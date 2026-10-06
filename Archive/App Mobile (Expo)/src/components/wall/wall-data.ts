import wall from '@/data/wall.json';

// World-space size of one grid cell, and how much of it a stamp quad fills (a small gap between
// stamps). Layouts in wall.json are integer grid cells (see Scripts/make_wall.py).
export const PITCH = 1.2;
export const SIZE = 1.05;

export type Lens = 'time' | 'colour';
export const LENSES: { key: Lens; label: string }[] = [
  { key: 'time', label: 'Time' },
  { key: 'colour', label: 'Colour' },
];

export const COUNT = wall.count;
export const SHEETS = wall.sheets;
export const PER_SHEET = wall.perSheet;
export const PER_ROW = Math.floor(wall.sheet / wall.cell);
export const CELL_UV = wall.cell / wall.sheet;
export const ROWS = wall.rows;
export const IDS: number[] = wall.ids;
export const YEARS = wall.years as [number, number, number][];

function toWorld(flat: number[]): Float32Array {
  const out = new Float32Array(flat.length);
  for (let i = 0; i < flat.length; i++) out[i] = flat[i] * PITCH;
  return out;
}

// x, y per stamp (interleaved), in wall order.
export const LAYOUTS: Record<Lens, Float32Array> = {
  time: toWorld(wall.time),
  colour: toWorld(wall.colour),
};
export const WIDTH: Record<Lens, number> = {
  time: wall.width.time * PITCH,
  colour: wall.width.colour * PITCH,
};
export const HEIGHT = ROWS * PITCH;

const key = (gx: number, gy: number) => gx * 4096 + gy;

// Grid cell -> wall index, so a tap resolves to a stamp with one Map lookup (no raycaster over 3,015
// instances). Built lazily per lens.
const grids: Partial<Record<Lens, Map<number, number>>> = {};
export function stampAtCell(lens: Lens, gx: number, gy: number): number | undefined {
  let grid = grids[lens];
  if (!grid) {
    grid = new Map();
    const flat = lens === 'time' ? wall.time : wall.colour;
    for (let i = 0; i < COUNT; i++) grid.set(key(flat[i * 2], flat[i * 2 + 1]), i);
    grids[lens] = grid;
  }
  return grid.get(key(gx, gy));
}

// The year whose block the camera's x currently sits over (Time lens HUD).
export function yearAt(gx: number): number {
  for (const [year, , end] of YEARS) if (gx <= end + 0.5) return year;
  return YEARS[YEARS.length - 1][0];
}
