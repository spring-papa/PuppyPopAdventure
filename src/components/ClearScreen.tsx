import type { GameSnapshot, StageData } from '../game/types';

export default function ClearScreen({
  result,
  stage,
  onReplay,
  onNext,
  onCustomize,
}: {
  result: GameSnapshot;
  stage: StageData;
  onReplay: () => void;
  onNext: () => void;
  onCustomize: () => void;
}) {
  return (
    <section className="screen result-screen clear-screen">
      <div className="party">
        {Array.from({ length: 26 }, (_, index) => (
          <span key={index} style={{ '--i': index } as React.CSSProperties} />
        ))}
      </div>
      <div className="result-card">
        <p className="eyebrow">성공!</p>
        <h2>{stage.mode === 'delivery' ? '친구에게 간식을 배달했어요!' : stage.mode === 'balloon' ? '친구를 안전하게 구조했어요!' : '몽실이가 간식을 찾았어요!'}</h2>
        <p className="stage-clear-name">{stage.theme.name}</p>
        <div className="result-counts">
          <div>
            <strong>{result.snacks}</strong>
            <span>{stage.mode === 'balloon' ? '장난감' : '간식'}</span>
          </div>
          <div>
            <strong>{result.ribbonFound ? '찾음' : '다음에'}</strong>
            <span>{stage.mode === 'delivery' ? '간식 스탬프' : stage.mode === 'balloon' ? '친구 카드' : '리본 상자'}</span>
          </div>
        </div>
        <p className="reward-text">{result.ribbonFound ? (stage.mode === 'delivery' ? '간식 스탬프와 새 꾸미기가 열렸어요.' : stage.mode === 'balloon' ? '친구 강아지 카드와 새 꾸미기가 열렸어요.' : '새 꾸미기 아이템이 반짝 열렸어요.') : (stage.mode === 'delivery' ? '다음엔 간식을 더 많이 배달해 봐요.' : stage.mode === 'balloon' ? '다음엔 장난감을 더 많이 찾아봐요.' : '다음엔 리본 상자도 찾아봐요.')}</p>
        <button className="soft-button primary" onClick={onNext}>
          다음 스테이지
        </button>
        <button className="soft-button secondary" onClick={onReplay}>
          다시 하기
        </button>
        <button className="soft-button ghost" onClick={onCustomize}>
          꾸미기 보기
        </button>
      </div>
    </section>
  );
}
