const { app, BrowserWindow, dialog, ipcMain, nativeImage, Menu, protocol } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const zlib = require("node:zlib");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const DCS_ASSET_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".zip", ".sup5"]);
const DCS_ZIP_ASSET_EXTENSIONS = new Set([".dds"]);
const MANIFEST_FILE = "manifest.json";
const IMAGES_DIR = "images";
const OVERLAYS_DIR = "overlays";
const DCS_TERRAINS_DIR = path.join("Mods", "terrains");
const DCS_RASTER_CHARTS_DIR = "RasterCharts";
const DCS_RASTER_CHART_INDEX = "rasterCharts.sup5";
const DCS_RASTER_TILE_SIZE = 1024;
const DCS_MAX_RASTER_CHART_TILES = 12000;
const DCS_VECTOR_MAP_CANDIDATES = ["Map", "map"];
const DCS_VECTOR_MAP_MAX_BYTES = 260 * 1024 * 1024;
const DCS_LIGHTMAP_LUA = path.join("extra", "lightmap", "lightmap.lua");
const DCS_LIGHTMAP_DEPTH_MAX = path.join("extra", "lightmap", "lightmap_depthMax.png");
const DCS_ELEVATION_CANDIDATES = [
  "tarps-elevation.json",
  "tarps-dem.json",
  path.join("MissionGenerator", "tarps-elevation.json"),
  path.join("MissionGenerator", "elevation.json"),
  path.join("Map", "tarps-elevation.json"),
  path.join("map", "tarps-elevation.json"),
];
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
  {
    scheme: "tarps-dcs-asset",
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
  if (extension === ".json") {
    return "application/json";
  }
  if (extension === ".dds") {
    return "image/vnd-ms-dds";
  }
  if (extension === ".sup5") {
    return "application/octet-stream";
  }
  return "image/jpeg";
}

