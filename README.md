# TARPS Recon Map

Desktop app for displaying TARPS recon captures over an interactive Web Mercator map.

![TARPS Intel Map screenshot](screenshot.png)

## Run The Desktop App

Install the desktop dependencies once:

```powershell
npm install
```

Launch the app:

```powershell
npm start
```

Build a portable Windows executable:

```powershell
npm run pack:win
```

The Electron build uses native Windows file/save dialogs. New and Load work with single `.tarpsintel.zip` archives, imported TARPS folders are copied into the archive, autosave updates `manifest.json` inside the archive, and Export image uses a native PNG save dialog.

## Intel Archives

Use Import TARPS folder to copy one or more TARPS image folders into the active intel archive. Each imported folder becomes a separate run with editable name, colour, and visibility. Intel archives use the `.tarpsintel.zip` double extension, are written with ZIP store entries only, and can be browsed directly in Windows Explorer as normal ZIP files. Copied source images live in `images/`, `manifest.json` stores the session state, and the app creates small, medium, and large `overlays/` previews for fast canvas map rendering while keeping the originals for preview and export.

## Basemap Notes

The app has a basemap selector with a local coordinate grid and OpenStreetMap tiles. The coordinate grid is the default and remains available when map tiles cannot be loaded.

For public or heavy use, use a proper tile provider or local tile service rather than relying on `tile.openstreetmap.org`.

If DCS World is installed locally, use the DCS install folder control in Layers to point TARPS at the DCS World root folder. TARPS scans `Mods/terrains` and adds installed DCS theatres with readable height data to the separate DCS height map selector. DCS terrain files are opened read-only. DCS raster charts and vector map files are detected for future investigation, but they are not currently shown as basemaps.

## Filename Metadata

The parser currently expects filenames shaped like:

```text
TARPS KS-87D 07-16-22L 01-02-2005 N25-14-13 E055-24-12 ALT+08780 DRIFT+00 HDG301 PITCH+01 ROLL+01.png
```

Latitude/longitude are parsed from DMS, altitude is treated as feet, and heading/pitch/roll are treated as degrees. Drift is parsed from the filename for reference, but is ignored for map projection and image orientation.

## Scale Assumptions

The scale uses a fixed 150 mm KS-87 focal length and a 100 mm square frame side.

Pitch and roll are projected with a pinhole camera model for attitudes up to 45 degrees in either axis. The photo corners are intersected with the ground plane and rendered as a projective warp, so farther parts of an oblique frame cover larger ground distances. Captures beyond 45 degrees pitch or roll are still shown, but as unwarped rectangular images at the aircraft position with no pitch or roll projection applied.

Pitch and roll projection and image warping are always enabled for captures within the 45 degree attitude limit. Image orientation follows heading only; drift is not applied.

The Ground elevation field is the fallback terrain height. If a selected DCS terrain exposes a plain `tarps-elevation.json` / `tarps-dem.json` style grid with latitude/longitude bounds and row-major elevation values, TARPS samples that grid for terrain-aware ray intersections instead of using one flat elevation. Stock DCS terrains also expose `extra/lightmap/lightmap_depthMax.png` with `extra/lightmap/lightmap.lua` metadata; TARPS samples that read-only alpha-channel height image as a coarse DCS terrain source when an exact grid is unavailable. This lightmap appears to be a max-height raster at roughly 512 m cells, so it is useful for hill-aware projection but less precise than the underlying DCS surface mesh. TARPS fits the DCS local terrain grid to latitude/longitude with a curved beacon-derived polynomial georeference, with lower-order fallback for small fixture terrains, so broad theatres are not forced through a single flat affine transform. The Layers panel can choose a DCS height map independently from the basemap and can toggle DCS heights on or off for image projection; when disabled, projections use the manual Ground elevation field. A separate DCS height map visibility toggle colorizes and warps the lightmap over OpenStreetMap or the coordinate grid for alignment checks and includes it in PNG exports. Stock DCS `Surface/*.surface5`, `.tile`, `.ng5`, and `.sup4` surface files are detected from disk, but the app currently treats them as read-only candidate mesh sources until a safe on-disk height decoder can produce sampled elevations.

## Layer Navigation

Left-clicking a photo selects it, brings it to the top of the overlay stack, and opens the native, unwarped image preview. The preview uses wheel-to-zoom and left-drag-to-pan controls independent of the map, and can be minimized to a compact bottom-right widget before expanding it again. Right-clicking a visible photo sends that capture behind the other photo overlays, which makes it possible to peel through dense stacks without changing the loaded capture order.

The Photos toggle controls image overlays, while Flight path controls the colored aircraft position icons. Each icon points in the capture heading direction and can be clicked to select the corresponding image.

Markup can be toggled independently. The markup tools support pencil, square, circle, and X shapes with selectable colour and line thickness.

## Image Edits

Selecting a photo shows a small edit toolbar next to it on the map. The pencil button opens edit mode. Move mode lets the selected image be dragged into place and resized with the Size slider. Warp mode lets one side of the image be selected and lengthened or shortened with the side-length slider. Save commits the draft into the active intel session; Cancel discards the draft.

## Intel And Export

On launch, the app prompts to create or load an intel archive. Creating a new archive asks for a `.tarpsintel.zip` archive location first, then keeps `manifest.json` updated automatically inside the archive as work changes. Importing a TARPS folder copies each readable image into the archive's `images/` directory and shows progress while copying. Use Export image to save the current map viewport as a PNG at the current on-screen map resolution.

## Timeline

The timeline opens across the full loaded time range. The front slider handle sets the window end time, while the rear handle sets the start time. Moving the front handle preserves the current window width, and playback advances the end time until it reaches the end, then loops back to the start. Holding the middle mouse button over the map and dragging left or right scrubs backward or forward through the loaded time range.
