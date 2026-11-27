import type React from 'react';
import {COLORS} from './theme';

type MannequinProps = {
  shot: number;
  progress: number;
};

const Belt = ({glow}: {glow: number}) => {
  return (
    <group>
      <mesh position={[0, 0.06, 0.19]}>
        <boxGeometry args={[0.54, 0.07, 0.08]} />
        <meshStandardMaterial
          color="#1d2b3a"
          emissive={COLORS.cyan}
          emissiveIntensity={glow}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.42, 0.19]} rotation={[0, 0, 0.52]}>
        <boxGeometry args={[0.07, 0.82, 0.07]} />
        <meshStandardMaterial
          color="#1d2b3a"
          emissive={COLORS.cyan}
          emissiveIntensity={glow}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0.2, 0.02, 0.21]}>
        <boxGeometry args={[0.055, 0.09, 0.06]} />
        <meshStandardMaterial color={COLORS.cyan} emissive={COLORS.cyan} emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
};

export const Mannequin: React.FC<MannequinProps> = ({shot, progress}) => {
  const lean = shot === 3 ? Math.sin(progress * Math.PI) * 0.16 : 0;
  const glow = shot === 5 || shot === 6 || shot === 8 ? 1.1 : 0.25;
  const bonesVisible = shot === 6 || shot === 8;

  return (
    <group rotation={[lean, 0, 0]}>
      <mesh position={[0, 0.02, 0]} scale={[0.72, 0.38, 0.5]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color={COLORS.mannequin} roughness={0.55} />
      </mesh>

      <mesh position={[0, 0.42, 0]}>
        <capsuleGeometry args={[0.17, 0.44, 6, 12]} />
        <meshStandardMaterial color={COLORS.mannequin} roughness={0.55} />
      </mesh>

      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.12, 12]} />
        <meshStandardMaterial color={COLORS.mannequinDark} roughness={0.6} />
      </mesh>

      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial color={COLORS.mannequin} roughness={0.45} />
      </mesh>

      <mesh position={[-0.28, 0.42, 0.01]} rotation={[0, 0, 0.28]}>
        <capsuleGeometry args={[0.055, 0.38, 4, 8]} />
        <meshStandardMaterial color={COLORS.mannequinDark} roughness={0.6} />
      </mesh>
      <mesh position={[0.28, 0.42, 0.01]} rotation={[0, 0, -0.28]}>
        <capsuleGeometry args={[0.055, 0.38, 4, 8]} />
        <meshStandardMaterial color={COLORS.mannequinDark} roughness={0.6} />
      </mesh>

      <mesh position={[-0.11, -0.32, 0]}>
        <capsuleGeometry args={[0.07, 0.46, 4, 8]} />
        <meshStandardMaterial color={COLORS.mannequinDark} roughness={0.6} />
      </mesh>
      <mesh position={[0.11, -0.32, 0]}>
        <capsuleGeometry args={[0.07, 0.46, 4, 8]} />
        <meshStandardMaterial color={COLORS.mannequinDark} roughness={0.6} />
      </mesh>

      <Belt glow={glow} />

      <mesh position={[0, 0.04, 0.2]} visible={bonesVisible}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={COLORS.bone} />
      </mesh>
      <mesh position={[0, 0.5, 0.2]} visible={bonesVisible}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={COLORS.bone} />
      </mesh>
      <mesh position={[0.23, 0.68, 0.12]} visible={bonesVisible}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={COLORS.bone} />
      </mesh>
    </group>
  );
};