function pathInside(parentPath, candidatePath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(candidatePath));
  return relative === "" || (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

function isSafeDcsTerrainId(terrainId) {
  return (
    typeof terrainId === "string" &&
    terrainId.trim() === terrainId &&
    terrainId.length > 0 &&
    !terrainId.includes("/") &&
    !terrainId.includes("\\") &&
    !terrainId.includes(":") &&
    terrainId !== "." &&
    terrainId !== ".."
  );
}

function splitSafeRelativePath(relativePath) {
  const parts = String(relativePath || "")
    .split(/[\\/]/)
    .filter(Boolean);
  if (!parts.length || parts.some((part) => part === "." || part === ".." || part.includes(":"))) {
    return null;
  }
  return parts;
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

function dcsAssetUrl(installPath, terrainId, assetPath, options = {}) {
  const parts = splitSafeRelativePath(assetPath);
  if (!isSafeDcsTerrainId(terrainId) || !parts) {
    throw new Error("Refusing to load an invalid DCS terrain asset.");
  }
  const encodedAssetPath = parts.map(encodeURIComponent).join("/");
  const params = new URLSearchParams({ root: path.resolve(installPath), v: String(Date.now()) });
  if (options.entryName) {
    params.set("entry", normalizeArchiveEntryName(options.entryName));
  }
  return `tarps-dcs-asset://terrain/${encodeURIComponent(terrainId)}/${encodedAssetPath}?${params.toString()}`;
}

function parseLuaStringField(text, fieldName) {
  const quotedKey = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`\\[\\s*['"]${quotedKey}['"]\\s*\\]\\s*=\\s*(?:_\\()?\\s*['"]([^'"]+)['"]`, "i"),
    new RegExp(`\\b${quotedKey}\\b\\s*=\\s*(?:_\\()?\\s*['"]([^'"]+)['"]`, "i"),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function parseNodesMapBorders(text) {
  const match = text.match(
    /nodesMapBorders['"]?\s*\]?\s*=\s*\{\s*([-+\d.eE]+)\s*,\s*([-+\d.eE]+)\s*,\s*([-+\d.eE]+)\s*,\s*([-+\d.eE]+)/,
  );
  if (!match) {
    return null;
  }
  const [minX, minZ, maxX, maxZ] = match.slice(1, 5).map(Number);
  if (![minX, minZ, maxX, maxZ].every(Number.isFinite)) {
    return null;
  }
  return { minX, minZ, maxX, maxZ };
}

async function readTextFileIfPresent(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function imageMetadataForPath(filePath) {
  const image = nativeImage.createFromPath(filePath);
  if (image.isEmpty()) {
    return null;
  }
  return image.getSize();
}

function parseGeoControlPoints(text) {
  const pattern =
    /position\s*=\s*\{\s*([-+\d.eE]+)\s*,\s*([-+\d.eE]+)\s*,\s*([-+\d.eE]+)\s*\}\s*;[\s\S]*?positionGeo\s*=\s*\{\s*latitude\s*=\s*([-+\d.eE]+)\s*,\s*longitude\s*=\s*([-+\d.eE]+)/g;
  const points = [];
  let match;
  while ((match = pattern.exec(text))) {
    const point = {
      x: Number(match[1]),
      elevationM: Number(match[2]),
      z: Number(match[3]),
      lat: Number(match[4]),
      lng: Number(match[5]),
    };
    if ([point.x, point.z, point.lat, point.lng].every(Number.isFinite)) {
      points.push(point);
    }
  }
  return points;
}

function solveLinearSystem(matrix, vector) {
  const size = matrix.length;
  if (!size || vector.length !== size || matrix.some((row) => row.length !== size)) {
    return null;
  }
  const rows = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) {
        pivot = row;
      }
    }
    if (Math.abs(rows[pivot][column]) < 1e-12) {
      return null;
    }
    [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
    const divisor = rows[column][column];
    for (let item = column; item <= size; item += 1) {
      rows[column][item] /= divisor;
    }
    for (let row = 0; row < size; row += 1) {
      if (row === column) {
        continue;
      }
      const factor = rows[row][column];
      for (let item = column; item <= size; item += 1) {
        rows[row][item] -= factor * rows[column][item];
      }
    }
  }
  return rows.map((row) => row[size]);
}

function polynomialBasis(u, v, degree) {
  const terms = [1, u, v];
  if (degree >= 2) {
    terms.push(u * u, u * v, v * v);
  }
  if (degree >= 3) {
    terms.push(u * u * u, u * u * v, u * v * v, v * v * v);
  }
  return terms;
}

function polynomialTermCount(degree) {
  return polynomialBasis(0, 0, degree).length;
}

function normalizedPolynomialInput(points, inputKeys) {
  const samples = points
    .map((point) => inputKeys.map((key) => Number(point[key])))
    .filter(([first, second]) => Number.isFinite(first) && Number.isFinite(second));
  if (!samples.length) {
    return null;
  }

  const origin = [
    samples.reduce((sum, sample) => sum + sample[0], 0) / samples.length,
    samples.reduce((sum, sample) => sum + sample[1], 0) / samples.length,
  ];
  const scale = samples.reduce(
    (largest, sample) => [
      Math.max(largest[0], Math.abs(sample[0] - origin[0])),
      Math.max(largest[1], Math.abs(sample[1] - origin[1])),
    ],
    [0, 0],
  );
  if (scale[0] <= 0 || scale[1] <= 0) {
    return null;
  }
  return {
    keys: [...inputKeys],
    origin,
    scale,
  };
}

function fitPolynomialOutput(points, input, outputKey, degree) {
  const termCount = polynomialTermCount(degree);
  const matrix = Array.from({ length: termCount }, () => Array(termCount).fill(0));
  const vector = Array(termCount).fill(0);
  let count = 0;

  for (const point of points) {
    const first = Number(point[input.keys[0]]);
    const second = Number(point[input.keys[1]]);
    const output = Number(point[outputKey]);
    if (![first, second, output].every(Number.isFinite)) {
      continue;
    }
    const u = (first - input.origin[0]) / input.scale[0];
    const v = (second - input.origin[1]) / input.scale[1];
    const basis = polynomialBasis(u, v, degree);
    count += 1;
    for (let row = 0; row < termCount; row += 1) {
      vector[row] += basis[row] * output;
      for (let column = 0; column < termCount; column += 1) {
        matrix[row][column] += basis[row] * basis[column];
      }
    }
  }

  if (count < termCount) {
    return null;
  }

  const coefficients = solveLinearSystem(matrix, vector);
  return coefficients?.every(Number.isFinite) ? coefficients : null;
}

function fitPolynomialPair(points, inputKeys, outputKeys, degree) {
  const input = normalizedPolynomialInput(points, inputKeys);
  if (!input) {
    return null;
  }
  const pair = {
    degree,
    input,
  };
  for (const outputKey of outputKeys) {
    const coefficients = fitPolynomialOutput(points, input, outputKey, degree);
    if (!coefficients) {
      return null;
    }
    pair[outputKey] = coefficients;
  }
  return pair;
}

function applyPolynomialOutput(model, outputKey, point) {
  const coefficients = model?.[outputKey];
  const input = model?.input;
  if (!Array.isArray(coefficients) || !input?.keys || !input?.origin || !input?.scale) {
    return NaN;
  }
  const first = Number(point?.[input.keys[0]]);
  const second = Number(point?.[input.keys[1]]);
  if (!Number.isFinite(first) || !Number.isFinite(second) || input.scale[0] === 0 || input.scale[1] === 0) {
    return NaN;
  }
  const u = (first - input.origin[0]) / input.scale[0];
  const v = (second - input.origin[1]) / input.scale[1];
  const basis = polynomialBasis(u, v, Number(model.degree) || 1);
  return coefficients.reduce((sum, coefficient, index) => sum + coefficient * basis[index], 0);
}

function applyAffine(coefficients, point) {
  return coefficients[0] + coefficients[1] * point.x + coefficients[2] * point.z;
}

function controlPointGeoErrorMeters(predictedLat, predictedLng, point) {
  const latErrorM = (predictedLat - point.lat) * 111000;
  const lngErrorM = (predictedLng - point.lng) * 111000 * Math.cos((point.lat * Math.PI) / 180);
  return Math.hypot(latErrorM, lngErrorM);
}

function controlPointErrorStats(errors) {
  return {
    average: errors.length ? errors.reduce((sum, error) => sum + error, 0) / errors.length : null,
    max: errors.length ? Math.max(...errors) : null,
  };
}

function fitGeoReference(points) {
  const validPoints = points.filter((point) => [point.x, point.z, point.lat, point.lng].every(Number.isFinite));
  for (const degree of [3, 2, 1]) {
    const forward = fitPolynomialPair(validPoints, ["x", "z"], ["lat", "lng"], degree);
    const inverse = fitPolynomialPair(validPoints, ["lat", "lng"], ["x", "z"], degree);
    if (!forward || !inverse) {
      continue;
    }

    const forwardErrors = [];
    const inverseErrors = [];
    for (const point of validPoints) {
      const predictedLat = applyPolynomialOutput(forward, "lat", point);
      const predictedLng = applyPolynomialOutput(forward, "lng", point);
      if (Number.isFinite(predictedLat) && Number.isFinite(predictedLng)) {
        forwardErrors.push(controlPointGeoErrorMeters(predictedLat, predictedLng, point));
      }

      const predictedX = applyPolynomialOutput(inverse, "x", point);
      const predictedZ = applyPolynomialOutput(inverse, "z", point);
      if (Number.isFinite(predictedX) && Number.isFinite(predictedZ)) {
        inverseErrors.push(Math.hypot(predictedX - point.x, predictedZ - point.z));
      }
    }

    const forwardStats = controlPointErrorStats(forwardErrors);
    const inverseStats = controlPointErrorStats(inverseErrors);
    return {
      type: "dcs-beacon-polynomial",
      degree,
      forward,
      inverse,
      sampleCount: validPoints.length,
      averageErrorM: forwardStats.average,
      maxErrorM: forwardStats.max,
      inverseAverageErrorM: inverseStats.average,
      inverseMaxErrorM: inverseStats.max,
    };
  }

  return null;
}

function dcsLocalPointToLatLng(geoReference, point) {
  if (geoReference?.forward) {
    return {
      lat: applyPolynomialOutput(geoReference.forward, "lat", point),
      lng: applyPolynomialOutput(geoReference.forward, "lng", point),
    };
  }
  if (!Array.isArray(geoReference?.lat) || !Array.isArray(geoReference?.lng)) {
    return { lat: NaN, lng: NaN };
  }
  return {
    lat: applyAffine(geoReference.lat, point),
    lng: applyAffine(geoReference.lng, point),
  };
}

function mapCornersFromDcsBounds(geoReference, bounds) {
  if (!geoReference || !bounds) {
    return null;
  }
  const corners = [
    { x: bounds.maxX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.maxZ },
    { x: bounds.minX, z: bounds.maxZ },
    { x: bounds.minX, z: bounds.minZ },
  ].map((point) => dcsLocalPointToLatLng(geoReference, point));

  if (!corners.every((corner) => corner && Number.isFinite(corner.lat) && Number.isFinite(corner.lng))) {
    return null;
  }
  return corners;
}

function latLngBoundsForCorners(corners) {
  return {
    minLat: Math.min(...corners.map((corner) => corner.lat)),
    maxLat: Math.max(...corners.map((corner) => corner.lat)),
    minLng: Math.min(...corners.map((corner) => corner.lng)),
    maxLng: Math.max(...corners.map((corner) => corner.lng)),
  };
}

async function collectFilesByExtension(rootPath, extension, currentPath = rootPath) {
  const entries = await fs.readdir(currentPath, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFilesByExtension(rootPath, extension, fullPath)));
      continue;
    }
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === extension) {
      files.push({
        fullPath,
        relativePath: path.relative(rootPath, fullPath).split(path.sep).join("/"),
        baseName: path.basename(entry.name, extension),
      });
    }
  }
  return files;
}

