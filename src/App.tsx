import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ClearScreen from './components/ClearScreen';
import CustomizeScreen from './components/CustomizeScreen';
import FailScreen from './components/FailScreen';
import GameScreen from './components/GameScreen';
import DeliveryGameScreen from './components/DeliveryGameScreen';
import BalloonGameScreen from './components/BalloonGameScreen';
import LoginScreen from './components/LoginScreen';
import MultiplicationGateScreen from './components/MultiplicationGateScreen';
import SettingsScreen from './components/SettingsScreen';
import StageSelectScreen from './components/StageSelectScreen';
import StartScreen from './components/StartScreen';
import { CUSTOM_ITEMS, INITIAL_UNLOCKED } from './game/constants';
import {
  DAILY_PLAY_LIMIT,
  getLocalDateKey,
  loadProgress,
  saveProgress,
} from './game/storage';
import {
  initCloud,
  onCloudUserChanged,
  saveProgressToCloud,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  syncProgressWithCloud,
  type CloudUser,
} from './game/firebaseCloud';
import { getStage, stages } from './game/levelData';
import type { CustomItemId, GameSnapshot, PuppyProgress, Screen } from './game/types';

const unlockRewards: CustomItemId[] = CUSTOM_ITEMS.map((item) => item.id).filter((id) => !INITIAL_UNLOCKED.includes(id));

