import { GROUND_Y, STAGE_WIDTH } from './constants';
import type { Collectible, Obstacle, Rect, StageData, StageTheme } from './types';

const goal: Rect = {
  x: STAGE_WIDTH - 132,
  y: 342,
  width: 70,
  height: 112,
};

const themes: StageTheme[] = [
  { id: 'flower', name: '꽃밭 산책길', label: '1-꽃밭', sky: '#bfeaff', ground: '#a7e873', hillA: '#aeea91', hillB: '#ffe9a8', platform: 'grass', decor: 'flower' },
  { id: 'candy', name: '솜사탕 언덕', label: '2-솜사탕', sky: '#ffdff0', ground: '#c8f1ff', hillA: '#ffc7e0', hillB: '#d8ccff', platform: 'candy', decor: 'star' },
  { id: 'clover', name: '네잎클로버 들판', label: '3-클로버', sky: '#d7f5ff', ground: '#9eeaa6', hillA: '#bff5b0', hillB: '#fff4b8', platform: 'grass', decor: 'clover' },
  { id: 'ribbon', name: '리본 마을길', label: '4-리본', sky: '#ffe7f3', ground: '#bce9ff', hillA: '#ffd0df', hillB: '#cdd7ff', platform: 'cream', decor: 'ribbon' },
  { id: 'cookie', name: '쿠키 둥근길', label: '5-쿠키', sky: '#cfefff', ground: '#f5d58d', hillA: '#f7cfa4', hillB: '#fff1bd', platform: 'cream', decor: 'bone' },
  { id: 'bubble', name: '비눗방울 냇가', label: '6-방울', sky: '#c7f3ff', ground: '#a5e6d1', hillA: '#9ee2ff', hillB: '#c9f3c7', platform: 'cloud', decor: 'bubble' },
  { id: 'starlight', name: '별빛 놀이터', label: '7-별빛', sky: '#dcd1ff', ground: '#bdebd2', hillA: '#c9b8ff', hillB: '#ffe8a3', platform: 'candy', decor: 'star' },
  { id: 'picnic', name: '피크닉 공원', label: '8-피크닉', sky: '#c7eeff', ground: '#b9ec92', hillA: '#ffe6a6', hillB: '#ffc4d8', platform: 'grass', decor: 'heart' },
  { id: 'rainbow', name: '무지개 다리', label: '9-무지개', sky: '#d9f2ff', ground: '#c5f0bb', hillA: '#ffd1e8', hillB: '#bde9ff', platform: 'cloud', decor: 'rainbow' },
  { id: 'festival', name: '멍멍 축제길', label: '10-축제', sky: '#fff0bd', ground: '#b5ed9a', hillA: '#ffb8d1', hillB: '#b9dfff', platform: 'candy', decor: 'confetti' },
  { id: 'pond', name: '연못 징검길', label: '11-연못', sky: '#bfefff', ground: '#8fd9c6', hillA: '#a8e6d7', hillB: '#c9f3ff', platform: 'cloud', decor: 'bubble' },
  { id: 'bakery', name: '빵집 골목', label: '12-빵집', sky: '#ffe4d1', ground: '#e7c26f', hillA: '#ffd6aa', hillB: '#fff0ba', platform: 'cream', decor: 'bone' },
  { id: 'garden', name: '비밀 정원', label: '13-정원', sky: '#d9f9ef', ground: '#86dd8d', hillA: '#b8f2a4', hillB: '#ffd7e8', platform: 'grass', decor: 'clover' },
  { id: 'cloud', name: '구름 퐁퐁길', label: '14-구름', sky: '#dff6ff', ground: '#b9e9ff', hillA: '#f6fdff', hillB: '#d7e9ff', platform: 'cloud', decor: 'star' },
  { id: 'market', name: '간식 시장길', label: '15-시장', sky: '#fff1cb', ground: '#f2cf8f', hillA: '#ffd5b7', hillB: '#c8edff', platform: 'candy', decor: 'heart' },
  { id: 'meadow', name: '민들레 초원', label: '16-초원', sky: '#c9f2ff', ground: '#a9e878', hillA: '#d6f5a3', hillB: '#fff0a5', platform: 'grass', decor: 'flower' },
  { id: 'toy', name: '장난감 마당', label: '17-장난감', sky: '#f1e4ff', ground: '#bce8ff', hillA: '#ffc8e8', hillB: '#fff3a8', platform: 'candy', decor: 'confetti' },
  { id: 'night', name: '달빛 산책길', label: '18-달빛', sky: '#cfc8ff', ground: '#9ddbc3', hillA: '#b9b0ff', hillB: '#dfe2ff', platform: 'cloud', decor: 'star' },
  { id: 'bridge', name: '리본 다리길', label: '19-다리', sky: '#ffe6f5', ground: '#afe4d7', hillA: '#ffc8dd', hillB: '#aee9ff', platform: 'cream', decor: 'ribbon' },
  { id: 'party', name: '왕관 축하길', label: '20-왕관', sky: '#fff0c5', ground: '#aae982', hillA: '#ffbed6', hillB: '#c5dcff', platform: 'candy', decor: 'rainbow' },
];