function parseRasterChartTileName(tileName) {
  const match = /^(\d+)[mM]([A-Za-z0-9_-]+)_x(\d+)_z(\d+)\.tif$/i.exec(tileName);
  if (!match) {
    return null;
  }
  return {
    scaleMPerPixel: Number(match[1]),
    archiveStem: `${match[1]}m${match[2]}`,
    tileX: Number(match[3]),
    tileZ: Number(match[4]),
  };
}

function rasterChartFloatData(buffer, tileNameOffset) {
  const nodeOffset = buffer.indexOf(Buffer.from("NODEFINITIONS", "latin1"), tileNameOffset);
  if (nodeOffset < 0 || nodeOffset + 25 + 23 * 4 > buffer.length) {
    return null;
  }
  const floats = [];
  const floatOffset = nodeOffset + 25;
  for (let index = 0; index < 23; index += 1) {
    floats.push(buffer.readFloatLE(floatOffset + index * 4));
  }
  if (!floats.every(Number.isFinite)) {
    return null;
  }
  return floats;
}

function rasterChartBoundsFromFloats(floats) {
  const x0 = floats[15];
  const x1 = floats[18];
  const z0 = floats[17];
  const z1 = floats[20];
  if (![x0, x1, z0, z1].every(Number.isFinite) || x0 === x1 || z0 === z1) {
    return null;
  }
  return {
    minX: Math.min(x0, x1),
    maxX: Math.max(x0, x1),
    minZ: Math.min(z0, z1),
    maxZ: Math.max(z0, z1),
  };
}

