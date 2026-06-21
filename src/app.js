const TILE_SIZE = 256;
const EARTH_RADIUS_M = 6378137;
const EARTH_CIRCUMFERENCE_M = 2 * Math.PI * EARTH_RADIUS_M;
const MAX_MERCATOR_LAT = 85.05112878;
const DEFAULT_CENTER = { lat: 25.255, lng: 55.375 };
const DEFAULT_FOCAL_MM = 150;
const DEFAULT_FRAME_MM = 100;
const MAX_WARP_ATTITUDE_DEG = 45;
const DEFAULT_OVERLAY_SOURCE_SIZE_PX = 2048;
const MIN_RAY_DOWN_COMPONENT = 0.001;
const INTEL_FILE_VERSION = 1;
const INTEL_AUTO_SAVE_DELAY_MS = 650;
const IMPORT_COPY_CONCURRENCY = 4;
const PERF_LOG_INTERVAL_MS = 5000;
const OVERLAY_CULL_MARGIN_PX = 256;
const MARKER_CULL_MARGIN_PX = 80;
const VIRTUAL_CAPTURE_ROW_HEIGHT_PX = 62;
const VIRTUAL_CAPTURE_OVERSCAN_ROWS = 8;
const OVERLAY_PREVIEW_ORDER = ["small", "medium", "large"];
const MARKUP_CLICK_SHAPE_SIZE_PX = 64;
const MARKUP_ERASER_RADIUS_PX = 24;
const PROJECTED_IMAGE_TRIANGLE_OVERLAP_PX = 1.2;
const MAP_DRAG_CLICK_SUPPRESSION_PX = 4;
const EDIT_TOOLBAR_VIEWPORT_MARGIN_PX = 12;
const EDIT_TOOLBAR_SEARCH_RADIUS_PX = 220;
const EDIT_TOOLBAR_SEARCH_STEP_PX = 12;
const EDIT_HANDLE_CLEARANCE_PX = 20;
const EDIT_ATTENTION_FLASH_MS = 900;
const SET_COLORS = ["#78c091", "#e0b35f", "#7fb4ff", "#e8839f", "#a58be8", "#6ec7c1", "#f08f5f", "#b6d96b"];
const EDIT_SIDES = ["top", "right", "bottom", "left"];
const EDIT_CORNERS = ["top-left", "top-right", "bottom-right", "bottom-left"];
const MARKUP_TOOLS = ["pan", "multi", "pencil", "line", "square", "circle", "x", "eraser"];
const TILE_SOURCES = {
  grid: {
    name: "Coordinate grid",
    attribution: "Coordinate grid",
  },
  osm: {
    name: "OpenStreetMap tiles",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    template: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
};

const elements = {
  appShell: document.querySelector(".app-shell"),
  appTitlebar: document.querySelector("#appTitlebar"),
  fileMenuButton: document.querySelector("#fileMenuButton"),
  fileMenu: document.querySelector("#fileMenu"),
  windowMinimizeButton: document.querySelector("#windowMinimizeButton"),
  windowMaximizeButton: document.querySelector("#windowMaximizeButton"),
  windowCloseButton: document.querySelector("#windowCloseButton"),
  sidebarToggleButton: document.querySelector("#sidebarToggleButton"),
  map: document.querySelector("#map"),
  mapTimeline: document.querySelector(".map-timeline"),
  tileLayer: document.querySelector("#tileLayer"),
  gridLayer: document.querySelector("#gridLayer"),
  overlayCanvas: document.querySelector("#overlayCanvas"),
  overlayLayer: document.querySelector("#overlayLayer"),
  markerLayer: document.querySelector("#markerLayer"),
  editHandleLayer: document.querySelector("#editHandleLayer"),
  trackLayer: document.querySelector("#trackLayer"),
  markupLayer: document.querySelector("#markupLayer"),
  eraserCursor: document.querySelector("#eraserCursor"),
  mapControls: document.querySelector(".map-controls"),
  addFolderButton: document.querySelector("#addFolderButton"),
  clearSetsButton: document.querySelector("#clearSetsButton"),
  importProgress: document.querySelector("#importProgress"),
  setList: document.querySelector("#setList"),
  loadStatus: document.querySelector("#loadStatus"),
  newIntelButton: document.querySelector("#newIntelButton"),
  loadIntelButton: document.querySelector("#loadIntelButton"),
  saveIntelButton: document.querySelector("#saveIntelButton"),
  exportImageButton: document.querySelector("#exportImageButton"),
  intelStatus: document.querySelector("#intelStatus"),
  intelDialog: document.querySelector("#intelDialog"),
  dialogNewIntelButton: document.querySelector("#dialogNewIntelButton"),
  dialogLoadIntelButton: document.querySelector("#dialogLoadIntelButton"),
  deleteCaptureDialog: document.querySelector("#deleteCaptureDialog"),
  deleteCaptureMessage: document.querySelector("#deleteCaptureMessage"),
  deleteCaptureConfirmButton: document.querySelector("#deleteCaptureConfirmButton"),
  deleteCaptureCancelButton: document.querySelector("#deleteCaptureCancelButton"),
  resetEditDialog: document.querySelector("#resetEditDialog"),
  resetLocationInput: document.querySelector("#resetLocationInput"),
  resetSizeInput: document.querySelector("#resetSizeInput"),
  resetRotationInput: document.querySelector("#resetRotationInput"),
  resetWarpInput: document.querySelector("#resetWarpInput"),
  resetApplyButton: document.querySelector("#resetApplyButton"),
  resetCancelButton: document.querySelector("#resetCancelButton"),
  opacityInput: document.querySelector("#opacityInput"),
  mapSourceInput: document.querySelector("#mapSourceInput"),
  imagesInput: document.querySelector("#imagesInput"),
  tracksInput: document.querySelector("#tracksInput"),
  markupInput: document.querySelector("#markupInput"),
  drawSelectButton: document.querySelector("#drawSelectButton"),
  drawMultiSelectButton: document.querySelector("#drawMultiSelectButton"),
  drawPencilButton: document.querySelector("#drawPencilButton"),
  drawLineButton: document.querySelector("#drawLineButton"),
  drawSquareButton: document.querySelector("#drawSquareButton"),
  drawCircleButton: document.querySelector("#drawCircleButton"),
  drawXButton: document.querySelector("#drawXButton"),
  drawEraserButton: document.querySelector("#drawEraserButton"),
  markupColorInput: document.querySelector("#markupColorInput"),
  markupThicknessInput: document.querySelector("#markupThicknessInput"),
  deleteMarkupButton: document.querySelector("#deleteMarkupButton"),
  timelineStartInput: document.querySelector("#timelineStartInput"),
  timelineInput: document.querySelector("#timelineInput"),
  timelineVisibleFill: document.querySelector("#timelineVisibleFill"),
  timelineTickLayer: document.querySelector("#timelineTickLayer"),
  timelineCurrentReadout: document.querySelector("#timelineCurrentReadout"),
  timelineStartReadout: document.querySelector("#timelineStartReadout"),
  timelineEndReadout: document.querySelector("#timelineEndReadout"),
  playButton: document.querySelector("#playButton"),
  speedInput: document.querySelector("#speedInput"),
  fitButton: document.querySelector("#fitButton"),
  zoomInButton: document.querySelector("#zoomInButton"),
  zoomOutButton: document.querySelector("#zoomOutButton"),
  scaleBar: document.querySelector("#scaleBar"),
  tileStatus: document.querySelector("#tileStatus"),
  mapAttribution: document.querySelector("#mapAttribution"),
  countReadout: document.querySelector("#countReadout"),
  imageList: document.querySelector("#imageList"),
  selectedDetails: document.querySelector("#selectedDetails"),
  imageViewer: document.querySelector("#imageViewer"),
  viewerFrame: document.querySelector(".image-viewer-frame"),
  viewerImageStage: document.querySelector("#viewerImageStage"),
  viewerImage: document.querySelector("#viewerImage"),
  viewerTitle: document.querySelector("#viewerTitle"),
  viewerZoomInput: document.querySelector("#viewerZoomInput"),
  viewerZoomReadout: document.querySelector("#viewerZoomReadout"),
  viewerCloseButton: document.querySelector("#viewerCloseButton"),
  editToolbar: document.querySelector("#editToolbar"),
};

const state = {
  captures: [],
  sets: [],
  nextSetNumber: 1,
  selectedId: null,
  center: DEFAULT_CENTER,
  zoom: 13,
  minZoom: 3,
  maxZoom: 19,
  focalMm: DEFAULT_FOCAL_MM,
  frameMm: DEFAULT_FRAME_MM,
  applyAttitude: true,
  warpImages: true,
  imageOpacity: Number(elements.opacityInput.value),
  imageBlend: "normal",
  mapSource: "grid",
  showImages: elements.imagesInput.checked,
  showFootprints: true,
  showTracks: elements.tracksInput.checked,
  showMarkup: elements.markupInput.checked,
  markupTool: "pan",
  markupColor: elements.markupColorInput.value,
  markupThickness: Number(elements.markupThicknessInput.value),
  markupItems: [],
  selectedMarkupIds: new Set(),
  activeMarkup: null,
  markupDrag: null,
  markupSelectionBox: null,
  markupEraser: null,
  nextMarkupNumber: 1,
  electronProjectPath: null,
  intelFileName: null,
  pendingIntel: null,
  intelDirty: false,
  intelRevision: 0,
  intelSaveTimerId: null,
  intelSaveInFlight: false,
  intelSaveQueued: false,
  intelSaveState: "idle",
  intelSaveError: null,
  sidebarCollapsed: false,
  timelineMin: 0,
  timelineMax: 0,
  windowStartTime: 0,
  currentTime: 0,
  timelineWindowFollowsPlayback: false,
  playbackSpeed: Number(elements.speedInput.value),
  isPlaying: false,
  playbackFrameId: null,
  playbackLastTime: null,
  renderAllFrameId: null,
  renderTimelineFrameId: null,
  renderMarkupFrameId: null,
  renderEditedFrameId: null,
  renderListFrameId: null,
  overlayCanvasRenderId: 0,
  overlayCanvasRetryTimerId: null,
  overlayCanvasHasFrame: false,
  useCanvasOverlays: true,
  visibleCaptureCache: { key: null, captures: [] },
  timelineTickKey: null,
  lastListRenderKey: null,
  perf: { metrics: new Map(), lastLogTime: 0 },
  captureRevision: 0,
  setRevision: 0,
  tileKeys: new Set(),
  tileStatuses: new Map(),
  layerOrder: [],
  viewerCaptureId: null,
  viewerMinimized: true,
  viewerZoom: Number(elements.viewerZoomInput.value),
  viewerPanX: 0,
  viewerPanY: 0,
  isViewerPanning: false,
  viewerPointerStart: null,
  isDragging: false,
  pointerStart: null,
  pendingOverlayClick: null,
  pendingPhotoDeselectClick: null,
  suppressNextOverlayClick: false,
  isTimelineScrubbing: false,
  timelineScrubStartX: 0,
  timelineScrubStartTime: 0,
  edit: {
    active: false,
    mode: "move",
    side: "top",
    captureId: null,
    draftAdjustments: null,
    drag: null,
    attentionTimerId: null,
  },
  pendingDeleteCaptureId: null,
  pendingEditClickOff: null,
};

elements.mapSourceInput.value = state.mapSource;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const SVG_NS = "http://www.w3.org/2000/svg";

function setIcon(iconElement, iconName) {
  const use = iconElement?.querySelector?.("use");
  if (!use) {
    return;
  }
  use.setAttribute("href", `#icon-${iconName}`);
}

function createIcon(iconName, className = "app-icon") {
  const icon = document.createElementNS(SVG_NS, "svg");
  for (const name of className.split(" ").filter(Boolean)) {
    icon.classList.add(name);
  }
  icon.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `#icon-${iconName}`);
  icon.append(use);
  return icon;
}

function setButtonIconLabel(button, iconName, label) {
  const labelElement = document.createElement("span");
  labelElement.textContent = label;
  button.replaceChildren(createIcon(iconName, "app-icon button-icon"), labelElement);
}

function normalizeLongitude(lng) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

function normalizeLatLng(point, fallback = DEFAULT_CENTER) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  const fallbackLat = Number(fallback?.lat);
  const fallbackLng = Number(fallback?.lng);
  return {
    lat: Number.isFinite(lat)
      ? clamp(lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT)
      : clamp(Number.isFinite(fallbackLat) ? fallbackLat : DEFAULT_CENTER.lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT),
    lng: Number.isFinite(lng)
      ? normalizeLongitude(lng)
      : normalizeLongitude(Number.isFinite(fallbackLng) ? fallbackLng : DEFAULT_CENTER.lng),
  };
}

function normalizeRotationDegrees(degrees) {
  const value = Number(degrees);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

function recordPerformance(label, durationMs, count = 1) {
  const metric = state.perf.metrics.get(label) ?? {
    calls: 0,
    totalMs: 0,
    maxMs: 0,
    count: 0,
  };
  metric.calls += 1;
  metric.totalMs += durationMs;
  metric.maxMs = Math.max(metric.maxMs, durationMs);
  metric.count += count;
  state.perf.metrics.set(label, metric);

  const now = performance.now();
  if (now - state.perf.lastLogTime < PERF_LOG_INTERVAL_MS) {
    return;
  }
  state.perf.lastLogTime = now;
  const summary = Array.from(state.perf.metrics, ([name, item]) => ({
    name,
    calls: item.calls,
    avgMs: Number((item.totalMs / Math.max(1, item.calls)).toFixed(2)),
    maxMs: Number(item.maxMs.toFixed(2)),
    avgItems: Number((item.count / Math.max(1, item.calls)).toFixed(1)),
  }));
  if (summary.length) {
    console.table(summary);
  }
}

function measurePerformance(label, fn, count = 1) {
  const start = performance.now();
  try {
    return fn();
  } finally {
    recordPerformance(label, performance.now() - start, count);
  }
}

async function measurePerformanceAsync(label, fn, count = 1) {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    recordPerformance(label, performance.now() - start, count);
  }
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function project(lat, lng, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin(degreesToRadians(clamp(lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT)));
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function unproject(x, y, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = radiansToDegrees(Math.atan(Math.sinh(n)));
  return { lat, lng };
}

function metersPerPixel(lat, zoom) {
  return (Math.cos(degreesToRadians(lat)) * EARTH_CIRCUMFERENCE_M) / (TILE_SIZE * 2 ** zoom);
}

function offsetLatLng(lat, lng, northM, eastM) {
  const latRad = degreesToRadians(lat);
  return {
    lat: lat + radiansToDegrees(northM / EARTH_RADIUS_M),
    lng: lng + radiansToDegrees(eastM / (EARTH_RADIUS_M * Math.cos(latRad))),
  };
}

function latLngDeltaMeters(from, to) {
  const latRad = degreesToRadians(from.lat);
  return {
    northM: degreesToRadians(to.lat - from.lat) * EARTH_RADIUS_M,
    eastM: degreesToRadians(to.lng - from.lng) * EARTH_RADIUS_M * Math.cos(latRad),
  };
}

function latLngToLocalMeters(origin, point) {
  const delta = latLngDeltaMeters(origin, point);
  return {
    rightM: delta.eastM,
    forwardM: delta.northM,
  };
}

function localMetersToLatLng(origin, point) {
  return offsetLatLng(origin.lat, origin.lng, point.forwardM, point.rightM);
}

function screenPointFor(lat, lng) {
  const rect = elements.map.getBoundingClientRect();
  const centerPoint = project(state.center.lat, state.center.lng, state.zoom);
  const point = project(lat, lng, state.zoom);
  return {
    x: point.x - centerPoint.x + rect.width / 2,
    y: point.y - centerPoint.y + rect.height / 2,
  };
}

function mapViewportBounds(marginPx = 0) {
  const rect = elements.map.getBoundingClientRect();
  return {
    minX: -marginPx,
    minY: -marginPx,
    maxX: rect.width + marginPx,
    maxY: rect.height + marginPx,
    width: rect.width,
    height: rect.height,
  };
}

function boundsForScreenPoints(points) {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function screenBoundsIntersect(a, b) {
  return a.maxX >= b.minX && a.minX <= b.maxX && a.maxY >= b.minY && a.minY <= b.maxY;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const crosses =
      current.y > point.y !== previous.y > point.y &&
      point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;
    if (crosses) {
      inside = !inside;
    }
  }
  return inside;
}

function screenPointInBounds(point, bounds) {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
}

function maxScreenEdge(points) {
  if (points.length < 2) {
    return 0;
  }
  let maxEdge = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    maxEdge = Math.max(maxEdge, Math.hypot(current.x - next.x, current.y - next.y));
  }
  return maxEdge;
}

function screenToLatLng(clientX, clientY) {
  const rect = elements.map.getBoundingClientRect();
  const centerPoint = project(state.center.lat, state.center.lng, state.zoom);
  const x = centerPoint.x + clientX - rect.left - rect.width / 2;
  const y = centerPoint.y + clientY - rect.top - rect.height / 2;
  return normalizeLatLng(unproject(x, y, state.zoom), state.center);
}

function formatMeters(meters) {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatClockTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "--:--:--";
  }

  const rounded = Math.max(0, Math.round(seconds));
  const hours = Math.floor(rounded / 3600) % 24;
  const minutes = Math.floor((rounded % 3600) / 60);
  const secondsPart = rounded % 60;
  return [hours, minutes, secondsPart].map((part) => String(part).padStart(2, "0")).join(":");
}

function defaultAdjustments() {
  return {
    translateM: { northM: 0, eastM: 0 },
    scale: 1,
    rotationDeg: 0,
    sideScales: { top: 1, right: 1, bottom: 1, left: 1 },
    cornerOffsetsM: EDIT_CORNERS.map(() => ({ rightM: 0, forwardM: 0 })),
  };
}

function normalizeAdjustments(input) {
  const defaults = defaultAdjustments();
  if (!input || typeof input !== "object") {
    return defaults;
  }

  const translateM = input.translateM && typeof input.translateM === "object" ? input.translateM : {};
  const sideScales = input.sideScales && typeof input.sideScales === "object" ? input.sideScales : {};
  const cornerOffsets = Array.isArray(input.cornerOffsetsM) ? input.cornerOffsetsM : [];
  return {
    translateM: {
      northM: Number.isFinite(Number(translateM.northM)) ? Number(translateM.northM) : defaults.translateM.northM,
      eastM: Number.isFinite(Number(translateM.eastM)) ? Number(translateM.eastM) : defaults.translateM.eastM,
    },
    scale: Number.isFinite(Number(input.scale)) ? clamp(Number(input.scale), 0.25, 4) : defaults.scale,
    rotationDeg: normalizeRotationDegrees(input.rotationDeg),
    sideScales: {
      top: Number.isFinite(Number(sideScales.top)) ? clamp(Number(sideScales.top), 0.25, 4) : defaults.sideScales.top,
      right: Number.isFinite(Number(sideScales.right)) ? clamp(Number(sideScales.right), 0.25, 4) : defaults.sideScales.right,
      bottom: Number.isFinite(Number(sideScales.bottom)) ? clamp(Number(sideScales.bottom), 0.25, 4) : defaults.sideScales.bottom,
      left: Number.isFinite(Number(sideScales.left)) ? clamp(Number(sideScales.left), 0.25, 4) : defaults.sideScales.left,
    },
    cornerOffsetsM: EDIT_CORNERS.map((_, index) => {
      const offset = cornerOffsets[index] && typeof cornerOffsets[index] === "object" ? cornerOffsets[index] : {};
      return {
        rightM: Number.isFinite(Number(offset.rightM)) ? Number(offset.rightM) : 0,
        forwardM: Number.isFinite(Number(offset.forwardM)) ? Number(offset.forwardM) : 0,
      };
    }),
  };
}

function cloneAdjustments(adjustments) {
  return normalizeAdjustments(JSON.parse(JSON.stringify(adjustments ?? defaultAdjustments())));
}

function captureAdjustments(capture) {
  if (state.edit.active && state.edit.captureId === capture.id && state.edit.draftAdjustments) {
    return state.edit.draftAdjustments;
  }
  return capture.adjustments ?? defaultAdjustments();
}

function capturePosition(capture) {
  const adjustments = captureAdjustments(capture);
  return offsetLatLng(
    capture.baseLat ?? capture.lat,
    capture.baseLng ?? capture.lng,
    adjustments.translateM.northM,
    adjustments.translateM.eastM,
  );
}

function setColorForIndex(index) {
  return SET_COLORS[index % SET_COLORS.length];
}

function timelineWindowStart() {
  return state.windowStartTime;
}

function invalidateVisibleCaptures() {
  state.visibleCaptureCache.key = null;
}

function touchCaptureCollection() {
  state.captureRevision += 1;
  invalidateVisibleCaptures();
}

function touchSetData() {
  state.setRevision += 1;
  invalidateVisibleCaptures();
}

function visibleCaptures() {
  const key = `${state.captureRevision}:${state.setRevision}:${state.windowStartTime}:${state.currentTime}`;
  if (state.visibleCaptureCache.key === key) {
    return state.visibleCaptureCache.captures;
  }

  const windowStart = timelineWindowStart();
  const visibleSetIds = new Set(state.sets.filter((set) => set.visible !== false).map((set) => set.id));
  const captures = state.captures.filter(
    (capture) =>
      visibleSetIds.has(capture.setId) &&
      capture.timeSeconds >= windowStart &&
      capture.timeSeconds <= state.currentTime,
  );
  state.visibleCaptureCache = { key, captures };
  return captures;
}

function ensureSelectedCaptureVisible() {
  if (!state.captures.length) {
    state.selectedId = null;
    return;
  }

  const captures = visibleCaptures();
  if (!captures.length) {
    state.selectedId = null;
    return;
  }

  if (!captures.some((capture) => capture.id === state.selectedId)) {
    state.selectedId = captures[captures.length - 1].id;
  }
}

function timelineWindowDuration() {
  return Math.max(0, state.currentTime - state.windowStartTime);
}

function isTimelineMovingWindow() {
  return (state.timelineWindowFollowsPlayback || state.windowStartTime > state.timelineMin) && timelineWindowDuration() > 0;
}

function timelinePercentForTime(timeSeconds) {
  const range = state.timelineMax - state.timelineMin;
  if (range <= 0) {
    return 0;
  }
  return clamp(((timeSeconds - state.timelineMin) / range) * 100, 0, 100);
}

function updateTimelineVisibleFill(hasRange) {
  if (!elements.timelineVisibleFill) {
    return;
  }

  if (!hasRange) {
    elements.timelineVisibleFill.style.left = "0%";
    elements.timelineVisibleFill.style.width = "0%";
    return;
  }

  const startPercent = timelinePercentForTime(state.windowStartTime);
  const endPercent = timelinePercentForTime(state.currentTime);
  elements.timelineVisibleFill.style.left = `${startPercent}%`;
  elements.timelineVisibleFill.style.width = `${Math.max(0, endPercent - startPercent)}%`;
}

function renderTimelineTicks(hasRange) {
  if (!elements.timelineTickLayer) {
    return;
  }

  if (!hasRange) {
    if (state.timelineTickKey !== "empty") {
      elements.timelineTickLayer.replaceChildren();
      state.timelineTickKey = "empty";
    }
    return;
  }

  const visibleSetIds = new Set(state.sets.filter((set) => set.visible !== false).map((set) => set.id));
  const setKey = Array.from(visibleSetIds).sort().join(",");
  const widthKey = Math.max(1, Math.round(elements.timelineTickLayer.clientWidth || 1000));
  const key = `${state.captureRevision}:${state.setRevision}:${state.timelineMin}:${state.timelineMax}:${setKey}:${widthKey}`;
  if (state.timelineTickKey === key) {
    return;
  }

  const occupiedBuckets = new Set();
  const fragment = document.createDocumentFragment();
  for (const capture of state.captures) {
    if (!visibleSetIds.has(capture.setId)) {
      continue;
    }

    const percent = timelinePercentForTime(capture.timeSeconds);
    const bucket = Math.round((percent / 100) * widthKey);
    if (occupiedBuckets.has(bucket)) {
      continue;
    }
    occupiedBuckets.add(bucket);

    const tick = document.createElement("span");
    tick.className = "timeline-tick";
    tick.style.left = `${percent}%`;
    tick.title = formatClockTime(capture.timeSeconds);
    fragment.append(tick);
  }

  elements.timelineTickLayer.replaceChildren(fragment);
  state.timelineTickKey = key;
}

function updateTimelineControls() {
  const hasCaptures = state.captures.length > 0;
  const hasRange = hasCaptures && state.timelineMax > state.timelineMin;
  const visibleCount = visibleCaptures().length;

  elements.timelineInput.disabled = !hasRange;
  elements.timelineStartInput.disabled = !hasRange;
  elements.timelineStartInput.min = String(state.timelineMin);
  elements.timelineStartInput.max = String(state.timelineMax);
  elements.timelineStartInput.value = String(Math.round(state.windowStartTime));
  elements.playButton.disabled = !hasRange;
  elements.timelineInput.min = String(state.timelineMin);
  elements.timelineInput.max = String(state.timelineMax);
  elements.timelineInput.value = String(Math.round(state.currentTime));
  elements.timelineCurrentReadout.textContent = hasCaptures
    ? `${formatClockTime(timelineWindowStart())}-${formatClockTime(state.currentTime)}`
    : "--:--:--";
  elements.timelineStartReadout.textContent = hasCaptures ? formatClockTime(state.timelineMin) : "--:--:--";
  elements.timelineEndReadout.textContent = hasCaptures ? formatClockTime(state.timelineMax) : "--:--:--";
  elements.countReadout.textContent = hasCaptures ? `${visibleCount}/${state.captures.length}` : "0";
  setButtonIconLabel(elements.playButton, state.isPlaying ? "pause" : "play", state.isPlaying ? "Pause" : "Play");
  elements.playButton.setAttribute("aria-pressed", String(state.isPlaying));
  updateTimelineVisibleFill(hasRange);
  renderTimelineTicks(hasRange);
}

function setTimelineTime(nextTime, shouldRender = true) {
  if (!state.captures.length) {
    state.currentTime = 0;
    state.windowStartTime = 0;
    state.timelineWindowFollowsPlayback = false;
    updateTimelineControls();
    return;
  }

  const movingWindow = isTimelineMovingWindow();
  const windowDuration = Math.max(0, state.currentTime - state.windowStartTime);
  state.currentTime = clamp(nextTime, state.timelineMin, state.timelineMax);
  state.windowStartTime = movingWindow
    ? clamp(state.currentTime - windowDuration, state.timelineMin, state.currentTime)
    : state.timelineMin;
  ensureSelectedCaptureVisible();
  updateTimelineControls();

  if (shouldRender) {
    renderTimelineLayers();
  }
}

