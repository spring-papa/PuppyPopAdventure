import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createGateQuestions, GATE_SECONDS } from '../game/multiplicationGate';
import type { CustomItemId, StageData } from '../game/types';
import Puppy from './Puppy';

const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

type GateStatus = 'playing' | 'checking' | 'failed' | 'cleared';

export default function MultiplicationGateScreen({
  stage,
  equippedItems,
  onPass,
  onBack,
}: {
  stage: StageData;
  equippedItems: CustomItemId[];
  onPass: () => void;
  onBack: () => void;
}) {
  const [round, setRound] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<GateStatus>('playing');
  const [timeRatio, setTimeRatio] = useState(1);
  const questions = useMemo(() => createGateQuestions(stage.id), [stage.id, round]);
  const question = questions[questionIndex];
  const answerLength = String(question.answer).length;
  const slots = Array.from({ length: answerLength }, (_, index) => input[index] ?? '');
  const progressText = `${questionIndex + 1} / ${questions.length}`;

  useEffect(() => {
    if (status !== 'playing') return undefined;

    const startedAt = Date.now();
    setTimeRatio(1);
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const nextRatio = Math.max(0, 1 - elapsed / GATE_SECONDS);
      setTimeRatio(nextRatio);
      if (nextRatio <= 0) {
        window.clearInterval(timer);
        setStatus('failed');
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [question.id, status]);

  const resetGate = () => {
    setRound((value) => value + 1);
    setQuestionIndex(0);
    setInput('');
    setStatus('playing');
    setTimeRatio(1);
  };

  const advanceQuestion = () => {
    if (questionIndex >= questions.length - 1) {
      setStatus('cleared');
      window.setTimeout(onPass, 420);
      return;
    }

    setQuestionIndex((index) => index + 1);
    setInput('');
    setStatus('playing');
  };

  const pressDigit = (digit: number) => {
    if (status !== 'playing') return;
    const nextInput = `${input}${digit}`.slice(0, answerLength);
    setInput(nextInput);

    if (nextInput.length < answerLength) return;
    setStatus('checking');
    if (Number(nextInput) === question.answer) {
      window.setTimeout(advanceQuestion, 140);
      return;
    }
    window.setTimeout(() => setStatus('failed'), 140);
  };

  return (
    <section
      className={`screen math-gate-screen stage-${stage.theme.id}`}
      style={
        {
          '--stage-sky': stage.theme.sky,
          '--stage-ground': stage.theme.ground,
          '--stage-hill-a': stage.theme.hillA,
          '--stage-hill-b': stage.theme.hillB,
        } as CSSProperties
      }
    >
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <header className="custom-header math-gate-header">
        <button className="round-button" onClick={onBack} aria-label="뒤로">
          ‹
        </button>
        <div>
          <p className="eyebrow">출발 전 구구단</p>
          <h2>{stage.theme.name}</h2>
        </div>
        <span className="stage-count">{progressText}</span>
      </header>

      <div className="math-gate-panel">
        <div className="math-gate-puppy">
          <Puppy items={equippedItems} moving={status === 'cleared'} mood={status === 'failed' ? 'rest' : 'happy'} />
        </div>

        <div className="math-timer" aria-label="남은 시간">
          <span style={{ transform: `scaleX(${timeRatio})` }} />
        </div>

        <div className="math-expression" aria-live="polite">
          <span>{question.dan}</span>
          <span>×</span>
          <span>{question.multiplier}</span>
          <span>=</span>
          {slots.map((slot, index) => (
            <span key={`${question.id}-${index}`} className={`math-answer-slot ${slot ? 'filled' : ''}`}>
              {slot}
            </span>
          ))}
        </div>

        {status === 'failed' && (
          <div className="math-gate-result">
            <strong>
              {question.dan} × {question.multiplier} = {question.answer}
            </strong>
            <button className="soft-button primary" onClick={resetGate}>
              다시 풀기
            </button>
          </div>
        )}

        {status !== 'failed' && (
          <div className="math-keypad" role="group" aria-label="정답 숫자 입력">
            {digits.map((digit) => (
              <button key={digit} type="button" className="digit-button" data-digit={digit} onClick={() => pressDigit(digit)} disabled={status !== 'playing'}>
                {digit}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flower-row" />
    </section>
  );
}
