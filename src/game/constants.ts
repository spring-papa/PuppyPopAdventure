import type { CustomItemId, CustomSlot } from './types';

export const STAGE_WIDTH = 8600;
export const VIEW_WIDTH = 390;
export const VIEW_HEIGHT = 560;
export const GROUND_Y = 450;
export const MAX_HEALTH = 5;

export const PHYSICS = {
  gravity: 0.34,
  moveSpeed: 3.2,
  dashSpeed: 12,
  jumpVelocity: -8.8,
  friction: 0.82,
  puppyWidth: 58,
  puppyHeight: 62,
};

export const CUSTOM_ITEMS: Array<{
  id: CustomItemId;
  name: string;
  icon: string;
  slot: CustomSlot;
  lockedLabel?: string;
}> = [
  { id: 'none', name: '모두 빼기', icon: '♡', slot: 'none' },
  { id: 'red-ribbon', name: '빨간 리본', icon: '🎀', slot: 'head' },
  { id: 'heart-necklace', name: '하트 목걸이', icon: '♥', slot: 'neck' },
  { id: 'star-pin', name: '별 머리핀', icon: '★', slot: 'head' },
  { id: 'strawberry-ribbon', name: '딸기 리본', icon: '🍓', slot: 'head', lockedLabel: '리본 상자' },
  { id: 'rainbow-cape', name: '무지개 망토', icon: '🌈', slot: 'back', lockedLabel: '리본 상자' },
  { id: 'blue-bow', name: '하늘 리본', icon: '🩵', slot: 'head', lockedLabel: '리본 상자' },
  { id: 'flower-pin', name: '꽃 머리핀', icon: '🌸', slot: 'head', lockedLabel: '리본 상자' },
  { id: 'clover-pin', name: '클로버 핀', icon: '♣', slot: 'head', lockedLabel: '리본 상자' },
  { id: 'moon-pin', name: '달 머리핀', icon: '☾', slot: 'head', lockedLabel: '리본 상자' },
  { id: 'crown', name: '작은 왕관', icon: '♛', slot: 'head', lockedLabel: '리본 상자' },
  { id: 'pearl-collar', name: '진주 목걸이', icon: '○', slot: 'neck', lockedLabel: '리본 상자' },
  { id: 'bell-collar', name: '방울 목걸이', icon: '🔔', slot: 'neck', lockedLabel: '리본 상자' },
  { id: 'cookie-badge', name: '쿠키 배지', icon: '🍪', slot: 'badge', lockedLabel: '리본 상자' },
  { id: 'bone-badge', name: '뼈다귀 배지', icon: '🦴', slot: 'badge', lockedLabel: '리본 상자' },
  { id: 'paw-badge', name: '발자국 배지', icon: '🐾', slot: 'badge', lockedLabel: '리본 상자' },
  { id: 'sun-cape', name: '햇살 망토', icon: '☀', slot: 'back', lockedLabel: '리본 상자' },
  { id: 'cloud-cape', name: '구름 망토', icon: '☁', slot: 'back', lockedLabel: '리본 상자' },
  { id: 'star-cape', name: '별빛 망토', icon: '✦', slot: 'back', lockedLabel: '리본 상자' },
  { id: 'mint-scarf', name: '민트 스카프', icon: '▰', slot: 'scarf', lockedLabel: '리본 상자' },
  { id: 'pink-scarf', name: '분홍 스카프', icon: '▰', slot: 'scarf', lockedLabel: '리본 상자' },
  { id: 'striped-scarf', name: '줄무늬 스카프', icon: '▰', slot: 'scarf', lockedLabel: '리본 상자' },
  { id: 'heart-glasses', name: '하트 안경', icon: '♡', slot: 'eyes', lockedLabel: '리본 상자' },
  { id: 'round-glasses', name: '동글 안경', icon: '◎', slot: 'eyes', lockedLabel: '리본 상자' },
  { id: 'butterfly-wings', name: '나비 날개', icon: '🦋', slot: 'back', lockedLabel: '리본 상자' },
  { id: 'angel-wings', name: '솜털 날개', icon: '⌁', slot: 'back', lockedLabel: '리본 상자' },
  { id: 'rainbow-tail', name: '무지개 꼬리', icon: '🌈', slot: 'tail', lockedLabel: '리본 상자' },
  { id: 'sparkle-aura', name: '반짝 오라', icon: '✧', slot: 'aura', lockedLabel: '리본 상자' },
  { id: 'party-hat', name: '파티 모자', icon: '△', slot: 'head', lockedLabel: '리본 상자' },
  { id: 'cherry-pin', name: '체리 핀', icon: '🍒', slot: 'head', lockedLabel: '리본 상자' },
  { id: 'pink-sneakers', name: '분홍 운동화', icon: '👟', slot: 'feet', lockedLabel: '스테이지 보상' },
  { id: 'rain-boots', name: '노랑 장화', icon: '👢', slot: 'feet', lockedLabel: '스테이지 보상' },
  { id: 'star-shoes', name: '별빛 신발', icon: '✨', slot: 'feet', lockedLabel: '스테이지 보상' },
  { id: 'roller-skates', name: '롤러스케이트', icon: '🛼', slot: 'feet', lockedLabel: '스테이지 보상' },
  { id: 'cookie-skateboard', name: '쿠키 스케이트보드', icon: '🛹', slot: 'ride', lockedLabel: '배달 스탬프' },
  { id: 'rainbow-skateboard', name: '무지개 스케이트보드', icon: '🌈', slot: 'ride', lockedLabel: '배달 스탬프' },
  { id: 'cloud-board', name: '구름 보드', icon: '☁️', slot: 'ride', lockedLabel: '친구 강아지 카드' },
  { id: 'star-hoverboard', name: '별빛 호버보드', icon: '🌟', slot: 'ride', lockedLabel: '친구 강아지 카드' },
];

export const INITIAL_UNLOCKED: CustomItemId[] = ['none', 'red-ribbon', 'heart-necklace', 'star-pin', 'blue-bow', 'flower-pin', 'bone-badge', 'mint-scarf'];

export const soundEvent = (name: 'jump' | 'collect' | 'dash' | 'hit' | 'clear' | 'unlock') => {
  console.info(`[sound:${name}]`);
};