async function dcsZipEntriesByLowercase(zipPath) {
  const archive = await readStoreZipArchive(zipPath);
  const entries = new Map();
  for (const entryName of archive.entries.keys()) {
    entries.set(entryName.toLowerCase(), entryName);
  }
  return entries;
}

async function detectRasterCharts(installPath, terrainId, terrainRoot, geoReference) {
  if (!geoReference) {
    return null;
  }
  const rasterRoot = path.join(terrainRoot, DCS_RASTER_CHARTS_DIR);
  const indexPath = path.join(rasterRoot, DCS_RASTER_CHART_INDEX);
  const indexBuffer = await fs.readFile(indexPath).catch(() => null);
  if (!indexBuffer) {
    return null;
  }

  const zipFiles = await collectFilesByExtension(rasterRoot, ".zip");
  const zipByStem = new Map(zipFiles.map((file) => [file.baseName.toLowerCase(), file]));
  const monolithicZip = zipByStem.get("rastercharts") ?? null;
  const zipEntryCache = new Map();
  const tilePattern = /\d+[mM][A-Za-z0-9_-]+_x\d+_z\d+\.tif/g;
  const indexText = indexBuffer.toString("latin1");
  const tiles = [];
  const scales = new Set();

  for (const match of indexText.matchAll(tilePattern)) {
    if (tiles.length >= DCS_MAX_RASTER_CHART_TILES) {
      break;
    }
    const tileName = match[0];
    const parsed = parseRasterChartTileName(tileName);
    if (!parsed) {
      continue;
    }
    let zipFile = zipByStem.get(parsed.archiveStem.toLowerCase());
    let entries = null;
    let entryName = null;
    const targetEntryName = `${tileName}.dds`.toLowerCase();
    for (const candidateZip of [zipFile, monolithicZip]) {
      if (!candidateZip) {
        continue;
      }
      entries = zipEntryCache.get(candidateZip.fullPath);
      if (!entries) {
        entries = await dcsZipEntriesByLowercase(candidateZip.fullPath).catch(() => null);
        zipEntryCache.set(candidateZip.fullPath, entries);
      }
      entryName = entries?.get(targetEntryName);
      if (entryName) {
        zipFile = candidateZip;
        break;
      }
    }
    if (!entryName) {
      continue;
    }
    const floats = rasterChartFloatData(indexBuffer, match.index);
    const localBounds = floats ? rasterChartBoundsFromFloats(floats) : null;
    const corners = mapCornersFromDcsBounds(geoReference, localBounds);
    if (!corners) {
      continue;
    }
    scales.add(parsed.scaleMPerPixel);
    const archiveAssetPath = `${DCS_RASTER_CHARTS_DIR}/${zipFile.relativePath}`;
    tiles.push({
      id: `${archiveAssetPath}:${entryName}`,
      scaleMPerPixel: parsed.scaleMPerPixel,
      tileX: parsed.tileX,
      tileZ: parsed.tileZ,
      archivePath: archiveAssetPath,
      entryName,
      url: dcsAssetUrl(installPath, terrainId, archiveAssetPath, { entryName }),
      width: DCS_RASTER_TILE_SIZE,
      height: DCS_RASTER_TILE_SIZE,
      localBounds,
      corners,
      bounds: latLngBoundsForCorners(corners),
    });
  }

  if (!tiles.length) {
    return null;
  }

  return {
    source: `${DCS_RASTER_CHARTS_DIR}/${DCS_RASTER_CHART_INDEX}`,
    tileSize: DCS_RASTER_TILE_SIZE,
    tileCount: tiles.length,
    scales: Array.from(scales).sort((a, b) => a - b),
    tiles,
  };
}

