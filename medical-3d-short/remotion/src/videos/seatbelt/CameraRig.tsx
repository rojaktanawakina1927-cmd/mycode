import type React from 'react';
import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import type {PerspectiveCamera} from 'three';
import {COLORS} from './theme';

type CameraConfig = {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  drift?: number;
};

const CAMERAS: Record<number, CameraConfig> = {
  1: {pos: [0, 0.38, 1.35], look: [0, 0.28, 0.15], fov: 30, drift: 0.08},
  2: {pos: [3.2, 0.25, 2.0], look: [0, 0.25, 0], fov: 35},
  3: {pos: [0.35, 0.35, 2.2], look: [0, 0.3, 0], fov: 32, drift: 0.08},
  4: {pos: [0, 2.6, 1.6], look: [0, 0.15, 0], fov: 35},
  5: {pos: [0.45, 0.25, 1.0], look: [0, 0.3, 0.2], fov: 28, drift: 0.05},
  6: {pos: [0.45, 0.35, 2.5], look: [0, 0.3, 0], fov: 30, drift: 0.06},
  7: {pos: [0, 0.2, 2.0], look: [0, 0.15, 0], fov: 30, drift: 0.05},
  8: {pos: [0, 0.3, 2.6], look: [0, 0.3, 0], fov: 30, drift: 0.04},
  80: {pos: [2.2, 0.3, 1.6], look: [0, 0.3, 0], fov: 32},
  9: {pos: [0, 0.2, 1.35], look: [0, 0.1, 0.2], fov: 28, drift: 0.08},
};

export const CameraRig: React.FC<{shot: number; progress: number}> = ({shot, progress}) => {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  useLayoutEffect(() => {
    const config = shot === 8 && progress > 0.5 ? CAMERAS[80] : CAMERAS[shot] ?? CAMERAS[1];
    const drift = config.drift ?? 0;

    camera.position.set(config.pos[0], config.pos[1], config.pos[2] - drift * progress);
    camera.lookAt(config.look[0], config.look[1], config.look[2]);
    camera.fov = config.fov;
    camera.updateProjectionMatrix();
  }, [camera, shot, progress]);

  return <color attach="background" args={[COLORS.bg]} />;
};