type CloudState = {
  user: CloudUser | null;
  syncing: boolean;
  message: string;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [stageIndex, setStageIndex] = useState(0);
  const [today, setToday] = useState(getLocalDateKey);
  const [progress, setProgress] = useState<PuppyProgress>(() => {
    const loaded = loadProgress();
    return {
      ...loaded,
      maxUnlockedStage: Math.min(loaded.maxUnlockedStage, stages.length - 1),
    };
  });
  const [cloud, setCloud] = useState<CloudState>({
    user: null,
    syncing: true,
    message: '로그인 상태 확인 중',
  });
  const progressRef = useRef(progress);
  const cloudUserRef = useRef<CloudUser | null>(null);
  const maxUnlockedStage = progress.maxUnlockedStage;
  const equippedItems = progress.equippedItems;
  const unlockedItems = progress.unlockedItems;
  const bestSnacks = progress.bestSnacks;
  const dailyPlayCount = progress.dailyPlayDate === today ? progress.dailyPlayCount : 0;
  const dailyLimitReached = dailyPlayCount >= DAILY_PLAY_LIMIT;
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

  useEffect(() => {
    if (!cloud.user && !['start', 'login', 'settings'].includes(screen)) {
      setScreen('start');
    }
  }, [cloud.user, screen]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const refreshDate = () => setToday(getLocalDateKey());
    const intervalId = window.setInterval(refreshDate, 60_000);
    window.addEventListener('focus', refreshDate);
    document.addEventListener('visibilitychange', refreshDate);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshDate);
      document.removeEventListener('visibilitychange', refreshDate);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    initCloud().then((result) => {
      if (!alive) return;
      if (!result.available) {
        setCloud({ user: null, syncing: false, message: '클라우드 연결을 준비하지 못했어요' });
      }
    });

    return onCloudUserChanged(async (user) => {
      if (!alive) return;
      cloudUserRef.current = user;

      if (!user) {
        setCloud({ user: null, syncing: false, message: '로그인하면 시작할 수 있어요' });
        return;
      }

      setCloud({ user, syncing: true, message: '기록 동기화 중' });
      const result = await syncProgressWithCloud(progressRef.current);
      if (!alive) return;

      if (result.ok && result.progress) {
        setProgress(result.progress);
        setCloud({ user, syncing: false, message: '다른 기기와 기록 보관 중' });
        return;
      }

      setCloud({ user, syncing: false, message: '기록은 저장됐고 동기화는 다시 시도할게요' });
    });
  }, []);

  const saveProgressChange = useCallback((changes: Partial<PuppyProgress>) => {
    const nextProgress = saveProgress({
      ...progressRef.current,
      ...changes,
      updatedAt: new Date().toISOString(),
    });
    progressRef.current = nextProgress;
    setProgress(nextProgress);

    if (cloudUserRef.current) {
      setCloud((current) => ({ ...current, syncing: true, message: '기록 저장 중' }));
      saveProgressToCloud(nextProgress).then((result) => {
        setCloud((current) => ({
          ...current,
          syncing: false,
          message: result.ok ? '다른 기기와 기록 보관 중' : '기록은 저장됐고 동기화는 다시 시도할게요',
        }));
      });
    }

    return nextProgress;
  }, []);

  const chooseItem = (item: CustomItemId) => {
    if (!unlockedItems.includes(item)) return;
    const customItem = CUSTOM_ITEMS.find((entry) => entry.id === item);
    if (!customItem) return;
    const nextItems =
      customItem.slot === 'none'
        ? []
        : [...equippedItems.filter((equipped) => CUSTOM_ITEMS.find((entry) => entry.id === equipped)?.slot !== customItem.slot), item];
    saveProgressChange({ equippedItems: nextItems });
  };

  const handleClear = useCallback(
    (snapshot: GameSnapshot) => {
      const nextBest = Math.max(bestSnacks, snapshot.snacks);
      setLastResult({ ...snapshot, bestSnacks: nextBest });
      let nextUnlocked = unlockedItems;

      if (snapshot.ribbonFound) {
        const nextReward = unlockRewards.find((item) => !unlockedItems.includes(item));
        if (nextReward) {
          nextUnlocked = [...unlockedItems, nextReward];
        }
      }

      const nextUnlockedStage = Math.min(stages.length - 1, stageIndex + 1);
      saveProgressChange({
        bestSnacks: nextBest,
        unlockedItems: nextUnlocked,
        maxUnlockedStage: Math.max(maxUnlockedStage, nextUnlockedStage),
      });

      setScreen('clear');
    },
    [bestSnacks, maxUnlockedStage, saveProgressChange, stageIndex, unlockedItems],
  );

  const handleFail = useCallback((snapshot: GameSnapshot) => {
    setLastResult(snapshot);
    setScreen('fail');
  }, []);

  const startGame = () => {
    if (!cloudUserRef.current) {
      setCloud((current) => ({ ...current, message: '먼저 로그인해 주세요' }));
      setScreen('login');
      return;
    }
    if (dailyLimitReached) {
      return;
    }
    setScreen('stage-select');
  };

  const selectStage = (index: number) => {
    if (index > maxUnlockedStage) return;
    if (dailyLimitReached) {
      setScreen('start');
      return;
    }
    setStageIndex(index);
    setScreen('math-gate');
  };

  const nextStage = () => {
    if (dailyLimitReached) {
      setScreen('start');
      return;
    }
    setStageIndex((index) => (index + 1) % stages.length);
    setScreen('math-gate');
  };

  const replayStage = () => {
    if (dailyLimitReached) {
      setScreen('start');
      return;
    }
    setScreen('math-gate');
  };

  const handleMathGatePass = () => {
    const current = progressRef.current;
    const currentDate = getLocalDateKey();
    const playCount = current.dailyPlayDate === currentDate ? current.dailyPlayCount : 0;

    if (playCount >= DAILY_PLAY_LIMIT) {
      setToday(currentDate);
      setScreen('start');
      return;
    }

    setToday(currentDate);
    saveProgressChange({
      dailyPlayDate: currentDate,
      dailyPlayCount: playCount + 1,
    });
    setScreen('game');
  };

  const handleCloudLogin = async () => {
    setCloud((current) => ({ ...current, syncing: true, message: 'Google 로그인 중' }));
    const result = await signInWithGoogle();
    if (!result.ok) {
      setCloud((current) => ({ ...current, syncing: false, message: '로그인이 취소되었거나 실패했어요' }));
      return false;
    }
    setScreen('start');
    return true;
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    setCloud((current) => ({ ...current, syncing: true, message: '이메일 로그인 중' }));
    const result = await signInWithEmail(email, password);
    if (!result.ok) {
      setCloud((current) => ({ ...current, syncing: false, message: result.message || '이메일 로그인을 다시 확인해 주세요' }));
      return false;
    }
    setScreen('start');
    return true;
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    setCloud((current) => ({ ...current, syncing: true, message: '이메일 가입 중' }));
    const result = await signUpWithEmail(email, password);
    if (!result.ok) {
      setCloud((current) => ({ ...current, syncing: false, message: result.message || '가입 정보를 다시 확인해 주세요' }));
      return false;
    }
    setScreen('start');
    return true;
  };

  const handlePasswordReset = async (email: string) => {
    setCloud((current) => ({ ...current, syncing: true, message: '비밀번호 재설정 메일 준비 중' }));
    const result = await sendPasswordReset(email);
    setCloud((current) => ({
      ...current,
      syncing: false,
      message: result.ok ? '비밀번호 재설정 메일을 보냈어요' : result.message || '이메일 주소를 확인해 주세요',
    }));
    return result.ok;
  };

  const handleCloudLogout = async () => {
    setCloud((current) => ({ ...current, syncing: true, message: '로그아웃 중' }));
    const result = await signOutUser();
    if (!result.ok) {
      setCloud((current) => ({ ...current, syncing: false, message: '로그아웃을 다시 시도해 주세요' }));
    }
    setScreen('start');
  };

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {screen === 'start' && (
          <StartScreen
            equippedItems={equippedSafe}
            bestSnacks={bestSnacks}
            dailyPlayCount={dailyPlayCount}
            dailyPlayLimit={DAILY_PLAY_LIMIT}
            cloud={cloud}
            onLogin={() => setScreen('login')}
            onSettings={() => setScreen('settings')}
            onStart={startGame}
            onCustomize={() => {
              if (!cloudUserRef.current) {
                setCloud((current) => ({ ...current, message: '먼저 로그인해 주세요' }));
                setScreen('login');
                return;
              }
              setScreen('customize');
            }}
          />
        )}
        {screen === 'login' && (
          <LoginScreen
            syncing={cloud.syncing}
            message={cloud.message}
            onBack={() => setScreen('start')}
            onGoogle={handleCloudLogin}
            onEmailSignIn={handleEmailSignIn}
            onEmailSignUp={handleEmailSignUp}
            onPasswordReset={handlePasswordReset}
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            user={cloud.user}
            syncing={cloud.syncing}
            message={cloud.message}
            onBack={() => setScreen('start')}
            onLogout={handleCloudLogout}
            onLogin={() => setScreen('login')}
          />
        )}
        {screen === 'stage-select' && (
          <StageSelectScreen maxUnlockedStage={maxUnlockedStage} onSelect={selectStage} onBack={() => setScreen('start')} />
        )}
        {screen === 'math-gate' && (
          <MultiplicationGateScreen
            key={`math-${stageIndex}`}
            equippedItems={equippedSafe}
            stage={getStage(stageIndex)}
            onPass={handleMathGatePass}
            onBack={() => setScreen('stage-select')}
          />
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
        {screen === 'game' && getStage(stageIndex).mode === 'adventure' && (
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
        {screen === 'game' && getStage(stageIndex).mode === 'delivery' && (
          <DeliveryGameScreen key={stageIndex} equippedItems={equippedSafe} stage={getStage(stageIndex)} bestSnacks={bestSnacks} onClear={handleClear} onFail={handleFail} onHome={() => setScreen('start')} />
        )}
        {screen === 'game' && getStage(stageIndex).mode === 'balloon' && (
          <BalloonGameScreen key={stageIndex} equippedItems={equippedSafe} stage={getStage(stageIndex)} bestSnacks={bestSnacks} onClear={handleClear} onFail={handleFail} onHome={() => setScreen('start')} />
        )}
        {screen === 'clear' && (
          <ClearScreen result={lastResult} stage={getStage(stageIndex)} onReplay={replayStage} onNext={nextStage} onCustomize={() => setScreen('customize')} />
        )}
        {screen === 'fail' && <FailScreen result={lastResult} equippedItems={equippedSafe} onRetry={replayStage} onHome={() => setScreen('start')} />}
      </div>
    </main>
  );
}
