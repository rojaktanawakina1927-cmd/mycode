import type React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {COLORS} from './theme';

const LABELS = [
  {text: 'PELVIS', start: 30.3, end: 31.0, x: 44, y: 60},
  {text: 'RIBS', start: 31.0, end: 31.6, x: 56, y: 43},
  {text: 'SHOULDER', start: 31.6, end: 32.2, x: 66, y: 35},
  {text: 'HIP BONE', start: 45.6, end: 46.2, x: 45, y: 62},
];

const Label = ({text, x, y}: {text: string; x: number; y: number}) => (
  <div
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: COLORS.ink,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 24,
      letterSpacing: 4,
      textShadow: '0 2px 18px rgba(0,0,0,.8)',
    }}
  >
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: COLORS.cyan,
        boxShadow: `0 0 14px ${COLORS.cyan}`,
      }}
    />
    <span>{text}</span>
  </div>
);

const ForceMeter = ({progress}: {progress: number}) => {
  const force = interpolate(progress, [0, 0.55, 0.75, 1], [0.9, 0.82, 0.48, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', right: 74, bottom: 190, width: 180}}>
      <div
        style={{
          color: COLORS.dim,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 16,
          letterSpacing: 3,
          marginBottom: 10,
        }}
      >
        PEAK FORCE
      </div>
      <div style={{height: 8, background: 'rgba(110,132,155,.22)', borderRadius: 99}}>
        <div
          style={{
            width: `${force * 100}%`,
            height: '100%',
            background: force > 0.6 ? COLORS.red : COLORS.cyan,
            borderRadius: 99,
            boxShadow: `0 0 14px ${force > 0.6 ? COLORS.red : COLORS.cyan}`,
          }}
        />
      </div>
    </div>
  );
};

export const Overlay: React.FC<{frame: number; fps: number; shot: number; progress: number}> = ({
  frame,
  fps,
  shot,
  progress,
}) => {
  const time = frame / fps;
  const active = LABELS.filter((label) => time >= label.start && time <= label.end);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 38%, rgba(0,0,0,0) 34%, rgba(0,0,0,.48) 100%)',
        }}
      />
      {active.map((label) => (
        <Label key={label.text} text={label.text} x={label.x} y={label.y} />
      ))}
      {shot === 7 ? <ForceMeter progress={progress} /> : null}
    </AbsoluteFill>
  );
};