function setPlaybackTimelineTime(
  nextTime,
  shouldRender = true,
  movingWindow = isTimelineMovingWindow(),
  windowDuration = timelineWindowDuration(),
) {
  if (!state.captures.length) {
    state.currentTime = 0;
    state.windowStartTime = 0;
    state.timelineWindowFollowsPlayback = false;
    updateTimelineControls();
    return;
  }

  state.currentTime = clamp(nextTime, state.timelineMin, state.timelineMax);
  state.windowStartTime = movingWindow
    ? clamp(state.currentTime - windowDuration, state.timelineMin, state.currentTime)
    : clamp(state.windowStartTime, state.timelineMin, state.currentTime);
  ensureSelectedCaptureVisible();
  updateTimelineControls();

  if (shouldRender) {
    renderTimelineLayers();
  }
}

function resetPlaybackTimelineToStart(shouldRender = true) {
  if (!state.captures.length) {
    state.currentTime = 0;
    state.windowStartTime = 0;
    state.timelineWindowFollowsPlayback = false;
    updateTimelineControls();
    return;
  }

  state.windowStartTime = state.timelineMin;
  state.currentTime = state.timelineMin;
  state.timelineWindowFollowsPlayback = false;
  ensureSelectedCaptureVisible();
  updateTimelineControls();

  if (shouldRender) {
    renderTimelineLayers();
  }
}

function setTimelineWindowStart(nextTime, shouldRender = true) {
  if (!state.captures.length) {
    state.windowStartTime = 0;
    state.timelineWindowFollowsPlayback = false;
    updateTimelineControls();
    return;
  }

  state.windowStartTime = clamp(nextTime, state.timelineMin, state.currentTime);
  state.timelineWindowFollowsPlayback = state.windowStartTime > state.timelineMin;
  ensureSelectedCaptureVisible();
  updateTimelineControls();

  if (shouldRender) {
    renderTimelineLayers();
  }
}

function configureTimeline(captures) {
  stopPlayback();
  if (!captures.length) {
    state.timelineMin = 0;
    state.timelineMax = 0;
    state.windowStartTime = 0;
    state.currentTime = 0;
    state.timelineWindowFollowsPlayback = false;
    updateTimelineControls();
    return;
  }

  state.timelineMin = Math.min(...captures.map((capture) => capture.timeSeconds));
  state.timelineMax = Math.max(...captures.map((capture) => capture.timeSeconds));
  state.currentTime = state.timelineMax;
  state.windowStartTime = state.timelineMin;
  state.timelineWindowFollowsPlayback = false;
  updateTimelineControls();
}

function stopPlayback() {
  if (state.playbackFrameId !== null) {
    cancelAnimationFrame(state.playbackFrameId);
  }
  state.isPlaying = false;
  state.playbackFrameId = null;
  state.playbackLastTime = null;
  updateTimelineControls();
}

function playbackStep(timestamp) {
  if (!state.isPlaying) {
    return;
  }

  if (state.playbackLastTime === null) {
    state.playbackLastTime = timestamp;
  }

  const elapsedSeconds = (timestamp - state.playbackLastTime) / 1000;
  state.playbackLastTime = timestamp;
  const range = state.timelineMax - state.timelineMin;
  const movingWindow = isTimelineMovingWindow();
  const windowDuration = timelineWindowDuration();
  let nextTime = state.currentTime + elapsedSeconds * state.playbackSpeed;

  if (nextTime >= state.timelineMax) {
    const overflow = (nextTime - state.timelineMax) % range;
    nextTime = movingWindow ? state.timelineMin + overflow + windowDuration : state.timelineMin + overflow;
    if (!movingWindow) {
      state.windowStartTime = state.timelineMin;
    }
  }

  setPlaybackTimelineTime(nextTime, false, movingWindow, windowDuration);
  scheduleTimelineRender();
  state.playbackFrameId = requestAnimationFrame(playbackStep);
}

function startPlayback() {
  if (!state.captures.length || state.timelineMax <= state.timelineMin) {
    return;
  }

  const shouldResetToStart = state.currentTime >= state.timelineMax;
  const movingWindow = isTimelineMovingWindow();
  const windowDuration = timelineWindowDuration();
  if (shouldResetToStart) {
    if (movingWindow) {
      setPlaybackTimelineTime(state.timelineMin + windowDuration, false, true, windowDuration);
    } else {
      resetPlaybackTimelineToStart(false);
    }
  }

  state.isPlaying = true;
  state.playbackLastTime = null;
  updateTimelineControls();
  if (shouldResetToStart) {
    scheduleTimelineRender();
  }
  state.playbackFrameId = requestAnimationFrame(playbackStep);
}

function togglePlayback() {
  if (state.isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

function niceDistance(targetMeters) {
  const exponent = 10 ** Math.floor(Math.log10(targetMeters));
  const normalized = targetMeters / exponent;
  const nice = normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1;
  return nice * exponent;
}

function niceDegreeStep(targetDegrees) {
  if (!Number.isFinite(targetDegrees) || targetDegrees <= 0) {
    return 1;
  }
  const exponent = 10 ** Math.floor(Math.log10(targetDegrees));
  const normalized = targetDegrees / exponent;
  const nice = normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1;
  return nice * exponent;
}

function formatCoordinate(value, axis) {
  const hemi = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  const abs = Math.abs(value);
  if (abs < 1) {
    return `${hemi}${abs.toFixed(3)}`;
  }
  return `${hemi}${abs.toFixed(2)}`;
}

function imageFootprintMeters(capture) {
  const altitudeM = capture.altFt * 0.3048;
  const sideM = 2 * altitudeM * Math.tan(Math.atan(state.frameMm / (2 * state.focalMm)));
  return {
    widthM: sideM,
    heightM: sideM,
    altitudeM,
  };
}

function vectorLength(vector) {
  return Math.hypot(vector.x, vector.y, vector.z);
}

function normalizeVector(vector) {
  const length = vectorLength(vector);
  if (!Number.isFinite(length) || length === 0) {
    return null;
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function crossVectors(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function localOffsetLatLng(center, orientationDeg, rightM, forwardM) {
  const orientationRad = degreesToRadians(orientationDeg);
  const northM = forwardM * Math.cos(orientationRad) + rightM * Math.cos(orientationRad + Math.PI / 2);
  const eastM = forwardM * Math.sin(orientationRad) + rightM * Math.sin(orientationRad + Math.PI / 2);
  return offsetLatLng(center.lat, center.lng, northM, eastM);
}

function rectangularImageProjection(capture, center, reason = null) {
  const footprint = imageFootprintMeters(capture);
  const halfWidthM = footprint.widthM / 2;
  const halfHeightM = footprint.heightM / 2;
  const cornersMeters = [
    { rightM: -halfWidthM, forwardM: halfHeightM },
    { rightM: halfWidthM, forwardM: halfHeightM },
    { rightM: halfWidthM, forwardM: -halfHeightM },
    { rightM: -halfWidthM, forwardM: -halfHeightM },
  ];

  return {
    type: "rectangle",
    reason,
    center,
    corners: cornersMeters.map((corner) =>
      localOffsetLatLng(center, imageRotationDegrees(capture), corner.rightM, corner.forwardM),
    ),
    cornersMeters,
  };
}

function isWarpableAttitude(capture) {
  return Math.abs(capture.pitchDeg) <= MAX_WARP_ATTITUDE_DEG && Math.abs(capture.rollDeg) <= MAX_WARP_ATTITUDE_DEG;
}

function locationOnlyProjection(capture, reason) {
  const center = capturePosition(capture);
  return {
    type: "location-only",
    reason,
    center,
    corners: [],
    cornersMeters: [],
  };
}

function warpedImageProjection(capture) {
  if (!isWarpableAttitude(capture)) {
    return locationOnlyProjection(capture, "attitude-range");
  }

  const footprint = imageFootprintMeters(capture);
  const halfFrameRatio = state.frameMm / (2 * state.focalMm);
  if (!Number.isFinite(footprint.altitudeM) || footprint.altitudeM <= 0 || !Number.isFinite(halfFrameRatio)) {
    return locationOnlyProjection(capture, "invalid-camera");
  }

  const rightSlope = -Math.tan(degreesToRadians(capture.rollDeg));
  const forwardSlope = -Math.tan(degreesToRadians(capture.pitchDeg));
  const centerDirection = normalizeVector({ x: rightSlope, y: forwardSlope, z: 1 });
  if (!centerDirection) {
    return locationOnlyProjection(capture, "invalid-camera");
  }

  const aircraftForward = { x: 0, y: 1, z: 0 };
  const rightAxis = normalizeVector(crossVectors(aircraftForward, centerDirection)) ?? { x: 1, y: 0, z: 0 };
  const forwardAxis = normalizeVector(crossVectors(centerDirection, rightAxis));
  if (!forwardAxis) {
    return locationOnlyProjection(capture, "invalid-camera");
  }

  const center = captureGroundCenter(capture);
  const centerRightM = rightSlope * footprint.altitudeM;
  const centerForwardM = forwardSlope * footprint.altitudeM;
  const sourceCorners = [
    { u: -halfFrameRatio, v: halfFrameRatio },
    { u: halfFrameRatio, v: halfFrameRatio },
    { u: halfFrameRatio, v: -halfFrameRatio },
    { u: -halfFrameRatio, v: -halfFrameRatio },
  ];
  const corners = [];
  const cornersMeters = [];

  for (const corner of sourceCorners) {
    const ray = {
      x: centerDirection.x + corner.u * rightAxis.x + corner.v * forwardAxis.x,
      y: centerDirection.y + corner.u * rightAxis.y + corner.v * forwardAxis.y,
      z: centerDirection.z + corner.u * rightAxis.z + corner.v * forwardAxis.z,
    };
    if (ray.z <= MIN_RAY_DOWN_COMPONENT) {
      return locationOnlyProjection(capture, "above-horizon");
    }

    const scale = footprint.altitudeM / ray.z;
    const rightM = ray.x * scale;
    const forwardM = ray.y * scale;
    const deltaRightM = rightM - centerRightM;
    const deltaForwardM = forwardM - centerForwardM;

    cornersMeters.push({ rightM, forwardM });
    corners.push(localOffsetLatLng(center, imageRotationDegrees(capture), deltaRightM, deltaForwardM));
  }

  return {
    type: "warped",
    center,
    corners,
    cornersMeters,
  };
}

function unadjustedImageGroundProjection(capture) {
  const position = capturePosition(capture);
  if (!isWarpableAttitude(capture)) {
    return rectangularImageProjection(capture, position, "attitude-range");
  }
  if (!state.applyAttitude) {
    return rectangularImageProjection(capture, position);
  }
  if (!state.warpImages) {
    return rectangularImageProjection(capture, captureGroundCenter(capture), "warp-disabled");
  }
  return warpedImageProjection(capture);
}

function scalePointAroundCenter(center, corner, scale) {
  const local = latLngToLocalMeters(center, corner);
  return localMetersToLatLng(center, {
    rightM: local.rightM * scale,
    forwardM: local.forwardM * scale,
  });
}

function scaleSideLength(corners, center, side, scale) {
  const sideIndices = {
    top: [0, 1],
    right: [1, 2],
    bottom: [2, 3],
    left: [3, 0],
  }[side];
  if (!sideIndices || Math.abs(scale - 1) < 0.0001) {
    return corners;
  }

  const nextCorners = [...corners];
  const [firstIndex, secondIndex] = sideIndices;
  const first = latLngToLocalMeters(center, nextCorners[firstIndex]);
  const second = latLngToLocalMeters(center, nextCorners[secondIndex]);
  const midpoint = {
    rightM: (first.rightM + second.rightM) / 2,
    forwardM: (first.forwardM + second.forwardM) / 2,
  };
  for (const [index, point] of [
    [firstIndex, first],
    [secondIndex, second],
  ]) {
    nextCorners[index] = localMetersToLatLng(center, {
      rightM: midpoint.rightM + (point.rightM - midpoint.rightM) * scale,
      forwardM: midpoint.forwardM + (point.forwardM - midpoint.forwardM) * scale,
    });
  }
  return nextCorners;
}

function rotatePointAroundCenter(center, point, degrees) {
  if (Math.abs(degrees) < 0.0001) {
    return point;
  }
  const local = latLngToLocalMeters(center, point);
  const radians = degreesToRadians(degrees);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return localMetersToLatLng(center, {
    rightM: local.rightM * cos - local.forwardM * sin,
    forwardM: local.rightM * sin + local.forwardM * cos,
  });
}

function applyCornerOffset(center, point, offset) {
  if (!offset || (Math.abs(offset.rightM) < 0.0001 && Math.abs(offset.forwardM) < 0.0001)) {
    return point;
  }
  const local = latLngToLocalMeters(center, point);
  return localMetersToLatLng(center, {
    rightM: local.rightM + offset.rightM,
    forwardM: local.forwardM + offset.forwardM,
  });
}

function applyManualProjectionAdjustments(projection, capture) {
  if (projection.corners.length !== 4) {
    return projection;
  }

  const adjustments = captureAdjustments(capture);
  let corners = projection.corners.map((corner) => ({ ...corner }));
  if (Math.abs(adjustments.scale - 1) > 0.0001) {
    corners = corners.map((corner) => scalePointAroundCenter(projection.center, corner, adjustments.scale));
  }

  for (const side of EDIT_SIDES) {
    corners = scaleSideLength(corners, projection.center, side, adjustments.sideScales[side]);
  }

  if (Math.abs(adjustments.rotationDeg) > 0.0001) {
    corners = corners.map((corner) => rotatePointAroundCenter(projection.center, corner, adjustments.rotationDeg));
  }

  corners = corners.map((corner, index) => applyCornerOffset(projection.center, corner, adjustments.cornerOffsetsM[index]));

  return {
    ...projection,
    corners,
    cornersMeters: corners.map((corner) => latLngToLocalMeters(projection.center, corner)),
  };
}

function imageGroundProjection(capture) {
  return applyManualProjectionAdjustments(unadjustedImageGroundProjection(capture), capture);
}

function capturePreviewRotationDegrees(capture) {
  if (!capture) {
    return 0;
  }
  const projection = imageGroundProjection(capture);
  if (projection.corners.length === 4) {
    const [topLeft, topRight] = projection.corners.map((corner) => screenPointFor(corner.lat, corner.lng));
    const dx = topRight.x - topLeft.x;
    const dy = topRight.y - topLeft.y;
    if (Math.hypot(dx, dy) > 0.5) {
      return normalizeRotationDegrees(radiansToDegrees(Math.atan2(dy, dx)));
    }
  }
  return normalizeRotationDegrees(imageRotationDegrees(capture) + captureAdjustments(capture).rotationDeg);
}

function rotatedRectangleSize(width, height, degrees) {
  const radians = degreesToRadians(degrees);
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  return {
    width: Math.max(1, width * cos + height * sin),
    height: Math.max(1, width * sin + height * cos),
  };
}

function distanceBetweenMeterPoints(a, b) {
  return Math.hypot(a.rightM - b.rightM, a.forwardM - b.forwardM);
}

function projectionMetrics(projection) {
  if (projection.cornersMeters.length !== 4) {
    return null;
  }

  const topWidthM = distanceBetweenMeterPoints(projection.cornersMeters[0], projection.cornersMeters[1]);
  const bottomWidthM = distanceBetweenMeterPoints(projection.cornersMeters[3], projection.cornersMeters[2]);
  const leftHeightM = distanceBetweenMeterPoints(projection.cornersMeters[0], projection.cornersMeters[3]);
  const rightHeightM = distanceBetweenMeterPoints(projection.cornersMeters[1], projection.cornersMeters[2]);
  return {
    widthMinM: Math.min(topWidthM, bottomWidthM),
    widthMaxM: Math.max(topWidthM, bottomWidthM),
    heightMinM: Math.min(leftHeightM, rightHeightM),
    heightMaxM: Math.max(leftHeightM, rightHeightM),
  };
}

function formatMetersRange(minM, maxM) {
  if (Math.abs(maxM - minM) < Math.max(1, maxM * 0.04)) {
    return formatMeters((minM + maxM) / 2);
  }
  if (minM >= 1000 && maxM >= 1000) {
    const minKm = minM / 1000;
    const maxKm = maxM / 1000;
    return `${minKm >= 10 ? Math.round(minKm) : minKm.toFixed(1)}-${
      maxKm >= 10 ? Math.round(maxKm) : maxKm.toFixed(1)
    } km`;
  }
  if (maxM < 1000) {
    return `${Math.round(minM)}-${Math.round(maxM)} m`;
  }
  return `${formatMeters(minM)}-${formatMeters(maxM)}`;
}

function projectionFootprintLabel(capture) {
  const projection = imageGroundProjection(capture);
  if (projection.type === "location-only") {
    return "location only";
  }

  const metrics = projectionMetrics(projection);
  if (!metrics) {
    return "location only";
  }
  return `${formatMetersRange(metrics.widthMinM, metrics.widthMaxM)} x ${formatMetersRange(
    metrics.heightMinM,
    metrics.heightMaxM,
  )}`;
}

function projectionFootprintReadout(capture) {
  const projection = imageGroundProjection(capture);
  if (projection.type === "location-only") {
    return "location only";
  }

  const metrics = projectionMetrics(projection);
  if (!metrics) {
    return "location only";
  }
  return formatMeters(Math.max(metrics.widthMaxM, metrics.heightMaxM));
}

function solveLinearSystem(rows, values) {
  const size = values.length;
  const matrix = rows.map((row, index) => [...row, values[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivotRow][column])) {
        pivotRow = row;
      }
    }

    if (Math.abs(matrix[pivotRow][column]) < 1e-10) {
      return null;
    }

    [matrix[column], matrix[pivotRow]] = [matrix[pivotRow], matrix[column]];
    const pivot = matrix[column][column];
    for (let cell = column; cell <= size; cell += 1) {
      matrix[column][cell] /= pivot;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === column) {
        continue;
      }
      const factor = matrix[row][column];
      for (let cell = column; cell <= size; cell += 1) {
        matrix[row][cell] -= factor * matrix[column][cell];
      }
    }
  }

  return matrix.map((row) => row[size]);
}

function cssNumber(value) {
  return Math.abs(value) < 1e-8 ? "0" : value.toFixed(8);
}

function homographyForQuad(points, width, height) {
  const sourcePoints = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];
  const rows = [];
  const values = [];

  for (let index = 0; index < points.length; index += 1) {
    const source = sourcePoints[index];
    const target = points[index];
    rows.push([source.x, source.y, 1, 0, 0, 0, -target.x * source.x, -target.x * source.y]);
    values.push(target.x);
    rows.push([0, 0, 0, source.x, source.y, 1, -target.y * source.x, -target.y * source.y]);
    values.push(target.y);
  }

  const solution = solveLinearSystem(rows, values);
  if (!solution || !solution.every(Number.isFinite)) {
    return null;
  }
  return solution;
}

function projectHomography(solution, x, y) {
  const [a, b, c, d, e, f, g, h] = solution;
  const denominator = g * x + h * y + 1;
  if (Math.abs(denominator) < 1e-10) {
    return null;
  }
  return {
    x: (a * x + b * y + c) / denominator,
    y: (d * x + e * y + f) / denominator,
  };
}

function matrix3dForQuad(points, width, height) {
  const solution = homographyForQuad(points, width, height);
  if (!solution) {
    return null;
  }
  const [a, b, c, d, e, f, g, h] = solution;
  const matrix = [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${matrix.map(cssNumber).join(", ")})`;
}

function normalizedOverlayPreviews(previews) {
  if (!previews || typeof previews !== "object") {
    return null;
  }
  const normalized = {};
  for (const [key, preview] of Object.entries(previews)) {
    if (!preview || typeof preview !== "object") {
      continue;
    }
    const fileUrl = preview.fileUrl ?? preview.url ?? null;
    const assetPath = preview.assetPath ?? null;
    if (!fileUrl && !assetPath) {
      continue;
    }
    normalized[key] = {
      fileUrl,
      assetPath,
      width: Number.isFinite(Number(preview.width)) ? Number(preview.width) : null,
      height: Number.isFinite(Number(preview.height)) ? Number(preview.height) : null,
      mimeType: preview.mimeType ?? "image/jpeg",
      sizeBytes: Number.isFinite(Number(preview.sizeBytes)) ? Number(preview.sizeBytes) : null,
      maxEdge: Number.isFinite(Number(preview.maxEdge)) ? Number(preview.maxEdge) : null,
    };
  }
  return Object.keys(normalized).length ? normalized : null;
}

function legacyOverlayPreview(capture) {
  if (!capture.overlayUrl && !capture.overlayAssetPath) {
    return null;
  }
  return {
    fileUrl: capture.overlayUrl ?? null,
    assetPath: capture.overlayAssetPath ?? null,
    width: capture.overlayWidth ?? null,
    height: capture.overlayHeight ?? null,
    mimeType: capture.overlayMimeType ?? "image/jpeg",
    sizeBytes: capture.overlaySizeBytes ?? null,
    maxEdge: Math.max(capture.overlayWidth ?? 0, capture.overlayHeight ?? 0) || null,
  };
}

function overlayPreviewEntries(capture) {
  const previews = normalizedOverlayPreviews(capture.overlayPreviews);
  if (previews) {
    return Object.entries(previews)
      .map(([key, preview]) => ({ key, ...preview }))
      .sort((a, b) => {
        const aIndex = OVERLAY_PREVIEW_ORDER.indexOf(a.key);
        const bIndex = OVERLAY_PREVIEW_ORDER.indexOf(b.key);
        const aOrder = aIndex >= 0 ? aIndex : OVERLAY_PREVIEW_ORDER.length;
        const bOrder = bIndex >= 0 ? bIndex : OVERLAY_PREVIEW_ORDER.length;
        return aOrder - bOrder || (a.maxEdge ?? Infinity) - (b.maxEdge ?? Infinity);
      });
  }

  const legacy = legacyOverlayPreview(capture);
  return legacy ? [{ key: "legacy", ...legacy }] : [];
}

function selectOverlayPreview(capture, projectedMaxEdge = Infinity) {
  const entries = overlayPreviewEntries(capture).filter((entry) => entry.fileUrl);
  if (!entries.length) {
    return {
      key: "original",
      fileUrl: capture.url,
      width: capture.imageWidth ?? DEFAULT_OVERLAY_SOURCE_SIZE_PX,
      height: capture.imageHeight ?? DEFAULT_OVERLAY_SOURCE_SIZE_PX,
      maxEdge: Math.max(capture.imageWidth ?? 0, capture.imageHeight ?? 0) || null,
    };
  }

  if (!Number.isFinite(projectedMaxEdge)) {
    return entries[entries.length - 1];
  }

  return entries.find((entry) => (entry.maxEdge ?? Math.max(entry.width ?? 0, entry.height ?? 0)) >= projectedMaxEdge * 1.15) ?? entries[entries.length - 1];
}

function overlaySourceSize(capture, preview = selectOverlayPreview(capture)) {
  if (preview?.width && preview?.height) {
    return {
      width: preview.width,
      height: preview.height,
    };
  }
  return {
    width: capture.overlayWidth ?? capture.imageWidth ?? DEFAULT_OVERLAY_SOURCE_SIZE_PX,
    height: capture.overlayHeight ?? capture.imageHeight ?? DEFAULT_OVERLAY_SOURCE_SIZE_PX,
  };
}

function captureOverlayUrl(capture, projectedMaxEdge = Infinity) {
  return selectOverlayPreview(capture, projectedMaxEdge).fileUrl ?? capture.url;
}

function updateCaptureSize(capture, width, height, widthKey, heightKey) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }

  const nextWidth = Math.round(width);
  const nextHeight = Math.round(height);
  if (capture[widthKey] === nextWidth && capture[heightKey] === nextHeight) {
    return false;
  }

  capture[widthKey] = nextWidth;
  capture[heightKey] = nextHeight;
  return true;
}

function updateCaptureImageSize(capture, width, height) {
  return updateCaptureSize(capture, width, height, "imageWidth", "imageHeight");
}

function updateCaptureOverlaySize(capture, width, height) {
  return updateCaptureSize(capture, width, height, "overlayWidth", "overlayHeight");
}

function captureGroundCenter(capture) {
  const position = capturePosition(capture);
  if (!state.applyAttitude) {
    return position;
  }

  const altitudeM = capture.altFt * 0.3048;
  const headingRad = degreesToRadians(capture.headingDeg);
  const forwardM = -altitudeM * Math.tan(degreesToRadians(capture.pitchDeg));
  const rightM = -altitudeM * Math.tan(degreesToRadians(capture.rollDeg));
  const northM = forwardM * Math.cos(headingRad) + rightM * Math.cos(headingRad + Math.PI / 2);
  const eastM = forwardM * Math.sin(headingRad) + rightM * Math.sin(headingRad + Math.PI / 2);
  return offsetLatLng(position.lat, position.lng, northM, eastM);
}

function imageRotationDegrees(capture) {
  return capture.headingDeg;
}

function parseDms(token) {
  const match = token.match(/^([NSEW])(\d{2,3})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid coordinate token: ${token}`);
  }
  const [, hemi, degrees, minutes, seconds] = match;
  const decimal = Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600;
  return hemi === "S" || hemi === "W" ? -decimal : decimal;
}

