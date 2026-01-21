"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import useGameStore from "../store/gameStore";
import * as THREE from "three";

export default function Container() {
  const meshRef = useRef<THREE.Group>(null);
  const { forward, backward, left, right } = useKeyboardControls();
  const {
    containerPosition,
    containerRotation,
    containerSpeed,
    updateContainerPosition,
    updateContainerRotation,
  } = useGameStore();

  const rotation = useRef(containerRotation);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const speed = containerSpeed;
    const rotationSpeed = 2;

    // Xử lý xoay
    if (left) {
      rotation.current += rotationSpeed * delta;
    }
    if (right) {
      rotation.current -= rotationSpeed * delta;
    }

    // Xử lý di chuyển
    const direction = new THREE.Vector3();
    if (forward) {
      direction.z = -1;
    }
    if (backward) {
      direction.z = 1;
    }

    // Áp dụng rotation vào direction
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.current);
    direction.multiplyScalar(speed);

    // Cập nhật vị trí
    const newPosition = new THREE.Vector3(...containerPosition).add(direction);

    // Giới hạn trong kho (20x20)
    newPosition.x = Math.max(-9, Math.min(9, newPosition.x));
    newPosition.z = Math.max(-9, Math.min(9, newPosition.z));

    // Cập nhật store
    updateContainerPosition([newPosition.x, newPosition.y, newPosition.z]);
    updateContainerRotation(rotation.current);

    // Cập nhật mesh
    meshRef.current.position.set(newPosition.x, newPosition.y, newPosition.z);
    meshRef.current.rotation.y = rotation.current;
  });

  return (
    <group ref={meshRef} position={containerPosition}>
      {/* Thân xe */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.5, 2]} />
        <meshStandardMaterial color="#ff6b35" />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.5, -0.7]} castShadow>
        <boxGeometry args={[1.2, 0.6, 0.6]} />
        <meshStandardMaterial color="#004e89" />
      </mesh>

      {/* Bánh xe */}
      <mesh
        position={[-0.6, -0.3, 0.7]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh
        position={[0.6, -0.3, 0.7]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh
        position={[-0.6, -0.3, -0.7]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh
        position={[0.6, -0.3, -0.7]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Đèn phía trước */}
      <mesh position={[-0.4, 0.2, -1.1]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0.4, 0.2, -1.1]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
