import type React from 'react';
import {interpolate} from 'remotion';
import {Vector3, Quaternion} from 'three';
import {COLORS} from './theme';
import {CameraRig} from './CameraRig';
import {Mannequin} from './Mannequin';

const CarInterior = () => (
  <group>
    <mesh position={[0, -0.8, 0]}>
      <boxGeometry args={[2.25, 0.07, 1.5]} />
      <meshStandardMaterial color={COLORS.panel} roughness={0.8} />
    </mesh>
    <mesh position={[0, 0.05, -0.72]}>
      <boxGeometry args={[2.25, 1.75, 0.07]} />
      <meshStandardMaterial color={COLORS.panel} roughness={0.85} />
    </mesh>
    <mesh position={[0, -0.78, -0.16]}>
      <boxGeometry args={[0.82, 0.14, 0.6]} />
      <meshStandardMaterial color={COLORS.seat} roughness={0.7} />
    </mesh>
    <mesh position={[0, -0.34, -0.4]}>
      <boxGeometry args={[0.74, 0.95, 0.14]} />
      <meshStandardMaterial color={COLORS.seat} roughness={0.7} />
    </mesh>
    <mesh position={[0, -0.02, 0.72]}>
      <boxGeometry args={[1.85, 0.32, 0.18]} />
      <meshStandardMaterial color={COLORS.seat} roughness={0.75} />
    </mesh>
    <mesh position={[-1.08, -0.18, 0]}>
      <boxGeometry args={[0.06, 1.25, 1.0]} />
      <meshStandardMaterial color={COLORS.seat} roughness={0.8} />
    </mesh>
    <mesh position={[1.08, -0.18, 0]}>
      <boxGeometry args={[0.06, 1.25, 1.0]} />
      <meshStandardMaterial color={COLORS.seat} roughness={0.8} />
    </mesh>
  </group>
);

const Barrier = () => (
  <group position={[-1.45, 0.15, 0]}>
    <mesh>
      <boxGeometry args={[0.2, 1.5, 1.4]} />
      <meshStandardMaterial color="#243247" roughness={0.85} />
    </mesh>
    <mesh position={[0.11, 0, 0]}>
      <boxGeometry args={[0.02, 1.3, 1.2]} />
      <meshBasicMaterial color={COLORS.cyan} />
    </mesh>
  </group>
);

const Ghost = ({progress}: {progress: number}) => {
  const opacity = interpolate(progress, [0, 0.45, 1], [0, 0.18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <mesh position={[0, 0.55, 0.9]}>
      <capsuleGeometry args={[0.15, 0.5, 4, 8]} />
      <meshBasicMaterial color={COLORS.cyan} transparent opacity={opacity} />
    </mesh>
  );
};

const Arrow = ({from, to}: {from: [number, number, number]; to: [number, number, number]}) => {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const quaternion = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.clone().normalize(),
  );

  return (
    <group>
      <mesh position={midpoint} quaternion={quaternion}>
        <cylinderGeometry args={[0.008, 0.008, length, 8]} />
        <meshBasicMaterial color={COLORS.cyan} />
      </mesh>
      <mesh position={end} quaternion={quaternion}>
        <coneGeometry args={[0.035, 0.1, 10]} />
        <meshBasicMaterial color={COLORS.cyan} />
      </mesh>
    </group>
  );
};

const ForceArrows = () => (
  <group visible>
    <Arrow from={[-0.8, 0.04, 0.5]} to={[0, 0.04, 0.2]} />
    <Arrow from={[0.8, 0.5, 0.5]} to={[0, 0.5, 0.2]} />
    <Arrow from={[0.7, 0.75, 0.5]} to={[0.23, 0.68, 0.12]} />
  </group>
);

const BallScene = ({progress}: {progress: number}) => {
  const catchT = interpolate(progress, [0.1, 0.52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pullT = interpolate(progress, [0.62, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ballX = -0.8 + catchT * 1.05;
  const handX = 0.48 + pullT * 0.28;

  return (
    <group>
      <mesh position={[ballX, 0.18, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#ff9f43" roughness={0.4} />
      </mesh>
      <group position={[handX, 0.12, 0]}>
        <mesh scale={[0.36, 0.24, 0.22]}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#a9b7c6" roughness={0.6} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.12, -0.05 + i * 0.05, 0.05]} rotation={[0, 0, -0.2]}>
            <capsuleGeometry args={[0.032, 0.18, 4, 8]} />
            <meshStandardMaterial color="#a9b7c6" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const CarScene = ({shot, progress}: {shot: number; progress: number}) => {
  const impact = shot === 2 ? Math.min(1, progress * 4) : 0;
  const carX = shot === 2 ? -0.35 * impact : 0;
  return (
    <group>
      <CarInterior />
      {shot === 2 ? <Barrier /> : null}
      <group position={[carX, 0, 0]}>
        <Mannequin shot={shot} progress={progress} />
      </group>
      {shot === 3 || shot === 4 ? <Ghost progress={progress} /> : null}
      {shot === 6 ? <ForceArrows /> : null}
    </group>
  );
};

export const Scene: React.FC<{shot: number; progress: number}> = ({shot, progress}) => {
  return (
    <>
      <color attach="background" args={[COLORS.bg]} />
      <fog attach="fog" args={[COLORS.bg, 4, 10]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 4]} intensity={2.1} />
      <pointLight position={[-3, 1, 2]} color={COLORS.cyan} intensity={2.2} />
      <CameraRig shot={shot} progress={progress} />
      {shot === 7 ? <BallScene progress={progress} /> : <CarScene shot={shot} progress={progress} />}
    </>
  );
};
