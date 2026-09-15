/* Web implementation of the desktop bridge.
 *
 * src/app.js only ever reaches for window.electronTarps, so providing the same
 * object in a browser runs the whole app with no change to it at all. Load this
 * before app.js and the Electron main process is not needed.
 *
 * Four things the main process did that a browser has to do differently:
 *
 *   files      Electron passed absolute paths around. Here a "filePath" is an
 *              opaque key into a registry of File objects. app.js never reads
 *              it, it only hands it back, so nothing there has to change.
 *   archive    Same store-only ZIP, written byte for byte the way
 *              electron-main.js writes it, so an archive made here opens in the
 *              desktop app and the other way round.
 *   images     Electron's nativeImage resize/toJPEG becomes canvas and
 *              convertToBlob.
 *   urls       The tarps-asset:// protocol becomes blob: URLs. assetUrl is
 *              called synchronously by app.js, so every entry gets its blob URL
 *              when it enters the archive, not on demand.
 *
 * Known trade-off in this first version: the archive is held in memory and
 * rewritten whole on each save, where the desktop app appends and rewrites only
 * the central directory. Simpler and correct, but a large archive will cost
 * more on every autosave. Worth revisiting with a real one.
 */
(function () {
  "use strict";

  const MANIFEST_FILE = "manifest.json";
  const IMAGES_DIR = "images";
  const OVERLAYS_DIR = "overlays";
  const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  const INTEL_ARCHIVE_EXTENSION = ".tarpsintel.zip";
  const OVERLAY_PREVIEW_SPECS = [
    { key: "small", maxEdge: 512, quality: 0.76 },
    { key: "medium", maxEdge: 1024, quality: 0.8 },
    { key: "large", maxEdge: 1536, quality: 0.82 },
  ];

  const ZIP_STORE_METHOD = 0;
  const ZIP_UTF8_FLAG = 0x0800;
  const ZIP_VERSION_NEEDED = 20;
  const ZIP_EOCD_MIN_SIZE = 22;

  /* ------------------------------------------------------------ store zip -- */

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

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
      crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
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

  const utf8 = new TextEncoder();
  const fromUtf8 = new TextDecoder();

  // Entries are Map<name, Uint8Array>, in insertion order, which is the order
  // they are written. Store only: the compressed and uncompressed sizes are the
  // same number and there is no deflate anywhere.
  function buildStoreZip(entries) {
    const locals = [];
    const central = [];
    let offset = 0;

    for (const [name, bytes] of entries) {
      const nameBytes = utf8.encode(name);
      const { time, date } = dosDateTime();
      const crc = crc32(bytes);

      const local = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, ZIP_VERSION_NEEDED, true);
      lv.setUint16(6, ZIP_UTF8_FLAG, true);
      lv.setUint16(8, ZIP_STORE_METHOD, true);
      lv.setUint16(10, time, true);
      lv.setUint16(12, date, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, bytes.length, true);
      lv.setUint32(22, bytes.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      local.set(nameBytes, 30);

      const dir = new Uint8Array(46 + nameBytes.length);
      const dv = new DataView(dir.buffer);
      dv.setUint32(0, 0x02014b50, true);
      dv.setUint16(4, ZIP_VERSION_NEEDED, true);
      dv.setUint16(6, ZIP_VERSION_NEEDED, true);
      dv.setUint16(8, ZIP_UTF8_FLAG, true);
      dv.setUint16(10, ZIP_STORE_METHOD, true);
      dv.setUint16(12, time, true);
      dv.setUint16(14, date, true);
      dv.setUint32(16, crc, true);
      dv.setUint32(20, bytes.length, true);
      dv.setUint32(24, bytes.length, true);
      dv.setUint16(28, nameBytes.length, true);
      dv.setUint32(42, offset, true);
      dir.set(nameBytes, 46);

      locals.push(local, bytes);
      central.push(dir);
      offset += local.length + bytes.length;
    }

    const centralSize = central.reduce((sum, part) => sum + part.length, 0);
    const eocd = new Uint8Array(ZIP_EOCD_MIN_SIZE);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.size, true);
    ev.setUint16(10, entries.size, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    return new Blob([...locals, ...central, eocd], { type: "application/zip" });
  }

  // Read a store-only zip by walking the central directory, which is where the
  // desktop app's own reader looks. A deflated entry is refused rather than
  // silently skipped: a half-read archive looks like an empty one.
  function readStoreZip(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let i = bytes.length - ZIP_EOCD_MIN_SIZE; i >= 0; i -= 1) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) {
      throw new Error("That file is not a readable intel archive.");
    }
    const count = view.getUint16(eocd + 10, true);
    let cursor = view.getUint32(eocd + 16, true);
    const entries = new Map();
    for (let i = 0; i < count; i += 1) {
      if (view.getUint32(cursor, true) !== 0x02014b50) {
        throw new Error("That intel archive's directory is damaged.");
      }
      const method = view.getUint16(cursor + 10, true);
      const size = view.getUint32(cursor + 24, true);
      const nameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localOffset = view.getUint32(cursor + 42, true);
      const name = fromUtf8.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
      if (method !== ZIP_STORE_METHOD) {
        throw new Error(`${name} is compressed; this archive was not written by TARPS Intel Map.`);
      }
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataAt = localOffset + 30 + localNameLength + localExtraLength;
      entries.set(name, bytes.subarray(dataAt, dataAt + size));
      cursor += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }

  /* --------------------------------------------------------- asset naming -- */
  /* Mirrors electron-main.js exactly so the two write the same layout. */

  function cleanPathSegment(segment) {
    return (
      String(segment)
        .replace(/[<>:"\\|?*\x00-\x1f]/g, "_")
        .replace(/\.+$/g, "_")
        .trim() || "item"
    );
  }

  function withExtension(fileName, extension) {
    if (!extension) return fileName;
    const stem = String(fileName || "image").replace(/\.[^.]*$/, "") || "image";
    return `${stem}${extension}`;
  }

  function safeAssetRelativePath(rootDir, setId, relativePath, extension = null) {
    const safeSet = cleanPathSegment(setId || "run");
    const parts = String(relativePath || "").split(/[\\/]/).filter(Boolean).map(cleanPathSegment);
    const safeName = parts.length ? parts : ["image"];
    safeName[safeName.length - 1] = withExtension(safeName[safeName.length - 1], extension);
    return [rootDir, safeSet, ...safeName].join("/");
  }

  const safeImageRelativePath = (setId, relativePath) =>
    safeAssetRelativePath(IMAGES_DIR, setId, relativePath);
  const safeOverlayRelativePath = (setId, relativePath, sizeKey = "large") =>
    safeAssetRelativePath([OVERLAYS_DIR, cleanPathSegment(sizeKey)].join("/"), setId, relativePath, ".jpg");

  /* -------------------------------------------------------------- archive -- */

  const archive = {
    handle: null,     // FileSystemFileHandle, when the browser gives us one
    name: null,
    path: null,       // what app.js carries as state.electronProjectPath
    entries: new Map(),
    urls: new Map(),  // assetPath -> blob: URL, because assetUrl is synchronous
    dirty: false,
  };

  function mimeForPath(assetPath) {
    const lower = String(assetPath || "").toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".json")) return "application/json";
    return "image/jpeg";
  }

  function publish(assetPath, bytes) {
    archive.entries.set(assetPath, bytes);
    const previous = archive.urls.get(assetPath);
    if (previous) URL.revokeObjectURL(previous);
    archive.urls.set(assetPath, URL.createObjectURL(new Blob([bytes], { type: mimeForPath(assetPath) })));
  }

  function forget(assetPath) {
    const url = archive.urls.get(assetPath);
    if (url) URL.revokeObjectURL(url);
    archive.urls.delete(assetPath);
    archive.entries.delete(assetPath);
  }

  function resetArchive(handle, name, pathLabel, entries = new Map()) {
    for (const url of archive.urls.values()) URL.revokeObjectURL(url);
    archive.urls.clear();
    archive.entries.clear();
    archive.handle = handle;
    archive.name = name;
    archive.path = pathLabel;
    for (const [assetPath, bytes] of entries) publish(assetPath, bytes);
  }

  async function flush() {
    if (!archive.handle) return { written: false };
    const blob = buildStoreZip(archive.entries);
    const writable = await archive.handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return { written: true, bytes: blob.size };
  }

  /* --------------------------------------------------------------- images -- */

  async function decode(bytes, mimeType) {
    const blob = new Blob([bytes], { type: mimeType || "application/octet-stream" });
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(blob);
    }
    // Safari and anything else without createImageBitmap for blobs.
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("Could not decode that image."));
        image.src = url;
      });
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function sizeOf(image) {
    return {
      width: image.width || image.naturalWidth || 0,
      height: image.height || image.naturalHeight || 0,
    };
  }

  function scaledOverlaySize(width, height, maxEdge) {
    const longestEdge = Math.max(width, height);
    if (!Number.isFinite(longestEdge) || longestEdge <= 0) return null;
    const scale = Math.min(1, maxEdge / longestEdge);
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
  }

  async function toJpeg(image, width, height, quality) {
    const canvas =
      typeof OffscreenCanvas === "function"
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement("canvas"), { width, height });
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    const blob =
      typeof canvas.convertToBlob === "function"
        ? await canvas.convertToBlob({ type: "image/jpeg", quality })
        : await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    return new Uint8Array(await blob.arrayBuffer());
  }

  async function buildOverlayPreviews(setId, relativePath, image) {
    const source = sizeOf(image);
    if (!source.width || !source.height) return null;

    const previews = {};
    for (const spec of OVERLAY_PREVIEW_SPECS) {
      const target = scaledOverlaySize(source.width, source.height, spec.maxEdge);
      if (!target) continue;
      const bytes = await toJpeg(image, target.width, target.height, spec.quality);
      if (!bytes.length) continue;
      const assetPath = safeOverlayRelativePath(setId, relativePath || "image", spec.key);
      publish(assetPath, bytes);
      previews[spec.key] = {
        assetPath,
        fileUrl: archive.urls.get(assetPath),
        width: target.width,
        height: target.height,
        mimeType: "image/jpeg",
        sizeBytes: bytes.length,
        maxEdge: spec.maxEdge,
      };
    }

    const preferred = previews.large ?? previews.medium ?? previews.small;
    if (!preferred) return null;
    return {
      imageWidth: source.width,
      imageHeight: source.height,
      overlayPreviews: previews,
      overlayAssetPath: preferred.assetPath,
      overlayFileUrl: preferred.fileUrl,
      overlayWidth: preferred.width,
      overlayHeight: preferred.height,
      overlayMimeType: preferred.mimeType,
      overlaySizeBytes: preferred.sizeBytes,
    };
  }

  /* ------------------------------------------------------- picked sources -- */
  /* Electron passed absolute paths. A browser has File objects, so hand app.js
     an opaque key and keep the File here. app.js only ever passes it back. */

  const sources = new Map();
  let sourceSeq = 0;

  function rememberSource(file) {
    const key = `web-source:${++sourceSeq}`;
    sources.set(key, file);
    return key;
  }

  function extensionOf(name) {
    const dot = String(name).lastIndexOf(".");
    return dot < 0 ? "" : String(name).slice(dot).toLowerCase();
  }

  async function collectFromDirectoryHandle(directoryHandle, prefix = "") {
    const files = [];
    for await (const [name, entry] of directoryHandle.entries()) {
      const relativePath = prefix ? `${prefix}/${name}` : name;
      if (entry.kind === "directory") {
        files.push(...(await collectFromDirectoryHandle(entry, relativePath)));
        continue;
      }
      if (!IMAGE_EXTENSIONS.has(extensionOf(name))) continue;
      const file = await entry.getFile();
      files.push({
        filePath: rememberSource(file),
        fileName: name,
        relativePath,
        mimeType: file.type || mimeForPath(name),
        sizeBytes: file.size,
      });
    }
    return files;
  }

  // Fallback for browsers with no showDirectoryPicker: a hidden directory input.
  function collectFromDirectoryInput() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.webkitdirectory = true;
      input.style.display = "none";
      input.addEventListener("change", () => {
        const picked = Array.from(input.files || []);
        input.remove();
        if (!picked.length) {
          resolve(null);
          return;
        }
        const root = (picked[0].webkitRelativePath || "").split("/")[0] || "TARPS";
        const files = picked
          .filter((file) => IMAGE_EXTENSIONS.has(extensionOf(file.name)))
          .map((file) => ({
            filePath: rememberSource(file),
            fileName: file.name,
            relativePath: (file.webkitRelativePath || file.name).split("/").slice(1).join("/") || file.name,
            mimeType: file.type || mimeForPath(file.name),
            sizeBytes: file.size,
          }));
        resolve({ directoryPath: root, name: root, files });
      });
      document.body.append(input);
      input.click();
    });
  }

  /* ---------------------------------------------------------- the bridge -- */

  const hasFsAccess = typeof window.showSaveFilePicker === "function";
  const ARCHIVE_PICKER_TYPES = [
    { description: "TARPS intel ZIP archive", accept: { "application/zip": [".tarpsintel.zip", ".zip"] } },
  ];

  function requireFsAccess() {
    if (!hasFsAccess) {
      throw new Error(
        "This browser cannot open or save intel archives. Chrome, Edge or another Chromium browser can.",
      );
    }
  }

  const bridge = {
    assetUrl(projectPath, assetPath) {
      const url = archive.urls.get(String(assetPath || ""));
      if (!url) {
        throw new Error("Refusing to load an invalid TARPS archive asset.");
      }
      return url;
    },

    async createProjectFolder() {
      requireFsAccess();
      let handle;
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: `tarps-intel${INTEL_ARCHIVE_EXTENSION}`,
          types: ARCHIVE_PICKER_TYPES,
        });
      } catch (error) {
        if (error?.name === "AbortError") return null;
        throw error;
      }
      resetArchive(handle, handle.name, handle.name);
      await flush();
      return { projectPath: archive.path, name: archive.name };
    },

    async openProjectFolder() {
      requireFsAccess();
      let handle;
      try {
        [handle] = await window.showOpenFilePicker({ types: ARCHIVE_PICKER_TYPES, multiple: false });
      } catch (error) {
        if (error?.name === "AbortError") return null;
        throw error;
      }
      const file = await handle.getFile();
      const entries = readStoreZip(new Uint8Array(await file.arrayBuffer()));
      resetArchive(handle, handle.name, handle.name, entries);
      const manifest = archive.entries.get(MANIFEST_FILE);
      return {
        projectPath: archive.path,
        name: archive.name,
        text: manifest ? fromUtf8.decode(manifest) : "",
      };
    },

    async writeProjectManifest(projectPath, text) {
      publish(MANIFEST_FILE, utf8.encode(String(text ?? "")));
      return flush();
    },

    async chooseTarpsDirectory() {
      if (typeof window.showDirectoryPicker !== "function") {
        return collectFromDirectoryInput();
      }
      let handle;
      try {
        handle = await window.showDirectoryPicker({ id: "tarps-import", mode: "read" });
      } catch (error) {
        if (error?.name === "AbortError") return null;
        throw error;
      }
      return { directoryPath: handle.name, name: handle.name, files: await collectFromDirectoryHandle(handle) };
    },

    async copyImageToProject(projectPath, setId, relativePath, sourceFilePath) {
      const file = sources.get(sourceFilePath);
      if (!file) {
        throw new Error("That image is no longer available to copy.");
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const assetPath = safeImageRelativePath(setId, relativePath || file.name);
      let image;
      try {
        image = await decode(bytes, file.type || mimeForPath(file.name));
      } catch {
        throw new Error(`Could not decode ${file.name} as a supported PNG, JPG, or WebP image.`);
      }
      publish(assetPath, bytes);
      const overlay = await buildOverlayPreviews(setId, relativePath || file.name, image);
      if (image.close) image.close();
      await flush();
      return { assetPath, fileUrl: archive.urls.get(assetPath), sizeBytes: bytes.length, ...(overlay ?? {}) };
    },

    async createOverlayPreview(projectPath, setId, relativePath, assetPath) {
      const bytes = archive.entries.get(assetPath);
      if (!bytes) return null;
      const image = await decode(bytes, mimeForPath(assetPath));
      const overlay = await buildOverlayPreviews(setId, relativePath, image);
      if (image.close) image.close();
      if (overlay) await flush();
      return overlay;
    },

    async deleteProjectAssets(projectPath, assetPaths) {
      const unique = [...new Set((Array.isArray(assetPaths) ? assetPaths : []).filter(Boolean))];
      for (const assetPath of unique) forget(assetPath);
      if (unique.length) await flush();
      return { deleted: unique.length };
    },

    async savePngAs(suggestedName, pngPayload) {
      const bytes =
        typeof pngPayload === "string"
          ? Uint8Array.from(atob(pngPayload.replace(/^data:image\/png;base64,/, "")), (c) => c.charCodeAt(0))
          : new Uint8Array(pngPayload instanceof ArrayBuffer ? pngPayload : pngPayload.buffer);
      const blob = new Blob([bytes], { type: "image/png" });
      const name = suggestedName || "tarps-map.png";

      if (hasFsAccess) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: name,
            types: [{ description: "PNG image", accept: { "image/png": [".png"] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return { name: handle.name };
        } catch (error) {
          if (error?.name === "AbortError") return null;
          throw error;
        }
      }

      const url = URL.createObjectURL(blob);
      const anchor = Object.assign(document.createElement("a"), { href: url, download: name });
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return { name };
    },

    /* No minimizeWindow, toggleMaximizeWindow or closeWindow on purpose. A
       browser tab has no window chrome, and bindWindowControls() checks for
       exactly those three: leave them out and it disables the titlebar buttons
       instead of showing three that do nothing. */
  };

  window.electronTarps = bridge;
  window.tarpsWebBridge = { archive, buildStoreZip, readStoreZip, crc32, safeImageRelativePath, safeOverlayRelativePath };
})();
