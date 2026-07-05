import { INITIAL_UNLOCKED } from './constants';
import type { CustomItemId } from './types';

const KEYS = {
  unlocked: 'puppy-pop.unlockedItems',
  selected: 'puppy-pop.selectedItem',
  equipped: 'puppy-pop.equippedItems',
  bestSnacks: 'puppy-pop.bestSnacks',
  maxUnlockedStage: 'puppy-pop.maxUnlockedStage',
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const loadUnlockedItems = () => readJson<CustomItemId[]>(KEYS.unlocked, INITIAL_UNLOCKED);

export const saveUnlockedItems = (items: CustomItemId[]) => {
  localStorage.setItem(KEYS.unlocked, JSON.stringify(Array.from(new Set(items))));
};

export const loadSelectedItem = () => (localStorage.getItem(KEYS.selected) as CustomItemId | null) ?? 'red-ribbon';

export const saveSelectedItem = (item: CustomItemId) => {
  localStorage.setItem(KEYS.selected, item);
};

export const loadEquippedItems = () => {
  const equipped = readJson<CustomItemId[] | null>(KEYS.equipped, null);
  if (equipped) return equipped;
  const selected = loadSelectedItem();
  return selected === 'none' ? [] : [selected];
};

export const saveEquippedItems = (items: CustomItemId[]) => {
  localStorage.setItem(KEYS.equipped, JSON.stringify(Array.from(new Set(items))));
};

export const loadBestSnacks = () => Number(localStorage.getItem(KEYS.bestSnacks) ?? 0);

export const saveBestSnacks = (count: number) => {
  localStorage.setItem(KEYS.bestSnacks, String(count));
};

export const loadMaxUnlockedStage = () => Math.max(0, Number(localStorage.getItem(KEYS.maxUnlockedStage) ?? 0));

export const saveMaxUnlockedStage = (index: number) => {
  localStorage.setItem(KEYS.maxUnlockedStage, String(Math.max(0, index)));
};