function parseTimeSeconds(timeToken) {
  const match = timeToken.match(/^(\d{2})-(\d{2})-(\d{2})$/);
  if (!match) {
    return 0;
  }
  const [, hours, minutes, seconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function extensionFromPath(path) {
  const lowerPath = path.toLowerCase();
  const dotIndex = lowerPath.lastIndexOf(".");
  return dotIndex >= 0 ? lowerPath.slice(dotIndex) : "";
}

function filenameFromUrl(url) {
  const pathname = new URL(url, window.location.href).pathname;
  return decodeURIComponent(pathname.slice(pathname.lastIndexOf("/") + 1));
}

function parseCapture(url, options = {}) {
  return parseCaptureFromFileName(filenameFromUrl(url), url, options);
}

function parseCaptureFromFileName(fileName, url, options = {}) {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const match = stem.match(
    /^TARPS\s+(?<camera>\S+)\s+(?<time>\d{2}-\d{2}-\d{2})(?<station>[A-Z])\s+(?<date>\d{2}-\d{2}-\d{4})\s+(?<lat>[NS]\d{2}-\d{2}-\d{2})\s+(?<lng>[EW]\d{3}-\d{2}-\d{2})\s+ALT(?<alt>[+-]\d+)\s+DRIFT(?<drift>[+-]\d+)\s+HDG(?<heading>\d+)\s+PITCH(?<pitch>[+-]\d+)\s+ROLL(?<roll>[+-]\d+)$/,
  );

  if (!match?.groups) {
    throw new Error(`Filename does not match TARPS metadata pattern: ${fileName}`);
  }

  const groups = match.groups;
  const baseId = `${groups.date}-${groups.time}${groups.station}-${groups.lat}-${groups.lng}`;
  const relativePath = options.relativePath ?? fileName;
  const setId = options.setId ?? "default";
  const baseLat = parseDms(groups.lat);
  const baseLng = parseDms(groups.lng);
  return {
    id: `${setId}:${relativePath}:${baseId}`,
    url,
    overlayUrl: options.overlayUrl ?? url,
    fileName,
    relativePath,
    setId,
    setName: options.setName ?? "Images",
    setColor: options.setColor ?? SET_COLORS[0],
    camera: groups.camera,
    timeToken: groups.time,
    dateToken: groups.date,
    station: groups.station,
    timeSeconds: parseTimeSeconds(groups.time),
    lat: baseLat,
    lng: baseLng,
    baseLat,
    baseLng,
    altFt: Number(groups.alt),
    driftDeg: Number(groups.drift),
    headingDeg: Number(groups.heading),
    pitchDeg: Number(groups.pitch),
    rollDeg: Number(groups.roll),
    adjustments: cloneAdjustments(options.adjustments),
    dataUrl: options.dataUrl ?? (url.startsWith("data:") ? url : null),
    assetPath: options.assetPath ?? null,
    overlayPreviews: normalizedOverlayPreviews(options.overlayPreviews),
    overlayAssetPath: options.overlayAssetPath ?? null,
    overlayMimeType: options.overlayMimeType ?? null,
    overlaySizeBytes: Number.isFinite(Number(options.overlaySizeBytes)) ? Number(options.overlaySizeBytes) : null,
    overlayWidth: Number.isFinite(Number(options.overlayWidth)) ? Number(options.overlayWidth) : null,
    overlayHeight: Number.isFinite(Number(options.overlayHeight)) ? Number(options.overlayHeight) : null,
    mimeType: options.mimeType ?? null,
    sizeBytes: Number.isFinite(Number(options.sizeBytes)) ? Number(options.sizeBytes) : null,
  };
}

function setStatus(message, isError = false) {
  elements.loadStatus.value = message;
  elements.loadStatus.classList.toggle("error", isError);
}

function setIntelStatus(message, isError = false) {
  elements.intelStatus.value = message;
  elements.intelStatus.classList.toggle("error", isError);
}

function hasWritableIntelFile() {
  return Boolean(state.electronProjectPath);
}

function renderIntelStatus() {
  const name = state.intelFileName ?? "No intel archive";
  if (state.intelSaveState === "saving") {
    setIntelStatus(`${name} / saving...`);
    return;
  }
  if (state.intelSaveState === "error") {
    setIntelStatus(`${name} / autosave failed: ${state.intelSaveError ?? "unknown error"}`, true);
    return;
  }

  if (state.intelDirty && hasWritableIntelFile()) {
    setIntelStatus(`${name} / autosave pending`);
    return;
  }
  if (state.intelDirty) {
    setIntelStatus(`${name} / not saved to disk`, true);
    return;
  }

  setIntelStatus(`${name} / ${hasWritableIntelFile() ? "saved on disk" : "session only"}`);
}

function scheduleIntelAutoSave(delay = INTEL_AUTO_SAVE_DELAY_MS) {
  if (!hasWritableIntelFile()) {
    renderIntelStatus();
    return;
  }
  if (state.intelSaveTimerId !== null) {
    clearTimeout(state.intelSaveTimerId);
  }
  state.intelSaveTimerId = setTimeout(() => {
    state.intelSaveTimerId = null;
    saveIntelFile({ automatic: true }).catch((error) => {
      console.error(error);
      state.intelSaveState = "error";
      state.intelSaveError = error.message;
      renderIntelStatus();
    });
  }, delay);
}

function clearScheduledIntelAutoSave() {
  if (state.intelSaveTimerId !== null) {
    clearTimeout(state.intelSaveTimerId);
    state.intelSaveTimerId = null;
  }
  state.intelSaveQueued = false;
}

function markIntelDirty() {
  state.intelDirty = true;
  state.intelRevision += 1;
  state.intelSaveError = null;
  if (state.intelSaveState === "error") {
    state.intelSaveState = "idle";
  }
  renderIntelStatus();
  scheduleIntelAutoSave();
}

function resetLoadedCaptures() {
  stopPlayback();
  state.captures = [];
  state.sets = [];
  state.selectedId = null;
  state.layerOrder = [];
  state.viewerCaptureId = null;
  state.viewerMinimized = true;
  state.edit.active = false;
  state.edit.captureId = null;
  state.edit.draftAdjustments = null;
  touchCaptureCollection();
  configureTimeline([]);
}

function createCaptureSet(name, options = {}) {
  const setIndex = state.sets.length;
  const setId = `set-${Date.now().toString(36)}-${state.nextSetNumber}`;
  state.nextSetNumber += 1;
  return {
    id: setId,
    name: name || `Set ${state.nextSetNumber - 1}`,
    color: options.color ?? setColorForIndex(setIndex),
    sourceDirectory: options.sourceDirectory ?? name ?? `Set ${state.nextSetNumber - 1}`,
    importedAt: options.importedAt ?? new Date().toISOString(),
    visible: options.visible ?? true,
    captureCount: 0,
  };
}

function intelSetForSource(sourceDirectory) {
  const sets = Array.isArray(state.pendingIntel?.sets) ? state.pendingIntel.sets : [];
  return sets.find((set) => set.sourceDirectory === sourceDirectory || set.name === sourceDirectory) ?? null;
}

function intelCaptureForPath(intelSet, relativePath) {
  const captures = Array.isArray(intelSet?.captures) ? intelSet.captures : [];
  return captures.find((capture) => capture.relativePath === relativePath) ?? null;
}

function fileNameFromRelativePath(relativePath, fallback = "image") {
  const path = String(relativePath || fallback);
  return path.split(/[\\/]/).filter(Boolean).pop() || fallback;
}

function mimeTypeForImage(file) {
  if (file.type) {
    return file.type;
  }
  const extension = extensionFromPath(file.name);
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".webp") {
    return "image/webp";
  }
  return "image/jpeg";
}

function setImportProgress(current, total, message) {
  const hasProgress = Number.isFinite(total) && total > 0;
  elements.importProgress.hidden = !hasProgress;
  if (hasProgress) {
    elements.importProgress.max = total;
    elements.importProgress.value = clamp(current, 0, total);
  }
  if (message) {
    setStatus(message);
  }
}

function hideImportProgress() {
  elements.importProgress.hidden = true;
  elements.importProgress.value = 0;
}

function applyIntelToLoadedSets() {
  if (!state.pendingIntel) {
    return;
  }

  const markup = Array.isArray(state.pendingIntel.markup) ? state.pendingIntel.markup : [];
  state.markupItems = markup.map(normalizeMarkupItem).filter(Boolean);
  state.selectedMarkupIds.clear();
  state.markupDrag = null;
  state.markupSelectionBox = null;
  elements.map.classList.remove("is-multi-selecting");

  for (const set of state.sets) {
    const intelSet = intelSetForSource(set.sourceDirectory);
    if (!intelSet) {
      continue;
    }
    set.color = intelSet.color ?? set.color;
    set.name = intelSet.name ?? set.name;
    set.visible = intelSet.visible ?? set.visible;
    for (const capture of state.captures.filter((item) => item.setId === set.id)) {
      const intelCapture = intelCaptureForPath(intelSet, capture.relativePath);
      if (!intelCapture) {
        continue;
      }
      capture.setColor = set.color;
      capture.setName = set.name;
      capture.adjustments = cloneAdjustments(intelCapture.adjustments);
    }
  }
  touchSetData();
}

function hasStoredIntelSets() {
  return Array.isArray(state.pendingIntel?.sets) && state.pendingIntel.sets.length > 0;
}

function applyIntelView(requireStoredSets = false) {
  if (requireStoredSets && !hasStoredIntelSets()) {
    return false;
  }

  const view = state.pendingIntel?.view;
  if (!view || typeof view !== "object") {
    return false;
  }

  const centerLat = Number(view.center?.lat);
  const centerLng = Number(view.center?.lng);
  if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
    state.center = normalizeLatLng({ lat: centerLat, lng: centerLng }, state.center);
  }

  const zoom = Number(view.zoom);
  if (Number.isFinite(zoom)) {
    state.zoom = clamp(zoom, state.minZoom, state.maxZoom);
  }

  if (state.captures.length && state.timelineMax >= state.timelineMin) {
    const currentTime = Number(view.currentTime);
    if (Number.isFinite(currentTime)) {
      state.currentTime = clamp(currentTime, state.timelineMin, state.timelineMax);
    }

    const windowStartTime = Number(view.windowStartTime);
    if (Number.isFinite(windowStartTime)) {
      state.windowStartTime = clamp(windowStartTime, state.timelineMin, state.currentTime);
    }
    state.timelineWindowFollowsPlayback = state.windowStartTime > state.timelineMin;
  }

  updateTimelineControls();
  return true;
}

function captureLayerRef(capture) {
  const set = state.sets.find((item) => item.id === capture.setId);
  return {
    sourceDirectory: set?.sourceDirectory ?? capture.setName,
    relativePath: capture.relativePath,
  };
}

function layerRefKey(ref) {
  if (typeof ref === "string") {
    return ref;
  }
  if (!ref || typeof ref !== "object") {
    return "";
  }
  return `${ref.sourceDirectory ?? ref.setName ?? ""}\u0000${ref.relativePath ?? ref.fileName ?? ""}`;
}

function captureLayerRefKey(capture) {
  return layerRefKey(captureLayerRef(capture));
}

function currentLayerOrderRefs() {
  const capturesById = new Map(state.captures.map((capture) => [capture.id, capture]));
  const usedIds = new Set();
  const ordered = [];
  for (const captureId of state.layerOrder) {
    const capture = capturesById.get(captureId);
    if (!capture || usedIds.has(captureId)) {
      continue;
    }
    ordered.push(capture);
    usedIds.add(captureId);
  }
  for (const capture of state.captures) {
    if (!usedIds.has(capture.id)) {
      ordered.push(capture);
    }
  }
  return ordered.map(captureLayerRef);
}

function applyStoredLayerOrder() {
  const storedOrder = state.pendingIntel?.view?.layerOrder ?? state.pendingIntel?.layerOrder;
  if (!Array.isArray(storedOrder) || !storedOrder.length) {
    state.layerOrder = state.captures.map((capture) => capture.id);
    return;
  }

  const captureByKey = new Map(state.captures.map((capture) => [captureLayerRefKey(capture), capture]));
  const orderedIds = [];
  const usedIds = new Set();
  for (const ref of storedOrder) {
    const capture = captureByKey.get(layerRefKey(ref));
    if (!capture || usedIds.has(capture.id)) {
      continue;
    }
    orderedIds.push(capture.id);
    usedIds.add(capture.id);
  }
  state.layerOrder = [
    ...orderedIds,
    ...state.captures.map((capture) => capture.id).filter((captureId) => !usedIds.has(captureId)),
  ];
}

function currentIntelPayload() {
  const sets = state.sets.map((set) => ({
    name: set.name,
    color: set.color,
    sourceDirectory: set.sourceDirectory,
    importedAt: set.importedAt,
    visible: set.visible !== false,
    captures: state.captures
      .filter((capture) => capture.setId === set.id)
      .map((capture) => ({
        relativePath: capture.relativePath,
        fileName: capture.fileName,
        mimeType: capture.mimeType,
        sizeBytes: capture.sizeBytes,
        assetPath: capture.assetPath ?? null,
        overlayPreviews: capture.overlayPreviews
          ? Object.fromEntries(
              Object.entries(capture.overlayPreviews).map(([key, preview]) => [
                key,
                {
                  assetPath: preview.assetPath ?? null,
                  width: preview.width ?? null,
                  height: preview.height ?? null,
                  mimeType: preview.mimeType ?? null,
                  sizeBytes: preview.sizeBytes ?? null,
                  maxEdge: preview.maxEdge ?? null,
                },
              ]),
            )
          : null,
        overlayAssetPath: capture.overlayAssetPath ?? null,
        overlayMimeType: capture.overlayMimeType ?? null,
        overlaySizeBytes: capture.overlaySizeBytes ?? null,
        overlayWidth: capture.overlayWidth ?? null,
        overlayHeight: capture.overlayHeight ?? null,
        dataUrl: capture.assetPath ? null : capture.dataUrl ?? capture.url,
        adjustments: cloneAdjustments(capture.adjustments),
      })),
  }));

  return {
    version: INTEL_FILE_VERSION,
    updatedAt: new Date().toISOString(),
    view: {
      center: state.center,
      zoom: state.zoom,
      currentTime: state.currentTime,
      windowStartTime: state.windowStartTime,
      layerOrder: currentLayerOrderRefs(),
    },
    sets,
    markup: state.markupItems,
  };
}

function intelCaptureUrl(intelCapture) {
  if (intelCapture.dataUrl) {
    return intelCapture.dataUrl;
  }
  if (intelCapture.assetPath && state.electronProjectPath && window.electronTarps?.assetUrl) {
    return window.electronTarps.assetUrl(state.electronProjectPath, intelCapture.assetPath);
  }
  return null;
}

function intelCaptureOverlayUrl(intelCapture, fallbackUrl) {
  if (intelCapture.overlayAssetPath && state.electronProjectPath && window.electronTarps?.assetUrl) {
    return window.electronTarps.assetUrl(state.electronProjectPath, intelCapture.overlayAssetPath);
  }
  return fallbackUrl;
}

function intelCaptureOverlayPreviews(intelCapture) {
  const previews = normalizedOverlayPreviews(intelCapture.overlayPreviews);
  if (!previews) {
    return null;
  }
  const hydrated = {};
  for (const [key, preview] of Object.entries(previews)) {
    hydrated[key] = {
      ...preview,
      fileUrl:
        preview.fileUrl ??
        (preview.assetPath && state.electronProjectPath && window.electronTarps?.assetUrl
          ? window.electronTarps.assetUrl(state.electronProjectPath, preview.assetPath)
          : null),
    };
  }
  return hydrated;
}

async function refreshMissingOverlayPreviews() {
  if (!state.electronProjectPath || !window.electronTarps?.createOverlayPreview) {
    return;
  }

  const captures = state.captures.filter((capture) => capture.assetPath && !capture.overlayPreviews);
  if (!captures.length) {
    return;
  }

  let nextIndex = 0;
  let updatedCount = 0;
  setStatus(`Optimising ${captures.length} map preview${captures.length === 1 ? "" : "s"}...`);

  async function processCapture(capture) {
    const preview = await window.electronTarps
      .createOverlayPreview(state.electronProjectPath, capture.setId, capture.relativePath, capture.assetPath)
      .catch(() => null);
    if (!preview?.overlayAssetPath) {
      return;
    }
    capture.overlayPreviews = normalizedOverlayPreviews(preview.overlayPreviews) ?? capture.overlayPreviews;
    capture.overlayAssetPath = preview.overlayAssetPath;
    capture.overlayUrl = preview.overlayFileUrl ?? capture.overlayUrl;
    capture.overlayMimeType = preview.overlayMimeType ?? capture.overlayMimeType;
    capture.overlaySizeBytes = preview.overlaySizeBytes ?? capture.overlaySizeBytes;
    capture.overlayWidth = preview.overlayWidth ?? capture.overlayWidth;
    capture.overlayHeight = preview.overlayHeight ?? capture.overlayHeight;
    updatedCount += 1;
  }

  const workerCount = Math.min(IMPORT_COPY_CONCURRENCY, captures.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < captures.length) {
      const capture = captures[nextIndex];
      nextIndex += 1;
      await processCapture(capture);
    }
  });
  await Promise.all(workers);

  if (updatedCount > 0) {
    renderOverlays();
    markIntelDirty();
    setStatus(`Optimised ${updatedCount} map preview${updatedCount === 1 ? "" : "s"}.`);
  }
}

function loadEmbeddedSetsFromIntel() {
  const sets = Array.isArray(state.pendingIntel?.sets) ? state.pendingIntel.sets : [];
  const failures = [];

  for (const intelSet of sets) {
    const captures = Array.isArray(intelSet?.captures) ? intelSet.captures : [];
    const set = createCaptureSet(intelSet.name ?? intelSet.sourceDirectory ?? `Run ${state.nextSetNumber}`, {
      sourceDirectory: intelSet.sourceDirectory ?? intelSet.name ?? `Run ${state.nextSetNumber}`,
      color: intelSet.color,
      importedAt: intelSet.importedAt,
      visible: intelSet.visible !== false,
    });
    const parsed = [];

    for (const intelCapture of captures) {
      const imageUrl = intelCaptureUrl(intelCapture);
      if (!imageUrl) {
        failures.push(`${intelCapture.fileName ?? intelCapture.relativePath ?? "image"} has no image data or project asset.`);
        continue;
      }
      const relativePath = intelCapture.relativePath ?? intelCapture.fileName;
      const fileName = intelCapture.fileName ?? fileNameFromRelativePath(relativePath);
      try {
        parsed.push(
          parseCaptureFromFileName(fileName, imageUrl, {
            relativePath,
            setId: set.id,
            setName: set.name,
            setColor: set.color,
            adjustments: intelCapture.adjustments,
            dataUrl: intelCapture.dataUrl ?? null,
            assetPath: intelCapture.assetPath ?? null,
            overlayPreviews: intelCaptureOverlayPreviews(intelCapture),
            overlayUrl: intelCaptureOverlayUrl(intelCapture, imageUrl),
            overlayAssetPath: intelCapture.overlayAssetPath ?? null,
            overlayMimeType: intelCapture.overlayMimeType ?? null,
            overlaySizeBytes: intelCapture.overlaySizeBytes,
            overlayWidth: intelCapture.overlayWidth,
            overlayHeight: intelCapture.overlayHeight,
            mimeType: intelCapture.mimeType,
            sizeBytes: intelCapture.sizeBytes,
          }),
        );
      } catch (error) {
        failures.push(error.message);
      }
    }

    if (parsed.length) {
      parsed.sort((a, b) => a.timeSeconds - b.timeSeconds || a.fileName.localeCompare(b.fileName));
      set.captureCount = parsed.length;
      state.sets.push(set);
      state.captures.push(...parsed);
    }
  }

  state.captures.sort((a, b) => a.timeSeconds - b.timeSeconds || a.setName.localeCompare(b.setName) || a.fileName.localeCompare(b.fileName));
  state.layerOrder = state.captures.map((capture) => capture.id);
  applyStoredLayerOrder();
  state.selectedId = state.captures[0]?.id ?? null;
  touchCaptureCollection();
  configureTimeline(state.captures);
  applyIntelView();
  ensureSelectedCaptureVisible();
  return failures;
}

function loadIntelPayload(payload, fileName = "Loaded intel") {
  clearScheduledIntelAutoSave();
  resetLoadedCaptures();
  state.pendingIntel = payload && typeof payload === "object" ? payload : {};
  state.intelFileName = fileName;
  state.intelDirty = false;
  state.intelSaveError = null;
  if (!state.intelSaveInFlight) {
    state.intelSaveState = "idle";
  }
  const failures = loadEmbeddedSetsFromIntel();
  applyIntelToLoadedSets();
  renderSetList();
  renderList();
  renderSelectedDetails();
  renderAll();
  renderIntelStatus();
  const loadedCount = state.captures.length;
  if (loadedCount) {
    const warning = failures.length ? ` (${failures.length} skipped)` : "";
    setStatus(`${fileName}: ${loadedCount} image${loadedCount === 1 ? "" : "s"} loaded${warning}.`, false);
  } else {
    setStatus(`${fileName} loaded, but it contains no TARPS images.`, failures.length > 0);
  }
  if (failures.length) {
    console.warn(failures);
  }
  refreshMissingOverlayPreviews().catch((error) => {
    console.warn(error);
  });
}

async function loadIntelFromPicker() {
  if (!window.electronTarps?.openProjectFolder) {
    throw new Error("TARPS desktop bridge is unavailable.");
  }
  const result = await window.electronTarps.openProjectFolder();
  if (!result) {
    return false;
  }
  state.electronProjectPath = result.projectPath;
  loadIntelPayload(JSON.parse(result.text), result.name);
  return true;
}

async function chooseIntelSaveLocation() {
  if (!window.electronTarps?.createProjectFolder) {
    throw new Error("TARPS desktop bridge is unavailable.");
  }
  const result = await window.electronTarps.createProjectFolder();
  if (!result) {
    return false;
  }
  state.electronProjectPath = result.projectPath;
  state.intelFileName = result.name;
  state.intelSaveState = "idle";
  state.intelSaveError = null;
  return true;
}

async function createNewIntelFile() {
  const hasSaveLocation = await chooseIntelSaveLocation();
  if (!hasSaveLocation) {
    return false;
  }

  clearScheduledIntelAutoSave();
  state.pendingIntel = currentIntelPayload();
  state.intelDirty = true;
  state.intelRevision += 1;
  await saveIntelFile({ automatic: false });
  return true;
}

async function saveIntelFile(options = {}) {
  const { automatic = false } = options;
  if (!hasWritableIntelFile() && !automatic) {
    const choseLocation = await chooseIntelSaveLocation();
    if (!choseLocation) {
      return;
    }
  }

  if (state.intelSaveInFlight) {
    state.intelSaveQueued = true;
    return;
  }

  const payload = currentIntelPayload();
  const text = JSON.stringify(payload, null, 2);
  if (state.electronProjectPath) {
    const savingRevision = state.intelRevision;
    state.intelSaveInFlight = true;
    state.intelSaveState = "saving";
    state.intelSaveError = null;
    renderIntelStatus();
    try {
      const result = await window.electronTarps.writeProjectManifest(state.electronProjectPath, text);
      state.intelFileName = result?.name ?? state.intelFileName ?? "tarps-intel";
      state.pendingIntel = payload;
      if (state.intelRevision === savingRevision) {
        state.intelDirty = false;
      } else {
        state.intelDirty = true;
        state.intelSaveQueued = true;
      }
      state.intelSaveState = "idle";
      renderIntelStatus();
      if (!automatic) {
        setIntelStatus(`${state.intelFileName} saved on disk`);
      }
    } catch (error) {
      state.intelSaveState = "error";
      state.intelSaveError = error.message;
      renderIntelStatus();
      throw error;
    } finally {
      state.intelSaveInFlight = false;
      if (state.intelSaveQueued || (state.intelDirty && state.intelSaveState !== "error")) {
        state.intelSaveQueued = false;
        scheduleIntelAutoSave(0);
      }
    }
  } else if (!automatic) {
    throw new Error("Choose an intel archive before saving.");
  }
}

function addParsedSet(set, parsed, failures) {
  if (!parsed.length) {
    setStatus(`No readable TARPS images found in ${set.name}.`, true);
    if (failures.length) {
      console.warn(failures);
    }
    return;
  }

  parsed.sort((a, b) => a.timeSeconds - b.timeSeconds || a.fileName.localeCompare(b.fileName));
  set.captureCount = parsed.length;
  state.sets.push(set);
  state.captures.push(...parsed);
  state.captures.sort((a, b) => a.timeSeconds - b.timeSeconds || a.setName.localeCompare(b.setName) || a.fileName.localeCompare(b.fileName));
  const allIds = new Set(state.captures.map((capture) => capture.id));
  state.layerOrder = [
    ...state.layerOrder.filter((captureId) => allIds.has(captureId)),
    ...parsed.map((capture) => capture.id).filter((captureId) => !state.layerOrder.includes(captureId)),
  ];
  state.selectedId = parsed[0].id;
  touchCaptureCollection();
  configureTimeline(state.captures);
  const restoredIntelView = applyIntelView(true);
  ensureSelectedCaptureVisible();
  renderSetList();
  renderList();
  renderSelectedDetails();
  if (!restoredIntelView) {
    fitCaptures();
  }
  renderAll();

  const warning = failures.length ? ` (${failures.length} skipped)` : "";
  setStatus(`${set.name}: ${parsed.length} loaded${warning}`, false);
  markIntelDirty();
  if (failures.length) {
    console.warn(failures);
  }
}

async function importFileEntriesAsSet(name, entries, getFile, progress) {
  const perfStart = performance.now();
  const set = createCaptureSet(name, { sourceDirectory: name });
  try {
    const intelSet = intelSetForSource(set.sourceDirectory);
    if (intelSet) {
      set.name = intelSet.name ?? set.name;
      set.color = intelSet.color ?? set.color;
    }
    const parsed = [];
    const failures = [];

    let nextEntryIndex = 0;
    async function processEntry(entry) {
      try {
        const file = await getFile(entry, set);
        const imageUrl = file.url ?? file.dataUrl;
        if (!imageUrl) {
          throw new Error(`${file.name} was not copied into the intel archive.`);
        }
        const dataUrl = file.dataUrl ?? (imageUrl.startsWith("data:") ? imageUrl : null);
        parsed.push(
          parseCaptureFromFileName(file.name, imageUrl, {
            relativePath: entry.relativePath,
            setId: set.id,
            setName: set.name,
            setColor: set.color,
            adjustments: intelCaptureForPath(intelSet, entry.relativePath)?.adjustments,
            dataUrl,
            assetPath: file.assetPath ?? null,
            overlayPreviews: file.overlayPreviews ?? null,
            overlayUrl: file.overlayUrl ?? file.overlayFileUrl ?? imageUrl,
            overlayAssetPath: file.overlayAssetPath ?? null,
            overlayMimeType: file.overlayMimeType ?? null,
            overlaySizeBytes: file.overlaySizeBytes,
            overlayWidth: file.overlayWidth,
            overlayHeight: file.overlayHeight,
            mimeType: mimeTypeForImage(file),
            sizeBytes: file.size ?? file.sizeBytes,
          }),
        );
      } catch (error) {
        failures.push(error.message);
      } finally {
        progress.done += 1;
        setImportProgress(progress.done, progress.total, `Copying images into intel archive (${progress.done}/${progress.total})...`);
      }
    }

    const workerCount = Math.min(IMPORT_COPY_CONCURRENCY, entries.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (nextEntryIndex < entries.length) {
        const entry = entries[nextEntryIndex];
        nextEntryIndex += 1;
        await processEntry(entry);
      }
    });
    await Promise.all(workers);

    addParsedSet(set, parsed, failures);
    return { loaded: parsed.length, skipped: failures.length };
  } finally {
    recordPerformance("importFileEntriesAsSet", performance.now() - perfStart, entries.length);
  }
}

