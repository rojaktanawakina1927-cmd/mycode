import type React from 'react';
import {Composition} from 'remotion';
import plan from './data/shot_plan.json';
import {SeatBeltShort} from './videos/seatbelt/SeatBeltShort';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SeatBeltShort"
      component={SeatBeltShort}
      durationInFrames={plan.duration_frames}
      fps={plan.fps}
      width={plan.width}
      height={plan.height}
    />
  );
};
