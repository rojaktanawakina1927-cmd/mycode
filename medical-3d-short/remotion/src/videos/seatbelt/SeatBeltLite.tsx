import type React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import plan from '../../data/shot_plan.json';
import {Overlay} from './Overlay';
import {COLORS} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Background: React.FC = () => (
  <AbsoluteFill>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 50% 34%, #0d1b2b 0%, #05080f 58%, #02040a 100%)',
      }}
    />
    <svg
      viewBox="0 0 1080 1920"
      width="100%"
      height="100%"
      style={{position: 'absolute', inset: 0, opacity: 0.16}}
    >
      {Array.from({length: 15}).map((_, i) => (
        <line key={`v${i}`} x1={i * 80} y1={0} x2={i * 80} y2={1920} stroke="#39627a" strokeWidth={1} />
      ))}
      {Array.from({length: 24}).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 80} x2={1080} y2={i * 80} stroke="#39627a" strokeWidth={1} />
      ))}
    </svg>
  </AbsoluteFill>
);

const Mannequin: React.FC<{
  lean?: number;
  beltGlow?: number;
  bones?: boolean;
  arrows?: boolean;
}> = ({lean = 0, beltGlow = 0.45, bones = false, arrows = false}) => (
  <g transform={`translate(540 980) rotate(${lean})`}>
    <ellipse cx={0} cy={-390} rx={105} ry={128} fill="#8795a7" />
    <path d="M -95 -270 Q 0 -310 95 -270 L 110 40 Q 0 90 -110 40 Z" fill="#738396" />
    <path d="M -95 -245 L -220 -20" stroke="#4b5b6d" strokeWidth={42} strokeLinecap="round" />
    <path d="M 95 -245 L 220 -20" stroke="#4b5b6d" strokeWidth={42} strokeLinecap="round" />
    <path d="M -55 35 L -85 300" stroke="#4b5b6d" strokeWidth={52} strokeLinecap="round" />
    <path d="M 55 35 L 85 300" stroke="#4b5b6d" strokeWidth={52} strokeLinecap="round" />
    <ellipse cx={-85} cy={315} rx={52} ry={24} fill="#3d4c5d" />
    <ellipse cx={85} cy={315} rx={52} ry={24} fill="#3d4c5d" />
    <path d="M -100 -225 L 120 5" stroke="#203142" strokeWidth={34} strokeLinecap="round" />
    <path d="M -100 -225 L 120 5" stroke={COLORS.cyan} strokeWidth={9} strokeLinecap="round" opacity={beltGlow} />
    <rect x={-195} y={-35} width={390} height={58} rx={29} fill="#203142" />
    <rect x={-195} y={-35} width={390} height={58} rx={29} fill="none" stroke={COLORS.cyan} strokeWidth={7} opacity={beltGlow} />
    <rect x={150} y={-25} width={44} height={38} rx={8} fill={COLORS.cyan} opacity={beltGlow} />
    {bones ? (
      <g fill={COLORS.bone}>
        <circle cx={0} cy={-8} r={13} />
        <circle cx={0} cy={-195} r={13} />
        <circle cx={135} cy={-230} r={13} />
      </g>
    ) : null}
    {arrows ? (
      <g stroke={COLORS.cyan} strokeWidth={5} fill="none">
        <path d="M -360 30 L -80 5" />
        <path d="M 360 -190 L 55 -195" />
        <path d="M 300 -300 L 155 -235" />
        <path d="M -80 5 l 28 -12 l -6 28" fill={COLORS.cyan} stroke="none" />
        <path d="M 55 -195 l 28 -12 l -6 28" fill={COLORS.cyan} stroke="none" />
        <path d="M 155 -235 l 28 -12 l -6 28" fill={COLORS.cyan} stroke="none" />
      </g>
    ) : null}
  </g>
);