async function addElectronDirectorySet() {
  if (!window.electronTarps?.chooseTarpsDirectory || !window.electronTarps?.copyImageToProject) {
    throw new Error("TARPS desktop bridge is unavailable.");
  }
  if (!state.electronProjectPath) {
    setStatus("Choose an intel archive before importing TARPS images.");
    const hasProject = await chooseIntelSaveLocation();
    if (!hasProject) {
      hideImportProgress();
      return;
    }
    await saveIntelFile({ automatic: false });
  }
  const directory = await window.electronTarps.chooseTarpsDirectory();
  if (!directory) {
    return;
  }
  if (!directory.files.length) {
    setStatus(`No PNG, JPG, or WebP files found in ${directory.name}.`, true);
    hideImportProgress();
    return;
  }

  const progress = { done: 0, total: directory.files.length };
  setImportProgress(0, directory.files.length, `Preparing to copy ${directory.files.length} image${directory.files.length === 1 ? "" : "s"} into the intel archive...`);
  const result = await importFileEntriesAsSet(
    directory.name,
    directory.files,
    async (entry, set) => {
      const copied = await window.electronTarps.copyImageToProject(
        state.electronProjectPath,
        set.id,
        entry.relativePath,
        entry.filePath,
      );
      return {
        name: entry.fileName,
        type: entry.mimeType,
        size: copied.sizeBytes ?? entry.sizeBytes,
        url: copied.fileUrl,
        assetPath: copied.assetPath,
        overlayPreviews: copied.overlayPreviews ?? null,
        overlayUrl: copied.overlayFileUrl ?? copied.fileUrl,
        overlayAssetPath: copied.overlayAssetPath ?? null,
        overlayMimeType: copied.overlayMimeType ?? null,
        overlaySizeBytes: copied.overlaySizeBytes,
        overlayWidth: copied.overlayWidth,
        overlayHeight: copied.overlayHeight,
      };
    },
    progress,
  );
  hideImportProgress();
  setStatus(
    `${directory.name}: copied ${result.loaded} image${result.loaded === 1 ? "" : "s"} into the intel archive (${result.skipped} skipped).`,
    result.loaded === 0,
  );
}

function clearSets() {
  stopPlayback();
  state.captures = [];
  state.sets = [];
  state.selectedId = null;
  state.layerOrder = [];
  state.viewerCaptureId = null;
  state.viewerMinimized = true;
  state.edit.active = false;
  state.edit.captureId = null;
  state.edit.draftAdjustments = null;
  touchCaptureCollection();
  configureTimeline([]);
  renderSetList();
  renderList();
  renderSelectedDetails();
  renderAll();
  setStatus("No image sets loaded.");
  markIntelDirty();
}

function capturesForSet(setId) {
  return state.captures.filter((capture) => capture.setId === setId);
}

function updateSetName(set, name) {
  const nextName = name.trim() || set.sourceDirectory || set.name;
  if (nextName === set.name) {
    return;
  }
  set.name = nextName;
  for (const capture of capturesForSet(set.id)) {
    capture.setName = nextName;
  }
  touchSetData();
  markIntelDirty();
  renderList();
  renderSelectedDetails();
  renderOverlays();
  renderMarkers();
}

function updateSetColor(set, color) {
  if (!color || color === set.color) {
    return;
  }
  set.color = color;
  for (const capture of capturesForSet(set.id)) {
    capture.setColor = color;
  }
  touchSetData();
  markIntelDirty();
  renderList();
  renderSelectedDetails();
  renderOverlays();
  renderMarkers();
}

function updateSetVisibility(set, visible) {
  const nextVisible = Boolean(visible);
  if ((set.visible !== false) === nextVisible) {
    return;
  }
  set.visible = nextVisible;
  touchSetData();
  markIntelDirty();
  renderSetList();
  renderTimelineLayers();
}

function renderSetList() {
  elements.setList.replaceChildren();
  if (!state.sets.length) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "No sets loaded.";
    elements.setList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const set of state.sets) {
    const row = document.createElement("div");
    row.className = "set-row";
    row.classList.toggle("is-hidden-run", set.visible === false);
    row.style.setProperty("--set-color", set.color);

    const visibilityInput = document.createElement("input");
    visibilityInput.className = "set-visible-input";
    visibilityInput.type = "checkbox";
    visibilityInput.checked = set.visible !== false;
    visibilityInput.title = "Show run";
    visibilityInput.setAttribute("aria-label", `Show ${set.name}`);
    visibilityInput.addEventListener("change", () => {
      updateSetVisibility(set, visibilityInput.checked);
    });

    const colorInput = document.createElement("input");
    colorInput.className = "set-color-input";
    colorInput.type = "color";
    colorInput.value = set.color;
    colorInput.title = "Run colour";
    colorInput.setAttribute("aria-label", `${set.name} colour`);
    colorInput.addEventListener("input", () => {
      row.style.setProperty("--set-color", colorInput.value);
      updateSetColor(set, colorInput.value);
    });

    const label = document.createElement("input");
    label.className = "set-name-input";
    label.type = "text";
    label.value = set.name;
    label.title = "Run name";
    label.setAttribute("aria-label", "Run name");
    label.addEventListener("change", () => {
      updateSetName(set, label.value);
      label.value = set.name;
    });

    const count = document.createElement("span");
    count.className = "set-count";
    count.textContent = `${set.captureCount} image${set.captureCount === 1 ? "" : "s"}`;

    row.append(visibilityInput, colorInput, label, count);
    fragment.append(row);
  }

  elements.setList.append(fragment);
}

function captureSummary(capture) {
  return `${capture.dateToken} ${capture.timeToken}${capture.station}`;
}

function createCaptureButton(capture) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "capture-button";
  button.setAttribute("role", "option");
  button.setAttribute("aria-selected", String(capture.id === state.selectedId));
  button.dataset.captureId = capture.id;
  button.style.setProperty("--capture-color", capture.setColor);

  const swatch = document.createElement("span");
  swatch.className = "capture-swatch";
  swatch.setAttribute("aria-hidden", "true");
  const title = document.createElement("strong");
  title.textContent = captureSummary(capture);
  const setName = document.createElement("span");
  setName.className = "set-pill";
  setName.textContent = capture.setName;
  const heading = document.createElement("span");
  heading.className = "heading-pill";
  heading.textContent = `${String(Math.round(capture.headingDeg)).padStart(3, "0")} deg`;
  const place = document.createElement("span");
  place.className = "place-pill";
  const position = capturePosition(capture);
  place.textContent = `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
  const altitude = document.createElement("span");
  altitude.className = "altitude-pill";
  altitude.textContent = `${capture.altFt.toLocaleString()} ft`;

  button.append(swatch, title, heading, setName, place, altitude);
  button.addEventListener("click", () => selectCapture(capture.id, true, true));
  return button;
}

function renderList() {
  const perfStart = performance.now();
  const captures = visibleCaptures();
  try {
    const scrollTop = elements.imageList.scrollTop;
    const viewportRows = Math.ceil(elements.imageList.clientHeight / VIRTUAL_CAPTURE_ROW_HEIGHT_PX);
    const firstIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_CAPTURE_ROW_HEIGHT_PX) - VIRTUAL_CAPTURE_OVERSCAN_ROWS);
    const endIndex = Math.min(captures.length, firstIndex + viewportRows + VIRTUAL_CAPTURE_OVERSCAN_ROWS * 2);
    const renderKey = `${state.visibleCaptureCache.key}:${state.selectedId}:${state.captureRevision}:${state.setRevision}:${firstIndex}:${endIndex}`;
    if (state.lastListRenderKey === renderKey) {
      return;
    }
    state.lastListRenderKey = renderKey;

    elements.imageList.replaceChildren();
    const fragment = document.createDocumentFragment();
    updateTimelineControls();

    const topSpacer = document.createElement("div");
    topSpacer.className = "capture-list-spacer";
    topSpacer.style.height = `${firstIndex * VIRTUAL_CAPTURE_ROW_HEIGHT_PX}px`;
    fragment.append(topSpacer);

    for (const capture of captures.slice(firstIndex, endIndex)) {
      fragment.append(createCaptureButton(capture));
    }

    const bottomSpacer = document.createElement("div");
    bottomSpacer.className = "capture-list-spacer";
    bottomSpacer.style.height = `${Math.max(0, captures.length - endIndex) * VIRTUAL_CAPTURE_ROW_HEIGHT_PX}px`;
    fragment.append(bottomSpacer);

    elements.imageList.append(fragment);
  } finally {
    recordPerformance("renderList", performance.now() - perfStart, captures.length);
  }
}

function selectedCapture() {
  return state.captures.find((capture) => capture.id === state.selectedId) ?? null;
}

function renderSelectedDetails() {
  const capture = selectedCapture();
  elements.selectedDetails.replaceChildren();

  if (!capture) {
    const dt = document.createElement("dt");
    dt.textContent = "Capture";
    const dd = document.createElement("dd");
    dd.textContent = "None";
    elements.selectedDetails.append(dt, dd);
    return;
  }

  const projection = imageGroundProjection(capture);
  const position = capturePosition(capture);
  const projectionLabel =
    projection.type === "location-only"
      ? `Location only (${projection.reason === "attitude-range" ? "attitude over 45 deg" : "no ground projection"})`
      : projection.type === "warped"
        ? "Warped to ground"
        : projection.reason === "attitude-range"
          ? "Unwarped (attitude over 45 deg)"
          : projection.reason === "warp-disabled"
            ? "Projected rectangle (warp off)"
          : "Rectangular";
  const details = [
    ["Capture", captureSummary(capture)],
    ["Set", capture.setName],
    ["Camera", capture.camera],
    ["Position", `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`],
    ["Altitude", `${capture.altFt.toLocaleString()} ft`],
    ["Heading", `${capture.headingDeg} deg`],
    ["Drift", `${capture.driftDeg} deg (ignored)`],
    ["Attitude", `pitch ${capture.pitchDeg} deg, roll ${capture.rollDeg} deg`],
    ["Projection", projectionLabel],
    ["Footprint", projectionFootprintLabel(capture)],
    ["File", capture.fileName],
  ];

  for (const [label, value] of details) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    elements.selectedDetails.append(dt, dd);
  }
}

function visibleCaptureById(id) {
  return visibleCaptures().find((capture) => capture.id === id) ?? null;
}

function applyViewerZoom() {
  const zoom = state.viewerZoom;
  elements.viewerZoomInput.value = String(zoom);
  elements.viewerZoomReadout.textContent = `${Math.round(zoom * 100)}%`;
  updateViewerTransform();
}

function updateViewerTransform() {
  if (elements.viewerImage.naturalWidth && elements.viewerImage.naturalHeight) {
    const capture = state.viewerCaptureId ? visibleCaptureById(state.viewerCaptureId) : null;
    const rotationDeg = capturePreviewRotationDegrees(capture);
    const naturalWidth = elements.viewerImage.naturalWidth;
    const naturalHeight = elements.viewerImage.naturalHeight;
    const rotatedSize = rotatedRectangleSize(naturalWidth, naturalHeight, rotationDeg);
    elements.viewerImageStage.style.width = `${rotatedSize.width}px`;
    elements.viewerImageStage.style.height = `${rotatedSize.height}px`;
    elements.viewerImageStage.style.transform = `translate(${state.viewerPanX}px, ${state.viewerPanY}px) scale(${state.viewerZoom})`;
    elements.viewerImage.style.width = `${naturalWidth}px`;
    elements.viewerImage.style.height = `${naturalHeight}px`;
    elements.viewerImage.style.left = `${(rotatedSize.width - naturalWidth) / 2}px`;
    elements.viewerImage.style.top = `${(rotatedSize.height - naturalHeight) / 2}px`;
    elements.viewerImage.style.transform = `rotate(${rotationDeg}deg)`;
  }
}

function setViewerZoom(nextZoom, anchorClientX, anchorClientY) {
  const zoom = clamp(nextZoom, Number(elements.viewerZoomInput.min), Number(elements.viewerZoomInput.max));
  if (zoom === state.viewerZoom) {
    return;
  }

  if (Number.isFinite(anchorClientX) && Number.isFinite(anchorClientY)) {
    const rect = elements.viewerImageStage.getBoundingClientRect();
    const sourceX = (anchorClientX - rect.left) / state.viewerZoom;
    const sourceY = (anchorClientY - rect.top) / state.viewerZoom;
    const frameRect = elements.viewerFrame.getBoundingClientRect();
    state.viewerPanX = anchorClientX - frameRect.left - sourceX * zoom;
    state.viewerPanY = anchorClientY - frameRect.top - sourceY * zoom;
  }

  state.viewerZoom = zoom;
  applyViewerZoom();
}

function toggleImageViewerMinimized() {
  if (!state.viewerCaptureId) {
    return;
  }
  state.viewerMinimized = !state.viewerMinimized;
  renderImageViewer();
}

function renderImageViewer() {
  const capture = state.viewerCaptureId ? visibleCaptureById(state.viewerCaptureId) : null;
  if (!capture) {
    elements.imageViewer.hidden = true;
    elements.imageViewer.classList.remove("is-minimized");
    elements.viewerImage.removeAttribute("src");
    elements.viewerImageStage.style.width = "";
    elements.viewerImageStage.style.height = "";
    elements.viewerImageStage.style.transform = "";
    elements.viewerImage.style.width = "";
    elements.viewerImage.style.height = "";
    elements.viewerImage.style.left = "";
    elements.viewerImage.style.top = "";
    elements.viewerImage.style.transform = "";
    return;
  }

  elements.imageViewer.hidden = false;
  elements.imageViewer.classList.toggle("is-minimized", state.viewerMinimized);
  elements.viewerTitle.textContent = captureSummary(capture);
  setIcon(elements.viewerCloseButton.querySelector(".ui-icon"), state.viewerMinimized ? "plus" : "minus");
  elements.viewerCloseButton.title = state.viewerMinimized ? "Expand image preview" : "Minimize image preview";
  elements.viewerCloseButton.setAttribute(
    "aria-label",
    state.viewerMinimized ? "Expand image preview" : "Minimize image preview",
  );
  elements.viewerImage.alt = capture.fileName;
  if (elements.viewerImage.src !== capture.url) {
    elements.viewerImage.src = capture.url;
  }
  applyViewerZoom();
}

function clearEditAttention() {
  if (state.edit.attentionTimerId !== null) {
    window.clearTimeout(state.edit.attentionTimerId);
    state.edit.attentionTimerId = null;
  }
  elements.editToolbar.classList.remove("needs-edit-decision");
  for (const button of elements.editToolbar.querySelectorAll(".is-edit-decision-needed")) {
    button.classList.remove("is-edit-decision-needed");
  }
}

function promptEditSaveReset() {
  if (!state.edit.active) {
    return false;
  }

  if (elements.editToolbar.hidden || !elements.editToolbar.querySelector("[data-edit-action='save']")) {
    renderEditToolbar();
  }

  clearEditAttention();
  const decisionButtons = elements.editToolbar.querySelectorAll("[data-edit-action='reset'], [data-edit-action='save']");
  elements.editToolbar.classList.add("needs-edit-decision");
  for (const button of decisionButtons) {
    button.classList.add("is-edit-decision-needed");
  }
  // Restart the CSS animation even if the user repeatedly clicks away.
  void elements.editToolbar.offsetWidth;
  for (const button of decisionButtons) {
    button.classList.remove("is-edit-decision-needed");
    void button.offsetWidth;
    button.classList.add("is-edit-decision-needed");
  }

  state.edit.attentionTimerId = window.setTimeout(() => {
    clearEditAttention();
  }, EDIT_ATTENTION_FLASH_MS);
  return true;
}

function selectCapture(id, zoomToCapture = false, showViewer = false) {
  if (state.edit.active && state.edit.captureId !== id) {
    promptEditSaveReset();
    return false;
  }
  state.selectedId = id;
  sendCaptureToFront(id);
  if (showViewer) {
    const keepMinimized = state.viewerMinimized;
    const isChangingViewerImage = state.viewerCaptureId !== id;
    state.viewerCaptureId = id;
    state.viewerMinimized = keepMinimized;
    if (isChangingViewerImage || !keepMinimized) {
      state.viewerZoom = 1;
      state.viewerPanX = 0;
      state.viewerPanY = 0;
    }
  }
  if (zoomToCapture) {
    const capture = selectedCapture();
    if (capture) {
      state.center = normalizeLatLng(imageGroundProjection(capture).center, state.center);
      state.zoom = Math.max(state.zoom, 15);
    }
  }
  renderList();
  renderSelectedDetails();
  renderAll();
  return true;
}

function deselectCapture(shouldRender = true) {
  if (!state.selectedId && !state.viewerCaptureId) {
    return false;
  }
  if (state.edit.active) {
    promptEditSaveReset();
    return false;
  }

  state.selectedId = null;
  state.viewerCaptureId = null;
  state.pendingOverlayClick = null;
  state.pendingPhotoDeselectClick = null;
  state.suppressNextOverlayClick = false;
  if (shouldRender) {
    renderList();
    renderEditedLayers();
  }
  return true;
}

function canSelectOverlayCapture(capture) {
  return Boolean(
    capture &&
      state.markupTool === "pan" &&
      !(state.edit.active && state.edit.captureId === capture.id),
  );
}

function selectOverlayCapture(capture) {
  if (!canSelectOverlayCapture(capture)) {
    return false;
  }
  return selectCapture(capture.id, false, true);
}

function selectedVisibleCapture() {
  return state.selectedId ? visibleCaptureById(state.selectedId) : null;
}

function renderEditedLayers(includeToolbar = true) {
  const capture = selectedVisibleCapture();
  renderSelectedDetails();
  renderTracks();
  renderOverlays();
  renderMarkers();
  renderImageViewer();
  if (includeToolbar) {
    renderEditToolbar();
  }
}

function beginEditMode() {
  const capture = selectedVisibleCapture();
  if (!capture) {
    return;
  }
  state.edit.active = true;
  state.edit.mode = "move";
  state.edit.side = "top";
  state.edit.captureId = capture.id;
  state.edit.draftAdjustments = cloneAdjustments(capture.adjustments);
  state.edit.drag = null;
  state.viewerMinimized = true;
  renderImageViewer();
  renderAll();
}

function cancelEditMode(shouldRender = true) {
  clearEditAttention();
  state.edit.active = false;
  state.edit.captureId = null;
  state.edit.draftAdjustments = null;
  state.edit.drag = null;
  state.pendingEditClickOff = null;
  elements.map.classList.remove("is-edit-dragging");
  if (shouldRender) {
    renderAll();
  }
}

async function saveEditMode() {
  const capture = selectedCapture();
  if (!state.edit.active || !capture || state.edit.captureId !== capture.id || !state.edit.draftAdjustments) {
    return;
  }

  capture.adjustments = cloneAdjustments(state.edit.draftAdjustments);
  cancelEditMode(false);
  markIntelDirty();
  renderAll();
  setIntelStatus(hasWritableIntelFile() ? "Image adjustment queued for autosave." : "Image adjustment stored in this session.");
}

function captureAssetPaths(capture) {
  const previewAssetPaths = Object.values(capture.overlayPreviews ?? {})
    .map((preview) => preview?.assetPath)
    .filter(Boolean);
  return [...new Set([capture.assetPath, capture.overlayAssetPath, ...previewAssetPaths].filter(Boolean))];
}

function openDeleteCaptureDialog() {
  const capture = selectedCapture();
  if (!capture) {
    return;
  }
  state.pendingDeleteCaptureId = capture.id;
  elements.deleteCaptureMessage.textContent = `Remove ${capture.fileName} from this intel archive?`;
  if (elements.deleteCaptureDialog?.showModal) {
    elements.deleteCaptureDialog.showModal();
    return;
  }
  if (window.confirm(elements.deleteCaptureMessage.textContent)) {
    removePendingDeleteCapture().catch((error) => {
      console.error(error);
      setStatus(error.message, true);
    });
  }
}

async function removePendingDeleteCapture() {
  const captureId = state.pendingDeleteCaptureId;
  state.pendingDeleteCaptureId = null;
  if (!captureId) {
    return;
  }
  await removeCaptureFromIntel(captureId);
}

async function removeCaptureFromIntel(captureId) {
  const captureIndex = state.captures.findIndex((capture) => capture.id === captureId);
  if (captureIndex < 0) {
    return;
  }

  const capture = state.captures[captureIndex];
  const assetPaths = captureAssetPaths(capture);
  let assetDeleteError = null;

  state.captures.splice(captureIndex, 1);
  state.layerOrder = state.layerOrder.filter((id) => id !== captureId);
  if (state.selectedId === captureId) {
    state.selectedId = state.captures[Math.min(captureIndex, state.captures.length - 1)]?.id ?? null;
  }
  if (state.viewerCaptureId === captureId) {
    state.viewerCaptureId = state.selectedId;
    state.viewerMinimized = true;
    state.viewerZoom = 1;
    state.viewerPanX = 0;
    state.viewerPanY = 0;
  }
  if (state.edit.captureId === captureId) {
    cancelEditMode(false);
  }

  const set = state.sets.find((item) => item.id === capture.setId);
  if (set) {
    set.captureCount = capturesForSet(set.id).length;
    if (set.captureCount === 0) {
      state.sets = state.sets.filter((item) => item.id !== set.id);
    }
  }

  canvasImageCache.delete(capture.url);
  canvasImageCache.delete(capture.overlayUrl);
  for (const preview of Object.values(capture.overlayPreviews ?? {})) {
    if (preview?.fileUrl) {
      canvasImageCache.delete(preview.fileUrl);
    }
  }

  touchCaptureCollection();
  touchSetData();
  configureTimeline(state.captures);
  ensureSelectedCaptureVisible();
  renderSetList();
  renderList();
  renderSelectedDetails();
  renderAll();
  markIntelDirty();

  if (assetPaths.length && state.electronProjectPath && window.electronTarps?.deleteProjectAssets) {
    try {
      clearScheduledIntelAutoSave();
      await saveIntelFile({ automatic: true });
      await window.electronTarps.deleteProjectAssets(state.electronProjectPath, assetPaths);
    } catch (error) {
      assetDeleteError = error;
      console.warn(error);
    }
  }

  if (assetDeleteError) {
    setStatus(`${capture.fileName} removed in the app, but autosave or copied-file cleanup failed.`, true);
    return;
  }
  setStatus(`${capture.fileName} removed ${hasWritableIntelFile() ? "from the intel archive" : "from this session"}.`);
}

function setEditMode(mode) {
  if (!state.edit.active) {
    return;
  }
  state.edit.mode = mode;
  renderEditToolbar();
}

function setEditSide(side) {
  if (!EDIT_SIDES.includes(side)) {
    return;
  }
  state.edit.side = side;
  renderEditToolbar();
}

function updateDraftScale(scale) {
  if (!state.edit.draftAdjustments) {
    return;
  }
  state.edit.draftAdjustments.scale = clamp(scale, 0.25, 4);
  renderEditedLayers(false);
}

function updateDraftSideScale(scale) {
  if (!state.edit.draftAdjustments) {
    return;
  }
  state.edit.draftAdjustments.sideScales[state.edit.side] = clamp(scale, 0.25, 4);
  renderEditedLayers(false);
}

function openEditResetDialog() {
  if (!state.edit.active || !state.edit.draftAdjustments) {
    return;
  }

  elements.resetLocationInput.checked = true;
  elements.resetSizeInput.checked = true;
  elements.resetRotationInput.checked = true;
  elements.resetWarpInput.checked = true;
  if (elements.resetEditDialog?.showModal) {
    elements.resetEditDialog.showModal();
    return;
  }
  resetEditDraft({ location: true, size: true, rotation: true, warp: true });
}

function resetEditDraft(options) {
  if (!state.edit.active || !state.edit.draftAdjustments) {
    return;
  }

  const defaults = defaultAdjustments();
  if (options.location) {
    state.edit.draftAdjustments.translateM = { ...defaults.translateM };
  }
  if (options.size) {
    state.edit.draftAdjustments.scale = defaults.scale;
  }
  if (options.rotation) {
    state.edit.draftAdjustments.rotationDeg = defaults.rotationDeg;
  }
  if (options.warp) {
    state.edit.draftAdjustments.sideScales = { ...defaults.sideScales };
    state.edit.draftAdjustments.cornerOffsetsM = defaults.cornerOffsetsM.map((offset) => ({ ...offset }));
  }
  state.edit.drag = null;
  scheduleRenderAll();
}

function toolbarSizeForCapture(capture) {
  return state.edit.active && state.edit.captureId === capture.id
    ? { width: 188, height: 46 }
    : { width: 82, height: 38 };
}

function toolbarRectForPoint(point, size) {
  return {
    minX: point.x,
    minY: point.y,
    maxX: point.x + size.width,
    maxY: point.y + size.height,
  };
}

function rectIntersectionArea(a, b) {
  const width = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const height = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  return width * height;
}

function clampToolbarPoint(point, size, viewportRect) {
  return {
    x: clamp(
      point.x,
      EDIT_TOOLBAR_VIEWPORT_MARGIN_PX,
      Math.max(EDIT_TOOLBAR_VIEWPORT_MARGIN_PX, viewportRect.width - size.width - EDIT_TOOLBAR_VIEWPORT_MARGIN_PX),
    ),
    y: clamp(
      point.y,
      EDIT_TOOLBAR_VIEWPORT_MARGIN_PX,
      Math.max(EDIT_TOOLBAR_VIEWPORT_MARGIN_PX, viewportRect.height - size.height - EDIT_TOOLBAR_VIEWPORT_MARGIN_PX),
    ),
  };
}

function editHandleAvoidanceRects(capture, points) {
  if (!state.edit.active || state.edit.captureId !== capture.id || points.length !== 4) {
    return [];
  }
  return editHandleDefinitions(capture, { points }).map((definition) => ({
    minX: definition.x - EDIT_HANDLE_CLEARANCE_PX,
    minY: definition.y - EDIT_HANDLE_CLEARANCE_PX,
    maxX: definition.x + EDIT_HANDLE_CLEARANCE_PX,
    maxY: definition.y + EDIT_HANDLE_CLEARANCE_PX,
  }));
}

function toolbarHandleOverlapArea(point, size, avoidanceRects) {
  const toolbarRect = toolbarRectForPoint(point, size);
  return avoidanceRects.reduce((sum, rect) => sum + rectIntersectionArea(toolbarRect, rect), 0);
}

function toolbarPlacementScore(point, desiredPoint, size, avoidanceRects) {
  const overlapArea = toolbarHandleOverlapArea(point, size, avoidanceRects);
  const distance = Math.hypot(point.x - desiredPoint.x, point.y - desiredPoint.y);
  return overlapArea * 100000 + distance;
}

function toolbarPointClearOfHandles(desiredPoint, size, viewportRect, avoidanceRects) {
  if (!avoidanceRects.length) {
    return clampToolbarPoint(desiredPoint, size, viewportRect);
  }

  const seen = new Set();
  let bestPoint = clampToolbarPoint(desiredPoint, size, viewportRect);
  let bestScore = toolbarPlacementScore(bestPoint, desiredPoint, size, avoidanceRects);

  const considerPoint = (point) => {
    const candidate = clampToolbarPoint(point, size, viewportRect);
    const key = `${Math.round(candidate.x)},${Math.round(candidate.y)}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const score = toolbarPlacementScore(candidate, desiredPoint, size, avoidanceRects);
    if (score < bestScore) {
      bestScore = score;
      bestPoint = candidate;
    }
  };

  for (let radius = EDIT_TOOLBAR_SEARCH_STEP_PX; radius <= EDIT_TOOLBAR_SEARCH_RADIUS_PX; radius += EDIT_TOOLBAR_SEARCH_STEP_PX) {
    for (let step = 0; step < 16; step += 1) {
      const angle = (step / 16) * Math.PI * 2;
      considerPoint({
        x: desiredPoint.x + Math.cos(angle) * radius,
        y: desiredPoint.y + Math.sin(angle) * radius,
      });
    }
  }

  return bestPoint;
}

