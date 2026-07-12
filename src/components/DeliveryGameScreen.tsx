import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { CustomItemId, GameSnapshot, StageData } from '../game/types';
import Puppy from './Puppy';

const LANES = [142, 252, 362];
const COURSE = 6200;

type CourseItem = { id: string; x: number; lane: number; type: 'snack' | 'puddle' | 'yarn' | 'boost' };

export default function DeliveryGameScreen({ equippedItems, stage, bestSnacks, onClear, onFail, onHome }: {
  equippedItems: CustomItemId[]; stage: StageData; bestSnacks: number;
  onClear: (snapshot: GameSnapshot) => void; onFail: (snapshot: GameSnapshot) => void; onHome: () => void;
}) {
  const items = useMemo<CourseItem[]>(() => Array.from({ length: 40 }, (_, i) => ({
    id: `${stage.id}-${i}`, x: 440 + i * 142 + (i % 3) * 18, lane: (i * 2 + stage.id) % 3,
    type: i % 11 === 7 ? 'boost' : i % 5 === 3 ? 'puddle' : i % 7 === 4 ? 'yarn' : 'snack',
  })), [stage.id]);
  const [lane, setLane] = useState(1);
  const [distance, setDistance] = useState(0);
  const [snacks, setSnacks] = useState(0);
  const [health, setHealth] = useState(3);
  const [jumping, setJumping] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [boost, setBoost] = useState(false);
  const hit = useRef(new Set<string>());
  const start = useRef({ x: 0, y: 0, time: 0 });
  const done = useRef(false);
  const state = useRef({ lane: 1, distance: 0, snacks: 0, health: 3, jumping: false, sliding: false });
  state.current = { lane, distance, snacks, health, jumping, sliding };

  const finish = useCallback((won: boolean) => {
    if (done.current) return;
    done.current = true;
    const snapshot = { snacks: state.current.snacks, health: state.current.health, ribbonFound: state.current.snacks >= 12, bestSnacks };
    won ? onClear(snapshot) : onFail(snapshot);
  }, [bestSnacks, onClear, onFail]);

  useEffect(() => {
    let frame = 0; let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(34, now - last); last = now;
      setDistance((old) => {
        const next = Math.min(COURSE, old + dt * (boost ? 0.23 : 0.16));
        if (next >= COURSE) queueMicrotask(() => finish(true));
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [boost, finish]);

  useEffect(() => {
    items.forEach((item) => {
      const screenX = item.x - distance + 95;
      if (hit.current.has(item.id) || item.lane !== lane || screenX < 70 || screenX > 155) return;
      hit.current.add(item.id);
      if (item.type === 'snack') setSnacks((v) => v + 1);
      else if (item.type === 'boost') { setBoost(true); setTimeout(() => setBoost(false), 2200); }
      else if (!jumping && !(sliding && item.type === 'yarn')) setHealth((v) => {
        const next = v - 1; if (next <= 0) queueMicrotask(() => finish(false)); return next;
      });
    });
  }, [distance, finish, items, jumping, lane, sliding]);

  const moveLane = (delta: number) => setLane((v) => Math.max(0, Math.min(2, v + delta)));
  const jump = () => { if (jumping) return; setJumping(true); setTimeout(() => setJumping(false), 620); };
  const pointerDown = (e: PointerEvent) => { start.current = { x: e.clientX, y: e.clientY, time: performance.now() }; setSliding(false); };
  const pointerUp = (e: PointerEvent) => {
    const dy = e.clientY - start.current.y; const held = performance.now() - start.current.time;
    if (Math.abs(dy) > 34) moveLane(dy > 0 ? 1 : -1); else if (held > 430) { setSliding(true); setTimeout(() => setSliding(false), 720); } else jump();
  };
  const style = { '--stage-sky': stage.theme.sky, '--stage-ground': stage.theme.ground, '--stage-hill-a': stage.theme.hillA } as CSSProperties;

  return <section className="screen delivery-game" style={style} onPointerDown={pointerDown} onPointerUp={pointerUp}>
    <header className="mode-hud"><button onPointerDown={(e) => e.stopPropagation()} onClick={onHome}>⌂</button><span>🧺 {snacks}</span><span>{'♥'.repeat(health)}</span></header>
    <div className="mode-title"><b>{stage.theme.label}</b> 간식 배달 중! <small>{Math.round(distance / COURSE * 100)}%</small></div>
    <div className="delivery-scene">
      <div className="runner-hills" />
      {LANES.map((y, i) => <div className={`delivery-lane lane-${i}`} key={y} style={{ top: y }} />)}
      {items.map((item) => {
        const x = item.x - distance + 95;
        if (x < -80 || x > 500 || hit.current.has(item.id)) return null;
        return <span key={item.id} className={`course-item ${item.type}`} style={{ left: x, top: LANES[item.lane] - 35 }}>{item.type === 'snack' ? '🍪' : item.type === 'puddle' ? '💧' : item.type === 'yarn' ? '🧶' : '⚡'}</span>;
      })}
      <div className={`delivery-puppy ${jumping ? 'is-jumping' : ''} ${sliding ? 'is-sliding' : ''} ${boost ? 'is-boosting' : ''}`} style={{ top: LANES[lane] - 75 }}>
        <span className="snack-basket">🧺</span><Puppy items={equippedItems} moving dashing={boost} />
      </div>
      {distance > COURSE - 500 && <div className="friend-house" style={{ left: COURSE - distance + 40 }}>🏠<span>🐶</span></div>}
    </div>
    <div className="gesture-help"><span>↕ 위아래 스와이프</span><span>👆 탭 점프</span><span>👇 길게 눌러 슬라이딩</span></div>
  </section>;
}
