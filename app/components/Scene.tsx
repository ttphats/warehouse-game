"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment } from "@react-three/drei";
import Container from "./Container";
import Warehouse from "./Warehouse";
import useGameStore from "../store/gameStore";

function Lights() {
  return (
    <>
      {/* Ánh sáng môi trường */}
      <ambientLight intensity={0.4} />

      {/* Ánh sáng chính */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Ánh sáng điểm */}
      <pointLight position={[-10, 5, -10]} intensity={0.5} />
      <pointLight position={[10, 5, 10]} intensity={0.5} />
    </>
  );
}

function CameraController() {
  const { containerPosition } = useGameStore();

  return (
    <OrbitControls
      target={containerPosition}
      maxPolarAngle={Math.PI / 2.5}
      minDistance={5}
      maxDistance={30}
      enablePan={true}
    />
  );
}

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [15, 15, 15], fov: 50 }}
      style={{ background: "#87CEEB" }}
    >
      <Sky sunPosition={[100, 20, 100]} />
      <Lights />
      <Warehouse />
      <Container />
      <CameraController />
      <Environment preset="warehouse" />

      {/* Grid helper để dễ nhìn */}
      <gridHelper
        args={[20, 20, "#444444", "#888888"]}
        position={[0, 0.01, 0]}
      />
    </Canvas>
  );
}