const CarSide: React.FC<{progress: number}> = ({progress}) => {
  const shift = interpolate(progress, [0, 0.25, 1], [80, -30, -30], clamp);
  const shake = Math.sin(progress * 90) * Math.max(0, 1 - progress * 3) * 8;
  return (
    <g transform={`translate(${shift} ${shake})`}>
      <rect x={220} y={820} width={620} height={260} rx={80} fill="#0d1725" stroke="#2e4b5e" strokeWidth={4} />
      <path d="M 300 830 L 380 690 L 690 690 L 760 830" fill="#101e2c" stroke="#2e4b5e" strokeWidth={4} />
      <rect x={390} y={710} width={270} height={95} rx={28} fill="#193143" opacity={0.8} />
      <circle cx={345} cy={1085} r={70} fill="#081019" stroke="#2e4b5e" strokeWidth={8} />
      <circle cx={710} cy={1085} r={70} fill="#081019" stroke="#2e4b5e" strokeWidth={8} />
      <rect x={120} y={720} width={90} height={380} rx={20} fill="#20384a" />
      <rect x={900} y={720} width={90} height={380} rx={20} fill="#20384a" />
      <g transform="translate(540 950) scale(0.72)">
        <Mannequin lean={8} beltGlow={1.2} />
      </g>
      <g stroke={COLORS.cyan} strokeWidth={5} opacity={0.8}>
        <path d="M 850 760 L 980 760" />
        <path d="M 870 800 L 1000 800" />
        <path d="M 890 840 L 1020 840" />
      </g>
    </g>
  );
};

const MacroBelt: React.FC<{progress: number}> = ({progress}) => {
  const glow = interpolate(progress, [0, 0.4, 1], [0.35, 1.1, 0.65], clamp);
  const curve = interpolate(progress, [0, 0.55, 1], [520, 430, 290], clamp);
  return (
    <g>
      <rect x={170} y={560} width={740} height={150} rx={75} fill="#1b2b3a" transform="rotate(-18 540 635)" />
      <rect x={170} y={560} width={740} height={150} rx={75} fill="none" stroke={COLORS.cyan} strokeWidth={10} opacity={glow} transform="rotate(-18 540 635)" />
      <circle cx={770} cy={720} r={95} fill="#0b1622" stroke={COLORS.cyan} strokeWidth={8} opacity={glow} />
      <circle cx={770} cy={720} r={44} fill="#183144" stroke={COLORS.cyan} strokeWidth={5} opacity={glow} />
      <g stroke={COLORS.cyan} strokeWidth={2} opacity={0.7} fill="none">
        <path d={`M 260 ${curve} C 420 ${curve - 80}, 610 ${curve - 60}, 820 ${curve - 10}`} />
      </g>
      <g fill={COLORS.cyan} opacity={0.9}>
        <circle cx={260} cy={curve} r={7} />
        <circle cx={820} cy={curve - 10} r={7} />
      </g>
    </g>
  );
};

const BallAnalogy: React.FC<{progress: number}> = ({progress}) => {
  const catchT = interpolate(progress, [0.1, 0.52], [0, 1], clamp);
  const pullT = interpolate(progress, [0.62, 1], [0, 1], clamp);
  const ballX = 270 + catchT * 400;
  const handX = 820 + pullT * 90;
  return (
    <g>
      <circle cx={ballX} cy={980} r={95} fill="#ff9f43" />
      <circle cx={ballX - 25} cy={950} r={18} fill="#ffd29a" opacity={0.8} />
      <g transform={`translate(${handX} 980)`}>
        <ellipse cx={0} cy={0} rx={105} ry={72} fill="#a9b7c6" />
        <path d="M -20 -55 L 100 -80" stroke="#a9b7c6" strokeWidth={28} strokeLinecap="round" />
        <path d="M -20 0 L 120 0" stroke="#a9b7c6" strokeWidth={28} strokeLinecap="round" />
        <path d="M -20 55 L 100 80" stroke="#a9b7c6" strokeWidth={28} strokeLinecap="round" />
      </g>
      <g stroke={COLORS.cyan} strokeWidth={3} opacity={0.65}>
        <path d={`M ${ballX + 110} 980 L ${handX - 130} 980`} strokeDasharray="12 14" />
      </g>
    </g>
  );
};

