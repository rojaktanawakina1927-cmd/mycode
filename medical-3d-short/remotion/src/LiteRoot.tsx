import type React from 'react';
import {Composition} from 'remotion';
import plan from './data/shot_plan.json';
import {SeatBeltLite} from './videos/seatbelt/SeatBeltLite';

export const LiteRoot: React.FC = () => {
  return (
    <Composition
      id="SeatBeltLite"
      component={SeatBeltLite}
      durationInFrames={plan.duration_frames}
      fps={plan.fps}
      width={plan.width}
      height={plan.height}
    />
  );
};
