const { contextBridge, ipcRenderer } = require("electron");

function assetUrl(projectPath, assetPath) {
  const assetParts = String(assetPath || "")
    .split(/[\\/]/)
    .filter(Boolean);
  if (!projectPath || !assetParts.length || assetParts.some((part) => part === "." || part === ".." || part.includes(":"))) {
    throw new Error("Refusing to load an invalid TARPS archive asset.");
  }
  const encodedAssetPath = assetParts.map(encodeURIComponent).join("/");
  return `tarps-asset://archive/${encodedAssetPath}?archive=${encodeURIComponent(projectPath)}&v=${Date.now()}`;
}

contextBridge.exposeInMainWorld("electronTarps", {
  assetUrl,
  chooseTarpsDirectory: () => ipcRenderer.invoke("tarps:choose-directory"),
  copyImageToProject: (projectPath, setId, relativePath, sourceFilePath) =>
    ipcRenderer.invoke("tarps:copy-image-to-project", projectPath, setId, relativePath, sourceFilePath),
  createOverlayPreview: (projectPath, setId, relativePath, assetPath) =>
    ipcRenderer.invoke("tarps:create-overlay-preview", projectPath, setId, relativePath, assetPath),
  createProjectFolder: () => ipcRenderer.invoke("tarps:create-project-folder"),
  deleteProjectAssets: (projectPath, assetPaths) => ipcRenderer.invoke("tarps:delete-project-assets", projectPath, assetPaths),
  openProjectFolder: () => ipcRenderer.invoke("tarps:open-project-folder"),
  savePngAs: (suggestedName, pngPayload) => ipcRenderer.invoke("tarps:save-png-as", suggestedName, pngPayload),
  writeProjectManifest: (projectPath, text) => ipcRenderer.invoke("tarps:write-project-manifest", projectPath, text),
  getWindowState: () => ipcRenderer.invoke("tarps:window-state"),
  minimizeWindow: () => ipcRenderer.invoke("tarps:window-minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("tarps:window-toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("tarps:window-close"),
  onWindowStateChange: (callback) => {
    if (typeof callback !== "function") {
      return () => {};
    }
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("tarps:window-state-change", listener);
    return () => ipcRenderer.removeListener("tarps:window-state-change", listener);
  },
});