function toolbarPointForCapture(capture) {
  const projection = imageGroundProjection(capture);
  const rect = elements.map.getBoundingClientRect();
  const points = projection.corners.length
    ? projection.corners.map((corner) => screenPointFor(corner.lat, corner.lng))
    : [screenPointFor(projection.center.lat, projection.center.lng)];
  const anchor =
    points.length === 4
      ? (() => {
          const center = polygonCenter(points);
          const sideMidpoints = [
            midpoint(points[0], points[1]),
            midpoint(points[1], points[2]),
            midpoint(points[2], points[3]),
            midpoint(points[3], points[0]),
          ];
          const rightSide = sideMidpoints.reduce((rightmost, point) => (point.x > rightmost.x ? point : rightmost), sideMidpoints[0]);
          return pointAwayFromCenter(rightSide, center, 8);
        })()
      : points[0];
  const size = toolbarSizeForCapture(capture);
  const desiredPoint = {
    x: anchor.x + 6,
    y: anchor.y - size.height / 2,
  };
  return toolbarPointClearOfHandles(desiredPoint, size, rect, editHandleAvoidanceRects(capture, points));
}

function makeToolbarButton(label, title, onClick, isActive = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.title = title;
  button.setAttribute("aria-pressed", String(isActive));
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function makeIconToolbarButton(iconName, title, onClick, isActive = false) {
  const button = makeToolbarButton("", title, onClick, isActive);
  button.setAttribute("aria-label", title);
  button.replaceChildren(createIcon(iconName, "app-icon toolbar-icon"));
  return button;
}

function renderEditToolbar() {
  const capture = selectedVisibleCapture();
  elements.editToolbar.replaceChildren();
  if (!capture) {
    elements.editToolbar.hidden = true;
    return;
  }

  const point = toolbarPointForCapture(capture);
  elements.editToolbar.hidden = false;
  elements.editToolbar.style.transform = `translate(${Math.round(point.x)}px, ${Math.round(point.y)}px)`;
  elements.editToolbar.classList.toggle("is-editing", state.edit.active && state.edit.captureId === capture.id);

  if (!state.edit.active || state.edit.captureId !== capture.id) {
    const quickActionRow = document.createElement("div");
    quickActionRow.className = "edit-toolbar-row";
    const editButton = makeIconToolbarButton("pencil", "Edit placement", beginEditMode);
    const deleteButton = makeIconToolbarButton("trash-2", "Remove image", openDeleteCaptureDialog);
    deleteButton.classList.add("danger-button");
    quickActionRow.append(editButton, deleteButton);
    elements.editToolbar.append(quickActionRow);
    return;
  }

  const actionRow = document.createElement("div");
  actionRow.className = "edit-toolbar-row";
  const resetButton = makeToolbarButton("Reset", "Reset edit draft", openEditResetDialog);
  const saveButton = makeToolbarButton("Save", "Save edits", () => {
    saveEditMode();
  });
  const cancelButton = makeToolbarButton("Cancel", "Cancel edits", () => cancelEditMode());
  resetButton.dataset.editAction = "reset";
  saveButton.dataset.editAction = "save";
  cancelButton.dataset.editAction = "cancel";
  actionRow.append(resetButton, saveButton, cancelButton);
  elements.editToolbar.append(actionRow);
}

function localMetersFromPointer(center, event) {
  return latLngToLocalMeters(center, screenToLatLng(event.clientX, event.clientY));
}

function localAngleDegrees(local) {
  return radiansToDegrees(Math.atan2(local.forwardM, local.rightM));
}

function cloneCornerOffsets(offsets) {
  return EDIT_CORNERS.map((_, index) => ({
    rightM: Number(offsets?.[index]?.rightM) || 0,
    forwardM: Number(offsets?.[index]?.forwardM) || 0,
  }));
}

function setMapPointerCapture(event) {
  try {
    elements.map.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic callers used in tests may not have an active DOM pointer.
  }
}

function startEditHandleDrag(event, capture, handleDataset) {
  if (!state.edit.active || state.edit.captureId !== capture.id || event.button !== 0 || !state.edit.draftAdjustments) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();
  setMapPointerCapture(event);

  const projection = imageGroundProjection(capture);
  const center = projection.center;
  const startPointerLocal = localMetersFromPointer(center, event);
  state.edit.drag = {
    kind: handleDataset.kind,
    pointerId: event.pointerId,
    center,
    cornerIndex: Number.isFinite(Number(handleDataset.cornerIndex)) ? Number(handleDataset.cornerIndex) : null,
    startPointerLocal,
    startDistanceM: Math.max(1, Math.hypot(startPointerLocal.rightM, startPointerLocal.forwardM)),
    startAngleDeg: localAngleDegrees(startPointerLocal),
    startScale: state.edit.draftAdjustments.scale,
    startRotationDeg: state.edit.draftAdjustments.rotationDeg,
    startCornerOffsetsM: cloneCornerOffsets(state.edit.draftAdjustments.cornerOffsetsM),
  };
  elements.map.classList.add("is-edit-dragging");
  return true;
}

function startEditDrag(event, capture) {
  if (!state.edit.active || state.edit.captureId !== capture.id || event.button !== 0 || !state.edit.draftAdjustments) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();
  setMapPointerCapture(event);
  state.edit.drag = {
    kind: "move",
    pointerId: event.pointerId,
    startLatLng: screenToLatLng(event.clientX, event.clientY),
    startTranslateM: { ...state.edit.draftAdjustments.translateM },
  };
  elements.map.classList.add("is-edit-dragging");
  return true;
}

function updateEditDrag(event) {
  if (!state.edit.drag || !state.edit.draftAdjustments) {
    return false;
  }
  event.preventDefault();
  const drag = state.edit.drag;
  if (drag.kind === "move") {
    const currentLatLng = screenToLatLng(event.clientX, event.clientY);
    const delta = latLngDeltaMeters(drag.startLatLng, currentLatLng);
    state.edit.draftAdjustments.translateM = {
      northM: drag.startTranslateM.northM + delta.northM,
      eastM: drag.startTranslateM.eastM + delta.eastM,
    };
  } else if (drag.kind === "scale") {
    const currentLocal = localMetersFromPointer(drag.center, event);
    const currentDistanceM = Math.max(1, Math.hypot(currentLocal.rightM, currentLocal.forwardM));
    state.edit.draftAdjustments.scale = clamp(drag.startScale * (currentDistanceM / drag.startDistanceM), 0.25, 4);
  } else if (drag.kind === "rotate") {
    const currentLocal = localMetersFromPointer(drag.center, event);
    const angleDelta = normalizeRotationDegrees(localAngleDegrees(currentLocal) - drag.startAngleDeg);
    state.edit.draftAdjustments.rotationDeg = normalizeRotationDegrees(drag.startRotationDeg + angleDelta);
  } else if (drag.kind === "warp-corner" && Number.isInteger(drag.cornerIndex)) {
    const currentLocal = localMetersFromPointer(drag.center, event);
    const delta = {
      rightM: currentLocal.rightM - drag.startPointerLocal.rightM,
      forwardM: currentLocal.forwardM - drag.startPointerLocal.forwardM,
    };
    state.edit.draftAdjustments.cornerOffsetsM = cloneCornerOffsets(drag.startCornerOffsetsM);
    state.edit.draftAdjustments.cornerOffsetsM[drag.cornerIndex] = {
      rightM: drag.startCornerOffsetsM[drag.cornerIndex].rightM + delta.rightM,
      forwardM: drag.startCornerOffsetsM[drag.cornerIndex].forwardM + delta.forwardM,
    };
  }
  scheduleEditedLayersRender();
  return true;
}

function endEditDrag(event) {
  if (!state.edit.drag) {
    return false;
  }
  if (elements.map.hasPointerCapture(event.pointerId)) {
    elements.map.releasePointerCapture(event.pointerId);
  }
  state.edit.drag = null;
  elements.map.classList.remove("is-edit-dragging");
  renderEditedLayers();
  return true;
}

function captureBoundsPoints(capture) {
  const projection = imageGroundProjection(capture);
  if (projection.corners.length) {
    return projection.corners;
  }
  return [capturePosition(capture)];
}

function fitCaptures() {
  const captures = visibleCaptures();
  if (!captures.length) {
    state.center = normalizeLatLng(DEFAULT_CENTER);
    state.zoom = 13;
    return;
  }

  const rect = elements.map.getBoundingClientRect();
  const points = captures.flatMap(captureBoundsPoints);
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const bounds = {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
  const padding = 80;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  state.center = normalizeLatLng({ lat: centerLat, lng: centerLng }, state.center);

  for (let zoom = state.maxZoom; zoom >= state.minZoom; zoom -= 1) {
    const sw = project(bounds.minLat, bounds.minLng, zoom);
    const ne = project(bounds.maxLat, bounds.maxLng, zoom);
    const width = Math.abs(ne.x - sw.x);
    const height = Math.abs(ne.y - sw.y);
    if (width <= rect.width - padding * 2 && height <= rect.height - padding * 2) {
      state.zoom = zoom;
      return;
    }
  }
  state.zoom = state.minZoom;
}

function renderTiles() {
  if (state.mapSource === "grid") {
    elements.tileLayer.replaceChildren();
    state.tileStatuses.clear();
    elements.map.classList.add("grid-basemap");
    elements.map.classList.remove("tiles-loading", "tiles-unavailable");
    elements.tileStatus.classList.remove("visible");
    elements.tileStatus.textContent = "";
    elements.mapAttribution.textContent = TILE_SOURCES.grid.attribution;
    return;
  }

  const tileSource = TILE_SOURCES[state.mapSource];
  elements.map.classList.remove("grid-basemap");
  elements.mapAttribution.innerHTML = tileSource.attribution;
  const rect = elements.map.getBoundingClientRect();
  const centerPoint = project(state.center.lat, state.center.lng, state.zoom);
  const topLeft = {
    x: centerPoint.x - rect.width / 2,
    y: centerPoint.y - rect.height / 2,
  };
  const tileCount = 2 ** state.zoom;
  const minTileX = Math.floor(topLeft.x / TILE_SIZE);
  const minTileY = Math.floor(topLeft.y / TILE_SIZE);
  const maxTileX = Math.floor((topLeft.x + rect.width) / TILE_SIZE);
  const maxTileY = Math.floor((topLeft.y + rect.height) / TILE_SIZE);
  const activeKeys = new Set();

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      if (tileY < 0 || tileY >= tileCount) {
        continue;
      }

      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
      const key = `${state.zoom}/${wrappedX}/${tileY}`;
      activeKeys.add(key);
      let img = elements.tileLayer.querySelector(`[data-key="${CSS.escape(key)}"]`);
      if (!img) {
        img = document.createElement("img");
        img.decoding = "async";
        img.loading = "lazy";
        img.dataset.key = key;
        img.alt = "";
        img.crossOrigin = "anonymous";
        img.addEventListener("load", () => {
          state.tileStatuses.set(key, "loaded");
          updateTileStatus();
        });
        img.addEventListener("error", () => {
          state.tileStatuses.set(key, "failed");
          img.style.opacity = "0";
          updateTileStatus();
        });
        state.tileStatuses.set(key, "pending");
        img.referrerPolicy = "strict-origin-when-cross-origin";
        img.src = tileSource.template
          .replace("{z}", state.zoom)
          .replace("{x}", wrappedX)
          .replace("{y}", tileY);
        elements.tileLayer.append(img);
      }
      img.style.transform = `translate(${Math.round(tileX * TILE_SIZE - topLeft.x)}px, ${Math.round(tileY * TILE_SIZE - topLeft.y)}px)`;
    }
  }

  for (const tile of Array.from(elements.tileLayer.children)) {
    if (!activeKeys.has(tile.dataset.key)) {
      tile.remove();
    }
  }
  updateTileStatus();
}

function updateTileStatus() {
  const activeTiles = Array.from(elements.tileLayer.children);
  const statuses = activeTiles.map((tile) => state.tileStatuses.get(tile.dataset.key) ?? "pending");
  const loaded = statuses.filter((status) => status === "loaded").length;
  const failed = statuses.filter((status) => status === "failed").length;
  const pending = statuses.filter((status) => status === "pending").length;

  if (!activeTiles.length || loaded > 0) {
    elements.map.classList.remove("tiles-loading", "tiles-unavailable");
    elements.tileStatus.classList.remove("visible");
    elements.tileStatus.textContent = "";
    return;
  }

  if (failed > 0 && pending === 0) {
    elements.map.classList.remove("tiles-loading");
    elements.map.classList.add("tiles-unavailable");
    elements.tileStatus.textContent = "Map tiles unavailable. Using coordinate grid.";
    elements.tileStatus.classList.add("visible");
    return;
  }

  elements.map.classList.add("tiles-loading");
  elements.map.classList.remove("tiles-unavailable");
  elements.tileStatus.textContent = "Loading map tiles...";
  elements.tileStatus.classList.add("visible");
}

function renderGrid() {
  elements.gridLayer.replaceChildren();
  const rect = elements.map.getBoundingClientRect();
  elements.gridLayer.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);

  const topLeft = screenToLatLng(rect.left, rect.top);
  const bottomRight = screenToLatLng(rect.right, rect.bottom);
  const minLat = Math.min(topLeft.lat, bottomRight.lat);
  const maxLat = Math.max(topLeft.lat, bottomRight.lat);
  const minLng = Math.min(topLeft.lng, bottomRight.lng);
  const maxLng = Math.max(topLeft.lng, bottomRight.lng);
  const latStep = niceDegreeStep((maxLat - minLat) / 5);
  const lngStep = niceDegreeStep((maxLng - minLng) / 6);

  const fragment = document.createDocumentFragment();

  for (let lng = Math.ceil(minLng / lngStep) * lngStep; lng <= maxLng; lng += lngStep) {
    const point = screenPointFor(state.center.lat, lng);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "geo-grid-line");
    line.setAttribute("x1", point.x.toFixed(1));
    line.setAttribute("y1", "0");
    line.setAttribute("x2", point.x.toFixed(1));
    line.setAttribute("y2", String(rect.height));
    fragment.append(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "geo-grid-label");
    label.setAttribute("x", (point.x + 4).toFixed(1));
    label.setAttribute("y", "18");
    label.textContent = formatCoordinate(lng, "lng");
    fragment.append(label);
  }

  for (let lat = Math.ceil(minLat / latStep) * latStep; lat <= maxLat; lat += latStep) {
    const point = screenPointFor(lat, state.center.lng);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "geo-grid-line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", point.y.toFixed(1));
    line.setAttribute("x2", String(rect.width));
    line.setAttribute("y2", point.y.toFixed(1));
    fragment.append(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "geo-grid-label");
    label.setAttribute("x", "8");
    label.setAttribute("y", (point.y - 5).toFixed(1));
    label.textContent = formatCoordinate(lat, "lat");
    fragment.append(label);
  }

  elements.gridLayer.append(fragment);
}

function renderTracks() {
  elements.trackLayer.replaceChildren();
  elements.trackLayer.classList.add("is-hidden");
}

function orderedCapturesForLayers() {
  const captures = visibleCaptures();
  const capturesById = new Map(captures.map((capture) => [capture.id, capture]));
  const ordered = [];
  const usedIds = new Set();

  for (const id of state.layerOrder) {
    const capture = capturesById.get(id);
    if (capture) {
      ordered.push(capture);
      usedIds.add(id);
    }
  }

  for (const capture of captures) {
    if (!usedIds.has(capture.id)) {
      ordered.push(capture);
    }
  }

  return ordered;
}

function sendCaptureToFront(id) {
  const allIds = state.captures.map((capture) => capture.id);
  const orderedIds = [...state.layerOrder, ...allIds.filter((captureId) => !state.layerOrder.includes(captureId))];
  const nextLayerOrder = [...orderedIds.filter((captureId) => captureId !== id), id];
  if (nextLayerOrder.join("\u0000") !== state.layerOrder.join("\u0000")) {
    state.layerOrder = nextLayerOrder;
    markIntelDirty();
  }
}

function sendCaptureToBack(id) {
  const allIds = state.captures.map((capture) => capture.id);
  const orderedIds = [...state.layerOrder, ...allIds.filter((captureId) => !state.layerOrder.includes(captureId))];
  const nextLayerOrder = [id, ...orderedIds.filter((captureId) => captureId !== id)];
  if (nextLayerOrder.join("\u0000") !== state.layerOrder.join("\u0000")) {
    state.layerOrder = nextLayerOrder;
    markIntelDirty();
  }
}

function updateOverlayStacking() {
  const orderIds = orderedCapturesForLayers().map((capture) => capture.id);
  const orderIndexById = new Map(orderIds.map((captureId, index) => [captureId, index]));
  for (const overlay of elements.overlayLayer.querySelectorAll(".overlay-item")) {
    const orderIndex = orderIndexById.get(overlay.dataset.captureId) ?? -1;
    const baseZIndex = orderIndex >= 0 ? orderIndex + 1 : 1;
    overlay.style.zIndex = String(baseZIndex);
  }
}

function captureAtScreenPoint(clientX, clientY) {
  const rect = elements.map.getBoundingClientRect();
  const point = {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
  const captures = orderedCapturesForLayers();
  for (let index = captures.length - 1; index >= 0; index -= 1) {
    const capture = captures[index];
    const geometry = overlayGeometryForCapture(capture);
    if (geometry?.points?.length === 4 && pointInPolygon(point, geometry.points)) {
      return capture;
    }
  }
  return null;
}

function overlayGeometryForCapture(capture) {
  const projection = imageGroundProjection(capture);
  if (projection.type === "location-only") {
    return null;
  }

  const shouldShowImage = state.showImages;
  const shouldShowFootprint = state.showFootprints && capture.id === state.selectedId;
  if (!shouldShowImage && !shouldShowFootprint) {
    return null;
  }

  const points = projection.corners.map((corner) => screenPointFor(corner.lat, corner.lng));
  const bounds = boundsForScreenPoints(points);
  if (!screenBoundsIntersect(bounds, mapViewportBounds(OVERLAY_CULL_MARGIN_PX))) {
    return null;
  }

  const projectedMaxEdge = maxScreenEdge(points);
  const preview = selectOverlayPreview(capture, projectedMaxEdge);
  const sourceSize = overlaySourceSize(capture, preview);
  const transform = matrix3dForQuad(points, sourceSize.width, sourceSize.height);
  return transform
    ? {
        bounds,
        points,
        preview,
        projectedMaxEdge,
        sourceSize,
        transform,
        shouldShowImage,
        shouldShowFootprint,
      }
    : null;
}

function applyOverlayGeometry(overlay, capture, geometry = overlayGeometryForCapture(capture)) {
  if (!geometry) {
    return false;
  }

  overlay.className = `overlay-item projected${capture.id === state.selectedId ? " selected" : ""}`;
  overlay.dataset.captureId = capture.id;
  overlay.title = `${captureSummary(capture)}. Left click to preview. Right click to send behind this stack.`;
  overlay.style.setProperty("--capture-color", capture.setColor);
  overlay.style.width = `${geometry.sourceSize.width}px`;
  overlay.style.height = `${geometry.sourceSize.height}px`;
  overlay.style.opacity = state.useCanvasOverlays ? "1" : String(state.imageOpacity);
  overlay.style.mixBlendMode = state.imageBlend;
  overlay.style.transform = geometry.transform;
  return true;
}

function updateCaptureOverlay(capture) {
  const overlay = elements.overlayLayer.querySelector(`[data-capture-id="${CSS.escape(capture.id)}"]`);
  if (!overlay) {
    renderOverlays();
    return;
  }

  if (!applyOverlayGeometry(overlay, capture)) {
    overlay.remove();
    return;
  }
  updateOverlayStacking();
}

function createOverlayElement(capture) {
  const overlay = document.createElement("div");
  overlay.dataset.captureId = capture.id;

  overlay.addEventListener("pointerdown", (event) => {
    const currentCapture = visibleCaptureById(overlay.dataset.captureId);
    if (currentCapture && startEditDrag(event, currentCapture)) {
      return;
    }
  });
  overlay.addEventListener("click", (event) => {
    event.stopPropagation();
    if (state.suppressNextOverlayClick) {
      state.suppressNextOverlayClick = false;
      event.preventDefault();
      return;
    }
    const currentCapture = visibleCaptureById(overlay.dataset.captureId);
    if (!selectOverlayCapture(currentCapture)) {
      event.preventDefault();
      return;
    }
  });
  overlay.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const currentCapture = visibleCaptureById(overlay.dataset.captureId);
    if (!currentCapture) {
      return;
    }
    sendCaptureToBack(currentCapture.id);
    renderOverlays();
    renderMarkers();
  });

  return overlay;
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function polygonCenter(points) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function pointAwayFromCenter(point, center, distancePx) {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    x: point.x + (dx / length) * distancePx,
    y: point.y + (dy / length) * distancePx,
  };
}

function editHandleDefinitions(capture, geometry) {
  const points = geometry.points;
  const center = polygonCenter(points);
  const sideMidpoints = [
    midpoint(points[0], points[1]),
    midpoint(points[1], points[2]),
    midpoint(points[2], points[3]),
    midpoint(points[3], points[0]),
  ];
  const scaleOffsetPx = 28;
  const rotateOffsetPx = 72;
  const topMidpoint = sideMidpoints[0];
  const rotatePoint = pointAwayFromCenter(topMidpoint, center, rotateOffsetPx);
  return [
    { kind: "warp-corner", captureId: capture.id, cornerIndex: 0, ...points[0], className: "edit-anchor-warp", label: "Warp top left corner" },
    { kind: "warp-corner", captureId: capture.id, cornerIndex: 1, ...points[1], className: "edit-anchor-warp", label: "Warp top right corner" },
    { kind: "warp-corner", captureId: capture.id, cornerIndex: 2, ...points[2], className: "edit-anchor-warp", label: "Warp bottom right corner" },
    { kind: "warp-corner", captureId: capture.id, cornerIndex: 3, ...points[3], className: "edit-anchor-warp", label: "Warp bottom left corner" },
    ...sideMidpoints.map((point) => ({
      kind: "scale",
      captureId: capture.id,
      ...pointAwayFromCenter(point, center, scaleOffsetPx),
      className: "edit-anchor-scale",
      label: "Resize image",
    })),
    { kind: "rotate", captureId: capture.id, ...rotatePoint, className: "edit-anchor-rotate", label: "Rotate image", linkFrom: topMidpoint },
  ];
}

function createEditAnchor(definition) {
  const anchor = document.createElement("button");
  anchor.type = "button";
  anchor.className = `edit-anchor ${definition.className}`;
  anchor.title = definition.label;
  anchor.setAttribute("aria-label", definition.label);
  anchor.dataset.kind = definition.kind;
  anchor.dataset.captureId = definition.captureId;
  if (Number.isFinite(definition.cornerIndex)) {
    anchor.dataset.cornerIndex = String(definition.cornerIndex);
  }
  if (definition.kind === "rotate") {
    anchor.append(createIcon("rotate-cw", "app-icon edit-anchor-icon"));
  }
  anchor.style.left = `${definition.x}px`;
  anchor.style.top = `${definition.y}px`;
  anchor.addEventListener("pointerdown", (event) => {
    const capture = visibleCaptureById(anchor.dataset.captureId);
    if (capture) {
      startEditHandleDrag(event, capture, anchor.dataset);
    }
  });
  return anchor;
}

function clearEditAnchors() {
  elements.editHandleLayer.replaceChildren();
}

function renderEditAnchors(capture, geometry) {
  if (!state.edit.active || state.edit.captureId !== capture.id || geometry.points.length !== 4) {
    return;
  }
  const definitions = editHandleDefinitions(capture, geometry);
  const rotateDefinition = definitions.find((definition) => definition.kind === "rotate");
  if (rotateDefinition?.linkFrom) {
    const dx = rotateDefinition.x - rotateDefinition.linkFrom.x;
    const dy = rotateDefinition.y - rotateDefinition.linkFrom.y;
    const rotateLink = document.createElement("div");
    rotateLink.className = "edit-rotate-link";
    rotateLink.style.left = `${rotateDefinition.linkFrom.x}px`;
    rotateLink.style.top = `${rotateDefinition.linkFrom.y}px`;
    rotateLink.style.width = `${Math.hypot(dx, dy)}px`;
    rotateLink.style.transform = `rotate(${radiansToDegrees(Math.atan2(dy, dx))}deg)`;
    elements.editHandleLayer.append(rotateLink);
  }
  for (const definition of definitions) {
    const anchor = createEditAnchor(definition);
    elements.editHandleLayer.append(anchor);
  }
}

function syncOverlayContent(overlay, capture, geometry) {
  let img = overlay.querySelector(":scope > img");
  if (geometry.shouldShowImage && !state.useCanvasOverlays) {
    if (!img) {
      img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.addEventListener("load", () => {
        const currentCapture = visibleCaptureById(overlay.dataset.captureId);
        if (currentCapture && updateCaptureOverlaySize(currentCapture, img.naturalWidth, img.naturalHeight)) {
          updateCaptureOverlay(currentCapture);
        }
      });
      overlay.prepend(img);
    }
    img.alt = capture.fileName;
    const overlayUrl = captureOverlayUrl(capture, geometry.projectedMaxEdge);
    if (img.src !== overlayUrl) {
      img.src = overlayUrl;
    }
  } else if (img) {
    img.remove();
  }

  let footprintBox = overlay.querySelector(":scope > .overlay-footprint");
  if (geometry.shouldShowFootprint) {
    if (!footprintBox) {
      footprintBox = document.createElement("div");
      footprintBox.className = "overlay-footprint";
      overlay.append(footprintBox);
    }
  } else if (footprintBox) {
    footprintBox.remove();
  }

  let selectionSurround = overlay.querySelector(":scope > .selection-surround");
  if (capture.id === state.selectedId) {
    if (!selectionSurround) {
      selectionSurround = document.createElement("div");
      selectionSurround.className = "selection-surround";
      overlay.append(selectionSurround);
    }
  } else if (selectionSurround) {
    selectionSurround.remove();
  }

}

function resizeOverlayCanvas() {
  const rect = elements.map.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (elements.overlayCanvas.width !== width || elements.overlayCanvas.height !== height) {
    elements.overlayCanvas.width = width;
    elements.overlayCanvas.height = height;
  }
}

