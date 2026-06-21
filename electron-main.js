const { app, BrowserWindow, dialog, ipcMain, nativeImage, Menu, protocol } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const zlib = require("node:zlib");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MANIFEST_FILE = "manifest.json";
const IMAGES_DIR = "images";
const OVERLAYS_DIR = "overlays";
const OVERLAY_PREVIEW_SPECS = [
  { key: "small", maxEdge: 512, quality: 76 },
  { key: "medium", maxEdge: 1024, quality: 80 },
  { key: "large", maxEdge: 1536, quality: 82 },
];
const APP_ICON_PATH = path.join(__dirname, "icon.png");
const INTEL_ARCHIVE_EXTENSION = ".tarpsintel.zip";
const INTEL_ARCHIVE_FILTER = { name: "TARPS intel ZIP archive", extensions: ["tarpsintel.zip"] };
const ZIP_STORE_METHOD = 0;
const ZIP_DEFLATE_METHOD = 8;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_VERSION_NEEDED = 20;
const ZIP_MAX_UINT32 = 0xffffffff;
const ZIP_EOCD_MIN_SIZE = 22;
const ZIP_EOCD_MAX_COMMENT = 0xffff;
const ZIP_EOCD_SEARCH_SIZE = ZIP_EOCD_MIN_SIZE + ZIP_EOCD_MAX_COMMENT;
const archiveCache = new Map();
const archiveWriteQueues = new Map();

