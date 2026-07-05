import { MAX_HEALTH } from '../game/constants';

export default function HUD({ snacks, health, ribbonFound, onHome }: { snacks: number; health: number; ribbonFound: boolean; onHome: () => void }) {
  return (
    <div className="hud">
      <button className="hud-home" onClick={onHome} aria-label="처음으로">
        집
      </button>
      <div className="hud-pill">🦴 {snacks}</div>
      <div className="hud-hearts" aria-label={`하트 ${health}개`}>
        {Array.from({ length: MAX_HEALTH }, (_, index) => (
          <span key={index} className={index < health ? 'heart on' : 'heart'}>
            ♥
          </span>
        ))}
      </div>
      <div className={`hud-pill ribbon ${ribbonFound ? 'found' : ''}`}>🎁 {ribbonFound ? '찾음' : '리본'}</div>
    </div>
  );
}
