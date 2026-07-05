import { stages } from '../game/levelData';
import type { CSSProperties } from 'react';

export default function StageSelectScreen({
  maxUnlockedStage,
  onSelect,
  onBack,
}: {
  maxUnlockedStage: number;
  onSelect: (index: number) => void;
  onBack: () => void;
}) {
  return (
    <section className="screen stage-select-screen">
      <header className="custom-header">
        <button className="round-button" onClick={onBack} aria-label="뒤로">
          ‹
        </button>
        <div>
          <p className="eyebrow">몽실이 모험 지도</p>
          <h2>스테이지 선택</h2>
        </div>
        <span className="stage-count">{maxUnlockedStage + 1}/{stages.length}</span>
      </header>

      <div className="stage-list">
        {stages.map((stage, index) => {
          const unlocked = index <= maxUnlockedStage;
          return (
            <button
              key={stage.id}
              className={`stage-card stage-card-${stage.theme.id} ${unlocked ? '' : 'locked'}`}
              onClick={() => unlocked && onSelect(index)}
              disabled={!unlocked}
              style={{
                '--stage-sky': stage.theme.sky,
                '--stage-ground': stage.theme.ground,
                '--stage-hill-a': stage.theme.hillA,
              } as CSSProperties}
            >
              <span className="stage-number">{stage.id}</span>
              <span className="stage-card-text">
                <strong>{stage.theme.name}</strong>
                <small>{unlocked ? '출발하기' : '잠겨 있어요'}</small>
              </span>
              <span className="stage-lock">{unlocked ? '▶' : '🔒'}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
