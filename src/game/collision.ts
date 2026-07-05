import type { Rect } from './types';

export const intersects = (a: Rect, b: Rect, inset = 0) =>
  a.x + inset < b.x + b.width &&
  a.x + a.width - inset > b.x &&
  a.y + inset < b.y + b.height &&
  a.y + a.height - inset > b.y;

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
