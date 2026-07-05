import Puppy from './Puppy';
import type { CustomItemId } from '../game/types';

export default function StartScreen({
  equippedItems,
  bestSnacks,
  onStart,
  onCustomize,
}: {
  equippedItems: CustomItemId[];
  bestSnacks: number;
  onStart: () => void;
  onCustomize: () => void;
}) {
  return (
    <section className="screen start-screen flower-town">
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="start-content">
        <p className="eyebrow">꽃밭 산책길</p>
        <h1>멍멍 대소동!</h1>
        <div className="hero-puppy">
          <Puppy items={equippedItems} />
        </div>
        <p className="speech-bubble">몽실이랑 간식 찾으러 가자!</p>
        <div className="start-best">최고 간식 {bestSnacks}개</div>
        <div className="primary-actions">
          <button className="soft-button primary" onClick={onStart}>
            시작하기
          </button>
          <button className="soft-button secondary" onClick={onCustomize}>
            꾸미기
          </button>
        </div>
      </div>
      <div className="flower-row" />
    </section>
  );
}
