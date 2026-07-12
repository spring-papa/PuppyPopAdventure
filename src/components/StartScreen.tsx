import Puppy from './Puppy';
import type { CustomItemId } from '../game/types';

export default function StartScreen({
  equippedItems,
  bestSnacks,
  cloud,
  onLogin,
  onSettings,
  onStart,
  onCustomize,
}: {
  equippedItems: CustomItemId[];
  bestSnacks: number;
  cloud: {
    user: { displayName: string; email: string } | null;
    syncing: boolean;
    message: string;
  };
  onLogin: () => void;
  onSettings: () => void;
  onStart: () => void;
  onCustomize: () => void;
}) {
  const signedIn = Boolean(cloud.user);

  return (
    <section className="screen start-screen flower-town">
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <button className="settings-fab" onClick={onSettings} aria-label="설정">
        ⚙
      </button>
      <div className="start-content">
        <p className="eyebrow">꽃밭 산책길</p>
        <h1>멍멍 대소동!</h1>
        <div className="hero-puppy">
          <Puppy items={equippedItems} />
        </div>
        <p className="speech-bubble">몽실이랑 간식 찾으러 가자!</p>
        <div className="start-best">최고 간식 {bestSnacks}개</div>
        <p className="start-cloud-status">{cloud.message}</p>
        <div className="primary-actions">
          {signedIn ? (
            <>
              <button className="soft-button primary" onClick={onStart} disabled={cloud.syncing}>
                시작하기
              </button>
              <button className="soft-button secondary" onClick={onCustomize} disabled={cloud.syncing}>
                꾸미기
              </button>
            </>
          ) : (
            <button className="soft-button primary" onClick={onLogin} disabled={cloud.syncing}>
              로그인
            </button>
          )}
        </div>
      </div>
      <div className="flower-row" />
    </section>
  );
}
