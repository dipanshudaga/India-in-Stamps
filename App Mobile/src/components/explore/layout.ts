export const COLS = 4;

// Each row starts this many stamps further along the list than the row above, so the same stamp
// never shows twice on one screen (7 > the ~5 columns visible mid-pan).
export const ROW_SHIFT = 7;

// Pager pages on either side of the tapped stamp. Fewer than the catalog size, so a row's pages
// never repeat a stamp.
export const HALF = 1500;

// The grid is infinite, so there are no side margins and no first row: a cell is just
// (column, row) on an endless plane. The zoom transition only lands exactly on the hero because the
// cell's image box and the hero box are both square `contain` boxes centred on a known point - the
// zoom is just heroBox / imgBox.
export function makeLayout(width: number, insetTop: number) {
  const cellW = width / COLS;
  const rowH = Math.round(cellW * 1.08);
  const heroBox = Math.round(Math.min(width * 0.7, 290));

  return {
    width,
    cellW,
    rowH,
    rowStride: rowH + 8,
    padTop: insetTop + 10,
    imgBox: Math.round(cellW * 0.78),
    heroBox,
    heroCx: width / 2,
    heroCy: insetTop + 76 + heroBox / 2,
    pageW: Math.round(width * 0.74),
  };
}

export type ExploreLayout = ReturnType<typeof makeLayout>;
