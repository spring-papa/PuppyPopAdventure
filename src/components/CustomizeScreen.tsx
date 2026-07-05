import { CUSTOM_ITEMS } from '../game/constants';
import type { CustomItemId } from '../game/types';
import Puppy from './Puppy';

export default function CustomizeScreen({
  equippedItems,
  unlockedItems,
  onChoose,
  onBack,
  onPlay,
}: {
  equippedItems: CustomItemId[];
  unlockedItems: CustomItemId[];
  onChoose: (item: CustomItemId) => void;
  onBack: () => void;
  onPlay: () => void;
}) {
  return (
    <section className="screen customize-screen">
      <header className="custom-header">
        <button className="round-button" onClick={onBack} aria-label="뒤로">
          ‹
        </button>
        <div>
          <p className="eyebrow">몽실이 옷장</p>
          <h2>꾸미기</h2>
        </div>
        <button className="round-button play-mini" onClick={onPlay} aria-label="시작">
          ▶
        </button>
      </header>
      <div className="custom-preview">
        <Puppy items={equippedItems} />
      </div>
      <div className="item-grid">
        {CUSTOM_ITEMS.map((item) => {
          const unlocked = unlockedItems.includes(item.id);
          const equipped = item.slot === 'none' ? equippedItems.length === 0 : equippedItems.includes(item.id);
          return (
            <button
              key={item.id}
              className={`item-card ${equipped ? 'selected' : ''} ${unlocked ? '' : 'locked'}`}
              onClick={() => onChoose(item.id)}
              disabled={!unlocked}
            >
              <span className="item-icon">{item.icon}</span>
              <strong>{item.name}</strong>
              <small>{unlocked ? (equipped ? '착용 중' : item.slot === 'none' ? '초기화' : '같은 위치 교체') : item.lockedLabel}</small>
            </button>
          );
        })}
      </div>
      <button className="soft-button primary wide" onClick={onPlay}>
        이 모습으로 시작
      </button>
    </section>
  );
}
