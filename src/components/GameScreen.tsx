import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { STAGE_WIDTH, VIEW_HEIGHT } from '../game/constants';
import { useGameLoop } from '../game/useGameLoop';
import type { ControlsState, CustomItemId, GameSnapshot, StageData } from '../game/types';
import HUD from './HUD';
import Puppy from './Puppy';
import TouchControls from './TouchControls';

const emptyControls: ControlsState = { left: false, right: false, jump: false, dash: false };
const tips = ['간식을 모아보자!', '점프해서 넘어가!', '리본 상자를 찾아봐!', '도착 깃발까지 가자!'];

declare global {
  interface Window {
    __puppyDebug?: {
      controls: ControlsState;
    };
  }
}

export default function GameScreen({
  equippedItems,
  stage,
  bestSnacks,
  onClear,
  onFail,
  onHome,
}: {
  equippedItems: CustomItemId[];
  stage: StageData;
  bestSnacks: number;
  onClear: (snapshot: GameSnapshot) => void;
  onFail: (snapshot: GameSnapshot) => void;
  onHome: () => void;
}) {
  const controlsRef = useRef<ControlsState>({ ...emptyControls });
  const [controls, setControls] = useState<ControlsState>(emptyControls);
  const game = useGameLoop({ controlsRef, stage, bestSnacks, onClear, onFail });

  const setControl = useCallback((key: 'left' | 'right' | 'jump' | 'dash', active: boolean) => {
    if (active && key === 'jump') {
      game.requestJump();
    }
    if (active && key === 'dash') {
      game.requestDash();
    }

    const next = {
      ...controlsRef.current,
      [key]: active,
    };
    controlsRef.current = next;
    if (!import.meta.env.PROD) window.__puppyDebug = { controls: next };
    setControls(next);
  }, [game]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') setControl('left', true);
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') setControl('right', true);
      if (event.code === 'Space') setControl('jump', true);
      if (event.key === 'Shift') setControl('dash', true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') setControl('left', false);
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') setControl('right', false);
      if (event.code === 'Space') setControl('jump', false);
      if (event.key === 'Shift') setControl('dash', false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [setControl]);

  const scenery = useMemo(
    () =>
      Array.from({ length: Math.ceil(STAGE_WIDTH / 120) }, (_, index) => ({
        id: index,
        x: 52 + index * 118,
        y: index % 3 === 0 ? 418 : 432,
        delay: `${index * 0.14}s`,
      })),
    [stage.id],
  );

  const stageStyle = {
    '--stage-sky': stage.theme.sky,
    '--stage-ground': stage.theme.ground,
    '--stage-hill-a': stage.theme.hillA,
    '--stage-hill-b': stage.theme.hillB,
  } as CSSProperties;

  return (
    <section className={`screen game-screen stage-${stage.theme.id}`} style={stageStyle}>
      <HUD snacks={game.snacks} health={game.health} ribbonFound={game.ribbonFound} onHome={onHome} />
      <div className="tip-bubble">
        <span className="stage-badge">{stage.theme.label}</span>
        {tips[Math.min(game.tipIndex, tips.length - 1)]}
      </div>
      <div className="stage-viewport" style={{ height: VIEW_HEIGHT }}>
        <div className="sky-layer" style={{ '--camera-x': `${game.cameraX}px` } as CSSProperties}>
          <div className="cloud cloud-a" />
          <div className="cloud cloud-b" />
          <div className="hill hill-a" />
          <div className="hill hill-b" />
        </div>
        <div className="stage-world" style={{ width: STAGE_WIDTH, transform: `translateX(${-game.cameraX}px)` }}>
          {scenery.map((flower) => (
            <span
              key={flower.id}
              className={`flower decor-${stage.theme.decor}`}
              style={{ left: flower.x, top: flower.y, animationDelay: flower.delay }}
            />
          ))}
          {stage.platforms.map((platform, index) => (
            <div
              key={`${platform.x}-${index}`}
              className={`${platform.y < 400 ? 'platform floating' : 'platform'} platform-${stage.theme.platform}`}
              style={{ left: platform.x, top: platform.y, width: platform.width, height: platform.height }}
            />
          ))}
          {game.collectibles.map(
            (item) =>
              !item.collected && (
                <div key={item.id} className={`collectible ${item.type}`} style={{ left: item.x, top: item.y, width: item.width, height: item.height }}>
                  {item.type === 'bone' && <span>🦴</span>}
                  {item.type === 'heart' && <span>♥</span>}
                  {item.type === 'ribbon-box' && <span>🎁</span>}
                </div>
              ),
          )}
          {game.obstacles.map((obstacle) => (
            <div
              key={obstacle.id}
              className={`obstacle ${obstacle.type}`}
              style={{ left: obstacle.x, top: obstacle.y, width: obstacle.width, height: obstacle.height }}
            >
              {obstacle.type === 'ball' && <span />}
              {obstacle.type === 'cat' && (
                <>
                  <i />
                  <b />
                </>
              )}
              {obstacle.type === 'butterfly' && (
                <>
                  <i />
                  <b />
                </>
              )}
              {obstacle.type === 'pinwheel' && <span />}
            </div>
          ))}
          <div className="goal" style={{ left: stage.goal.x, top: stage.goal.y, width: stage.goal.width, height: stage.goal.height }}>
            <span />
          </div>
          {game.particles.map((particle) => (
            <span
              key={particle.id}
              className={`particle ${particle.kind}`}
              style={{ left: particle.x, top: particle.y, opacity: Math.max(0, particle.ttl / 42) }}
            />
          ))}
          <div
            className="puppy-actor"
            style={{ left: game.puppy.x, top: game.puppy.y, width: game.puppy.width, height: game.puppy.height }}
          >
            <Puppy
              items={equippedItems}
              moving={Math.abs(game.puppy.vx) > 1}
              jumping={!game.puppy.grounded}
              dashing={game.puppy.dashing}
              flipped={game.puppy.facing < 0}
            />
          </div>
        </div>
      </div>
      <TouchControls controls={controls} setControl={setControl} />
    </section>
  );
}
