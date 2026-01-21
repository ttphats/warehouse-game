"use client";

import { useEffect, useRef } from "react";
import useGameStore from "../store/gameStore";

export default function Game2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    containerPosition,
    containerRotation,
    containerSpeed,
    factories,
    currentFactory,
    updateContainerPosition,
    updateContainerRotation,
    setCurrentFactory,
    addToInventory,
    inventory,
  } = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Local state for position (không trigger re-render)
    let localPosition = { ...containerPosition };
    let localRotation = containerRotation;

    // Keyboard state
    const keys: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;

      // Nhấn E để lấy/giao hàng
      if (e.key.toLowerCase() === "e") {
        factories.forEach((factory) => {
          const dx = localPosition.x - factory.x;
          const dy = localPosition.y - factory.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 80) {
            if (currentFactory === null) {
              // Lấy hàng
              setCurrentFactory(factory.id);
              addToInventory(`Hàng từ ${factory.name}`);
            } else if (currentFactory !== factory.id) {
              // Giao hàng
              setCurrentFactory(null);
            }
          }
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Game loop
    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = "#2d5016";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw roads
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 80;
      ctx.beginPath();
      // Horizontal roads
      ctx.moveTo(0, 100);
      ctx.lineTo(800, 100);
      ctx.moveTo(0, 500);
      ctx.lineTo(800, 500);
      // Vertical roads
      ctx.moveTo(100, 0);
      ctx.lineTo(100, 600);
      ctx.moveTo(700, 0);
      ctx.lineTo(700, 600);
      ctx.stroke();

      // Draw road lines
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 10]);
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.lineTo(800, 100);
      ctx.moveTo(0, 500);
      ctx.lineTo(800, 500);
      ctx.moveTo(100, 0);
      ctx.lineTo(100, 600);
      ctx.moveTo(700, 0);
      ctx.lineTo(700, 600);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw factories
      factories.forEach((factory) => {
        ctx.fillStyle = factory.color;
        ctx.fillRect(factory.x - 40, factory.y - 40, 80, 80);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeRect(factory.x - 40, factory.y - 40, 80, 80);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(factory.name, factory.x, factory.y - 50);
      });

      // Update container position
      if (keys["w"] || keys["arrowup"]) {
        localPosition.x += Math.sin(localRotation) * containerSpeed;
        localPosition.y -= Math.cos(localRotation) * containerSpeed;
      }
      if (keys["s"] || keys["arrowdown"]) {
        localPosition.x -= Math.sin(localRotation) * containerSpeed;
        localPosition.y += Math.cos(localRotation) * containerSpeed;
      }
      if (keys["a"] || keys["arrowleft"]) {
        localRotation -= 0.05;
      }
      if (keys["d"] || keys["arrowright"]) {
        localRotation += 0.05;
      }

      // Keep container in bounds
      localPosition.x = Math.max(30, Math.min(770, localPosition.x));
      localPosition.y = Math.max(30, Math.min(570, localPosition.y));

      // Draw container truck
      ctx.save();
      ctx.translate(localPosition.x, localPosition.y);
      ctx.rotate(localRotation);

      // Container body
      ctx.fillStyle = inventory.length > 0 ? "#FFD700" : "#4A90E2";
      ctx.fillRect(-15, -25, 30, 50);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -25, 30, 50);

      // Container code
      ctx.fillStyle = "#000";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CONT", 0, -5);
      ctx.fillText("1234567", 0, 5);

      // Truck cab
      ctx.fillStyle = "#E74C3C";
      ctx.fillRect(-12, -30, 24, 10);
      ctx.strokeRect(-12, -30, 24, 10);

      ctx.restore();

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    containerSpeed,
    factories,
    currentFactory,
    setCurrentFactory,
    addToInventory,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        display: "block",
        margin: "0 auto",
        border: "2px solid #333",
        background: "#2d5016",
      }}
    />
  );
}
