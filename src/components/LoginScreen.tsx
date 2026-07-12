import { useState } from 'react';
import type { FormEvent } from 'react';

type AuthMode = 'signin' | 'signup';

export default function LoginScreen({
  syncing,
  message,
  onBack,
  onGoogle,
  onEmailSignIn,
  onEmailSignUp,
  onPasswordReset,
}: {
  syncing: boolean;
  message: string;
  onBack: () => void;
  onGoogle: () => void;
  onEmailSignIn: (email: string, password: string) => Promise<boolean>;
  onEmailSignUp: (email: string, password: string) => Promise<boolean>;
  onPasswordReset: (email: string) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localMessage, setLocalMessage] = useState('');

  const submitLabel = mode === 'signin' ? '이메일로 로그인' : '새 이메일로 가입';

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalMessage('');
    const ok = mode === 'signin' ? await onEmailSignIn(email, password) : await onEmailSignUp(email, password);
    if (ok) return;
    setLocalMessage(mode === 'signin' ? '이메일 로그인을 다시 확인해 주세요.' : '가입 정보를 다시 확인해 주세요.');
  };

  const resetPassword = async () => {
    setLocalMessage('');
    const ok = await onPasswordReset(email);
    setLocalMessage(ok ? '비밀번호 재설정 메일을 보냈어요.' : '이메일 주소를 먼저 확인해 주세요.');
  };

  return (
    <section className="screen login-screen">
      <header className="custom-header auth-header">
        <button className="round-button" onClick={onBack} aria-label="뒤로">
          ‹
        </button>
        <div>
          <p className="eyebrow">계정 연결</p>
          <h2>로그인</h2>
        </div>
        <span className="header-spacer" />
      </header>

      <div className="auth-panel">
        <p className="auth-status" aria-live="polite">
          {localMessage || message}
        </p>

        <button className="soft-button google-button" onClick={onGoogle} disabled={syncing}>
          Google 계정으로 로그인
        </button>

        <div className="auth-divider">
          <span>또는</span>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="이메일 로그인 방식">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')} type="button">
            로그인
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')} type="button">
            가입
          </button>
        </div>

        <form className="email-auth-form" onSubmit={submitEmail}>
          <label>
            <span>이메일</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} inputMode="email" autoComplete="email" />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
          <button className="soft-button primary" type="submit" disabled={syncing}>
            {submitLabel}
          </button>
        </form>

        {mode === 'signin' && (
          <button className="cloud-text-button auth-reset-button" onClick={resetPassword} disabled={syncing} type="button">
            비밀번호를 잊었어요
          </button>
        )}
      </div>
    </section>
  );
}
