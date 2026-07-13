import { INITIAL_UNLOCKED } from './constants';
import type { CustomItemId, PuppyProgress } from './types';

const KEYS = {
  progress: 'puppy-pop.progress',
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const uniqueItems = (items: CustomItemId[]) => Array.from(new Set(items.filter(Boolean)));

export const DAILY_PLAY_LIMIT = 10;

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const createDefaultProgress = (): PuppyProgress => ({
  schemaVersion: 2,
  maxUnlockedStage: 0,
  unlockedItems: [...INITIAL_UNLOCKED],
  equippedItems: ['red-ribbon'],
  bestSnacks: 0,
  dailyPlayDate: getLocalDateKey(),
  dailyPlayCount: 0,
  updatedAt: new Date().toISOString(),
});

export const normalizeProgress = (progress: Partial<PuppyProgress> | null | undefined): PuppyProgress => {
  const fallback = createDefaultProgress();
  const unlockedItems = uniqueItems([...INITIAL_UNLOCKED, ...(Array.isArray(progress?.unlockedItems) ? progress.unlockedItems : [])]);
  const equippedItems = uniqueItems(Array.isArray(progress?.equippedItems) ? progress.equippedItems : fallback.equippedItems).filter((item) =>
    unlockedItems.includes(item),
  );
  const today = getLocalDateKey();
  const isToday = progress?.dailyPlayDate === today;

  return {
    schemaVersion: 2,
    maxUnlockedStage: Math.max(0, Number(progress?.maxUnlockedStage ?? fallback.maxUnlockedStage)),
    unlockedItems,
    equippedItems,
    bestSnacks: Math.max(0, Number(progress?.bestSnacks ?? fallback.bestSnacks)),
    dailyPlayDate: today,
    dailyPlayCount: isToday
      ? Math.min(DAILY_PLAY_LIMIT, Math.max(0, Math.floor(Number(progress?.dailyPlayCount) || 0)))
      : 0,
    updatedAt: progress?.updatedAt || fallback.updatedAt,
  };
};

export const loadProgress = () => normalizeProgress(readJson<Partial<PuppyProgress> | null>(KEYS.progress, null));

export const saveProgress = (progress: Partial<PuppyProgress>) => {
  const normalized = normalizeProgress({
    ...progress,
    updatedAt: progress.updatedAt || new Date().toISOString(),
  });
  localStorage.setItem(KEYS.progress, JSON.stringify(normalized));
  return normalized;
};

export const loadUnlockedItems = () => loadProgress().unlockedItems;

export const saveUnlockedItems = (items: CustomItemId[]) => saveProgress({ ...loadProgress(), unlockedItems: items });

export const loadEquippedItems = () => loadProgress().equippedItems;

export const saveEquippedItems = (items: CustomItemId[]) => saveProgress({ ...loadProgress(), equippedItems: items });

export const loadBestSnacks = () => loadProgress().bestSnacks;

export const saveBestSnacks = (count: number) => saveProgress({ ...loadProgress(), bestSnacks: count });

export const loadMaxUnlockedStage = () => loadProgress().maxUnlockedStage;

export const saveMaxUnlockedStage = (index: number) => saveProgress({ ...loadProgress(), maxUnlockedStage: index });