const groundPatterns = [
  [620, 0, 640, 132, 520, 168, 760, 144],
  [780, 116, 460, 184, 660, 132, 520, 208],
  [500, 156, 500, 156, 480, 196, 700, 128],
  [980, 124, 420, 220, 560, 148, 430, 236],
  [560, 172, 860, 120, 460, 214, 640, 156],
];

const addGround = (stage: number): Rect[] => {
  const pattern = groundPatterns[(stage - 1) % groundPatterns.length];
  const platforms: Rect[] = [];
  let x = 0;
  let step = 0;
  while (x < STAGE_WIDTH - 280) {
    const width = pattern[step % pattern.length];
    const gap = pattern[(step + 1) % pattern.length];
    platforms.push({ x, y: GROUND_Y, width: Math.min(width, STAGE_WIDTH - x), height: 84 });
    x += width + gap;
    step += 2;
  }
  platforms.push({ x: STAGE_WIDTH - 360, y: GROUND_Y, width: 360, height: 84 });
  return platforms;
};

const addFloating = (stage: number): Rect[] => {
  const mode = (stage - 1) % 5;
  const platforms: Rect[] = [];
  for (let i = 0; i < 13; i += 1) {
    const x = 620 + i * 560 + ((stage * 47 + i * 31) % 120);
    const y =
      mode === 0 ? (i % 2 === 0 ? 342 : 306) :
      mode === 1 ? 330 - (i % 3) * 30 :
      mode === 2 ? (i % 4 === 0 ? 288 : 350) :
      mode === 3 ? 318 + (i % 2) * 36 :
      294 + (i % 3) * 28;
    const width = mode === 2 ? 150 : 170 + (i % 3) * 18;
    platforms.push({ x, y, width, height: 28 });
  }
  return platforms;
};

const makePlatforms = (stage: number): Rect[] => [...addGround(stage), ...addFloating(stage)];

const makeCollectibles = (stage: number, platforms: Rect[]): Collectible[] => {
  const items: Collectible[] = [];
  const groundItems = [210, 520, 1060, 1630, 2280, 3020, 3760, 4560, 5320, 6120, 6960, 7750];
  groundItems.forEach((x, index) => {
    items.push({ id: `s${stage}-bone-g-${index}`, type: 'bone', x: x + ((stage * 23 + index * 19) % 90), y: 382, width: 34, height: 28, collected: false });
  });

  platforms
    .filter((platform) => platform.y < GROUND_Y)
    .slice(1, 11)
    .forEach((platform, index) => {
      items.push({ id: `s${stage}-bone-p-${index}`, type: 'bone', x: platform.x + platform.width / 2 - 17, y: platform.y - 52, width: 34, height: 28, collected: false });
    });

  items.push({ id: `s${stage}-heart-1`, type: 'heart', x: 2480 + (stage % 5) * 280, y: 382, width: 34, height: 30, collected: false });
  items.push({ id: `s${stage}-heart-2`, type: 'heart', x: 5860 + (stage % 4) * 160, y: 382, width: 34, height: 30, collected: false });

  const ribbonPlatform = platforms.filter((platform) => platform.y < GROUND_Y)[stage % 10];
  items.push({
    id: `s${stage}-ribbon-box`,
    type: 'ribbon-box',
    x: ribbonPlatform ? ribbonPlatform.x + ribbonPlatform.width - 64 : 6620,
    y: ribbonPlatform ? ribbonPlatform.y - 54 : 374,
    width: 48,
    height: 44,
    collected: false,
  });

  return items;
};