function clearOverlayCanvas() {
  state.overlayCanvasRenderId += 1;
  if (state.overlayCanvasRetryTimerId !== null) {
    clearTimeout(state.overlayCanvasRetryTimerId);
    state.overlayCanvasRetryTimerId = null;
  }
  resizeOverlayCanvas();
  const ctx = elements.overlayCanvas.getContext("2d");
  ctx.clearRect(0, 0, elements.overlayCanvas.width, elements.overlayCanvas.height);
  state.overlayCanvasHasFrame = false;
}

async function loadOverlayCanvasImage(item) {
  const urls = [item.preview?.fileUrl, item.capture.url].filter(Boolean);
  const uniqueUrls = [...new Set(urls)];
  for (const url of uniqueUrls) {
    const image = await loadImageForCanvas(url).catch(() => null);
    if (image?.complete && image.naturalWidth && image.naturalHeight && canDrawImageSource(image)) {
      return image;
    }
  }
  return null;
}

function scheduleOverlayCanvasRetry(items, retryCount) {
  if (retryCount >= 2 || state.overlayCanvasRetryTimerId !== null) {
    return;
  }
  state.overlayCanvasRetryTimerId = setTimeout(() => {
    state.overlayCanvasRetryTimerId = null;
    renderOverlayCanvas(items, retryCount + 1).catch((error) => {
      console.warn(error);
    });
  }, 120);
}

async function renderOverlayCanvas(items, retryCount = 0) {
  if (retryCount === 0 && state.overlayCanvasRetryTimerId !== null) {
    clearTimeout(state.overlayCanvasRetryTimerId);
    state.overlayCanvasRetryTimerId = null;
  }
  const renderId = (state.overlayCanvasRenderId += 1);
  if (!state.useCanvasOverlays || !state.showImages || !items.length) {
    clearOverlayCanvas();
    return;
  }

  const loadedItems = await measurePerformanceAsync(
    "overlayCanvas.load",
    async () =>
      Promise.all(
        items.map(async (item) => ({
          ...item,
          image: await loadOverlayCanvasImage(item),
        })),
      ),
    items.length,
  );

  if (renderId !== state.overlayCanvasRenderId) {
    return;
  }

  const drawableItems = loadedItems.filter((item) => item.image);
  if (!drawableItems.length && state.overlayCanvasHasFrame) {
    scheduleOverlayCanvasRetry(items, retryCount);
    return;
  }

  measurePerformance("overlayCanvas.draw", () => {
    resizeOverlayCanvas();
    const ctx = elements.overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, elements.overlayCanvas.width, elements.overlayCanvas.height);
    for (const item of drawableItems) {
      drawProjectedImageToCanvas(ctx, item.image, item.geometry.points, {
        width: item.image.naturalWidth,
        height: item.image.naturalHeight,
      }, state.imageOpacity);
    }
    state.overlayCanvasHasFrame = drawableItems.length > 0;
  }, drawableItems.length);
}

function renderOverlays() {
  const perfStart = performance.now();
  const visible = visibleCaptures();
  elements.overlayCanvas.style.opacity = "1";
  elements.overlayCanvas.style.mixBlendMode = state.imageBlend;
  try {
    if (!visible.length || (!state.showImages && !state.showFootprints)) {
      elements.overlayLayer.replaceChildren();
      clearOverlayCanvas();
      clearEditAnchors();
      return;
    }

    const existingOverlays = new Map(
      Array.from(elements.overlayLayer.querySelectorAll(".overlay-item")).map((overlay) => [overlay.dataset.captureId, overlay]),
    );
    const activeIds = new Set();
    const canvasItems = [];
    let editAnchorTarget = null;
    clearEditAnchors();
    for (const capture of orderedCapturesForLayers()) {
      const geometry = overlayGeometryForCapture(capture);
      if (!geometry) {
        continue;
      }
      if (geometry.shouldShowImage) {
        canvasItems.push({
          capture,
          geometry,
          preview: geometry.preview,
        });
      }

      const overlay = existingOverlays.get(capture.id) ?? createOverlayElement(capture);
      applyOverlayGeometry(overlay, capture, geometry);
      syncOverlayContent(overlay, capture, geometry);
      if (state.edit.active && state.edit.captureId === capture.id) {
        editAnchorTarget = { capture, geometry };
      }
      activeIds.add(capture.id);
      if (!overlay.parentElement) {
        elements.overlayLayer.append(overlay);
      }
    }

    for (const [captureId, overlay] of existingOverlays) {
      if (!activeIds.has(captureId)) {
        overlay.remove();
      }
    }
    updateOverlayStacking();
    if (editAnchorTarget) {
      renderEditAnchors(editAnchorTarget.capture, editAnchorTarget.geometry);
    }
    renderOverlayCanvas(canvasItems).catch((error) => {
      console.warn(error);
    });
  } finally {
    recordPerformance("renderOverlays", performance.now() - perfStart, visible.length);
  }
}

function createMarkerElement() {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.append(createIcon("navigation-2", "app-icon marker-icon"));
  for (const eventName of ["pointerdown", "pointermove", "pointerup", "pointercancel", "dblclick", "contextmenu", "auxclick"]) {
    marker.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  }
  marker.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const capture = visibleCaptureById(marker.dataset.captureId);
    if (capture) {
      selectCapture(capture.id, false, true);
    }
  });
  return marker;
}

function syncMarkerElement(marker, capture, point = null) {
  const position = point ? null : capturePosition(capture);
  const markerPoint = point ?? screenPointFor(position.lat, position.lng);
  marker.dataset.captureId = capture.id;
  marker.className = `marker${capture.id === state.selectedId ? " selected" : ""}`;
  marker.title = captureSummary(capture);
  marker.style.setProperty("--capture-color", capture.setColor);
  marker.style.transform = `translate(${markerPoint.x - 14}px, ${markerPoint.y - 14}px) rotate(${capture.headingDeg}deg)`;
}

function renderMarkers() {
  elements.markerLayer.classList.toggle("is-hidden", !state.showTracks);
  if (!state.showTracks) {
    elements.markerLayer.replaceChildren();
    return;
  }

  const existingMarkers = new Map(
    Array.from(elements.markerLayer.querySelectorAll(".marker")).map((marker) => [marker.dataset.captureId, marker]),
  );
  const activeIds = new Set();
  const viewport = mapViewportBounds(MARKER_CULL_MARGIN_PX);

  for (const capture of visibleCaptures()) {
    const position = capturePosition(capture);
    const point = screenPointFor(position.lat, position.lng);
    if (!screenPointInBounds(point, viewport)) {
      continue;
    }
    const marker = existingMarkers.get(capture.id) ?? createMarkerElement();
    syncMarkerElement(marker, capture, point);
    activeIds.add(capture.id);
    if (!marker.parentElement) {
      elements.markerLayer.append(marker);
    }
  }

  for (const [captureId, marker] of existingMarkers) {
    if (!activeIds.has(captureId)) {
      marker.remove();
    }
  }
}

function createMarkupId() {
  const id = `markup-${Date.now().toString(36)}-${state.nextMarkupNumber}`;
  state.nextMarkupNumber += 1;
  return id;
}

function cloneMarkupPoint(point) {
  return { lat: point.lat, lng: point.lng };
}

function cloneMarkupItem(item) {
  if (!item) {
    return null;
  }
  if (item.type === "pencil") {
    return {
      id: item.id,
      type: item.type,
      color: item.color,
      thickness: item.thickness,
      points: item.points.map(cloneMarkupPoint),
    };
  }
  return {
    id: item.id,
    type: item.type,
    color: item.color,
    thickness: item.thickness,
    start: cloneMarkupPoint(item.start),
    end: cloneMarkupPoint(item.end),
  };
}

function selectedMarkupItems() {
  if (!state.selectedMarkupIds.size) {
    return [];
  }
  const items = state.markupItems.filter((item) => state.selectedMarkupIds.has(item.id));
  if (items.length !== state.selectedMarkupIds.size) {
    state.selectedMarkupIds = new Set(items.map((item) => item.id));
  }
  return items;
}

function selectedMarkupItem() {
  return selectedMarkupItems()[0] ?? null;
}

function updateMarkupSelectionControls() {
  const selectedItems = selectedMarkupItems();
  elements.deleteMarkupButton.disabled = !selectedItems.length;
  if (selectedItems.length) {
    const [firstSelected] = selectedItems;
    elements.markupThicknessInput.value = String(firstSelected.thickness);
    elements.markupColorInput.value = firstSelected.color;
    state.markupThickness = firstSelected.thickness;
    state.markupColor = firstSelected.color;
  }
}

function clearSelectedCaptureForMarkup() {
  if (!state.selectedId && !state.viewerCaptureId && !state.edit.active) {
    return true;
  }
  if (state.edit.active) {
    promptEditSaveReset();
    return false;
  }
  state.selectedId = null;
  state.viewerCaptureId = null;
  state.pendingOverlayClick = null;
  state.pendingPhotoDeselectClick = null;
  state.suppressNextOverlayClick = false;
  renderSelectedDetails();
  renderImageViewer();
  renderList();
  scheduleEditedLayersRender();
  return true;
}

function setSelectedMarkupIds(ids, shouldRender = true) {
  const validIds = new Set(state.markupItems.map((item) => item.id));
  const nextSelectedIds = new Set(ids.filter((id) => validIds.has(id)));
  if (nextSelectedIds.size && !clearSelectedCaptureForMarkup()) {
    return false;
  }
  state.selectedMarkupIds = nextSelectedIds;
  updateMarkupSelectionControls();
  if (shouldRender) {
    renderMarkup();
  }
  return true;
}

function selectMarkupItem(id, shouldRender = true) {
  return setSelectedMarkupIds(id ? [id] : [], shouldRender);
}

function toggleMarkupSelection(id, shouldRender = true) {
  if (!state.markupItems.some((item) => item.id === id)) {
    return;
  }
  const nextIds = new Set(state.selectedMarkupIds);
  if (nextIds.has(id)) {
    nextIds.delete(id);
  } else {
    nextIds.add(id);
  }
  setSelectedMarkupIds([...nextIds], shouldRender);
}

function removeMarkupItemById(id) {
  const index = state.markupItems.findIndex((item) => item.id === id);
  if (index < 0) {
    return false;
  }
  state.markupItems.splice(index, 1);
  state.selectedMarkupIds.delete(id);
  state.markupDrag = null;
  state.markupSelectionBox = null;
  elements.map.classList.remove("is-markup-resizing");
  elements.map.classList.remove("is-markup-moving");
  elements.map.classList.remove("is-multi-selecting");
  updateMarkupSelectionControls();
  markIntelDirty();
  renderMarkup();
  return true;
}

function deleteSelectedMarkupItem() {
  if (!state.selectedMarkupIds.size) {
    return;
  }
  const selectedIds = new Set(state.selectedMarkupIds);
  state.markupItems = state.markupItems.filter((item) => !selectedIds.has(item.id));
  state.selectedMarkupIds.clear();
  state.markupDrag = null;
  state.markupSelectionBox = null;
  elements.map.classList.remove("is-markup-resizing");
  elements.map.classList.remove("is-markup-moving");
  elements.map.classList.remove("is-multi-selecting");
  updateMarkupSelectionControls();
  markIntelDirty();
  renderMarkup();
}

function mapPointFromEvent(event) {
  const rect = elements.map.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function latLngForMapPoint(point) {
  const rect = elements.map.getBoundingClientRect();
  return screenToLatLng(rect.left + point.x, rect.top + point.y);
}

function moveMarkupItemFromOriginal(item, original, deltaX, deltaY) {
  if (item.type === "pencil" && original.points) {
    const originalPoints = original.points.map((point) => screenPointFor(point.lat, point.lng));
    item.points = originalPoints.map((point) =>
      latLngForMapPoint({
        x: point.x + deltaX,
        y: point.y + deltaY,
      }),
    );
    return;
  }

  const start = screenPointFor(original.start.lat, original.start.lng);
  const end = screenPointFor(original.end.lat, original.end.lng);
  item.start = latLngForMapPoint({ x: start.x + deltaX, y: start.y + deltaY });
  item.end = latLngForMapPoint({ x: end.x + deltaX, y: end.y + deltaY });
}

function expandScreenBounds(bounds, amount) {
  return {
    minX: bounds.minX - amount,
    minY: bounds.minY - amount,
    maxX: bounds.maxX + amount,
    maxY: bounds.maxY + amount,
  };
}

function markupItemScreenBounds(item) {
  if (!item) {
    return null;
  }

  if (item.type === "pencil") {
    const points = item.points?.map((point) => screenPointFor(point.lat, point.lng)) ?? [];
    return points.length ? boundsForScreenPoints(points) : null;
  }

  if (!item.start || !item.end) {
    return null;
  }

  return boundsForScreenPoints([
    screenPointFor(item.start.lat, item.start.lng),
    screenPointFor(item.end.lat, item.end.lng),
  ]);
}

function selectionBoxBounds(box) {
  return {
    minX: Math.min(box.startX, box.currentX),
    minY: Math.min(box.startY, box.currentY),
    maxX: Math.max(box.startX, box.currentX),
    maxY: Math.max(box.startY, box.currentY),
  };
}

function markupIdsInSelectionBox(box) {
  const selectionBounds = selectionBoxBounds(box);
  return state.markupItems
    .filter((item) => {
      const itemBounds = markupItemScreenBounds(item);
      if (!itemBounds) {
        return false;
      }
      return screenBoundsIntersect(expandScreenBounds(itemBounds, Math.max(6, item.thickness ?? 0)), selectionBounds);
    })
    .map((item) => item.id);
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t));
}

function markupStrokeSegments(item) {
  if (!item) {
    return [];
  }

  if (item.type === "pencil") {
    const points = item.points?.map((point) => screenPointFor(point.lat, point.lng)) ?? [];
    if (points.length === 1) {
      return [[points[0], points[0]]];
    }
    const segments = [];
    for (let index = 1; index < points.length; index += 1) {
      segments.push([points[index - 1], points[index]]);
    }
    return segments;
  }

  if (!item.start || !item.end) {
    return [];
  }

  const start = screenPointFor(item.start.lat, item.start.lng);
  const end = screenPointFor(item.end.lat, item.end.lng);
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxX = Math.max(start.x, end.x);
  const maxY = Math.max(start.y, end.y);
  if (item.type === "line") {
    return [[start, end]];
  }
  if (item.type === "square") {
    const nw = { x: minX, y: minY };
    const ne = { x: maxX, y: minY };
    const se = { x: maxX, y: maxY };
    const sw = { x: minX, y: maxY };
    return [[nw, ne], [ne, se], [se, sw], [sw, nw]];
  }
  if (item.type === "x") {
    return [
      [{ x: minX, y: minY }, { x: maxX, y: maxY }],
      [{ x: maxX, y: minY }, { x: minX, y: maxY }],
    ];
  }
  if (item.type === "circle") {
    const center = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const radiusX = Math.abs(end.x - start.x) / 2;
    const radiusY = Math.abs(end.y - start.y) / 2;
    const segmentCount = 64;
    const points = [];
    for (let index = 0; index < segmentCount; index += 1) {
      const angle = (Math.PI * 2 * index) / segmentCount;
      points.push({
        x: center.x + Math.cos(angle) * radiusX,
        y: center.y + Math.sin(angle) * radiusY,
      });
    }
    return points.map((point, index) => [point, points[(index + 1) % points.length]]);
  }
  return [];
}

function markupItemTouchesEraser(item, point, radius = MARKUP_ERASER_RADIUS_PX) {
  const bounds = markupItemScreenBounds(item);
  if (!bounds) {
    return false;
  }
  const threshold = radius + Math.max(2, (Number(item.thickness) || 1) / 2);
  const brushBounds = {
    minX: point.x - threshold,
    minY: point.y - threshold,
    maxX: point.x + threshold,
    maxY: point.y + threshold,
  };
  if (!screenBoundsIntersect(expandScreenBounds(bounds, threshold), brushBounds)) {
    return false;
  }
  return markupStrokeSegments(item).some(([start, end]) => distanceToSegment(point, start, end) <= threshold);
}

function normalizeMarkupPoint(point) {
  if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) {
    return null;
  }
  return { lat: Number(point.lat), lng: Number(point.lng) };
}

function normalizeMarkupItem(item) {
  if (!item || typeof item !== "object" || !["pencil", "line", "square", "circle", "x"].includes(item.type)) {
    return null;
  }
  const id = typeof item.id === "string" && item.id ? item.id : createMarkupId();
  const color = typeof item.color === "string" ? item.color : "#f6d06f";
  const thickness = Number.isFinite(Number(item.thickness)) ? clamp(Number(item.thickness), 1, 16) : 3;
  if (item.type === "pencil") {
    const points = Array.isArray(item.points) ? item.points.map(normalizeMarkupPoint).filter(Boolean) : [];
    return points.length ? { id, type: "pencil", color, thickness, points } : null;
  }
  const start = normalizeMarkupPoint(item.start);
  const end = normalizeMarkupPoint(item.end);
  return start && end ? { id, type: item.type, color, thickness, start, end } : null;
}

function markupPointFromEvent(event) {
  return screenToLatLng(event.clientX, event.clientY);
}

function centeredMarkupBoundsFromEvent(event, sizePx = MARKUP_CLICK_SHAPE_SIZE_PX) {
  const halfSize = sizePx / 2;
  return {
    start: screenToLatLng(event.clientX - halfSize, event.clientY - halfSize),
    end: screenToLatLng(event.clientX + halfSize, event.clientY + halfSize),
  };
}

function centeredMarkupLineFromEvent(event, sizePx = MARKUP_CLICK_SHAPE_SIZE_PX) {
  const halfSize = sizePx / 2;
  return {
    start: screenToLatLng(event.clientX - halfSize, event.clientY),
    end: screenToLatLng(event.clientX + halfSize, event.clientY),
  };
}

function renderMarkupItem(item, fragment) {
  const color = item.color;
  const thickness = String(item.thickness);
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", `markup-item${state.selectedMarkupIds.has(item.id) ? " is-selected" : ""}`);
  if (item.id) {
    group.dataset.markupId = item.id;
  }

  if (item.type === "pencil") {
    const points = item.points.map((point) => screenPointFor(point.lat, point.lng));
    if (points.length < 2) {
      return;
    }
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("class", "markup-stroke");
    polyline.setAttribute("points", points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" "));
    polyline.setAttribute("stroke", color);
    polyline.setAttribute("stroke-width", thickness);
    group.append(polyline);
    fragment.append(group);
    return;
  }

  const start = screenPointFor(item.start.lat, item.start.lng);
  const end = screenPointFor(item.end.lat, item.end.lng);
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  if (item.type === "line") {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "markup-stroke");
    line.setAttribute("x1", start.x.toFixed(1));
    line.setAttribute("y1", start.y.toFixed(1));
    line.setAttribute("x2", end.x.toFixed(1));
    line.setAttribute("y2", end.y.toFixed(1));
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", thickness);
    group.append(line);
    fragment.append(group);
    return;
  }

  if (item.type === "square") {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("class", "markup-stroke");
    rect.setAttribute("x", minX.toFixed(1));
    rect.setAttribute("y", minY.toFixed(1));
    rect.setAttribute("width", width.toFixed(1));
    rect.setAttribute("height", height.toFixed(1));
    rect.setAttribute("stroke", color);
    rect.setAttribute("stroke-width", thickness);
    group.append(rect);
    fragment.append(group);
    return;
  }

  if (item.type === "circle") {
    const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    ellipse.setAttribute("class", "markup-stroke");
    ellipse.setAttribute("cx", ((start.x + end.x) / 2).toFixed(1));
    ellipse.setAttribute("cy", ((start.y + end.y) / 2).toFixed(1));
    ellipse.setAttribute("rx", (width / 2).toFixed(1));
    ellipse.setAttribute("ry", (height / 2).toFixed(1));
    ellipse.setAttribute("stroke", color);
    ellipse.setAttribute("stroke-width", thickness);
    group.append(ellipse);
    fragment.append(group);
    return;
  }

  const first = document.createElementNS("http://www.w3.org/2000/svg", "line");
  first.setAttribute("class", "markup-stroke");
  first.setAttribute("x1", minX.toFixed(1));
  first.setAttribute("y1", minY.toFixed(1));
  first.setAttribute("x2", (minX + width).toFixed(1));
  first.setAttribute("y2", (minY + height).toFixed(1));
  first.setAttribute("stroke", color);
  first.setAttribute("stroke-width", thickness);
  const second = first.cloneNode();
  second.setAttribute("x1", (minX + width).toFixed(1));
  second.setAttribute("y1", minY.toFixed(1));
  second.setAttribute("x2", minX.toFixed(1));
  second.setAttribute("y2", (minY + height).toFixed(1));
  group.append(first, second);
  fragment.append(group);
}

function markupResizeHandlesForItem(item) {
  if (!item) {
    return [];
  }

  if (item.type === "pencil") {
    const points = item.points.map((point) => screenPointFor(point.lat, point.lng));
    if (points.length < 2) {
      return [];
    }
    const bounds = boundsForScreenPoints(points);
    return [
      { handle: "start", x: bounds.minX, y: bounds.minY },
      { handle: "end", x: bounds.maxX, y: bounds.maxY },
    ];
  }

  const start = screenPointFor(item.start.lat, item.start.lng);
  const end = screenPointFor(item.end.lat, item.end.lng);
  return [
    { handle: "start", x: start.x, y: start.y },
    { handle: "end", x: end.x, y: end.y },
  ];
}

function selectedMarkupScreenBounds() {
  const bounds = selectedMarkupItems()
    .map(markupItemScreenBounds)
    .filter(Boolean);
  if (!bounds.length) {
    return null;
  }
  return {
    minX: Math.min(...bounds.map((item) => item.minX)),
    minY: Math.min(...bounds.map((item) => item.minY)),
    maxX: Math.max(...bounds.map((item) => item.maxX)),
    maxY: Math.max(...bounds.map((item) => item.maxY)),
  };
}

function markupResizeHandlesForBounds(bounds) {
  if (!bounds) {
    return [];
  }
  const midX = (bounds.minX + bounds.maxX) / 2;
  const midY = (bounds.minY + bounds.maxY) / 2;
  return [
    { handle: "nw", x: bounds.minX, y: bounds.minY },
    { handle: "n", x: midX, y: bounds.minY },
    { handle: "ne", x: bounds.maxX, y: bounds.minY },
    { handle: "e", x: bounds.maxX, y: midY },
    { handle: "se", x: bounds.maxX, y: bounds.maxY },
    { handle: "s", x: midX, y: bounds.maxY },
    { handle: "sw", x: bounds.minX, y: bounds.maxY },
    { handle: "w", x: bounds.minX, y: midY },
  ];
}

function renderMarkupSelectionHandles(fragment) {
  const selectedItems = selectedMarkupItems();
  if (state.markupSelectionBox || !selectedItems.length || !["pan", "multi"].includes(state.markupTool)) {
    return;
  }

  const bounds = selectedMarkupScreenBounds();
  if (!bounds) {
    return;
  }

  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const frame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  frame.setAttribute("class", "markup-selection-frame");
  frame.setAttribute("x", bounds.minX.toFixed(1));
  frame.setAttribute("y", bounds.minY.toFixed(1));
  frame.setAttribute("width", width.toFixed(1));
  frame.setAttribute("height", height.toFixed(1));
  fragment.append(frame);

  for (const handle of markupResizeHandlesForBounds(bounds)) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", `markup-handle markup-handle-${handle.handle}`);
    circle.setAttribute("cx", handle.x.toFixed(1));
    circle.setAttribute("cy", handle.y.toFixed(1));
    circle.setAttribute("r", "7");
    circle.dataset.handle = handle.handle;
    fragment.append(circle);
  }
}

function renderMarkupSelectionBox(fragment) {
  if (!state.markupSelectionBox) {
    return;
  }

  const bounds = selectionBoxBounds(state.markupSelectionBox);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width < 1 && height < 1) {
    return;
  }

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("class", "markup-selection-box");
  rect.setAttribute("x", bounds.minX.toFixed(1));
  rect.setAttribute("y", bounds.minY.toFixed(1));
  rect.setAttribute("width", width.toFixed(1));
  rect.setAttribute("height", height.toFixed(1));
  fragment.append(rect);
}

function renderMarkup() {
  elements.markupLayer.replaceChildren();
  const rect = elements.map.getBoundingClientRect();
  elements.markupLayer.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
  elements.markupLayer.classList.toggle("is-hidden", !state.showMarkup);
  if (!state.showMarkup) {
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of state.markupItems) {
    renderMarkupItem(item, fragment);
  }
  renderMarkupSelectionHandles(fragment);
  renderMarkupSelectionBox(fragment);
  if (state.activeMarkup) {
    renderMarkupItem(state.activeMarkup, fragment);
  }
  elements.markupLayer.append(fragment);
  updateMarkupSelectionControls();
}

function setMarkupTool(tool) {
  state.markupTool = MARKUP_TOOLS.includes(tool) ? tool : "pan";
  if (state.markupTool !== "eraser") {
    state.markupEraser = null;
    setEraserCursor(null);
  }
  if (state.markupSelectionBox && state.markupTool !== "multi") {
    state.markupSelectionBox = null;
    elements.map.classList.remove("is-multi-selecting");
  }
  const buttons = {
    pan: elements.drawSelectButton,
    multi: elements.drawMultiSelectButton,
    pencil: elements.drawPencilButton,
    line: elements.drawLineButton,
    square: elements.drawSquareButton,
    circle: elements.drawCircleButton,
    x: elements.drawXButton,
    eraser: elements.drawEraserButton,
  };
  for (const [buttonTool, button] of Object.entries(buttons)) {
    button.setAttribute("aria-pressed", String(buttonTool === state.markupTool));
  }
  elements.map.classList.toggle("is-drawing", !["pan", "multi", "eraser"].includes(state.markupTool));
  elements.map.classList.toggle("is-erasing", state.markupTool === "eraser");
  renderMarkup();
}

function startMarkupMultiSelect(event) {
  if (!state.showMarkup || state.markupTool !== "multi" || event.button !== 0) {
    return false;
  }
  if (state.edit.active) {
    event.preventDefault();
    event.stopPropagation();
    promptEditSaveReset();
    return true;
  }
  if (event.target.closest?.(".markup-item, .markup-handle")) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();
  const point = mapPointFromEvent(event);
  state.markupSelectionBox = {
    startX: point.x,
    startY: point.y,
    currentX: point.x,
    currentY: point.y,
    hasMoved: false,
  };
  state.pendingOverlayClick = null;
  state.suppressNextOverlayClick = Boolean(event.target.closest?.(".overlay-item"));
  selectMarkupItem(null, false);
  try {
    elements.map.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic callers used in tests may not have an active DOM pointer.
  }
  elements.map.classList.add("is-multi-selecting");
  renderMarkup();
  return true;
}