const FitCheck: React.FC<{progress: number}> = ({progress}) => {
  const side = progress > 0.5;
  return (
    <g transform={side ? 'translate(230 0) scale(0.72)' : 'translate(540 0)'}>
      <Mannequin lean={0} beltGlow={1.1} bones />
      <g opacity={0.9}>
        <circle cx={-170} cy={-35} r={34} fill="none" stroke={COLORS.red} strokeWidth={8} />
        <path d="M -194 -59 L -146 -11 M -146 -59 L -194 -11" stroke={COLORS.red} strokeWidth={8} />
      </g>
      {side ? (
        <g transform="translate(380 0)">
          <Mannequin lean={0} beltGlow={0.8} />
          <circle cx={160} cy={-30} r={38} fill="none" stroke={COLORS.red} strokeWidth={8} />
          <path d="M 133 -57 L 187 -3 M 187 -57 L 133 -3" stroke={COLORS.red} strokeWidth={8} />
        </g>
      ) : null}
    </g>
  );
};

const ShotVisual: React.FC<{shot: number; progress: number}> = ({shot, progress}) => {
  if (shot === 2) return <CarSide progress={progress} />;
  if (shot === 5) return <MacroBelt progress={progress} />;
  if (shot === 7) return <BallAnalogy progress={progress} />;
  if (shot === 8) return <FitCheck progress={progress} />;

  if (shot === 4) {
    return (
      <g>
        <rect x={250} y={690} width={580} height={540} rx={90} fill="#0d1725" stroke="#2e4b5e" strokeWidth={4} />
        <g transform="translate(540 960) scale(0.55)">
          <Mannequin beltGlow={0.9} />
        </g>
        <path d="M 700 820 C 900 740, 980 620, 880 520" fill="none" stroke={COLORS.cyan} strokeWidth={5} strokeDasharray="14 16" opacity={0.8} />
      </g>
    );
  }

  const lean = shot === 3 ? Math.sin(progress * Math.PI) * 18 : 0;
  const glow = shot === 1 || shot === 9 ? 1.1 : 0.75;
  return (
    <g>
      <Mannequin lean={lean} beltGlow={glow} bones={shot === 6} arrows={shot === 6} />
      {shot === 1 ? (
        <g>
          <rect x={420} y={820} width={300} height={8} rx={4} fill={COLORS.cyan} opacity={0.8} />
          <circle cx={720} cy={825} r={18} fill={COLORS.cyan} opacity={0.9} />
        </g>
      ) : null}
      {shot === 9 ? (
        <g>
          <rect x={300} y={930} width={520} height={74} rx={37} fill="#1b2b3a" stroke={COLORS.cyan} strokeWidth={8} />
          <rect x={705} y={945} width={70} height={44} rx={10} fill={COLORS.cyan} />
        </g>
      ) : null}
    </g>
  );
};

export const SeatBeltLite: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shots = plan.shots;
  const shot = shots.find((item) => frame >= item.start && frame < item.end) ?? shots[shots.length - 1];
  const duration = Math.max(1, shot.end - shot.start);
  const progress = Math.min(1, Math.max(0, (frame - shot.start) / duration));

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <Background />
      <svg
        viewBox="0 0 1080 1920"
        width="100%"
        height="100%"
        style={{position: 'absolute', inset: 0}}
      >
        <defs>
          <radialGradient id="glow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#1d3b50" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#05080f" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#glow)" />
        <ShotVisual shot={shot.id} progress={progress} />
      </svg>
      <Overlay frame={frame} fps={fps} shot={shot.id} progress={progress} />
      <Audio src={staticFile('voice.wav')} />
    </AbsoluteFill>
  );
};
