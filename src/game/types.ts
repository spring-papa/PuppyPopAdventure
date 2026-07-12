export type Screen = 'start' | 'stage-select' | 'math-gate' | 'game' | 'customize' | 'clear' | 'fail';

export type CustomItemId = string;

export type CustomSlot = 'none' | 'head' | 'neck' | 'back' | 'scarf' | 'eyes' | 'tail' | 'aura' | 'badge';

export type CollectibleType = 'bone' | 'heart' | 'ribbon-box';

export type ObstacleType = 'ball' | 'cat' | 'puddle' | 'butterfly' | 'pinwheel';

export type ControlsState = {
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Collectible = Rect & {
  id: string;
  type: CollectibleType;
  collected: boolean;
};

export type Obstacle = Rect & {
  id: string;
  type: ObstacleType;
  vx?: number;
  minX?: number;
  maxX?: number;
};

export type StageTheme = {
  id: string;
  name: string;
  label: string;
  sky: string;
  ground: string;
  hillA: string;
  hillB: string;
  platform: 'grass' | 'cream' | 'candy' | 'cloud';
  decor: string;
};

export type StageData = {
  id: number;
  theme: StageTheme;
  platforms: Rect[];
  collectibles: Collectible[];
  obstacles: Obstacle[];
  goal: Rect;
};

export type Particle = {
  id: number;
  x: number;
  y: number;
  kind: 'sparkle' | 'heart' | 'paw';
  ttl: number;
};

export type GameSnapshot = {
  snacks: number;
  health: number;
  ribbonFound: boolean;
  bestSnacks: number;
};

export type PuppyState = Rect & {
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  dashing: boolean;
  invincibleUntil: number;
};
