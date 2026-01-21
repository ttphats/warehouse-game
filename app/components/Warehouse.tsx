"use client";

import { useRef } from "react";
import useGameStore from "../store/gameStore";
import { WarehouseItem } from "../types";
import * as THREE from "three";

// Component sàn kho
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
}

// Component tường
function Walls() {
  return (
    <group>
      {/* Tường sau */}
      <mesh position={[0, 2.5, -10]} receiveShadow>
        <boxGeometry args={[20, 5, 0.2]} />
        <meshStandardMaterial color="#8b8b8b" />
      </mesh>

      {/* Tường trái */}
      <mesh position={[-10, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 20]} />
        <meshStandardMaterial color="#8b8b8b" />
      </mesh>

      {/* Tường phải */}
      <mesh position={[10, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 20]} />
        <meshStandardMaterial color="#8b8b8b" />
      </mesh>

      {/* Tường trước (có cửa) */}
      <mesh position={[-5, 2.5, 10]} receiveShadow>
        <boxGeometry args={[10, 5, 0.2]} />
        <meshStandardMaterial color="#8b8b8b" />
      </mesh>
      <mesh position={[5, 2.5, 10]} receiveShadow>
        <boxGeometry args={[10, 5, 0.2]} />
        <meshStandardMaterial color="#8b8b8b" />
      </mesh>
    </group>
  );
}

// Component kệ hàng
interface ShelfProps {
  position: [number, number, number];
}

function Shelf({ position }: ShelfProps) {
  return (
    <group position={position}>
      {/* Chân kệ */}
      <mesh position={[-0.9, 0.5, 0]} castShadow>
        <boxGeometry args={[0.1, 1, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[0.9, 0.5, 0]} castShadow>
        <boxGeometry args={[0.1, 1, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>

      {/* Tầng 1 */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* Tầng 2 */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    </group>
  );
}

// Component thùng hàng
interface BoxProps {
  item: WarehouseItem;
}

function Box({ item }: BoxProps) {
  const { collectItem, addToInventory, containerPosition } = useGameStore();
  const meshRef = useRef<THREE.Mesh>(null);

  if (item.collected) return null;

  // Kiểm tra khoảng cách với container
  const distance = Math.sqrt(
    Math.pow(containerPosition[0] - item.position[0], 2) +
      Math.pow(containerPosition[2] - item.position[2], 2),
  );

  const isNear = distance < 2;

  return (
    <mesh
      ref={meshRef}
      position={item.position}
      castShadow
      onClick={() => {
        if (isNear) {
          collectItem(item.id);
          addToInventory(item);
        }
      }}
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial
        color={isNear ? "#4CAF50" : "#ff9800"}
        emissive={isNear ? "#4CAF50" : "#000000"}
        emissiveIntensity={isNear ? 0.3 : 0}
      />
    </mesh>
  );
}

// Component chính Warehouse
export default function Warehouse() {
  const { warehouseItems } = useGameStore();

  return (
    <group>
      <Floor />
      <Walls />

      {/* Kệ hàng */}
      <Shelf position={[-6, 0, -6]} />
      <Shelf position={[-6, 0, 0]} />
      <Shelf position={[-6, 0, 6]} />
      <Shelf position={[6, 0, -6]} />
      <Shelf position={[6, 0, 0]} />
      <Shelf position={[6, 0, 6]} />

      {/* Thùng hàng */}
      {warehouseItems.map((item) => (
        <Box key={item.id} item={item} />
      ))}
    </group>
  );
}
