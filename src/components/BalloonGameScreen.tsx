import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { CustomItemId, GameSnapshot, StageData } from '../game/types';
import Puppy from './Puppy';

const COURSE = 5600;
type AirItem = { id: string; x: number; y: number; type: 'toy' | 'branch' | 'cloud' };

export default function BalloonGameScreen({ equippedItems, stage, bestSnacks, onClear, onFail, onHome }: {
  equippedItems: CustomItemId[]; stage: StageData; bestSnacks: number;
  onClear: (snapshot: GameSnapshot) => void; onFail: (snapshot: GameSnapshot) => void; onHome: () => void;
}) {
  const items = useMemo<AirItem[]>(() => Array.from({ length: 36 }, (_, i) => ({
    id: `${stage.id}-air-${i}`, x: 420 + i * 145, y: 115 + ((i * 83 + stage.id * 17) % 300),
    type: i % 8 === 5 ? 'branch' : i % 6 === 3 ? 'cloud' : 'toy',
  })), [stage.id]);
  const [distance, setDistance] = useState(0); const [y, setY] = useState(255); const [toys, setToys] = useState(0); const [health, setHealth] = useState(3);
  const pressed = useRef(false); const velocity = useRef(0); const hit = useRef(new Set<string>()); const done = useRef(false); const swipeY = useRef(0);
  const live = useRef({ toys: 0, health: 3 }); live.current = { toys, health };
  const finish = useCallback((won: boolean) => { if (done.current) return; done.current = true; const s = { snacks: live.current.toys, health: live.current.health, ribbonFound: live.current.toys >= 12, bestSnacks }; won ? onClear(s) : onFail(s); }, [bestSnacks, onClear, onFail]);

  useEffect(() => {
    let frame = 0; let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(34, now - last); last = now;
      velocity.current += (pressed.current ? -0.00125 : 0.00072) * dt; velocity.current *= 0.985;
      setY((old) => Math.max(70, Math.min(440, old + velocity.current * dt)));
      setDistance((old) => { const next = Math.min(COURSE, old + dt * 0.145); if (next >= COURSE) queueMicrotask(() => finish(true)); return next; });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [finish]);
  useEffect(() => { items.forEach((item) => { const x = item.x - distance + 105; if (hit.current.has(item.id) || x < 75 || x > 160 || Math.abs(item.y - y) > 48) return; hit.current.add(item.id); if (item.type === 'toy') setToys((v) => v + 1); else setHealth((v) => { const n = v - 1; if (n <= 0) queueMicrotask(() => finish(false)); return n; }); }); }, [distance, finish, items, y]);
  const down = (e: PointerEvent) => { pressed.current = true; swipeY.current = e.clientY; };
  const up = (e: PointerEvent) => { pressed.current = false; const dy = e.clientY - swipeY.current; if (Math.abs(dy) > 30) velocity.current += dy > 0 ? .22 : -.22; };
  const style = { '--stage-sky': stage.theme.sky, '--stage-ground': stage.theme.ground, '--stage-hill-a': stage.theme.hillA } as CSSProperties;
  return <section className="screen balloon-game" style={style} onPointerDown={down} onPointerUp={up} onPointerCancel={up}>
    <header className="mode-hud"><button onPointerDown={(e) => e.stopPropagation()} onClick={onHome}>⌂</button><span>🧸 {toys}</span><span>{'♥'.repeat(health)}</span></header>
    <div className="mode-title"><b>{stage.theme.label}</b> 풍선 구조 중! <small>{Math.round(distance / COURSE * 100)}%</small></div>
    <div className="air-scene">
      <div className="air-stars">✦　·　✧　　·　✦　　✧</div>
      {items.map((item) => { const x = item.x - distance + 105; if (x < -80 || x > 500 || hit.current.has(item.id)) return null; return <span key={item.id} className={`air-item ${item.type}`} style={{ left: x, top: item.y }}>{item.type === 'toy' ? (Number(item.id.split('-').pop()) % 2 ? '⭐' : '🧸') : item.type === 'branch' ? '🌿' : '☁️'}</span>; })}
      <div className="balloon-puppy" style={{ top: y }}><span className="big-balloon">🎈</span><span className="balloon-string"/><Puppy items={equippedItems} /></div>
      {distance > COURSE - 500 && <div className="rescue-pad" style={{ left: COURSE - distance + 30 }}>🐶<span>구조 지점</span></div>}
    </div>
    <div className="balloon-help"><b>화면을 누르면 위로 둥실</b><span>손을 떼면 천천히 내려와요</span></div>
  </section>;
}
