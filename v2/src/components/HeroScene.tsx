import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { HERO_PROJECTS, type ShapeKind } from '../data/projects';

const RADIUS_3D = 1.95;
const ELECTRIC = '#7c96ff';
const IDLE_COLOR = '#3a3f4d';
const EDGE_IDLE = '#4a4f5c';

function nodePosition(angleDeg: number): [number, number, number] {
  const theta = (angleDeg * Math.PI) / 180;
  return [RADIUS_3D * Math.sin(theta), RADIUS_3D * Math.cos(theta), 0];
}

interface ModuleNodeProps {
  id: string;
  index: string;
  angle: number;
  shape: ShapeKind;
  active: boolean;
  onSelect: (id: string) => void;
}

function ModuleNode({ id, index, angle, shape, active, onSelect }: ModuleNodeProps) {
  const [hovered, setHovered] = useState(false);
  const position = nodePosition(angle);
  const highlighted = active || hovered;

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  const handlers = {
    scale: highlighted ? 1.15 : 1,
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onSelect(id);
    },
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setHovered(true);
    },
    onPointerOut: () => setHovered(false),
  };

  const material = (
    <meshStandardMaterial
      color={highlighted ? ELECTRIC : IDLE_COLOR}
      emissive={highlighted ? ELECTRIC : '#20242e'}
      emissiveIntensity={active ? 0.4 : hovered ? 0.2 : 0.4}
      roughness={0.3}
      metalness={0.3}
    />
  );

  return (
    <group>
      <Line
        points={[[0, 0, 0], position]}
        color={active ? ELECTRIC : EDGE_IDLE}
        lineWidth={active ? 2 : 1}
        transparent
        opacity={active ? 1 : 0.5}
      />

      {shape === 'box' && (
        <RoundedBox args={[0.72, 0.56, 0.3]} radius={0.08} smoothness={4} position={position} {...handlers}>
          {material}
        </RoundedBox>
      )}
      {shape === 'icosahedron' && (
        <mesh position={position} {...handlers}>
          <icosahedronGeometry args={[0.42, 0]} />
          {material}
        </mesh>
      )}
      {shape === 'octahedron' && (
        <mesh position={position} {...handlers}>
          <octahedronGeometry args={[0.46, 0]} />
          {material}
        </mesh>
      )}
      {shape === 'dodecahedron' && (
        <mesh position={position} {...handlers}>
          <dodecahedronGeometry args={[0.42, 0]} />
          {material}
        </mesh>
      )}
      {shape === 'torus' && (
        <mesh position={position} {...handlers}>
          <torusGeometry args={[0.32, 0.14, 12, 28]} />
          {material}
        </mesh>
      )}
      {shape === 'tetrahedron' && (
        <mesh position={position} {...handlers}>
          <tetrahedronGeometry args={[0.5, 0]} />
          {material}
        </mesh>
      )}

      <Html position={position} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            color: highlighted ? '#08090c' : 'rgba(244,243,238,0.75)',
            background: highlighted ? ELECTRIC : 'rgba(17,19,25,0.75)',
            borderRadius: '999px',
            padding: '3px 8px',
            whiteSpace: 'nowrap',
            transform: 'translateY(38px)',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {index}
        </div>
      </Html>
    </group>
  );
}

interface SceneProps {
  activeId: string;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
}

function Scene({ activeId, reducedMotion, onSelect }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const hub = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const finePointer =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reducedMotion || !finePointer) return;
    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    }
    canvas.addEventListener('pointermove', onMove);
    return () => canvas.removeEventListener('pointermove', onMove);
  }, [gl, reducedMotion]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (group.current) {
      const targetX = pointer.current.y * 0.16;
      const targetY = pointer.current.x * 0.22;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.06);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.06);
    }
    if (hub.current) hub.current.rotation.z += delta * 0.12;
  });

  return (
    <group ref={group}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 5]} intensity={0.7} color={ELECTRIC} />
      <directionalLight position={[-3, -2, 3]} intensity={0.25} color="#ff8a52" />

      <mesh ref={hub}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color={IDLE_COLOR}
          emissive={ELECTRIC}
          emissiveIntensity={0.55}
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>

      {HERO_PROJECTS.map((p) => (
        <ModuleNode
          key={p.id}
          id={p.id}
          index={p.index}
          angle={p.heroAngle}
          shape={p.shape}
          active={p.id === activeId}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

interface HeroSceneProps {
  activeId: string;
  reducedMotion: boolean;
  inView: boolean;
  onSelect: (id: string) => void;
}

export default function HeroScene({ activeId, reducedMotion, inView, onSelect }: HeroSceneProps) {
  const frameloop = reducedMotion ? 'demand' : inView ? 'always' : 'never';
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={frameloop}
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene activeId={activeId} reducedMotion={reducedMotion} onSelect={onSelect} />
    </Canvas>
  );
}
