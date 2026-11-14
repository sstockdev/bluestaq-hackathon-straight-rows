# Straight Rows map

A viewer for the detector's output. Three tractors drive their recorded paths across the field, and each detection opens with its action, confidence, and evidence. The detector does not depend on it.

## Run it

From the repository root, after the setup in the main README:

```bash
python app/tools/export_data.py   # writes app/public/data/
cd app
npm install
npm run dev                       # http://localhost:5173
```

## Use it

- The rail on the left opens a panel: Detections, How, Why, or Limits.
- Click a detection, in the list or on the timeline, to open it.
- Click or drag the timeline to move the clock.

| Key | What it does |
|---|---|
| Space | Play or pause |
| Left, Right | Move the clock one minute, or ten with Shift |
| `[`, `]` | Previous or next detection |
| `T` | Start the eight-stop tour. The arrows move it and Escape ends it |
| `N` | Open the speaker notes in a second window |
| `P` | Presentation mode, for a projector. Zoom the browser in afterwards |

## Code

| Path | What it holds |
|---|---|
| `tools/export_data.py` | Writes the JSON the app reads |
| `src/data/` | The JSON's types and loader |
| `src/state/` | The one store |
| `src/map/` | The map and its layers |
| `src/time/` | The timeline and playback |
| `src/panels/` | The panels |
| `src/tour/` | The tour and the speaker notes |

Built with React, Vite, TypeScript, MapLibre GL, deck.gl, Tailwind CSS, Recharts, and Zustand.

`public/data/` is generated and not committed. `public/basemap/` holds a world outline from Natural Earth, which is public domain.