async function detectDcsVectorMap(installPath, terrainId, terrainRoot) {
  for (const folderName of DCS_VECTOR_MAP_CANDIDATES) {
    const relativePath = path.join(folderName, `${terrainId}.sup5`);
    const fullPath = path.join(terrainRoot, relativePath);
    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat?.isFile()) {
      continue;
    }
    const normalizedPath = relativePath.split(path.sep).join("/");
    return {
      type: "dcs-sup5-line-map",
      source: normalizedPath,
      url: dcsAssetUrl(installPath, terrainId, normalizedPath),
      sizeBytes: stat.size,
      readable: stat.size > 0 && stat.size <= DCS_VECTOR_MAP_MAX_BYTES,
      maxBytes: DCS_VECTOR_MAP_MAX_BYTES,
      message:
        stat.size > DCS_VECTOR_MAP_MAX_BYTES
          ? "DCS vector map file is present but larger than the current safe read limit."
          : null,
    };
  }
  return null;
}

async function detectDcsSurfaceData(terrainRoot, terrainId) {
  const surfaceRoot = path.join(terrainRoot, "Surface");
  const candidates = [
    `${terrainId}.surface5`,
    `${terrainId}.tile`,
    `${terrainId}.ng5`,
    `${terrainId}.onlay.sup4`,
  ];
  const files = [];
  for (const fileName of candidates) {
    const fullPath = path.join(surfaceRoot, fileName);
    const stat = await fs.stat(fullPath).catch(() => null);
    if (stat?.isFile()) {
      files.push({
        source: path.relative(terrainRoot, fullPath).split(path.sep).join("/"),
        sizeBytes: stat.size,
      });
    }
  }
  if (!files.length) {
    return null;
  }
  return {
    type: "dcs-surface5",
    files,
    status: "detected",
    usable: false,
    message: "DCS surface mesh files were found, but no safe on-disk height decoder is available yet.",
  };
}

function parseLuaNumberListField(text, fieldName) {
  const quotedKey = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`${quotedKey}\\s*=\\s*\\{([^}]+)\\}`).exec(text);
  if (!match) {
    return null;
  }
  const values = match[1]
    .split(",")
    .map((value) => Number(value.trim()))
    .filter(Number.isFinite);
  return values.length ? values : null;
}