function updateMarkupMultiSelect(event) {
  if (!state.markupSelectionBox) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();
  const point = mapPointFromEvent(event);
  state.markupSelectionBox.currentX = point.x;
  state.markupSelectionBox.currentY = point.y;
  state.markupSelectionBox.hasMoved =
    state.markupSelectionBox.hasMoved ||
    Math.hypot(point.x - state.markupSelectionBox.startX, point.y - state.markupSelectionBox.startY) > MAP_DRAG_CLICK_SUPPRESSION_PX;
  setSelectedMarkupIds(state.markupSelectionBox.hasMoved ? markupIdsInSelectionBox(state.markupSelectionBox) : [], false);
  scheduleMarkupRender();
  return true;
}

function finishMarkupMultiSelect(event) {
  if (!state.markupSelectionBox) {
    return false;
  }

  if (elements.map.hasPointerCapture(event.pointerId)) {
    elements.map.releasePointerCapture(event.pointerId);
  }
  event.preventDefault();
  event.stopPropagation();
  const box = state.markupSelectionBox;
  state.markupSelectionBox = null;
  elements.map.classList.remove("is-multi-selecting");
  setSelectedMarkupIds(box.hasMoved ? markupIdsInSelectionBox(box) : [], false);
  if (state.suppressNextOverlayClick) {
    window.setTimeout(() => {
      state.suppressNextOverlayClick = false;
    }, 0);
  }
  renderMarkup();
  return true;
}

function setEraserCursor(point) {
  if (!elements.eraserCursor) {
    return;
  }
  if (!point || state.markupTool !== "eraser" || !state.showMarkup) {
    elements.eraserCursor.hidden = true;
    return;
  }
  elements.eraserCursor.hidden = false;
  elements.eraserCursor.style.transform = `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px) translate(-50%, -50%)`;
}

function eraseMarkupAtPoint(point) {
  const erasedIds = new Set(
    state.markupItems
      .filter((item) => markupItemTouchesEraser(item, point))
      .map((item) => item.id),
  );
  if (!erasedIds.size) {
    return false;
  }
  state.markupItems = state.markupItems.filter((item) => !erasedIds.has(item.id));
  for (const id of erasedIds) {
    state.selectedMarkupIds.delete(id);
  }
  state.markupDrag = null;
  state.markupSelectionBox = null;
  updateMarkupSelectionControls();
  markIntelDirty();
  renderMarkup();
  return true;
}

function startMarkupEraser(event) {
  if (!state.showMarkup || state.markupTool !== "eraser" || event.button !== 0) {
    return false;
  }
  event.preventDefault();
  event.stopPropagation();
  const point = mapPointFromEvent(event);
  state.markupEraser = { pointerId: event.pointerId };
  state.pendingOverlayClick = null;
  state.suppressNextOverlayClick = true;
  setEraserCursor(point);
  eraseMarkupAtPoint(point);
  try {
    elements.map.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic callers used in tests may not have an active DOM pointer.
  }
  return true;
}

function updateMarkupEraser(event) {
  if (!state.markupEraser) {
    return false;
  }
  event.preventDefault();
  event.stopPropagation();
  const point = mapPointFromEvent(event);
  setEraserCursor(point);
  eraseMarkupAtPoint(point);
  return true;
}

function finishMarkupEraser(event) {
  if (!state.markupEraser) {
    return false;
  }
  if (elements.map.hasPointerCapture(event.pointerId)) {
    elements.map.releasePointerCapture(event.pointerId);
  }
  event.preventDefault();
  event.stopPropagation();
  state.markupEraser = null;
  return true;
}

function updateEraserHover(event) {
  if (state.markupEraser) {
    return;
  }
  if (state.markupTool === "eraser" && state.showMarkup) {
    setEraserCursor(mapPointFromEvent(event));
  }
}

function startMarkupDrawing(event) {
  if (!state.showMarkup || ["pan", "multi"].includes(state.markupTool) || event.button !== 0) {
    return false;
  }
  event.preventDefault();
  event.stopPropagation();

  if (state.edit.active) {
    promptEditSaveReset();
    return true;
  }

  if (state.markupTool === "eraser") {
    return startMarkupEraser(event);
  }

  selectMarkupItem(null, false);
  const base = {
    type: state.markupTool,
    color: state.markupColor,
    thickness: state.markupThickness,
  };

  if (state.markupTool === "line") {
    const point = markupPointFromEvent(event);
    state.activeMarkup = {
      ...base,
      start: point,
      end: point,
      originClientX: event.clientX,
      originClientY: event.clientY,
    };
    try {
      elements.map.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic callers used in tests may not have an active DOM pointer.
    }
    scheduleMarkupRender();
    return true;
  }

  if (state.markupTool !== "pencil") {
    const item = normalizeMarkupItem({
      ...base,
      ...centeredMarkupBoundsFromEvent(event),
    });
    if (item) {
      state.markupItems.push(item);
      markIntelDirty();
      renderMarkup();
    }
    return true;
  }

  const point = markupPointFromEvent(event);
  state.activeMarkup = { ...base, points: [point] };
  try {
    elements.map.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic callers used in tests may not have an active DOM pointer.
  }
  scheduleMarkupRender();
  return true;
}

function updateMarkupDrawing(event) {
  if (!state.activeMarkup) {
    return false;
  }
  event.preventDefault();
  const point = markupPointFromEvent(event);
  if (state.activeMarkup.type === "pencil") {
    state.activeMarkup.points.push(point);
  } else {
    state.activeMarkup.end = point;
  }
  scheduleMarkupRender();
  return true;
}

function finishMarkupDrawing(event) {
  if (!state.activeMarkup) {
    return false;
  }
  if (elements.map.hasPointerCapture(event.pointerId)) {
    elements.map.releasePointerCapture(event.pointerId);
  }
  if (
    state.activeMarkup.type === "line" &&
    Number.isFinite(state.activeMarkup.originClientX) &&
    Number.isFinite(state.activeMarkup.originClientY) &&
    Math.hypot(event.clientX - state.activeMarkup.originClientX, event.clientY - state.activeMarkup.originClientY) <=
      MAP_DRAG_CLICK_SUPPRESSION_PX
  ) {
    Object.assign(state.activeMarkup, centeredMarkupLineFromEvent(event));
  }
  const item = normalizeMarkupItem(state.activeMarkup);
  state.activeMarkup = null;
  if (item) {
    state.markupItems.push(item);
    markIntelDirty();
  }
  renderMarkup();
  return true;
}

function markupItemFromTarget(target) {
  const itemElement = target.closest?.(".markup-item");
  const markupId = itemElement?.dataset.markupId;
  return markupId ? state.markupItems.find((item) => item.id === markupId) ?? null : null;
}

function resizeHandleFallbackSign(handle, axis) {
  if (axis === "x") {
    return handle.includes("w") ? -1 : 1;
  }
  return handle.includes("n") ? -1 : 1;
}

function signedDelta(value, origin, handle, axis) {
  const delta = value - origin;
  if (Math.abs(delta) > 0.5) {
    return delta;
  }
  return resizeHandleFallbackSign(handle, axis);
}

function normalizedBoundsFromCorners(a, b) {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  };
}

function markupResizeBoundsForEvent(event) {
  const drag = state.markupDrag;
  const bounds = drag?.bounds;
  if (!drag || !bounds) {
    return null;
  }

  const current = mapPointFromEvent(event);
  const handle = drag.handle;
  const handlesX = handle.includes("w") || handle.includes("e");
  const handlesY = handle.includes("n") || handle.includes("s");
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const aspect = width / height;
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };

  if (event.altKey) {
    let halfWidth = width / 2;
    let halfHeight = height / 2;
    if (handlesX) {
      halfWidth = Math.max(1, Math.abs(current.x - center.x));
    }
    if (handlesY) {
      halfHeight = Math.max(1, Math.abs(current.y - center.y));
    }
    if (event.shiftKey) {
      if (handlesX && handlesY) {
        const scale = Math.max(halfWidth / (width / 2), halfHeight / (height / 2));
        halfWidth = (width / 2) * scale;
        halfHeight = (height / 2) * scale;
      } else if (handlesX) {
        halfHeight = halfWidth / aspect;
      } else if (handlesY) {
        halfWidth = halfHeight * aspect;
      }
    }
    return {
      minX: center.x - halfWidth,
      minY: center.y - halfHeight,
      maxX: center.x + halfWidth,
      maxY: center.y + halfHeight,
    };
  }

  if (handlesX && handlesY) {
    const fixed = {
      x: handle.includes("w") ? bounds.maxX : bounds.minX,
      y: handle.includes("n") ? bounds.maxY : bounds.minY,
    };
    let moving = { x: current.x, y: current.y };
    if (event.shiftKey) {
      const scale = Math.max(Math.abs(current.x - fixed.x) / width, Math.abs(current.y - fixed.y) / height);
      moving = {
        x: fixed.x + Math.sign(signedDelta(current.x, fixed.x, handle, "x")) * width * scale,
        y: fixed.y + Math.sign(signedDelta(current.y, fixed.y, handle, "y")) * height * scale,
      };
    }
    return normalizedBoundsFromCorners(fixed, moving);
  }

  const next = { ...bounds };
  if (handlesX) {
    if (handle.includes("w")) {
      next.minX = current.x;
    } else {
      next.maxX = current.x;
    }
    if (event.shiftKey) {
      const fixedX = handle.includes("w") ? bounds.maxX : bounds.minX;
      const scale = Math.max(0.01, Math.abs(current.x - fixedX) / width);
      const nextHeight = height * scale;
      next.minY = center.y - nextHeight / 2;
      next.maxY = center.y + nextHeight / 2;
    }
  }
  if (handlesY) {
    if (handle.includes("n")) {
      next.minY = current.y;
    } else {
      next.maxY = current.y;
    }
    if (event.shiftKey) {
      const fixedY = handle.includes("n") ? bounds.maxY : bounds.minY;
      const scale = Math.max(0.01, Math.abs(current.y - fixedY) / height);
      const nextWidth = width * scale;
      next.minX = center.x - nextWidth / 2;
      next.maxX = center.x + nextWidth / 2;
    }
  }
  return {
    minX: Math.min(next.minX, next.maxX),
    minY: Math.min(next.minY, next.maxY),
    maxX: Math.max(next.minX, next.maxX),
    maxY: Math.max(next.minY, next.maxY),
  };
}

function resizeScreenPoint(point, fromBounds, toBounds) {
  const fromWidth = Math.max(1, fromBounds.maxX - fromBounds.minX);
  const fromHeight = Math.max(1, fromBounds.maxY - fromBounds.minY);
  const toWidth = Math.max(1, toBounds.maxX - toBounds.minX);
  const toHeight = Math.max(1, toBounds.maxY - toBounds.minY);
  return {
    x: toBounds.minX + ((point.x - fromBounds.minX) / fromWidth) * toWidth,
    y: toBounds.minY + ((point.y - fromBounds.minY) / fromHeight) * toHeight,
  };
}

function resizeMarkupItemFromOriginal(item, original, fromBounds, toBounds) {
  if (original.type === "pencil" && original.points) {
    item.points = original.points.map((point) => {
      const screenPoint = screenPointFor(point.lat, point.lng);
      return latLngForMapPoint(resizeScreenPoint(screenPoint, fromBounds, toBounds));
    });
    return;
  }

  item.start = latLngForMapPoint(
    resizeScreenPoint(screenPointFor(original.start.lat, original.start.lng), fromBounds, toBounds),
  );
  item.end = latLngForMapPoint(
    resizeScreenPoint(screenPointFor(original.end.lat, original.end.lng), fromBounds, toBounds),
  );
}

function startMarkupResize(event, handleElement) {
  if (!["pan", "multi"].includes(state.markupTool)) {
    return false;
  }
  const handle = handleElement.dataset.handle;
  if (!["nw", "n", "ne", "e", "se", "s", "sw", "w"].includes(handle)) {
    return false;
  }
  const selectedItems = selectedMarkupItems();
  const bounds = selectedMarkupScreenBounds();
  if (!selectedItems.length || !bounds) {
    return false;
  }
  event.preventDefault();
  event.stopPropagation();
  state.markupDrag = {
    mode: "resize",
    handle,
    bounds,
    originals: selectedItems.map(cloneMarkupItem),
    startClientX: event.clientX,
    startClientY: event.clientY,
    hasMoved: false,
  };
  try {
    elements.map.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic callers used in tests may not have an active DOM pointer.
  }
  elements.map.classList.add("is-markup-resizing");
  return true;
}

function startMarkupGroupMove(event, item) {
  const isMultiTool = state.markupTool === "multi";
  const isCursorMove = state.markupTool === "pan" && state.selectedMarkupIds.has(item.id);
  if (!isMultiTool && !isCursorMove) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();
  const wasSelected = state.selectedMarkupIds.has(item.id);
  if (!wasSelected) {
    setSelectedMarkupIds([...state.selectedMarkupIds, item.id], false);
    renderMarkup();
  }

  state.markupDrag = {
    mode: "move",
    id: item.id,
    startClientX: event.clientX,
    startClientY: event.clientY,
    wasSelected,
    toggleOnClick: isMultiTool && wasSelected,
    hasMoved: false,
    originals: null,
  };
  try {
    elements.map.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic callers used in tests may not have an active DOM pointer.
  }
  return true;
}

function updatePencilMarkupResize(item, event) {
  const original = state.markupDrag?.original;
  if (!original?.points?.length) {
    return;
  }

  const originalPoints = original.points.map((point) => screenPointFor(point.lat, point.lng));
  const bounds = boundsForScreenPoints(originalPoints);
  const fixed =
    state.markupDrag.handle === "start"
      ? { x: bounds.maxX, y: bounds.maxY }
      : { x: bounds.minX, y: bounds.minY };
  const moving =
    state.markupDrag.handle === "start"
      ? { x: bounds.minX, y: bounds.minY }
      : { x: bounds.maxX, y: bounds.maxY };
  const current = mapPointFromEvent(event);
  const scaleX = Math.abs(moving.x - fixed.x) < 1 ? 1 : (current.x - fixed.x) / (moving.x - fixed.x);
  const scaleY = Math.abs(moving.y - fixed.y) < 1 ? 1 : (current.y - fixed.y) / (moving.y - fixed.y);

  item.points = originalPoints.map((point) =>
    latLngForMapPoint({
      x: fixed.x + (point.x - fixed.x) * scaleX,
      y: fixed.y + (point.y - fixed.y) * scaleY,
    }),
  );
}

function updateMarkupGroupMove(event) {
  const dx = event.clientX - state.markupDrag.startClientX;
  const dy = event.clientY - state.markupDrag.startClientY;
  if (!state.markupDrag.hasMoved && Math.hypot(dx, dy) <= MAP_DRAG_CLICK_SUPPRESSION_PX) {
    return true;
  }

  if (!state.markupDrag.originals) {
    state.markupDrag.originals = selectedMarkupItems().map(cloneMarkupItem);
    state.markupDrag.hasMoved = true;
    elements.map.classList.add("is-markup-moving");
  }

  for (const original of state.markupDrag.originals) {
    const item = state.markupItems.find((markup) => markup.id === original.id);
    if (item) {
      moveMarkupItemFromOriginal(item, original, dx, dy);
    }
  }
  scheduleMarkupRender();
  return true;
}

function updateMarkupResize(event) {
  if (!state.markupDrag) {
    return false;
  }
  event.preventDefault();
  event.stopPropagation();
  if (state.markupDrag.mode === "move") {
    return updateMarkupGroupMove(event);
  }

  const nextBounds = markupResizeBoundsForEvent(event);
  if (!nextBounds || !state.markupDrag.originals?.length || !state.markupDrag.bounds) {
    return true;
  }
  const dragDistance = Math.hypot(
    event.clientX - (state.markupDrag.startClientX ?? event.clientX),
    event.clientY - (state.markupDrag.startClientY ?? event.clientY),
  );
  state.markupDrag.hasMoved = state.markupDrag.hasMoved || dragDistance > MAP_DRAG_CLICK_SUPPRESSION_PX;

  for (const original of state.markupDrag.originals) {
    const item = state.markupItems.find((markup) => markup.id === original.id);
    if (item) {
      resizeMarkupItemFromOriginal(item, original, state.markupDrag.bounds, nextBounds);
    }
  }
  scheduleMarkupRender();
  return true;
}

function finishMarkupResize(event) {
  if (!state.markupDrag) {
    return false;
  }
  if (elements.map.hasPointerCapture(event.pointerId)) {
    elements.map.releasePointerCapture(event.pointerId);
  }
  const markupDrag = state.markupDrag;
  state.markupDrag = null;
  elements.map.classList.remove("is-markup-resizing");
  elements.map.classList.remove("is-markup-moving");

  if (markupDrag.mode === "move" && !markupDrag.hasMoved && markupDrag.toggleOnClick) {
    toggleMarkupSelection(markupDrag.id, false);
  } else if (markupDrag.mode === "move" && markupDrag.hasMoved) {
    markIntelDirty();
  } else if (markupDrag.mode === "resize" && markupDrag.hasMoved) {
    markIntelDirty();
  }
  renderMarkup();
  return true;
}

function handleMarkupPointerDown(event) {
  if (!state.showMarkup || event.button !== 0) {
    return;
  }

  if (state.edit.active) {
    event.preventDefault();
    event.stopPropagation();
    promptEditSaveReset();
    return;
  }

  if (state.markupTool === "eraser") {
    return;
  }

  const handle = event.target.closest?.(".markup-handle");
  if (handle && startMarkupResize(event, handle)) {
    return;
  }

  const item = markupItemFromTarget(event.target);
  if (!item) {
    return;
  }

  if (startMarkupGroupMove(event, item)) {
    return;
  }

  if (state.markupTool === "pan") {
    event.preventDefault();
    event.stopPropagation();
    selectMarkupItem(item.id);
  }
}

function renderScaleBar() {
  const rect = elements.map.getBoundingClientRect();
  const mpp = metersPerPixel(state.center.lat, state.zoom);
  const targetWidthPx = Math.min(150, Math.max(80, rect.width * 0.16));
  const distance = niceDistance(targetWidthPx * mpp);
  const widthPx = distance / mpp;
  const line = elements.scaleBar.querySelector("span");
  const label = elements.scaleBar.querySelector("strong");
  line.style.width = `${widthPx}px`;
  label.textContent = formatMeters(distance);
}

function drawGridToCanvas(ctx, width, height) {
  ctx.fillStyle = "#10120f";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function canDrawImageSource(imageOrSrc) {
  const src = typeof imageOrSrc === "string" ? imageOrSrc : imageOrSrc?.src;
  if (!src) {
    return false;
  }
  const url = new URL(src, window.location.href);
  return (
    url.origin === window.location.origin ||
    url.protocol === "tarps-asset:" ||
    url.protocol === "blob:" ||
    url.protocol === "data:" ||
    (typeof imageOrSrc !== "string" && imageOrSrc.crossOrigin === "anonymous")
  );
}

const canvasImageCache = new Map();

function loadImageForCanvas(src) {
  const cached = canvasImageCache.get(src);
  if (cached) {
    return cached;
  }

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    if (src.startsWith("tarps-asset:")) {
      image.crossOrigin = "anonymous";
    }
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error("Could not load image for export.")), { once: true });
    image.src = src;
  });
  promise.catch(() => canvasImageCache.delete(src));
  canvasImageCache.set(src, promise);
  return promise;
}

function drawTilesToCanvas(ctx) {
  for (const tile of elements.tileLayer.querySelectorAll("img")) {
    if (!tile.complete || !tile.naturalWidth || !tile.naturalHeight || !canDrawImageSource(tile)) {
      continue;
    }
    const transform = new DOMMatrixReadOnly(getComputedStyle(tile).transform);
    ctx.drawImage(tile, transform.m41, transform.m42, TILE_SIZE, TILE_SIZE);
  }
}

function expandedTrianglePoint(point, center, amount) {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0) {
    return point;
  }
  const scale = (distance + amount) / distance;
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
}

function expandedTrianglePoints(a, b, c, amount = 0) {
  if (amount <= 0) {
    return [a, b, c];
  }
  const center = {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
  };
  return [
    expandedTrianglePoint(a, center, amount),
    expandedTrianglePoint(b, center, amount),
    expandedTrianglePoint(c, center, amount),
  ];
}

