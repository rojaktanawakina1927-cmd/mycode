import type React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import plan from '../../data/shot_plan.json';
import {Overlay} from './Overlay';
import {Scene} from './Scene';

export const SeatBeltShort: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const shots = plan.shots;
  const shot = shots.find((item) => frame >= item.start && frame < item.end) ?? shots[shots.length - 1];
  const duration = Math.max(1, shot.end - shot.start);
  const progress = Math.min(1, Math.max(0, (frame - shot.start) / duration));

  return (
    <AbsoluteFill style={{backgroundColor: '#05080f'}}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{fov: 30, near: 0.1, far: 50, position: [0, 0.35, 2.5]}}
      >
        <Scene shot={shot.id} progress={progress} />
      </ThreeCanvas>
      <Overlay frame={frame} fps={fps} shot={shot.id} progress={progress} />
      <Audio src={staticFile('voice.wav')} />
    </AbsoluteFill>
  );
};
