# Straight Rows map

A map of what the detector found. The three tractors drive their recorded paths across the field. Each leaves a trail that fades over 20 minutes and is colored by the cause detected at that moment. Selecting a detection shows its action, its confidence, and the one chart that gave the cause away.

The app is a viewer. It reads JSON that a script exports from the detector's output, and nothing in `straightrows/` depends on it.

## Run it

From the repository root, with the Python environment set up and the dataset downloaded (see the main README):

```bash
python app/tools/export_data.py     # writes app/public/data/ from the detector's output
cd app
npm install
npm run dev                         # then open http://localhost:5173
```

`npm run build` type-checks and writes a static bundle to `app/dist/`.

The app needs no internet once it is installed. The world outline the map draws is already in `app/public/basemap/`. To download it again, run `python app/tools/fetch_basemap.py`.

## Using it

- The rail on the left opens one panel at a time: Detections, Why (the dev score and the design decisions), and Limits.
- The bar along the bottom holds the day buttons, play and pause, the playback speed, and the day's timeline. Click or drag the timeline to move the clock. Click a block to open that detection.
- A detection opens on the right. Its evidence sentences, the detector's steps, and the other charts are under Details.
- Space plays and pauses. `[` and `]` step to the previous and next detection.
- `T` starts a four-stop guided tour. The arrow keys move between stops, and Escape ends it.
- The day, the clock, the selected detection, and the open panel are kept in the URL, so any view can be reloaded or linked.

## How it is put together

| Path | What it holds |
|---|---|
| `tools/export_data.py` | Turns the detector's output into `public/data/*.json` |
| `tools/fetch_basemap.py` | Downloads the world outline into `public/basemap/` |
| `src/data/types.ts` | The shapes of those JSON files. The contract between the export and the app |
| `src/data/load.ts` | Fetches and caches the JSON |
| `src/state/store.ts` | The one store: the day, the clock, the selection, the open panel |
| `src/map/` | The MapLibre map and its deck.gl layers, one file per layer |
| `src/time/` | The playback clock and the bar along the bottom: its controls and the timeline |
| `src/panels/` | The floating panels |
| `src/tour/` | The guided tour's stops and keyboard handling |
| `src/ui/` | Small shared pieces: panel surface, badges, the confidence meter |
| `src/lib/` | Cause names and colors, and time formatting |

Every component reads what it needs from the store, so there is no data passed down through props.

Built with React, Vite, TypeScript, MapLibre GL, deck.gl, Tailwind CSS, Recharts, and Zustand.

## Data and basemap

`public/data/` is generated and not committed, because it is derived from the event dataset.

`public/basemap/` is committed. It holds one file, a world land outline from Natural Earth, which is in the public domain.

The farm in the dataset is simulated. Its coordinates fall partly on a real neighborhood on the east side of Casselton, so the map shows no aerial photo. It draws the field as a plain patch of soil and labels it as simulated.
