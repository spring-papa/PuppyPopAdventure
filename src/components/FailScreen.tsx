import type { CustomItemId, GameSnapshot } from '../game/types';
import Puppy from './Puppy';

export default function FailScreen({
  result,
  equippedItems,
  onRetry,
  onHome,
}: {
  result: GameSnapshot;
  equippedItems: CustomItemId[];
  onRetry: () => void;
  onHome: () => void;
}) {
  return (
    <section className="screen result-screen fail-screen">
      <div className="rest-card">
        <div className="cushion">
          <Puppy items={equippedItems} mood="rest" />
        </div>
        <h2>몽실이가 잠깐 쉬고 있어요.</h2>
        <p>간식 {result.snacks}개를 찾았어요. 조금만 쉬고 다시 가요!</p>
        <button className="soft-button primary" onClick={onRetry}>
          다시 도전
        </button>
        <button className="soft-button secondary" onClick={onHome}>
          처음으로
        </button>
      </div>
    </section>
  );
}
