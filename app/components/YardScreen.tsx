"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Button, Tag, Space, message } from "antd";
import { CheckCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { Container, Driver } from "../types";

interface YardScreenProps {
  container: Container;
  driver: Driver;
  containerStatus: "empty" | "full";
  onComplete: () => void;
}

interface YardSlot {
  row: number;
  col: number;
  occupied: boolean;
  containerId?: string;
}

export default function YardScreen({
  container,
  driver,
  containerStatus,
  onComplete,
}: YardScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [truckPosition, setTruckPosition] = useState({ x: 50, y: 300 });
  const [targetSlot, setTargetSlot] = useState<YardSlot | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [taskComplete, setTaskComplete] = useState(false);

  // Yard grid: 5 rows x 10 columns
  const ROWS = 5;
  const COLS = 10;
  const SLOT_WIDTH = 60;
  const SLOT_HEIGHT = 40;
  const YARD_START_X = 100;
  const YARD_START_Y = 50;

  const [yardSlots] = useState<YardSlot[]>(() => {
    const slots: YardSlot[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        slots.push({
          row,
          col,
          occupied: Math.random() > 0.7, // 30% occupied randomly
        });
      }
    }
    return slots;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = "#2d3748";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw yard grid
      yardSlots.forEach((slot) => {
        const x = YARD_START_X + slot.col * SLOT_WIDTH;
        const y = YARD_START_Y + slot.row * SLOT_HEIGHT;

        if (slot.occupied) {
          // Occupied slot - draw container
          ctx.fillStyle = "#e53e3e";
          ctx.fillRect(x, y, SLOT_WIDTH - 4, SLOT_HEIGHT - 4);
        } else {
          // Empty slot
          ctx.strokeStyle = "#4a5568";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, SLOT_WIDTH - 4, SLOT_HEIGHT - 4);
        }

        // Slot label
        ctx.fillStyle = "#a0aec0";
        ctx.font = "10px Arial";
        ctx.fillText(
          `${String.fromCharCode(65 + slot.row)}${slot.col + 1}`,
          x + 5,
          y + 15
        );

        // Highlight target slot
        if (targetSlot && targetSlot.row === slot.row && targetSlot.col === slot.col) {
          ctx.strokeStyle = "#48bb78";
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 2, y - 2, SLOT_WIDTH, SLOT_HEIGHT);
        }
      });

      // Draw truck
      ctx.fillStyle = containerStatus === "full" ? "#f6ad55" : "#4299e1";
      ctx.fillRect(truckPosition.x - 15, truckPosition.y - 10, 30, 20);
      ctx.fillStyle = "#e53e3e";
      ctx.fillRect(truckPosition.x - 15, truckPosition.y - 15, 30, 8);

      // Container code on truck
      ctx.fillStyle = "#fff";
      ctx.font = "8px monospace";
      ctx.fillText(container.code.slice(0, 8), truckPosition.x - 12, truckPosition.y);

      requestAnimationFrame(draw);
    };

    draw();
  }, [truckPosition, targetSlot, yardSlots, container.code, containerStatus]);

  const handleSlotClick = (slot: YardSlot) => {
    if (slot.occupied) {
      message.warning("Vị trí này đã có container!");
      return;
    }

    setTargetSlot(slot);
    setIsMoving(true);

    const targetX = YARD_START_X + slot.col * SLOT_WIDTH + SLOT_WIDTH / 2;
    const targetY = YARD_START_Y + slot.row * SLOT_HEIGHT + SLOT_HEIGHT / 2;

    // Animate truck movement
    const startX = truckPosition.x;
    const startY = truckPosition.y;
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentX = startX + (targetX - startX) * progress;
      const currentY = startY + (targetY - startY) * progress;

      setTruckPosition({ x: currentX, y: currentY });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsMoving(false);
        setTaskComplete(true);
        message.success(`Container đã được đặt tại vị trí ${String.fromCharCode(65 + slot.row)}${slot.col + 1}!`);
      }
    };

    animate();
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Card
        style={{ marginBottom: 20, width: "100%", maxWidth: 800 }}
        title={
          <Space>
            <EnvironmentOutlined />
            <span>Container Yard - Đặt Container vào vị trí</span>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <strong>Container:</strong> <Tag color="blue">{container.code}</Tag>
            <strong>Tài xế:</strong> <Tag color="green">{driver.name}</Tag>
            <strong>Trạng thái:</strong>{" "}
            <Tag color={containerStatus === "empty" ? "default" : "orange"}>
              {containerStatus === "empty" ? "Rỗng" : "Đầy hàng"}
            </Tag>
          </div>
          <div style={{ color: "#666", fontSize: 12 }}>
            {!targetSlot && "👆 Click vào ô trống (màu xám) để đặt container"}
            {targetSlot && !taskComplete && "🚛 Đang di chuyển..."}
            {taskComplete && "✅ Hoàn thành! Container đã được đặt vào yard"}
          </div>
        </Space>
      </Card>

      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        style={{
          border: "2px solid #4a5568",
          borderRadius: 8,
          cursor: isMoving ? "wait" : "pointer",
          background: "#2d3748",
        }}
        onClick={(e) => {
          if (isMoving || taskComplete) return;

          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Find clicked slot
          const col = Math.floor((x - YARD_START_X) / SLOT_WIDTH);
          const row = Math.floor((y - YARD_START_Y) / SLOT_HEIGHT);

          if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            const slot = yardSlots.find((s) => s.row === row && s.col === col);
            if (slot) handleSlotClick(slot);
          }
        }}
      />

      {taskComplete && (
        <Button
          type="primary"
          size="large"
          icon={<CheckCircleOutlined />}
          onClick={onComplete}
          style={{ marginTop: 20 }}
        >
          Hoàn thành và Check-Out
        </Button>
      )}
    </div>
  );
}