function drawImageTriangle(ctx, image, sourceA, sourceB, sourceC, destA, destB, destC, overlapPx = 0) {
  const denominator =
    sourceA.x * (sourceB.y - sourceC.y) +
    sourceB.x * (sourceC.y - sourceA.y) +
    sourceC.x * (sourceA.y - sourceB.y);
  if (Math.abs(denominator) < 1e-10) {
    return;
  }

  const a =
    (destA.x * (sourceB.y - sourceC.y) +
      destB.x * (sourceC.y - sourceA.y) +
      destC.x * (sourceA.y - sourceB.y)) /
    denominator;
  const b =
    (destA.y * (sourceB.y - sourceC.y) +
      destB.y * (sourceC.y - sourceA.y) +
      destC.y * (sourceA.y - sourceB.y)) /
    denominator;
  const c =
    (destA.x * (sourceC.x - sourceB.x) +
      destB.x * (sourceA.x - sourceC.x) +
      destC.x * (sourceB.x - sourceA.x)) /
    denominator;
  const d =
    (destA.y * (sourceC.x - sourceB.x) +
      destB.y * (sourceA.x - sourceC.x) +
      destC.y * (sourceB.x - sourceA.x)) /
    denominator;
  const e =
    (destA.x * (sourceB.x * sourceC.y - sourceC.x * sourceB.y) +
      destB.x * (sourceC.x * sourceA.y - sourceA.x * sourceC.y) +
      destC.x * (sourceA.x * sourceB.y - sourceB.x * sourceA.y)) /
    denominator;
  const f =
    (destA.y * (sourceB.x * sourceC.y - sourceC.x * sourceB.y) +
      destB.y * (sourceC.x * sourceA.y - sourceA.x * sourceC.y) +
      destC.y * (sourceA.x * sourceB.y - sourceB.x * sourceA.y)) /
    denominator;

  const [clipA, clipB, clipC] = expandedTrianglePoints(destA, destB, destC, overlapPx);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(clipA.x, clipA.y);
  ctx.lineTo(clipB.x, clipB.y);
  ctx.lineTo(clipC.x, clipC.y);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(a, b, c, d, e, f);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

function createCanvasSurface(width, height) {
  if (typeof OffscreenCanvas === "function") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasExtentForPoints(points, canvas) {
  const bounds = boundsForScreenPoints(points);
  const padding = Math.ceil(PROJECTED_IMAGE_TRIANGLE_OVERLAP_PX + 2);
  const minX = clamp(Math.floor(bounds.minX - padding), 0, canvas.width);
  const minY = clamp(Math.floor(bounds.minY - padding), 0, canvas.height);
  const maxX = clamp(Math.ceil(bounds.maxX + padding), 0, canvas.width);
  const maxY = clamp(Math.ceil(bounds.maxY + padding), 0, canvas.height);
  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}

function drawProjectedImageMeshToCanvas(ctx, image, points, sourceSize) {
  const homography = homographyForQuad(points, sourceSize.width, sourceSize.height);
  if (!homography) {
    return;
  }

  const area = Math.abs(
    points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2,
  );
  const baseSegments = clamp(Math.ceil(Math.sqrt(area) / 90), 8, 32);
  const aspect = Math.max(0.25, Math.min(4, sourceSize.width / sourceSize.height));
  const columns = Math.round(clamp(baseSegments * Math.sqrt(aspect), 4, 40));
  const rows = Math.round(clamp(baseSegments / Math.sqrt(aspect), 4, 40));
  const grid = [];

  for (let row = 0; row <= rows; row += 1) {
    const sourceY = (sourceSize.height * row) / rows;
    const gridRow = [];
    for (let column = 0; column <= columns; column += 1) {
      const sourceX = (sourceSize.width * column) / columns;
      gridRow.push(projectHomography(homography, sourceX, sourceY));
    }
    grid.push(gridRow);
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const sourceTopLeft = {
        x: (sourceSize.width * column) / columns,
        y: (sourceSize.height * row) / rows,
      };
      const sourceTopRight = {
        x: (sourceSize.width * (column + 1)) / columns,
        y: sourceTopLeft.y,
      };
      const sourceBottomRight = {
        x: sourceTopRight.x,
        y: (sourceSize.height * (row + 1)) / rows,
      };
      const sourceBottomLeft = {
        x: sourceTopLeft.x,
        y: sourceBottomRight.y,
      };
      const destTopLeft = grid[row][column];
      const destTopRight = grid[row][column + 1];
      const destBottomRight = grid[row + 1][column + 1];
      const destBottomLeft = grid[row + 1][column];
      if (!destTopLeft || !destTopRight || !destBottomRight || !destBottomLeft) {
        continue;
      }
      drawImageTriangle(
        ctx,
        image,
        sourceTopLeft,
        sourceTopRight,
        sourceBottomRight,
        destTopLeft,
        destTopRight,
        destBottomRight,
        PROJECTED_IMAGE_TRIANGLE_OVERLAP_PX,
      );
      drawImageTriangle(
        ctx,
        image,
        sourceTopLeft,
        sourceBottomRight,
        sourceBottomLeft,
        destTopLeft,
        destBottomRight,
        destBottomLeft,
        PROJECTED_IMAGE_TRIANGLE_OVERLAP_PX,
      );
    }
  }
  ctx.restore();
}

function drawProjectedImageToCanvas(ctx, image, points, sourceSize, opacity = 1) {
  const alpha = clamp(Number(opacity), 0, 1);
  if (alpha <= 0) {
    return;
  }

  if (alpha >= 0.999) {
    drawProjectedImageMeshToCanvas(ctx, image, points, sourceSize);
    return;
  }

  const extent = canvasExtentForPoints(points, ctx.canvas);
  if (!extent.width || !extent.height) {
    return;
  }

  const imageLayer = createCanvasSurface(extent.width, extent.height);
  const imageLayerCtx = imageLayer.getContext("2d");
  const layerPoints = points.map((point) => ({
    x: point.x - extent.x,
    y: point.y - extent.y,
  }));
  drawProjectedImageMeshToCanvas(imageLayerCtx, image, layerPoints, sourceSize);

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(imageLayer, extent.x, extent.y);
  ctx.restore();
}

function drawMarkersToCanvas(ctx) {
  if (!state.showTracks) {
    return;
  }
  const viewport = mapViewportBounds(MARKER_CULL_MARGIN_PX);
  for (const capture of visibleCaptures()) {
    const position = capturePosition(capture);
    const point = screenPointFor(position.lat, position.lng);
    if (!screenPointInBounds(point, viewport)) {
      continue;
    }
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(degreesToRadians(capture.headingDeg));
    ctx.fillStyle = capture.setColor;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(7, 11);
    ctx.lineTo(0, 5);
    ctx.lineTo(-7, 11);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawMarkupToCanvas(ctx) {
  if (!state.showMarkup) {
    return;
  }
  for (const item of state.markupItems) {
    ctx.save();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = item.thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (item.type === "pencil") {
      const points = item.points.map((point) => screenPointFor(point.lat, point.lng));
      if (points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (const point of points.slice(1)) {
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }
    } else {
      const start = screenPointFor(item.start.lat, item.start.lng);
      const end = screenPointFor(item.end.lat, item.end.lng);
      const minX = Math.min(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      if (item.type === "line") {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (item.type === "square") {
        ctx.strokeRect(minX, minY, width, height);
      } else if (item.type === "circle") {
        ctx.beginPath();
        ctx.ellipse(minX + width / 2, minY + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(minX, minY);
        ctx.lineTo(minX + width, minY + height);
        ctx.moveTo(minX + width, minY);
        ctx.lineTo(minX, minY + height);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not create PNG export."));
        }
      }, "image/png");
    } catch (error) {
      reject(error);
    }
  });
}

function blobToArrayBuffer(blob) {
  return blob.arrayBuffer();
}

async function exportCurrentView() {
  await measurePerformanceAsync("exportCurrentView", async () => {
    if (!window.electronTarps?.savePngAs) {
      throw new Error("TARPS desktop bridge is unavailable.");
    }
    const rect = elements.map.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));
    const ctx = canvas.getContext("2d");
    drawGridToCanvas(ctx, canvas.width, canvas.height);
    drawTilesToCanvas(ctx);

    const viewport = mapViewportBounds(0);
    const overlayItems = orderedCapturesForLayers()
      .map((capture) => {
        if (!state.showImages && !(state.showFootprints && capture.id === state.selectedId)) {
          return null;
        }
        const projection = imageGroundProjection(capture);
        if (projection.type === "location-only" || projection.corners.length !== 4) {
          return null;
        }
        const points = projection.corners.map((corner) => screenPointFor(corner.lat, corner.lng));
        if (!screenBoundsIntersect(boundsForScreenPoints(points), viewport)) {
          return null;
        }
        return { capture, points };
      })
      .filter(Boolean);

    const loadedItems = await measurePerformanceAsync(
      "export.loadImages",
      async () =>
        Promise.all(
          overlayItems.map(async (item) => ({
            ...item,
            image: state.showImages ? await loadImageForCanvas(item.capture.url).catch(() => null) : null,
          })),
        ),
      overlayItems.length,
    );

    const imageLayer = document.createElement("canvas");
    imageLayer.width = canvas.width;
    imageLayer.height = canvas.height;
    const imageLayerCtx = imageLayer.getContext("2d");
    for (const item of loadedItems) {
      if (state.showImages && item.image?.complete && item.image.naturalWidth && item.image.naturalHeight && canDrawImageSource(item.image)) {
        drawProjectedImageToCanvas(imageLayerCtx, item.image, item.points, {
          width: item.image.naturalWidth,
          height: item.image.naturalHeight,
        }, state.imageOpacity);
      }
    }

    if (state.showImages) {
      ctx.drawImage(imageLayer, 0, 0);
    }

    for (const item of loadedItems) {
      if (item.capture.id === state.selectedId) {
        ctx.save();
        ctx.strokeStyle = item.capture.setColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(item.points[0].x, item.points[0].y);
        for (const point of item.points.slice(1)) {
          ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }

    drawMarkersToCanvas(ctx);
    drawMarkupToCanvas(ctx);
    const blob = await canvasToPngBlob(canvas);
    const suggestedName = `tarps-map-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    await window.electronTarps.savePngAs(suggestedName, await blobToArrayBuffer(blob));
    setIntelStatus("Map view exported as PNG.");
  }, visibleCaptures().length);
}

function renderTimelineLayers() {
  measurePerformance("renderTimelineLayers", () => {
    ensureSelectedCaptureVisible();
    updateTimelineControls();
    renderList();
    renderSelectedDetails();
    renderTracks();
    renderOverlays();
    renderMarkers();
    renderMarkup();
    renderImageViewer();
    renderEditToolbar();
  }, visibleCaptures().length);
}

function renderAll() {
  measurePerformance("renderAll", () => {
    ensureSelectedCaptureVisible();
    updateTimelineControls();
    renderTiles();
    renderGrid();
    renderTracks();
    renderOverlays();
    renderMarkers();
    renderMarkup();
    renderImageViewer();
    renderEditToolbar();
    renderScaleBar();
  }, visibleCaptures().length);
}

function scheduleRenderAll() {
  if (state.renderAllFrameId !== null) {
    return;
  }
  state.renderAllFrameId = requestAnimationFrame(() => {
    state.renderAllFrameId = null;
    renderAll();
  });
}

function scheduleTimelineRender() {
  if (state.renderTimelineFrameId !== null) {
    return;
  }
  state.renderTimelineFrameId = requestAnimationFrame(() => {
    state.renderTimelineFrameId = null;
    renderTimelineLayers();
  });
}

function scheduleMarkupRender() {
  if (state.renderMarkupFrameId !== null) {
    return;
  }
  state.renderMarkupFrameId = requestAnimationFrame(() => {
    state.renderMarkupFrameId = null;
    renderMarkup();
  });
}

function scheduleEditedLayersRender() {
  if (state.renderEditedFrameId !== null) {
    return;
  }
  state.renderEditedFrameId = requestAnimationFrame(() => {
    state.renderEditedFrameId = null;
    renderEditedLayers();
  });
}

function scheduleListRender() {
  if (state.renderListFrameId !== null) {
    return;
  }
  state.renderListFrameId = requestAnimationFrame(() => {
    state.renderListFrameId = null;
    renderList();
  });
}

function setZoom(nextZoom, anchorClientX, anchorClientY) {
  const zoom = clamp(nextZoom, state.minZoom, state.maxZoom);
  if (zoom === state.zoom) {
    return;
  }

  if (Number.isFinite(anchorClientX) && Number.isFinite(anchorClientY)) {
    const rect = elements.map.getBoundingClientRect();
    const anchorLatLng = screenToLatLng(anchorClientX, anchorClientY);
    state.zoom = zoom;
    const anchorPoint = project(anchorLatLng.lat, anchorLatLng.lng, state.zoom);
    const centerPoint = {
      x: anchorPoint.x - (anchorClientX - rect.left - rect.width / 2),
      y: anchorPoint.y - (anchorClientY - rect.top - rect.height / 2),
    };
    state.center = normalizeLatLng(unproject(centerPoint.x, centerPoint.y, state.zoom), state.center);
  } else {
    state.zoom = zoom;
  }
  scheduleRenderAll();
}

function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  elements.appShell.classList.toggle("is-sidebar-collapsed", state.sidebarCollapsed);
  elements.sidebarToggleButton.title = state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
  elements.sidebarToggleButton.setAttribute(
    "aria-label",
    state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar",
  );
  setIcon(elements.sidebarToggleButton.querySelector(".ui-icon"), state.sidebarCollapsed ? "panel-left-open" : "panel-left-close");
  scheduleRenderAll();
}

function updateWindowControlState(windowState = {}) {
  const isMaximized = Boolean(windowState.isMaximized || windowState.isFullScreen);
  elements.windowMaximizeButton.classList.toggle("is-maximized", isMaximized);
  elements.windowMaximizeButton.title = isMaximized ? "Restore" : "Maximize";
  elements.windowMaximizeButton.setAttribute("aria-label", isMaximized ? "Restore" : "Maximize");
  setIcon(elements.windowMaximizeButton.querySelector(".window-control-icon"), isMaximized ? "copy" : "maximize");
}

function bindWindowControls() {
  const controls = window.electronTarps;
  const canControlWindow =
    Boolean(controls?.minimizeWindow) &&
    Boolean(controls?.toggleMaximizeWindow) &&
    Boolean(controls?.closeWindow);
  document.body.classList.toggle("has-window-controls", canControlWindow);
  for (const button of [elements.windowMinimizeButton, elements.windowMaximizeButton, elements.windowCloseButton]) {
    button.disabled = !canControlWindow;
  }
  if (!canControlWindow) {
    return;
  }

  elements.windowMinimizeButton.addEventListener("click", () => {
    controls.minimizeWindow().catch(console.error);
  });
  elements.windowMaximizeButton.addEventListener("click", () => {
    controls.toggleMaximizeWindow().then(updateWindowControlState).catch(console.error);
  });
  elements.windowCloseButton.addEventListener("click", () => {
    controls.closeWindow().catch(console.error);
  });
  controls.getWindowState?.().then(updateWindowControlState).catch(() => {});
  controls.onWindowStateChange?.(updateWindowControlState);
}

function closeFileMenu() {
  if (!elements.fileMenu || !elements.fileMenuButton) {
    return;
  }
  elements.fileMenu.hidden = true;
  elements.fileMenuButton.setAttribute("aria-expanded", "false");
}

function toggleFileMenu() {
  if (!elements.fileMenu || !elements.fileMenuButton) {
    return;
  }
  const shouldOpen = elements.fileMenu.hidden;
  elements.fileMenu.hidden = !shouldOpen;
  elements.fileMenuButton.setAttribute("aria-expanded", String(shouldOpen));
}

function bindFileMenu() {
  if (!elements.fileMenu || !elements.fileMenuButton) {
    return;
  }
  elements.fileMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFileMenu();
  });
  elements.fileMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  document.addEventListener("click", closeFileMenu);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeFileMenu();
    }
  });
}

bindWindowControls();
bindFileMenu();

elements.sidebarToggleButton.addEventListener("click", toggleSidebar);

elements.newIntelButton.addEventListener("click", () => {
  closeFileMenu();
  createNewIntelFile().catch((error) => {
    if (error?.name === "AbortError") {
      return;
    }
    console.error(error);
    setIntelStatus(error.message, true);
  });
});

elements.loadIntelButton.addEventListener("click", () => {
  closeFileMenu();
  loadIntelFromPicker().catch((error) => {
    if (error?.name === "AbortError") {
      return;
    }
    console.error(error);
    setIntelStatus(error.message, true);
  });
});

elements.saveIntelButton?.addEventListener("click", () => {
  saveIntelFile().catch((error) => {
    console.error(error);
    setIntelStatus(error.message, true);
  });
});

elements.exportImageButton.addEventListener("click", () => {
  exportCurrentView().catch((error) => {
    if (error?.name === "AbortError") {
      return;
    }
    console.error(error);
    setIntelStatus(error.message, true);
  });
});

elements.dialogNewIntelButton.addEventListener("click", () => {
  createNewIntelFile().then((didCreate) => {
    if (didCreate) {
      elements.intelDialog.close();
    }
  }).catch((error) => {
    if (error?.name !== "AbortError") {
      console.error(error);
      setIntelStatus(error.message, true);
    }
  });
});

elements.dialogLoadIntelButton.addEventListener("click", () => {
  loadIntelFromPicker().then((didLoad) => {
    if (didLoad) {
      elements.intelDialog.close();
    }
  }).catch((error) => {
    if (error?.name !== "AbortError") {
      console.error(error);
      setIntelStatus(error.message, true);
    }
  });
});

elements.intelDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
});

elements.resetApplyButton.addEventListener("click", () => {
  resetEditDraft({
    location: elements.resetLocationInput.checked,
    size: elements.resetSizeInput.checked,
    rotation: elements.resetRotationInput.checked,
    warp: elements.resetWarpInput.checked,
  });
  elements.resetEditDialog.close();
});

elements.resetCancelButton.addEventListener("click", () => {
  elements.resetEditDialog.close();
});

elements.deleteCaptureConfirmButton.addEventListener("click", () => {
  elements.deleteCaptureDialog.close();
  removePendingDeleteCapture().catch((error) => {
    console.error(error);
    setStatus(error.message, true);
  });
});

elements.deleteCaptureCancelButton.addEventListener("click", () => {
  state.pendingDeleteCaptureId = null;
  elements.deleteCaptureDialog.close();
});

elements.addFolderButton.addEventListener("click", async () => {
  try {
    setStatus("Choose a TARPS folder. Images will be copied into the intel archive.");
    await addElectronDirectorySet();
  } catch (error) {
    if (error?.name === "AbortError") {
      hideImportProgress();
      return;
    }
    hideImportProgress();
    console.error(error);
    setStatus(error.message, true);
  }
});

elements.clearSetsButton.addEventListener("click", clearSets);

elements.imageList.addEventListener("scroll", scheduleListRender, { passive: true });

elements.opacityInput.addEventListener("input", () => {
  state.imageOpacity = Number(elements.opacityInput.value);
  renderOverlays();
});

elements.mapSourceInput.addEventListener("change", () => {
  state.mapSource = elements.mapSourceInput.value;
  renderAll();
});

for (const input of [elements.imagesInput, elements.tracksInput]) {
  input.addEventListener("change", () => {
    state.showImages = elements.imagesInput.checked;
    state.showTracks = elements.tracksInput.checked;
    renderAll();
  });
}

elements.markupInput.addEventListener("change", () => {
  state.showMarkup = elements.markupInput.checked;
  if (!state.showMarkup) {
    selectMarkupItem(null, false);
    state.markupSelectionBox = null;
    elements.map.classList.remove("is-multi-selecting");
  }
  renderMarkup();
});

elements.drawSelectButton.addEventListener("click", () => setMarkupTool("pan"));
elements.drawMultiSelectButton.addEventListener("click", () => setMarkupTool("multi"));
elements.drawPencilButton.addEventListener("click", () => setMarkupTool("pencil"));
elements.drawLineButton.addEventListener("click", () => setMarkupTool("line"));
elements.drawSquareButton.addEventListener("click", () => setMarkupTool("square"));
elements.drawCircleButton.addEventListener("click", () => setMarkupTool("circle"));
elements.drawXButton.addEventListener("click", () => setMarkupTool("x"));
elements.drawEraserButton.addEventListener("click", () => setMarkupTool("eraser"));

elements.deleteMarkupButton.addEventListener("click", deleteSelectedMarkupItem);

elements.markupLayer.addEventListener("pointerdown", handleMarkupPointerDown);

elements.markupColorInput.addEventListener("input", () => {
  const nextColor = elements.markupColorInput.value;
  state.markupColor = nextColor;
  const selectedItems = selectedMarkupItems();
  if (selectedItems.length) {
    for (const item of selectedItems) {
      item.color = nextColor;
    }
    markIntelDirty();
    renderMarkup();
  }
});

elements.markupThicknessInput.addEventListener("input", () => {
  const nextThickness = Number(elements.markupThicknessInput.value);
  state.markupThickness = nextThickness;
  const selectedItems = selectedMarkupItems();
  if (selectedItems.length) {
    for (const item of selectedItems) {
      item.thickness = nextThickness;
    }
    markIntelDirty();
    renderMarkup();
  }
});

elements.timelineInput.addEventListener("input", () => {
  const nextTime = Number(elements.timelineInput.value);
  stopPlayback();
  setTimelineTime(nextTime, false);
  scheduleTimelineRender();
});

elements.timelineStartInput.addEventListener("input", () => {
  const nextTime = Number(elements.timelineStartInput.value);
  stopPlayback();
  setTimelineWindowStart(nextTime, false);
  scheduleTimelineRender();
});

elements.playButton.addEventListener("click", togglePlayback);

elements.speedInput.addEventListener("change", () => {
  state.playbackSpeed = Number(elements.speedInput.value);
});

elements.viewerImage.addEventListener("load", () => {
  const capture = state.viewerCaptureId ? visibleCaptureById(state.viewerCaptureId) : null;
  if (capture && updateCaptureImageSize(capture, elements.viewerImage.naturalWidth, elements.viewerImage.naturalHeight)) {
    renderOverlays();
  }
  applyViewerZoom();
});

elements.viewerZoomInput.addEventListener("input", () => {
  state.viewerZoom = Number(elements.viewerZoomInput.value);
  applyViewerZoom();
});

elements.viewerCloseButton.addEventListener("click", toggleImageViewerMinimized);

for (const eventName of ["pointerdown", "pointermove", "pointerup", "click", "dblclick", "contextmenu", "auxclick", "wheel"]) {
  elements.editToolbar.addEventListener(eventName, (event) => {
    event.stopPropagation();
  });
}

for (const eventName of ["pointerdown", "pointermove", "pointerup", "click", "dblclick", "contextmenu", "auxclick"]) {
  elements.imageViewer.addEventListener(eventName, (event) => {
    event.stopPropagation();
  });
}

elements.imageViewer.addEventListener(
  "wheel",
  (event) => {
    event.stopPropagation();
    if (event.target.closest?.(".image-viewer-frame")) {
      event.preventDefault();
      const zoomFactor = 2 ** (-event.deltaY / 600);
      setViewerZoom(state.viewerZoom * zoomFactor, event.clientX, event.clientY);
    }
  },
  { passive: false },
);

elements.viewerFrame.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  elements.viewerFrame.setPointerCapture(event.pointerId);
  state.isViewerPanning = true;
  state.viewerPointerStart = {
    x: event.clientX,
    y: event.clientY,
    panX: state.viewerPanX,
    panY: state.viewerPanY,
  };
  elements.viewerFrame.classList.add("is-panning");
});

elements.viewerFrame.addEventListener("pointermove", (event) => {
  if (!state.isViewerPanning || !state.viewerPointerStart) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  state.viewerPanX = state.viewerPointerStart.panX + event.clientX - state.viewerPointerStart.x;
  state.viewerPanY = state.viewerPointerStart.panY + event.clientY - state.viewerPointerStart.y;
  updateViewerTransform();
});

function endViewerPan(event) {
  if (state.isViewerPanning && elements.viewerFrame.hasPointerCapture(event.pointerId)) {
    elements.viewerFrame.releasePointerCapture(event.pointerId);
  }
  state.isViewerPanning = false;
  state.viewerPointerStart = null;
  elements.viewerFrame.classList.remove("is-panning");
}

elements.viewerFrame.addEventListener("pointerup", endViewerPan);
elements.viewerFrame.addEventListener("pointercancel", endViewerPan);

elements.fitButton.addEventListener("click", () => {
  fitCaptures();
  renderAll();
});

for (const controlSurface of [elements.mapControls, elements.mapTimeline].filter(Boolean)) {
  for (const eventName of ["pointerdown", "pointermove", "pointerup", "click", "dblclick", "contextmenu", "auxclick", "wheel"]) {
    controlSurface.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  }
}

elements.zoomInButton.addEventListener("click", () => setZoom(state.zoom + 1));
elements.zoomOutButton.addEventListener("click", () => setZoom(state.zoom - 1));

elements.map.addEventListener("wheel", (event) => {
  event.preventDefault();
  if (
    (event.buttons ?? 0) !== 0 ||
    state.isDragging ||
    state.pointerStart ||
    state.isTimelineScrubbing ||
    state.edit.drag ||
    state.markupDrag ||
    state.markupSelectionBox ||
    state.activeMarkup
  ) {
    return;
  }
  setZoom(state.zoom + (event.deltaY < 0 ? 1 : -1), event.clientX, event.clientY);
});

function startTimelineScrub(event) {
  if (!state.captures.length || state.timelineMax <= state.timelineMin) {
    return;
  }

  event.preventDefault();
  stopPlayback();
  try {
    elements.map.setPointerCapture(event.pointerId);
  } catch {
    // Synthetic callers used in tests may not have an active DOM pointer.
  }
  state.isTimelineScrubbing = true;
  state.timelineScrubStartX = event.clientX;
  state.timelineScrubStartTime = state.currentTime;
  elements.map.classList.add("is-time-scrubbing");
}

function scrubTimeline(event) {
  const rect = elements.map.getBoundingClientRect();
  const durationSeconds = Math.max(1, state.timelineMax - state.timelineMin);
  const secondsPerPixel = durationSeconds / Math.max(1, rect.width);
  const deltaX = event.clientX - state.timelineScrubStartX;
  setTimelineTime(state.timelineScrubStartTime + deltaX * secondsPerPixel, false);
  scheduleTimelineRender();
}

elements.map.addEventListener("pointerdown", (event) => {
  if (startMarkupDrawing(event)) {
    return;
  }

  if (startMarkupMultiSelect(event)) {
    return;
  }

  if (
    ["pan", "multi"].includes(state.markupTool) &&
    state.selectedMarkupIds.size &&
    !event.target.closest?.(".markup-item, .markup-handle")
  ) {
    selectMarkupItem(null);
  }

  if (event.button === 1) {
    startTimelineScrub(event);
    return;
  }

  if (event.button !== 0) {
    return;
  }
  const overlay = event.target.closest?.(".overlay-item");
  const hitCaptureId = overlay?.dataset.captureId ?? captureAtScreenPoint(event.clientX, event.clientY)?.id ?? null;
  state.pendingEditClickOff =
    state.edit.active && !hitCaptureId
      ? { x: event.clientX, y: event.clientY }
      : null;
  state.pendingPhotoDeselectClick =
    !state.edit.active && state.selectedId && !hitCaptureId
      ? { x: event.clientX, y: event.clientY }
      : null;
  state.pendingOverlayClick = hitCaptureId
    ? { captureId: hitCaptureId, x: event.clientX, y: event.clientY }
    : null;
  elements.map.setPointerCapture(event.pointerId);
  state.isDragging = true;
  state.suppressNextOverlayClick = false;
  state.pointerStart = {
    x: event.clientX,
    y: event.clientY,
    centerPoint: project(state.center.lat, state.center.lng, state.zoom),
  };
});

elements.map.addEventListener("pointermove", (event) => {
  updateEraserHover(event);

  if (updateMarkupResize(event)) {
    return;
  }

  if (updateMarkupEraser(event)) {
    return;
  }

  if (updateMarkupDrawing(event)) {
    return;
  }

  if (updateMarkupMultiSelect(event)) {
    return;
  }

  if (updateEditDrag(event)) {
    return;
  }

  if (state.isTimelineScrubbing) {
    scrubTimeline(event);
    return;
  }

  if (!state.isDragging || !state.pointerStart) {
    return;
  }
  const dx = event.clientX - state.pointerStart.x;
  const dy = event.clientY - state.pointerStart.y;
  if (Math.hypot(dx, dy) > MAP_DRAG_CLICK_SUPPRESSION_PX) {
    state.suppressNextOverlayClick = true;
    state.pendingOverlayClick = null;
    state.pendingPhotoDeselectClick = null;
    state.pendingEditClickOff = null;
  }
  state.center = normalizeLatLng(unproject(
    state.pointerStart.centerPoint.x - dx,
    state.pointerStart.centerPoint.y - dy,
    state.zoom,
  ), state.center);
  scheduleRenderAll();
});

function endDrag(event) {
  if (finishMarkupResize(event)) {
    return;
  }

  if (finishMarkupEraser(event)) {
    return;
  }

  if (finishMarkupDrawing(event)) {
    return;
  }

  if (finishMarkupMultiSelect(event)) {
    return;
  }

  if (endEditDrag(event)) {
    return;
  }

  if ((state.isDragging || state.isTimelineScrubbing) && elements.map.hasPointerCapture(event.pointerId)) {
    elements.map.releasePointerCapture(event.pointerId);
  }
  const pendingOverlayClick = state.pendingOverlayClick;
  const pendingPhotoDeselectClick = state.pendingPhotoDeselectClick;
  const pendingEditClickOff = state.pendingEditClickOff;
  const shouldSelectPendingOverlay =
    state.isDragging &&
    pendingOverlayClick &&
    !state.suppressNextOverlayClick &&
    Math.hypot(event.clientX - pendingOverlayClick.x, event.clientY - pendingOverlayClick.y) <= MAP_DRAG_CLICK_SUPPRESSION_PX;
  const shouldDeselectSelectedPhoto =
    state.isDragging &&
    pendingPhotoDeselectClick &&
    !state.suppressNextOverlayClick &&
    Math.hypot(event.clientX - pendingPhotoDeselectClick.x, event.clientY - pendingPhotoDeselectClick.y) <= MAP_DRAG_CLICK_SUPPRESSION_PX;
  const shouldPromptEditClickOff =
    state.isDragging &&
    pendingEditClickOff &&
    !state.suppressNextOverlayClick &&
    Math.hypot(event.clientX - pendingEditClickOff.x, event.clientY - pendingEditClickOff.y) <= MAP_DRAG_CLICK_SUPPRESSION_PX;
  state.isDragging = false;
  state.pointerStart = null;
  state.pendingOverlayClick = null;
  state.pendingPhotoDeselectClick = null;
  state.pendingEditClickOff = null;
  state.isTimelineScrubbing = false;
  elements.map.classList.remove("is-time-scrubbing");
  if (shouldSelectPendingOverlay) {
    const capture = visibleCaptureById(pendingOverlayClick.captureId);
    selectOverlayCapture(capture);
    event.preventDefault();
  } else if (shouldPromptEditClickOff) {
    event.preventDefault();
    promptEditSaveReset();
  } else if (shouldDeselectSelectedPhoto) {
    event.preventDefault();
    deselectCapture();
  }
}

elements.map.addEventListener("pointerup", endDrag);
elements.map.addEventListener("pointercancel", endDrag);
elements.map.addEventListener("pointerleave", () => {
  if (!state.markupEraser) {
    setEraserCursor(null);
  }
});

elements.map.addEventListener("auxclick", (event) => {
  if (event.button === 1) {
    event.preventDefault();
  }
});

function isTextEntryTarget(target) {
  return Boolean(
    target?.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName),
  );
}

window.addEventListener("keydown", (event) => {
  if (!["Delete", "Backspace"].includes(event.key) || !state.selectedMarkupIds.size || isTextEntryTarget(event.target)) {
    return;
  }
  event.preventDefault();
  deleteSelectedMarkupItem();
});

elements.map.addEventListener("keydown", (event) => {
  const centerPoint = project(state.center.lat, state.center.lng, state.zoom);
  const panStep = 80;
  if (event.key === "+" || event.key === "=") {
    setZoom(state.zoom + 1);
    return;
  }
  if (event.key === "-" || event.key === "_") {
    setZoom(state.zoom - 1);
    return;
  }

  const deltas = {
    ArrowUp: [0, -panStep],
    ArrowDown: [0, panStep],
    ArrowLeft: [-panStep, 0],
    ArrowRight: [panStep, 0],
  };
  const delta = deltas[event.key];
  if (delta) {
    event.preventDefault();
    state.center = normalizeLatLng(unproject(centerPoint.x + delta[0], centerPoint.y + delta[1], state.zoom), state.center);
    renderAll();
  }
});

window.addEventListener("resize", renderAll);

renderSetList();
renderIntelStatus();
setMarkupTool("pan");
setStatus(
  window.electronTarps
    ? "Create or load an intel archive, then import a TARPS folder."
    : "This build must be run with the TARPS desktop app.",
  !window.electronTarps,
);
renderAll();

if (elements.intelDialog?.showModal) {
  elements.intelDialog.showModal();
}
