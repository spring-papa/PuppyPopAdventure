import { useCallback, useMemo, useState } from 'react';
import ClearScreen from './components/ClearScreen';
import CustomizeScreen from './components/CustomizeScreen';
import FailScreen from './components/FailScreen';
import GameScreen from './components/GameScreen';
import StageSelectScreen from './components/StageSelectScreen';
import StartScreen from './components/StartScreen';
import { CUSTOM_ITEMS, INITIAL_UNLOCKED } from './game/constants';
import {
  loadBestSnacks,
  loadEquippedItems,
  loadMaxUnlockedStage,
  loadUnlockedItems,
  saveBestSnacks,
  saveEquippedItems,
  saveMaxUnlockedStage,
  saveUnlockedItems,
} from './game/storage';
import { getStage, stages } from './game/levelData';
import type { CustomItemId, GameSnapshot, Screen } from './game/types';

const unlockRewards: CustomItemId[] = CUSTOM_ITEMS.map((item) => item.id).filter((id) => !INITIAL_UNLOCKED.includes(id));

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [stageIndex, setStageIndex] = useState(0);
  const [maxUnlockedStage, setMaxUnlockedStage] = useState(() => Math.min(loadMaxUnlockedStage(), stages.length - 1));
  const [equippedItems, setEquippedItems] = useState<CustomItemId[]>(() => loadEquippedItems());
  const [unlockedItems, setUnlockedItems] = useState<CustomItemId[]>(() => {
    const loaded = loadUnlockedItems();
    return Array.from(new Set([...INITIAL_UNLOCKED, ...loaded]));
  });
  const [bestSnacks, setBestSnacks] = useState(() => loadBestSnacks());
  const [lastResult, setLastResult] = useState<GameSnapshot>({
    snacks: 0,
    health: 5,
    ribbonFound: false,
    bestSnacks,
  });

  const equippedSafe = useMemo(
    () => equippedItems.filter((item) => unlockedItems.includes(item)),
    [equippedItems, unlockedItems],
  );

  const chooseItem = (item: CustomItemId) => {
    if (!unlockedItems.includes(item)) return;
    const customItem = CUSTOM_ITEMS.find((entry) => entry.id === item);
    if (!customItem) return;
    const nextItems =
      customItem.slot === 'none'
        ? []
        : [...equippedItems.filter((equipped) => CUSTOM_ITEMS.find((entry) => entry.id === equipped)?.slot !== customItem.slot), item];
    setEquippedItems(nextItems);
    saveEquippedItems(nextItems);
  };

  const handleClear = useCallback(
    (snapshot: GameSnapshot) => {
      const nextBest = Math.max(bestSnacks, snapshot.snacks);
      setBestSnacks(nextBest);
      saveBestSnacks(nextBest);
      setLastResult({ ...snapshot, bestSnacks: nextBest });

      if (snapshot.ribbonFound) {
        const nextReward = unlockRewards.find((item) => !unlockedItems.includes(item));
        if (nextReward) {
          const nextUnlocked = [...unlockedItems, nextReward];
          setUnlockedItems(nextUnlocked);
          saveUnlockedItems(nextUnlocked);
        }
      }

      const nextUnlockedStage = Math.min(stages.length - 1, stageIndex + 1);
      if (nextUnlockedStage > maxUnlockedStage) {
        setMaxUnlockedStage(nextUnlockedStage);
        saveMaxUnlockedStage(nextUnlockedStage);
      }

      setScreen('clear');
    },
    [bestSnacks, maxUnlockedStage, stageIndex, unlockedItems],
  );

  const handleFail = useCallback((snapshot: GameSnapshot) => {
    setLastResult(snapshot);
    setScreen('fail');
  }, []);

  const startGame = () => {
    setScreen('stage-select');
  };

  const selectStage = (index: number) => {
    if (index > maxUnlockedStage) return;
    setStageIndex(index);
    setScreen('game');
  };

  const nextStage = () => {
    setStageIndex((index) => (index + 1) % stages.length);
    setScreen('game');
  };

  const replayStage = () => {
    setScreen('game');
  };

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {screen === 'start' && (
          <StartScreen equippedItems={equippedSafe} bestSnacks={bestSnacks} onStart={startGame} onCustomize={() => setScreen('customize')} />
        )}
        {screen === 'stage-select' && (
          <StageSelectScreen maxUnlockedStage={maxUnlockedStage} onSelect={selectStage} onBack={() => setScreen('start')} />
        )}
        {screen === 'customize' && (
          <CustomizeScreen
            equippedItems={equippedSafe}
            unlockedItems={unlockedItems}
            onChoose={chooseItem}
            onBack={() => setScreen('start')}
            onPlay={startGame}
          />
        )}
        {screen === 'game' && (
          <GameScreen
            key={stageIndex}
            equippedItems={equippedSafe}
            stage={getStage(stageIndex)}
            bestSnacks={bestSnacks}
            onClear={handleClear}
            onFail={handleFail}
            onHome={() => setScreen('start')}
          />
        )}
        {screen === 'clear' && (
          <ClearScreen result={lastResult} stage={getStage(stageIndex)} onReplay={replayStage} onNext={nextStage} onCustomize={() => setScreen('customize')} />
        )}
        {screen === 'fail' && <FailScreen result={lastResult} equippedItems={equippedSafe} onRetry={replayStage} onHome={() => setScreen('start')} />}
      </div>
    </main>
  );
}
