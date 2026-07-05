import type { ControlsState } from '../game/types';

type ControlButtonKey = 'left' | 'right' | 'jump' | 'dash';

const buttons: Array<{ key: ControlButtonKey; label: string; icon: string; side: 'left' | 'right' }> = [
  { key: 'left', label: '왼쪽', icon: '‹', side: 'left' },
  { key: 'right', label: '오른쪽', icon: '›', side: 'left' },
  { key: 'jump', label: '점프', icon: '↟', side: 'right' },
  { key: 'dash', label: '대시', icon: '✦', side: 'right' },
];

export default function TouchControls({
  controls,
  setControl,
}: {
  controls: ControlsState;
  setControl: (key: ControlButtonKey, active: boolean) => void;
}) {
  const isActionButton = (key: ControlButtonKey) => key === 'jump' || key === 'dash';
  const press = (key: ControlButtonKey) => {
    setControl(key, true);
  };
  const release = (key: ControlButtonKey) => {
    setControl(key, false);
  };

  const renderButton = (button: (typeof buttons)[number]) => (
    <button
      key={button.key}
      type="button"
      data-control={button.key}
      className={`control-button ${controls[button.key] ? 'pressed' : ''}`}
      aria-label={button.label}
      onPointerDown={() => press(button.key)}
      onPointerUp={() => release(button.key)}
      onPointerCancel={() => release(button.key)}
      onPointerLeave={() => release(button.key)}
      onMouseDown={() => press(button.key)}
      onMouseUp={() => release(button.key)}
      onTouchStart={() => press(button.key)}
      onTouchEnd={() => release(button.key)}
      onClick={(event) => {
        if (!isActionButton(button.key)) return;
        press(button.key);
        window.setTimeout(() => release(button.key), 100);
      }}
    >
      <span>{button.icon}</span>
      <small>{button.label}</small>
    </button>
  );

  return (
    <div className="touch-controls">
      <div className="control-cluster">{buttons.filter((button) => button.side === 'left').map(renderButton)}</div>
      <div className="control-cluster">{buttons.filter((button) => button.side === 'right').map(renderButton)}</div>
    </div>
  );
}