protocol.registerSchemesAsPrivileged([
  {
    scheme: "tarps-asset",
    privileges: {
      standard: true,
      secure: true,
      corsEnabled: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

function mimeTypeForPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".webp") {
    return "image/webp";
  }
  return "image/jpeg";
}

function isIntelArchivePath(filePath) {
  return String(filePath || "").toLowerCase().endsWith(INTEL_ARCHIVE_EXTENSION);
}

function withIntelArchiveExtension(filePath) {
  if (isIntelArchivePath(filePath)) {
    return filePath;
  }
  if (String(filePath || "").toLowerCase().endsWith(".zip")) {
    return `${filePath.slice(0, -4)}${INTEL_ARCHIVE_EXTENSION}`;
  }
  return `${filePath}${INTEL_ARCHIVE_EXTENSION}`;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function normalizeArchiveEntryName(entryName) {
  const parts = String(entryName || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  if (!parts.length || parts.some((part) => part === "." || part === ".." || part.includes(":"))) {
    throw new Error("Refusing to access an invalid archive entry.");
  }
  return parts.join("/");
}

function assertZip32(value, label) {
  if (!Number.isSafeInteger(value) || value < 0 || value > ZIP_MAX_UINT32) {
    throw new Error(`${label} is too large for this ZIP archive.`);
  }
}

function archiveCacheKey(stat) {
  return `${stat.size}:${stat.mtimeMs}`;
}

function clearArchiveCache(archivePath) {
  archiveCache.delete(path.resolve(archivePath));
}

async function waitForArchiveWrites(archivePath) {
  const pendingWrite = archiveWriteQueues.get(path.resolve(archivePath));
  if (pendingWrite) {
    await pendingWrite.catch(() => {});
  }
}

function withArchiveWriteLock(archivePath, operation) {
  const resolvedPath = path.resolve(archivePath);
  const previousWrite = archiveWriteQueues.get(resolvedPath) ?? Promise.resolve();
  const run = previousWrite.catch(() => {}).then(operation);
  const cleanup = run.finally(() => {
    if (archiveWriteQueues.get(resolvedPath) === cleanup) {
      archiveWriteQueues.delete(resolvedPath);
    }
  });
  archiveWriteQueues.set(resolvedPath, cleanup);
  return run;
}

async function readExistingArchiveBytes(file, offset, length) {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await file.read(buffer, 0, length, offset);
  return bytesRead === length ? buffer : buffer.subarray(0, bytesRead);
}

function findEndOfCentralDirectory(tail) {
  for (let offset = tail.length - ZIP_EOCD_MIN_SIZE; offset >= 0; offset -= 1) {
    if (tail.readUInt32LE(offset) === 0x06054b50) {
      const commentLength = tail.readUInt16LE(offset + 20);
      if (offset + ZIP_EOCD_MIN_SIZE + commentLength <= tail.length) {
        return offset;
      }
    }
  }
  return -1;
}

function emptyZipBuffer() {
  const eocd = Buffer.alloc(ZIP_EOCD_MIN_SIZE);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(0, 8);
  eocd.writeUInt16LE(0, 10);
  eocd.writeUInt32LE(0, 12);
  eocd.writeUInt32LE(0, 16);
  eocd.writeUInt16LE(0, 20);
  return eocd;
}

function isReadableZipArchiveError(error) {
  return (
    error?.message === "This is not a readable ZIP-based TARPS intel archive." ||
    error?.message === "The TARPS intel archive central directory is damaged."
  );
}

async function readStoreZipArchive(archivePath) {
  const resolvedPath = path.resolve(archivePath);
  const stat = await fs.stat(resolvedPath).catch(() => null);
  if (!stat || stat.size === 0) {
    return { archivePath: resolvedPath, entries: new Map(), centralDirectoryOffset: 0 };
  }

  const cacheKey = archiveCacheKey(stat);
  const cached = archiveCache.get(resolvedPath);
  if (cached?.cacheKey === cacheKey) {
    return cached.archive;
  }

  const file = await fs.open(resolvedPath, "r");
  try {
    const tailLength = Math.min(stat.size, ZIP_EOCD_SEARCH_SIZE);
    const tail = await readExistingArchiveBytes(file, stat.size - tailLength, tailLength);
    const eocdOffset = findEndOfCentralDirectory(tail);
    if (eocdOffset < 0) {
      throw new Error("This is not a readable ZIP-based TARPS intel archive.");
    }

    const centralDirectorySize = tail.readUInt32LE(eocdOffset + 12);
    const centralDirectoryOffset = tail.readUInt32LE(eocdOffset + 16);
    const centralDirectory = await readExistingArchiveBytes(file, centralDirectoryOffset, centralDirectorySize);
    const entries = new Map();
    let offset = 0;
    while (offset < centralDirectory.length) {
      if (centralDirectory.readUInt32LE(offset) !== 0x02014b50) {
        throw new Error("The TARPS intel archive central directory is damaged.");
      }
      const flags = centralDirectory.readUInt16LE(offset + 8);
      const method = centralDirectory.readUInt16LE(offset + 10);
      const modifiedTime = centralDirectory.readUInt16LE(offset + 12);
      const modifiedDate = centralDirectory.readUInt16LE(offset + 14);
      const crc = centralDirectory.readUInt32LE(offset + 16);
      const compressedSize = centralDirectory.readUInt32LE(offset + 20);
      const uncompressedSize = centralDirectory.readUInt32LE(offset + 24);
      const nameLength = centralDirectory.readUInt16LE(offset + 28);
      const extraLength = centralDirectory.readUInt16LE(offset + 30);
      const commentLength = centralDirectory.readUInt16LE(offset + 32);
      const localHeaderOffset = centralDirectory.readUInt32LE(offset + 42);
      const nameStart = offset + 46;
      const nameEnd = nameStart + nameLength;
      const entryName = centralDirectory.subarray(nameStart, nameEnd).toString(flags & ZIP_UTF8_FLAG ? "utf8" : "binary");
      if (entryName && !entryName.endsWith("/")) {
        entries.set(entryName, {
          name: entryName,
          flags,
          method,
          modifiedTime,
          modifiedDate,
          crc,
          compressedSize,
          uncompressedSize,
          localHeaderOffset,
        });
      }
      offset = nameEnd + extraLength + commentLength;
    }

    const archive = { archivePath: resolvedPath, entries, centralDirectoryOffset };
    archiveCache.set(resolvedPath, { cacheKey, archive });
    return archive;
  } finally {
    await file.close();
  }
}

async function recoverStoreZipArchiveFromLocalEntries(archivePath) {
  const resolvedPath = path.resolve(archivePath);
  const stat = await fs.stat(resolvedPath).catch(() => null);
  if (!stat || stat.size === 0) {
    return { archivePath: resolvedPath, entries: new Map(), centralDirectoryOffset: 0 };
  }

  const file = await fs.open(resolvedPath, "r");
  const entries = new Map();
  let offset = 0;
  try {
    while (offset + 30 <= stat.size) {
      const localHeader = await readExistingArchiveBytes(file, offset, 30);
      if (localHeader.length < 30 || localHeader.readUInt32LE(0) !== 0x04034b50) {
        break;
      }
      const flags = localHeader.readUInt16LE(6);
      const method = localHeader.readUInt16LE(8);
      const modifiedTime = localHeader.readUInt16LE(10);
      const modifiedDate = localHeader.readUInt16LE(12);
      const crc = localHeader.readUInt32LE(14);
      const compressedSize = localHeader.readUInt32LE(18);
      const uncompressedSize = localHeader.readUInt32LE(22);
      const nameLength = localHeader.readUInt16LE(26);
      const extraLength = localHeader.readUInt16LE(28);
      if ((flags & 0x0008) !== 0 || !nameLength) {
        break;
      }
      const nameStart = offset + 30;
      const dataOffset = nameStart + nameLength + extraLength;
      const nextOffset = dataOffset + compressedSize;
      if (nextOffset > stat.size) {
        break;
      }
      const nameBuffer = await readExistingArchiveBytes(file, nameStart, nameLength);
      const rawEntryName = nameBuffer.toString(flags & ZIP_UTF8_FLAG ? "utf8" : "binary");
      if (
        rawEntryName &&
        !rawEntryName.endsWith("/") &&
        (method === ZIP_STORE_METHOD || method === ZIP_DEFLATE_METHOD)
      ) {
        try {
          const entryName = normalizeArchiveEntryName(rawEntryName);
          entries.set(entryName, {
            name: entryName,
            flags,
            method,
            modifiedTime,
            modifiedDate,
            crc,
            compressedSize,
            uncompressedSize,
            localHeaderOffset: offset,
          });
        } catch {
          break;
        }
      }
      offset = nextOffset;
    }
  } finally {
    await file.close();
  }

  return { archivePath: resolvedPath, entries, centralDirectoryOffset: offset };
}

async function readStoreZipArchiveForWrite(archivePath, options = {}) {
  try {
    return await readStoreZipArchive(archivePath);
  } catch (error) {
    if (!options.reinitializeInvalidArchive || !isReadableZipArchiveError(error)) {
      throw error;
    }
    const recoveredArchive = await recoverStoreZipArchiveFromLocalEntries(archivePath);
    clearArchiveCache(archivePath);
    return recoveredArchive;
  }
}

async function readZipEntryBuffer(archivePath, entryName) {
  await waitForArchiveWrites(archivePath);
  const normalizedName = normalizeArchiveEntryName(entryName);
  const archive = await readStoreZipArchive(archivePath);
  const entry = archive.entries.get(normalizedName);
  if (!entry) {
    throw new Error(`Archive entry not found: ${normalizedName}`);
  }

  const file = await fs.open(path.resolve(archivePath), "r");
  try {
    const localHeader = await readExistingArchiveBytes(file, entry.localHeaderOffset, 30);
    if (localHeader.length < 30 || localHeader.readUInt32LE(0) !== 0x04034b50) {
      throw new Error(`Archive entry is damaged: ${normalizedName}`);
    }
    const nameLength = localHeader.readUInt16LE(26);
    const extraLength = localHeader.readUInt16LE(28);
    const dataOffset = entry.localHeaderOffset + 30 + nameLength + extraLength;
    const compressed = await readExistingArchiveBytes(file, dataOffset, entry.compressedSize);
    if (entry.method === ZIP_STORE_METHOD) {
      return compressed;
    }
    if (entry.method === ZIP_DEFLATE_METHOD) {
      return zlib.inflateRawSync(compressed);
    }
    throw new Error(`Unsupported ZIP compression method ${entry.method} for ${normalizedName}`);
  } finally {
    await file.close();
  }
}

function writeLocalEntryHeader(entryName, buffer, offset) {
  const nameBuffer = Buffer.from(entryName, "utf8");
  const { time, date } = dosDateTime();
  const crc = crc32(buffer);
  assertZip32(offset, "Archive offset");
  assertZip32(buffer.length, "Archive entry");
  const header = Buffer.alloc(30 + nameBuffer.length);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(ZIP_VERSION_NEEDED, 4);
  header.writeUInt16LE(ZIP_UTF8_FLAG, 6);
  header.writeUInt16LE(ZIP_STORE_METHOD, 8);
  header.writeUInt16LE(time, 10);
  header.writeUInt16LE(date, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(buffer.length, 18);
  header.writeUInt32LE(buffer.length, 22);
  header.writeUInt16LE(nameBuffer.length, 26);
  header.writeUInt16LE(0, 28);
  nameBuffer.copy(header, 30);
  return {
    header,
    entry: {
      name: entryName,
      flags: ZIP_UTF8_FLAG,
      method: ZIP_STORE_METHOD,
      modifiedTime: time,
      modifiedDate: date,
      crc,
      compressedSize: buffer.length,
      uncompressedSize: buffer.length,
      localHeaderOffset: offset,
    },
  };
}

function centralDirectoryHeader(entry) {
  const nameBuffer = Buffer.from(entry.name, "utf8");
  assertZip32(entry.localHeaderOffset, "Archive offset");
  const header = Buffer.alloc(46 + nameBuffer.length);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(ZIP_VERSION_NEEDED, 4);
  header.writeUInt16LE(ZIP_VERSION_NEEDED, 6);
  header.writeUInt16LE(entry.flags ?? ZIP_UTF8_FLAG, 8);
  header.writeUInt16LE(entry.method, 10);
  header.writeUInt16LE(entry.modifiedTime, 12);
  header.writeUInt16LE(entry.modifiedDate, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.compressedSize, 20);
  header.writeUInt32LE(entry.uncompressedSize, 24);
  header.writeUInt16LE(nameBuffer.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(entry.localHeaderOffset, 42);
  nameBuffer.copy(header, 46);
  return header;
}

async function appendStoreZipEntries(archivePath, replacements, deletions = [], options = {}) {
  const resolvedPath = path.resolve(archivePath);
  return withArchiveWriteLock(resolvedPath, () =>
    appendStoreZipEntriesUnlocked(resolvedPath, replacements, deletions, options),
  );
}

async function appendStoreZipEntriesUnlocked(resolvedPath, replacements, deletions = [], options = {}) {
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  const archive = await readStoreZipArchiveForWrite(resolvedPath, options);
  const replacementMap = new Map(
    replacements.map((item) => [normalizeArchiveEntryName(item.name), Buffer.isBuffer(item.buffer) ? item.buffer : Buffer.from(item.buffer)]),
  );
  const deletionSet = new Set(deletions.map(normalizeArchiveEntryName));
  const entries = new Map(
    [...archive.entries].filter(([name]) => !replacementMap.has(name) && !deletionSet.has(name)),
  );

  let file;
  try {
    file = await fs.open(resolvedPath, "r+");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
    file = await fs.open(resolvedPath, "w+");
  }
  let offset = archive.centralDirectoryOffset;
  try {
    await file.truncate(offset);
    for (const [entryName, buffer] of replacementMap) {
      const { header, entry } = writeLocalEntryHeader(entryName, buffer, offset);
      await file.write(header, 0, header.length, offset);
      offset += header.length;
      await file.write(buffer, 0, buffer.length, offset);
      offset += buffer.length;
      entries.set(entryName, entry);
    }

    const centralDirectoryOffset = offset;
    const sortedEntries = [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of sortedEntries) {
      const header = centralDirectoryHeader(entry);
      await file.write(header, 0, header.length, offset);
      offset += header.length;
    }
    const centralDirectorySize = offset - centralDirectoryOffset;
    assertZip32(sortedEntries.length, "Archive entry count");
    assertZip32(centralDirectoryOffset, "Central directory offset");
    assertZip32(centralDirectorySize, "Central directory size");
    const eocd = Buffer.alloc(ZIP_EOCD_MIN_SIZE);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(sortedEntries.length, 8);
    eocd.writeUInt16LE(sortedEntries.length, 10);
    eocd.writeUInt32LE(centralDirectorySize, 12);
    eocd.writeUInt32LE(centralDirectoryOffset, 16);
    eocd.writeUInt16LE(0, 20);
    await file.write(eocd, 0, eocd.length, offset);
    offset += eocd.length;
    await file.truncate(offset);
  } finally {
    await file.close();
    clearArchiveCache(resolvedPath);
  }
  return { name: path.basename(resolvedPath) };
}

function tarpsAssetUrl(archivePath, assetPath) {
  const encodedAssetPath = normalizeArchiveEntryName(assetPath).split("/").map(encodeURIComponent).join("/");
  return `tarps-asset://archive/${encodedAssetPath}?archive=${encodeURIComponent(path.resolve(archivePath))}&v=${Date.now()}`;
}

async function handleArchiveAssetRequest(request) {
  const url = new URL(request.url);
  const archivePath = url.searchParams.get("archive");
  const assetPath = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!archivePath || !assetPath) {
    return new Response("Missing archive asset request details.", { status: 400 });
  }
  try {
    const buffer = await readZipEntryBuffer(archivePath, assetPath);
    return new Response(buffer, {
      headers: {
        "Content-Type": mimeTypeForPath(assetPath),
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(error.message, { status: 404 });
  }
}

async function collectImages(rootPath, currentPath = rootPath) {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImages(rootPath, fullPath)));
      continue;
    }
    if (!entry.isFile() || !IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }
    const stat = await fs.stat(fullPath);
    files.push({
      filePath: fullPath,
      fileName: entry.name,
      relativePath: path.relative(rootPath, fullPath).split(path.sep).join("/"),
      mimeType: mimeTypeForPath(fullPath),
      sizeBytes: stat.size,
    });
  }
  return files;
}

function cleanPathSegment(segment) {
  return String(segment)
    .replace(/[<>:"\\|?*\x00-\x1f]/g, "_")
    .replace(/\.+$/g, "_")
    .trim() || "item";
}

function withExtension(fileName, extension) {
  if (!extension) {
    return fileName;
  }
  const stem = String(fileName || "image").replace(/\.[^.]*$/, "") || "image";
  return `${stem}${extension}`;
}

function safeAssetRelativePath(rootDir, setId, relativePath, extension = null) {
  const safeSet = cleanPathSegment(setId || "run");
  const safeParts = String(relativePath || "")
    .split(/[\\/]/)
    .filter(Boolean)
    .map(cleanPathSegment);
  const safeName = safeParts.length ? safeParts : ["image"];
  safeName[safeName.length - 1] = withExtension(safeName[safeName.length - 1], extension);
  return [rootDir, safeSet, ...safeName].join("/");
}

function safeImageRelativePath(setId, relativePath) {
  return safeAssetRelativePath(IMAGES_DIR, setId, relativePath);
}

function safeOverlayRelativePath(setId, relativePath, sizeKey = "large") {
  return safeAssetRelativePath([OVERLAYS_DIR, cleanPathSegment(sizeKey)].join("/"), setId, relativePath, ".jpg");
}

function scaledOverlaySize(width, height, maxEdge) {
  const longestEdge = Math.max(width, height);
  if (!Number.isFinite(longestEdge) || longestEdge <= 0) {
    return null;
  }
  const scale = Math.min(1, maxEdge / longestEdge);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function overlayPreviewEntries(archivePath, setId, relativePath, sourceImage) {
  if (sourceImage.isEmpty()) {
    return null;
  }

  const sourceSize = sourceImage.getSize();
  const previews = {};
  const entries = [];

  for (const spec of OVERLAY_PREVIEW_SPECS) {
    const overlaySize = scaledOverlaySize(sourceSize.width, sourceSize.height, spec.maxEdge);
    if (!overlaySize) {
      continue;
    }
    const overlayImage =
      overlaySize.width === sourceSize.width && overlaySize.height === sourceSize.height
        ? sourceImage
        : sourceImage.resize({ ...overlaySize, quality: "good" });
    const buffer = overlayImage.toJPEG(spec.quality);
    if (!buffer.length) {
      continue;
    }

    const overlayAssetPath = safeOverlayRelativePath(setId, relativePath || "image", spec.key);
    entries.push({ name: overlayAssetPath, buffer });
    previews[spec.key] = {
      assetPath: overlayAssetPath,
      fileUrl: tarpsAssetUrl(archivePath, overlayAssetPath),
      width: overlaySize.width,
      height: overlaySize.height,
      mimeType: "image/jpeg",
      sizeBytes: buffer.length,
      maxEdge: spec.maxEdge,
    };
  }

  const preferred = previews.large ?? previews.medium ?? previews.small;
  if (!preferred) {
    return null;
  }

  return {
    overlayPreviews: previews,
    overlayAssetPath: preferred.assetPath,
    overlayFileUrl: preferred.fileUrl,
    overlayWidth: preferred.width,
    overlayHeight: preferred.height,
    overlayMimeType: preferred.mimeType,
    overlaySizeBytes: preferred.sizeBytes,
    entries,
  };
}

async function createOverlayPreview(archivePath, setId, relativePath, sourceBuffer) {
  const sourceImage = nativeImage.createFromBuffer(sourceBuffer);
  const overlay = overlayPreviewEntries(archivePath, setId, relativePath, sourceImage);
  if (!overlay) {
    return null;
  }
  await appendStoreZipEntries(archivePath, overlay.entries);
  const { entries, ...metadata } = overlay;
  return metadata;
}

async function copyImageIntoProject(projectPath, setId, relativePath, sourceFilePath) {
  const assetPath = safeImageRelativePath(setId, relativePath || path.basename(sourceFilePath));
  const sourceBuffer = await fs.readFile(sourceFilePath);
  const sourceImage = nativeImage.createFromBuffer(sourceBuffer);
  const overlay = overlayPreviewEntries(projectPath, setId, relativePath || path.basename(sourceFilePath), sourceImage);
  await appendStoreZipEntries(projectPath, [
    { name: assetPath, buffer: sourceBuffer },
    ...(overlay?.entries ?? []),
  ]);
  const overlayMetadata = overlay
    ? Object.fromEntries(Object.entries(overlay).filter(([key]) => key !== "entries"))
    : null;
  return {
    assetPath,
    fileUrl: tarpsAssetUrl(projectPath, assetPath),
    sizeBytes: sourceBuffer.length,
    ...overlayMetadata,
  };
}

async function deleteProjectAssets(projectPath, assetPaths) {
  const uniqueAssetPaths = [...new Set((Array.isArray(assetPaths) ? assetPaths : []).filter(Boolean))];
  await appendStoreZipEntries(projectPath, [], uniqueAssetPaths);
  return { deleted: uniqueAssetPaths.length };
}

function bufferFromPngPayload(payload) {
  if (typeof payload === "string") {
    const base64 = payload.replace(/^data:image\/png;base64,/, "");
    return Buffer.from(base64, "base64");
  }
  if (Buffer.isBuffer(payload)) {
    return payload;
  }
  if (payload instanceof ArrayBuffer) {
    return Buffer.from(payload);
  }
  if (ArrayBuffer.isView(payload)) {
    return Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
  }
  throw new Error("Could not read PNG export data.");
}

function windowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

function windowStateFor(window) {
  return {
    isMaximized: Boolean(window?.isMaximized()),
    isFullScreen: Boolean(window?.isFullScreen()),
  };
}

function sendWindowState(window) {
  if (!window || window.isDestroyed() || window.webContents.isDestroyed()) {
    return;
  }
  window.webContents.send("tarps:window-state-change", windowStateFor(window));
}

function createWindow() {
  const window = new BrowserWindow({
    title: "TARPS",
    width: 1440,
    height: 950,
    minWidth: 980,
    minHeight: 700,
    frame: false,
    icon: APP_ICON_PATH,
    backgroundColor: "#171915",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "electron-preload.js"),
    },
  });

  for (const eventName of ["maximize", "unmaximize", "restore", "enter-full-screen", "leave-full-screen"]) {
    window.on(eventName, () => sendWindowState(window));
  }
  window.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle("tarps-asset", handleArchiveAssetRequest);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("tarps:window-state", (event) => windowStateFor(windowFromEvent(event)));

ipcMain.handle("tarps:window-minimize", (event) => {
  const window = windowFromEvent(event);
  window?.minimize();
});

ipcMain.handle("tarps:window-toggle-maximize", (event) => {
  const window = windowFromEvent(event);
  if (!window) {
    return { isMaximized: false, isFullScreen: false };
  }
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
  const state = windowStateFor(window);
  sendWindowState(window);
  return state;
});

ipcMain.handle("tarps:window-close", (event) => {
  windowFromEvent(event)?.close();
});

ipcMain.handle("tarps:create-project-folder", async () => {
  const result = await dialog.showSaveDialog({
    title: "Create new TARPS intel archive",
    defaultPath: "tarps-intel.tarpsintel.zip",
    filters: [INTEL_ARCHIVE_FILTER],
  });
  if (result.canceled || !result.filePath) {
    return null;
  }
  const projectPath = withIntelArchiveExtension(result.filePath);
  await fs.mkdir(path.dirname(projectPath), { recursive: true });
  await fs.writeFile(projectPath, emptyZipBuffer());
  clearArchiveCache(projectPath);
  return {
    projectPath,
    name: path.basename(projectPath),
  };
});

ipcMain.handle("tarps:write-project-manifest", async (_event, projectPath, text) => {
  return appendStoreZipEntries(
    projectPath,
    [{ name: MANIFEST_FILE, buffer: Buffer.from(text, "utf8") }],
    [],
    { reinitializeInvalidArchive: true },
  );
});

ipcMain.handle("tarps:open-project-folder", async () => {
  const result = await dialog.showOpenDialog({
    title: "Open TARPS intel archive",
    properties: ["openFile"],
    filters: [INTEL_ARCHIVE_FILTER],
  });
  if (result.canceled || !result.filePaths.length) {
    return null;
  }
  const projectPath = result.filePaths[0];
  if (!isIntelArchivePath(projectPath)) {
    throw new Error("Choose a .tarpsintel.zip intel archive.");
  }
  return {
    projectPath,
    name: path.basename(projectPath),
    text: (await readZipEntryBuffer(projectPath, MANIFEST_FILE)).toString("utf8"),
  };
});

ipcMain.handle("tarps:choose-directory", async () => {
  const result = await dialog.showOpenDialog({
    title: "Import TARPS folder",
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths.length) {
    return null;
  }
  const directoryPath = result.filePaths[0];
  return {
    directoryPath,
    name: path.basename(directoryPath),
    files: await collectImages(directoryPath),
  };
});

ipcMain.handle("tarps:copy-image-to-project", async (_event, projectPath, setId, relativePath, sourceFilePath) => {
  return copyImageIntoProject(projectPath, setId, relativePath, sourceFilePath);
});

ipcMain.handle("tarps:create-overlay-preview", async (_event, projectPath, setId, relativePath, assetPath) => {
  const sourceBuffer = await readZipEntryBuffer(projectPath, assetPath);
  return createOverlayPreview(projectPath, setId, relativePath, sourceBuffer);
});

ipcMain.handle("tarps:delete-project-assets", async (_event, projectPath, assetPaths) => {
  return deleteProjectAssets(projectPath, assetPaths);
});

ipcMain.handle("tarps:save-png-as", async (_event, suggestedName, pngPayload) => {
  const result = await dialog.showSaveDialog({
    title: "Export map image",
    defaultPath: suggestedName || "tarps-map.png",
    filters: [{ name: "PNG image", extensions: ["png"] }],
  });
  if (result.canceled || !result.filePath) {
    return null;
  }
  await fs.writeFile(result.filePath, bufferFromPngPayload(pngPayload));
  return { name: path.basename(result.filePath) };
});
