import type { Layer } from "@deck.gl/core";
import { PathLayer, PolygonLayer } from "@deck.gl/layers";
import type { Frame } from "./frame";
import { withAlpha, type Rgb } from "./style";

/**
 * The land around the field, so it does not sit in a void: neighboring fields,
 * gravel roads on a one-mile grid, and blocks for the town of Casselton to the west.
 *
 * All of it is an illustration. The dataset's farm is simulated, and nothing in
 * it says what surrounds the field. The layout follows how this part of North
 * Dakota is divided: roads a mile apart, and quarter-mile-square fields between them.
 */

/** The spacing of the land grid in meters: half a mile. Every second line is a road. */
const HALF_MILE = 805;
/** Where the road lines nearest the field run, in meters from the field's south-west corner. */
export const ROAD_X = -60;
export const ROAD_Y = -140;
/** How many grid lines are drawn each way from the field. The land reaches past the screen at the widest zoom the flat map allows. */
const REACH_X = 28;
const REACH_Y = 18;

const GROUND: Rgb = [19, 23, 23];
const ROAD: Rgb = [84, 80, 71];
const FARMSTEAD: Rgb = [30, 39, 29];
const TOWN: Rgb = [37, 42, 49];
/** Muted crop colors. The field's own soil and rows stay the brightest thing on the map. */
const CROPS: Rgb[] = [[27, 40, 30], [36, 42, 27], [44, 38, 27], [29, 36, 33], [41, 36, 24], [32, 45, 28]];

/** The field's own cell is a little larger than the others, so the field and its yard fit inside it. */
const lineX = (k: number) => (k === 1 ? 760 : ROAD_X + k * HALF_MILE);
const lineY = (k: number) => (k === 1 ? 850 : ROAD_Y + k * HALF_MILE);
/** A cell edge on a road line stands farther back than one on a plain boundary. */
const inset = (k: number) => (k % 2 === 0 ? 13 : 6);

interface Patch {
  ring: [number, number][];
  color: Rgb;
}

/** Casselton lies west of the field: two cells wide and two tall. */
const isTown = (i: number, j: number) => (i === -2 || i === -1) && (j === -1 || j === 0);

/** A town cell cut into street blocks. */
function townBlocks(frame: Frame, x0: number, y0: number, x1: number, y1: number): Patch[] {
  const BLOCK = 64;
  const STREET = 12;
  const blocks: Patch[] = [];
  for (let x = x0; x + BLOCK <= x1 + 1; x += BLOCK + STREET) {
    for (let y = y0; y + BLOCK <= y1 + 1; y += BLOCK + STREET) {
      blocks.push({ ring: frame.rect(x, y, x + BLOCK, y + BLOCK), color: TOWN });
    }
  }
  return blocks;
}

interface Land {
  ground: [number, number][][];
  patches: Patch[];
  roads: [number, number][][];
}

const landByFrame = new WeakMap<Frame, Land>();

function land(frame: Frame): Land {
  let built = landByFrame.get(frame);
  if (!built) {
    const patches: Patch[] = [];
    for (let i = -REACH_X; i < REACH_X; i++) {
      for (let j = -REACH_Y; j < REACH_Y; j++) {
        const x0 = lineX(i) + inset(i), x1 = lineX(i + 1) - inset(i + 1);
        const y0 = lineY(j) + inset(j), y1 = lineY(j + 1) - inset(j + 1);
        if (isTown(i, j)) {
          patches.push(...townBlocks(frame, x0, y0, x1, y1));
          continue;
        }
        const home = i === 0 && j === 0;
        // A fixed scramble of the cell's place in the grid, so the patchwork looks uneven and never changes.
        const pick = (((i * 31 + j * 17 + ((i * j) % 7)) % CROPS.length) + CROPS.length) % CROPS.length;
        patches.push({ ring: frame.rect(x0, y0, x1, y1), color: home ? FARMSTEAD : CROPS[pick] });
      }
    }
    const [west, east] = [lineX(-REACH_X), lineX(REACH_X)];
    const [south, north] = [lineY(-REACH_Y), lineY(REACH_Y)];
    const roads: [number, number][][] = [];
    for (let k = -REACH_X; k <= REACH_X; k += 2) roads.push([frame.at(lineX(k), south), frame.at(lineX(k), north)]);
    for (let k = -REACH_Y; k <= REACH_Y; k += 2) roads.push([frame.at(west, lineY(k)), frame.at(east, lineY(k))]);
    built = { ground: [frame.rect(west, south, east, north)], patches, roads };
    landByFrame.set(frame, built);
  }
  return built;
}

export function surroundingLayers(frame: Frame): Layer[] {
  const { ground, patches, roads } = land(frame);
  return [
    new PolygonLayer<[number, number][]>({
      id: "ground",
      data: ground,
      getPolygon: (ring) => ring,
      getFillColor: withAlpha(GROUND, 255),
      stroked: false,
    }),
    new PolygonLayer<Patch>({
      id: "land",
      data: patches,
      getPolygon: (patch) => patch.ring,
      getFillColor: (patch) => withAlpha(patch.color, 255),
      stroked: false,
    }),
    new PathLayer<[number, number][]>({
      id: "roads",
      data: roads,
      getPath: (road) => road,
      getColor: withAlpha(ROAD, 255),
      getWidth: 9,
      widthUnits: "meters",
      widthMinPixels: 1,
    }),
  ];
}