const ball = (stage: number, id: number, x: number, speed: number): Obstacle => ({
  id: `s${stage}-ball-${id}`,
  type: 'ball',
  x,
  y: 410,
  width: 38,
  height: 38,
  vx: speed,
  minX: x - 96,
  maxX: x + 142,
});

const makeObstacles = (stage: number): Obstacle[] => {
  const pattern = (stage - 1) % 10;
  const commonCats: Obstacle[] = [
    { id: `s${stage}-cat-1`, type: 'cat', x: 1880 + pattern * 34, y: 398, width: 46, height: 50 },
    { id: `s${stage}-cat-2`, type: 'cat', x: 6240 - pattern * 28, y: 398, width: 46, height: 50 },
  ];
  const puddles: Obstacle[] = [
    { id: `s${stage}-puddle-1`, type: 'puddle', x: 1020 + pattern * 42, y: 431, width: 92, height: 18 },
    { id: `s${stage}-puddle-2`, type: 'puddle', x: 4320 + pattern * 36, y: 431, width: 118, height: 18 },
  ];
  const airy: Obstacle[] = [
    { id: `s${stage}-butterfly-1`, type: 'butterfly', x: 2860 + pattern * 40, y: 338, width: 46, height: 34 },
    { id: `s${stage}-pinwheel-1`, type: 'pinwheel', x: 5080 + pattern * 48, y: 386, width: 48, height: 62 },
  ];

  const sets: Obstacle[][] = [
    [ball(stage, 1, 760, 1.35), ...puddles, ...commonCats, airy[0]],
    [...commonCats, ball(stage, 1, 1460, 1.5), ball(stage, 2, 3740, -1.25), airy[1]],
    [puddles[0], airy[0], ball(stage, 1, 2320, 1.45), commonCats[1], ball(stage, 2, 6680, 1.2)],
    [airy[1], puddles[1], commonCats[0], ball(stage, 1, 5360, -1.55), airy[0]],
    [ball(stage, 1, 1180, 1.25), ball(stage, 2, 3240, -1.4), ball(stage, 3, 7280, 1.35), ...puddles],
    [airy[0], airy[1], commonCats[0], commonCats[1], puddles[0]],
    [puddles[0], ball(stage, 1, 1880, 1.45), airy[1], ball(stage, 2, 5480, -1.35), commonCats[1]],
    [commonCats[0], puddles[1], airy[0], ball(stage, 1, 4720, 1.55), ball(stage, 2, 7440, -1.3)],
    [ball(stage, 1, 920, 1.2), airy[0], airy[1], puddles[1], commonCats[1]],
    [puddles[0], commonCats[0], ball(stage, 1, 2760, 1.5), ball(stage, 2, 6120, -1.45), airy[1]],
  ];

  return sets[pattern];
};

export const stages: StageData[] = Array.from({ length: 20 }, (_, index) => {
  const id = index + 1;
  const platforms = makePlatforms(id);
  return {
    id,
    theme: { ...themes[index], label: `${id}-${themes[index].label.split('-')[1]}` },
    platforms,
    collectibles: makeCollectibles(id, platforms),
    obstacles: makeObstacles(id),
    goal: { ...goal },
  };
});

export const getStage = (index: number) => stages[index % stages.length];
