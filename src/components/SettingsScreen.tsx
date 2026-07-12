export default function SettingsScreen({
  user,
  syncing,
  message,
  onBack,
  onLogout,
  onLogin,
}: {
  user: { displayName: string; email: string } | null;
  syncing: boolean;
  message: string;
  onBack: () => void;
  onLogout: () => void;
  onLogin: () => void;
}) {
  const userLabel = user?.displayName || user?.email || '로그인 필요';

  return (
    <section className="screen settings-screen">
      <header className="custom-header auth-header">
        <button className="round-button" onClick={onBack} aria-label="뒤로">
          ‹
        </button>
        <div>
          <p className="eyebrow">몽실이 기록</p>
          <h2>설정</h2>
        </div>
        <span className="header-spacer" />
      </header>

      <div className="settings-panel">
        <div className="settings-account">
          <span>계정</span>
          <strong>{userLabel}</strong>
          <small>{message}</small>
        </div>

        {user ? (
          <button className="soft-button secondary" onClick={onLogout} disabled={syncing}>
            로그아웃
          </button>
        ) : (
          <button className="soft-button primary" onClick={onLogin} disabled={syncing}>
            로그인
          </button>
        )}
      </div>
    </section>
  );
}
