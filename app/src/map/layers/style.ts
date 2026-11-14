/** Shared looks for the deck.gl layers. */

export type Rgb = [number, number, number];
export type Rgba = [number, number, number, number];

/** The app's text color (--color-ink). */
export const INK: Rgb = [244, 243, 238];

/** The app's panel color (--color-panel), used behind map labels. */
export const PANEL: Rgb = [18, 22, 27];

/** A color with an opacity from 0 to 255. */
export function withAlpha(rgb: Rgb, alpha: number): Rgba {
  return [rgb[0], rgb[1], rgb[2], alpha];
}

/** Settings every map label shares: the app's font on a small dark chip, so it reads over the field and its rows. */
export const LABEL_STYLE = {
  fontFamily: "Barlow, system-ui, sans-serif",
  fontWeight: 600,
  background: true,
  getBackgroundColor: withAlpha(PANEL, 255),
  backgroundPadding: [5, 2],
  backgroundBorderRadius: 4,
} as const;