function parseLuaNumberField(text, fieldName) {
  const quotedKey = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`${quotedKey}\\s*=\\s*([-+0-9.eE]+)`).exec(text);
  return match ? Number(match[1]) : null;
}

function parseLightmapBounds(text) {
  const boxMatch = /box\s*=\s*\{[\s\S]*?min\s*=\s*\{([^}]+)\}[\s\S]*?max\s*=\s*\{([^}]+)\}[\s\S]*?\}/.exec(text);
  if (!boxMatch) {
    return null;
  }
  const min = boxMatch[1].split(",").map((value) => Number(value.trim()));
  const max = boxMatch[2].split(",").map((value) => Number(value.trim()));
  if (min.length < 3 || max.length < 3 || ![...min.slice(0, 3), ...max.slice(0, 3)].every(Number.isFinite)) {
    return null;
  }
  return {
    minX: min[0],
    minY: min[1],
    minZ: min[2],
    maxX: max[0],
    maxY: max[1],
    maxZ: max[2],
  };
}

async function detectLightmapElevation(installPath, terrainId, terrainRoot) {
  const lightmapText = await readTextFileIfPresent(path.join(terrainRoot, DCS_LIGHTMAP_LUA));
  if (!lightmapText) {
    return null;
  }
  const imagePath = path.join(terrainRoot, DCS_LIGHTMAP_DEPTH_MAX);
  const imageSize = imageMetadataForPath(imagePath);
  if (!imageSize) {
    return null;
  }
  const localBounds = parseLightmapBounds(lightmapText);
  const heightMinMax = parseLuaNumberListField(lightmapText, "heightMinMax");
  const pixelSizeX = parseLuaNumberField(lightmapText, "pixelSizeX");
  const pixelSizeZ = parseLuaNumberField(lightmapText, "pixelSizeZ");
  if (
    !localBounds ||
    !heightMinMax ||
    heightMinMax.length < 2 ||
    ![pixelSizeX, pixelSizeZ, heightMinMax[0], heightMinMax[1]].every(Number.isFinite) ||
    pixelSizeX <= 0 ||
    pixelSizeZ <= 0 ||
    heightMinMax[1] <= heightMinMax[0]
  ) {
    return null;
  }

  return {
    type: "dcs-lightmap-depthmax",
    sourceFile: DCS_LIGHTMAP_DEPTH_MAX.split(path.sep).join("/"),
    metadataFile: DCS_LIGHTMAP_LUA.split(path.sep).join("/"),
    url: dcsAssetUrl(installPath, terrainId, DCS_LIGHTMAP_DEPTH_MAX),
    width: imageSize.width,
    height: imageSize.height,
    localBounds,
    pixelSizeX,
    pixelSizeZ,
    minElevationM: heightMinMax[0],
    maxElevationM: heightMinMax[1],
    channel: "alpha",
    resolutionM: Math.max(pixelSizeX, pixelSizeZ),
  };
}

function normalizeElevationGrid(raw, sourceFile) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const bounds = raw.bounds ?? raw.extent;
  const width = Number(raw.width);
  const height = Number(raw.height);
  const values = Array.isArray(raw.values) ? raw.values : Array.isArray(raw.data) ? raw.data : null;
  const minLat = Number(bounds?.minLat);
  const maxLat = Number(bounds?.maxLat);
  const minLng = Number(bounds?.minLng);
  const maxLng = Number(bounds?.maxLng);
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 1 ||
    height <= 1 ||
    width * height > 2_000_000 ||
    !Array.isArray(values) ||
    values.length !== width * height ||
    ![minLat, maxLat, minLng, maxLng].every(Number.isFinite) ||
    maxLat <= minLat ||
    maxLng <= minLng
  ) {
    return null;
  }

  const units = String(raw.units ?? raw.unit ?? "meters").toLowerCase();
  const factor = units.startsWith("ft") || units.startsWith("feet") ? 0.3048 : 1;
  const normalizedValues = values.map((value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric * factor : null;
  });

  return {
    type: "grid",
    sourceFile,
    width,
    height,
    bounds: { minLat, maxLat, minLng, maxLng },
    values: normalizedValues,
    units: "meters",
  };
}

async function detectElevationGrid(terrainRoot) {
  for (const relativePath of DCS_ELEVATION_CANDIDATES) {
    const fullPath = path.join(terrainRoot, relativePath);
    const text = await readTextFileIfPresent(fullPath);
    if (!text) {
      continue;
    }
    try {
      const grid = normalizeElevationGrid(JSON.parse(text), relativePath.split(path.sep).join("/"));
      if (grid) {
        return grid;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function scanDcsTerrain(installPath, terrainEntry) {
  const terrainRoot = path.join(installPath, DCS_TERRAINS_DIR, terrainEntry.name);
  const entryPath = path.join(terrainRoot, "entry.lua");
  const entryText = (await readTextFileIfPresent(entryPath)) ?? "";
  const id = parseLuaStringField(entryText, "id") ?? terrainEntry.name;
  const localizedName =
    parseLuaStringField(entryText, "localizedName") ?? parseLuaStringField(entryText, "name") ?? id;
  const nodesMapFile = parseLuaStringField(entryText, "nodesMapFile") ?? path.join("MissionGenerator", "nodesMap.png");
  const entryImage = parseLuaStringField(entryText, "image") ?? "map.png";
  let nodesMapBorders = parseNodesMapBorders(entryText);

  if (!nodesMapBorders) {
    const nodesMapText = await readTextFileIfPresent(path.join(terrainRoot, "MissionGenerator", "nodesMap.lua"));
    if (nodesMapText) {
      nodesMapBorders = parseNodesMapBorders(nodesMapText);
    }
  }

  const beaconPath =
    (await pathExists(path.join(terrainRoot, "beacons.lua"))) ? path.join(terrainRoot, "beacons.lua") : path.join(terrainRoot, "Beacons.lua");
  const beaconText = await readTextFileIfPresent(beaconPath);
  const controlPoints = beaconText ? parseGeoControlPoints(beaconText) : [];
  const geoReference = controlPoints.length >= 3 ? fitGeoReference(controlPoints) : null;
  const mapCandidates = [nodesMapFile, path.join("MissionGenerator", "nodesMap.png"), entryImage, "map.png"];
  let mapRelativePath = null;
  let mapSize = null;
  for (const candidate of mapCandidates.map((item) => String(item || "").replace(/\\/g, "/"))) {
    if (
      !candidate ||
      candidate === mapRelativePath ||
      !DCS_ASSET_EXTENSIONS.has(path.extname(candidate).toLowerCase())
    ) {
      continue;
    }
    const candidatePath = path.join(terrainRoot, ...candidate.split("/"));
    if (!(await pathExists(candidatePath))) {
      continue;
    }
    const candidateSize = imageMetadataForPath(candidatePath);
    if (!candidateSize) {
      continue;
    }
    mapRelativePath = candidate;
    mapSize = candidateSize;
    break;
  }
  const corners = mapSize ? mapCornersFromDcsBounds(geoReference, nodesMapBorders) : null;
  const rasterCharts = await detectRasterCharts(installPath, terrainEntry.name, terrainRoot, geoReference);
  const vectorMap = await detectDcsVectorMap(installPath, terrainEntry.name, terrainRoot);
  const elevationGrid = await detectElevationGrid(terrainRoot);
  const lightmapElevation = await detectLightmapElevation(installPath, terrainEntry.name, terrainRoot);
  const surfaceData = await detectDcsSurfaceData(terrainRoot, terrainEntry.name);

  return {
    id,
    directoryName: terrainEntry.name,
    name: localizedName,
    developerName: parseLuaStringField(entryText, "developerName") ?? "",
    installed: true,
    mapImage:
      mapSize && corners
        ? {
            assetPath: mapRelativePath,
            source: mapRelativePath,
            url: dcsAssetUrl(installPath, terrainEntry.name, mapRelativePath),
            width: mapSize.width,
            height: mapSize.height,
            corners,
            bounds: latLngBoundsForCorners(corners),
            localBounds: nodesMapBorders,
          }
        : null,
    rasterCharts,
    vectorMap,
    geoReference,
    elevation: elevationGrid,
    lightmapElevation,
    surfaceData,
    capabilities: {
      map: Boolean((mapSize && corners) || rasterCharts),
      vectorMap: Boolean(vectorMap?.readable && geoReference),
      elevation: Boolean(elevationGrid || lightmapElevation),
      elevationGrid: Boolean(elevationGrid),
      lightmapElevation: Boolean(lightmapElevation),
      surfaceData: Boolean(surfaceData),
      rasterCharts: Boolean(rasterCharts),
    },
    unavailableReason:
      !mapSize && !rasterCharts
        ? "No readable DCS overview or raster chart image was found."
        : !geoReference
          ? "No readable DCS geographic control points were found."
          : !rasterCharts && !nodesMapBorders
            ? "No readable DCS map borders were found."
            : null,
  };
}

async function scanDcsInstall(installPath) {
  if (!installPath) {
    return null;
  }
  const resolvedInstallPath = path.resolve(installPath);
  const terrainsPath = path.join(resolvedInstallPath, DCS_TERRAINS_DIR);
  const stat = await fs.stat(terrainsPath).catch(() => null);
  if (!stat?.isDirectory()) {
    return {
      installPath: resolvedInstallPath,
      terrains: [],
      error: "No DCS terrain folder was found at Mods/terrains.",
    };
  }

  const entries = await fs.readdir(terrainsPath, { withFileTypes: true });
  const terrainEntries = entries.filter((entry) => entry.isDirectory() && isSafeDcsTerrainId(entry.name));
  const terrains = [];
  for (const terrainEntry of terrainEntries) {
    try {
      terrains.push(await scanDcsTerrain(resolvedInstallPath, terrainEntry));
    } catch (error) {
      terrains.push({
        id: terrainEntry.name,
        directoryName: terrainEntry.name,
        name: terrainEntry.name,
        installed: true,
        mapImage: null,
        elevation: null,
        capabilities: { map: false, elevation: false },
        unavailableReason: error.message,
      });
    }
  }

  terrains.sort((a, b) => a.name.localeCompare(b.name));
  return {
    installPath: resolvedInstallPath,
    terrains,
    error: null,
  };
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

async function handleDcsAssetRequest(request) {
  const url = new URL(request.url);
  const installPath = url.searchParams.get("root");
  const entryName = url.searchParams.get("entry");
  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const terrainId = parts.shift();
  const assetParts = splitSafeRelativePath(parts.join("/"));
  if (!installPath || !isSafeDcsTerrainId(terrainId) || !assetParts) {
    return new Response("Missing or invalid DCS asset request details.", { status: 400 });
  }

  const extension = path.extname(assetParts[assetParts.length - 1]).toLowerCase();
  if (!DCS_ASSET_EXTENSIONS.has(extension)) {
    return new Response("DCS asset type is not supported.", { status: 415 });
  }

  const terrainRoot = path.resolve(installPath, DCS_TERRAINS_DIR, terrainId);
  const assetPath = path.resolve(terrainRoot, ...assetParts);
  if (!pathInside(terrainRoot, assetPath)) {
    return new Response("Refusing to load a DCS asset outside the selected terrain.", { status: 400 });
  }

  try {
    let buffer;
    let contentType = mimeTypeForPath(assetPath);
    if (entryName) {
      if (extension !== ".zip") {
        return new Response("DCS archive entries can only be read from ZIP assets.", { status: 400 });
      }
      const normalizedEntryName = normalizeArchiveEntryName(entryName);
      const entryExtension = path.extname(normalizedEntryName).toLowerCase();
      if (!DCS_ZIP_ASSET_EXTENSIONS.has(entryExtension)) {
        return new Response("DCS archive entry type is not supported.", { status: 415 });
      }
      buffer = await readZipEntryBuffer(assetPath, normalizedEntryName);
      contentType = mimeTypeForPath(normalizedEntryName);
    } else {
      if (extension === ".zip") {
        return new Response("DCS ZIP assets require a safe archive entry name.", { status: 400 });
      }
      buffer = await fs.readFile(assetPath);
    }
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
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
  protocol.handle("tarps-dcs-asset", handleDcsAssetRequest);
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

ipcMain.handle("tarps:choose-dcs-install", async () => {
  const result = await dialog.showOpenDialog({
    title: "Choose DCS World install folder",
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths.length) {
    return null;
  }
  return scanDcsInstall(result.filePaths[0]);
});

ipcMain.handle("tarps:scan-dcs-install", async (_event, installPath) => {
  return scanDcsInstall(installPath);
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
