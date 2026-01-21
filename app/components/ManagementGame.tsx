"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Tag, Space, Modal, Radio, Button, message, Select } from "antd";
import { Container, Driver } from "../types";
import mockData from "../data/mockData.json";

type CameraView = "overview" | "yard";

export default function ManagementGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [truckPos, setTruckPos] = useState({ x: 150, y: 500 });
  const [truckRotation, setTruckRotation] = useState(0);
  const [hasContainer, setHasContainer] = useState(false);
  const [containerStatus, setContainerStatus] = useState<"empty" | "full">(
    "empty",
  );
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(
    null,
  );
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showGateModal, setShowGateModal] = useState(false);
  const [showYardModal, setShowYardModal] = useState(false);
  const [gateCheckInDone, setGateCheckInDone] = useState(false);
  const [selectedDoor, setSelectedDoor] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [cameraView, setCameraView] = useState<CameraView>("overview");
  const [yardTruckPos, setYardTruckPos] = useState({ x: 100, y: 500 }); // Position in yard view

  const containers = mockData.containers as Container[];
  const drivers = mockData.drivers as Driver[];

  // Map layout - Top-down Management Board
  const W = 1600;
  const H = 900;

  const ROAD = { x: 0, y: 450, w: W, h: 150 };
  const GATE = { x: 700, y: 300, w: 150, h: 150 };
  const FACTORY = { x: 950, y: 100, w: 600, h: 300 };
  const YARD = { x: 950, y: 450, w: 600, h: 350 };

  const DOORS = [
    { id: 1, x: 1000, y: 380 },
    { id: 2, x: 1180, y: 380 },
    { id: 3, x: 1360, y: 380 },
  ];

  const SLOTS: any[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      SLOTS.push({
        id: `${String.fromCharCode(65 + r)}${c + 1}`,
        x: YARD.x + 30 + c * 70,
        y: YARD.y + 50 + r * 90,
        w: 65,
        h: 80,
        occupied: Math.random() > 0.65,
      });
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let pos = { ...truckPos };
    let rot = truckRotation;
    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;

      // Tab to switch camera view
      if (e.key === "Tab") {
        e.preventDefault();
        if (cameraView === "yard") {
          setCameraView("overview");
          message.info("📹 Quay về Overview");
        }
      }

      if (e.key.toLowerCase() === "e") {
        if (cameraView === "overview") {
          const atGate =
            pos.x > GATE.x &&
            pos.x < GATE.x + GATE.w &&
            pos.y > GATE.y &&
            pos.y < GATE.y + GATE.h;
          const atYard =
            pos.x > YARD.x &&
            pos.x < YARD.x + YARD.w &&
            pos.y > YARD.y &&
            pos.y < YARD.y + YARD.h;

          if (atGate && !gateCheckInDone) setShowGateModal(true);
          if (atYard && gateCheckInDone && hasContainer) {
            // Switch to Yard camera
            setCameraView("yard");
            setYardTruckPos({ x: 100, y: 500 });
            message.success("📹 Chuyển sang Yard Management View");
          }
        } else if (cameraView === "yard") {
          // In yard, press E to park
          setShowYardModal(true);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const draw = () => {
      // Background
      ctx.fillStyle = "#3a5a40";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, H);
        ctx.stroke();
      }
      for (let i = 0; i < H; i += 100) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }

      // Road
      ctx.fillStyle = "#3d3d3d";
      ctx.fillRect(ROAD.x, ROAD.y, ROAD.w, ROAD.h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.setLineDash([50, 30]);
      ctx.beginPath();
      ctx.moveTo(0, ROAD.y + 75);
      ctx.lineTo(W, ROAD.y + 75);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#ffeb3b";
      ctx.lineWidth = 3;
      ctx.strokeRect(ROAD.x, ROAD.y, ROAD.w, ROAD.h);

      // Gate
      ctx.fillStyle = "#795548";
      ctx.fillRect(GATE.x, GATE.y, GATE.w, GATE.h);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 5;
      ctx.strokeRect(GATE.x, GATE.y, GATE.w, GATE.h);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🚪", GATE.x + 75, GATE.y + 70);
      ctx.font = "bold 20px Arial";
      ctx.fillText("GATE", GATE.x + 75, GATE.y + 100);
      ctx.font = "14px Arial";
      ctx.fillText("Press E", GATE.x + 75, GATE.y + 125);

      // Factory
      ctx.fillStyle = "#b8860b";
      ctx.fillRect(FACTORY.x, FACTORY.y, FACTORY.w, FACTORY.h);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 6;
      ctx.strokeRect(FACTORY.x, FACTORY.y, FACTORY.w, FACTORY.h);

      // Roof
      ctx.fillStyle = "#8B0000";
      ctx.beginPath();
      ctx.moveTo(FACTORY.x - 30, FACTORY.y);
      ctx.lineTo(FACTORY.x + FACTORY.w / 2, FACTORY.y - 50);
      ctx.lineTo(FACTORY.x + FACTORY.w + 30, FACTORY.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 36px Arial";
      ctx.fillText("🏭 WAREHOUSE", FACTORY.x + FACTORY.w / 2, FACTORY.y + 60);

      // Doors
      DOORS.forEach((d, i) => {
        ctx.fillStyle = selectedDoor === d.id ? "#4CAF50" : "#654321";
        ctx.fillRect(d.x, d.y, 140, 40);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 4;
        ctx.strokeRect(d.x, d.y, 140, 40);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Arial";
        ctx.fillText(`DOOR ${String.fromCharCode(65 + i)}`, d.x + 70, d.y + 26);
      });

      // Yard
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(YARD.x, YARD.y, YARD.w, YARD.h);
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.strokeRect(YARD.x, YARD.y, YARD.w, YARD.h);
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "left";
      ctx.fillText("📦 CONTAINER YARD", YARD.x + 15, YARD.y - 15);

      // Slots
      SLOTS.forEach((s) => {
        if (s.occupied) {
          ctx.fillStyle = "#e74c3c";
          ctx.fillRect(s.x, s.y, s.w, s.h);
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 2;
          ctx.strokeRect(s.x, s.y, s.w, s.h);
        } else {
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.strokeRect(s.x, s.y, s.w, s.h);
          ctx.setLineDash([]);
        }
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(s.id, s.x + s.w / 2, s.y + s.h / 2 + 4);
      });

      // Update truck
      const spd = 4;
      if (keys["w"] || keys["arrowup"]) {
        pos.x += Math.sin(rot) * spd;
        pos.y -= Math.cos(rot) * spd;
      }
      if (keys["s"] || keys["arrowdown"]) {
        pos.x -= Math.sin(rot) * spd;
        pos.y += Math.cos(rot) * spd;
      }
      if (keys["a"] || keys["arrowleft"]) rot -= 0.06;
      if (keys["d"] || keys["arrowright"]) rot += 0.06;

      pos.x = Math.max(40, Math.min(W - 40, pos.x));
      pos.y = Math.max(40, Math.min(H - 40, pos.y));

      setTruckPos(pos);
      setTruckRotation(rot);

      // Draw truck
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(rot);

      const truckColor = hasContainer
        ? containerStatus === "full"
          ? "#FFD700"
          : "#87CEEB"
        : "#4A90E2";
      ctx.fillStyle = truckColor;
      ctx.fillRect(-25, -40, 50, 80);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeRect(-25, -40, 50, 80);

      ctx.fillStyle = "#E74C3C";
      ctx.fillRect(-20, -48, 40, 12);
      ctx.strokeRect(-20, -48, 40, 12);

      if (hasContainer && selectedContainer) {
        ctx.fillStyle = "#000";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(selectedContainer.code.slice(0, 10), 0, -15);
      }

      ctx.restore();

      requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    truckPos,
    truckRotation,
    hasContainer,
    containerStatus,
    selectedContainer,
    gateCheckInDone,
    selectedDoor,
  ]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Card style={{ marginBottom: 15, width: "100%", maxWidth: 1600 }}>
        <Space size="large">
          <Tag color="blue" style={{ fontSize: 14, padding: "5px 12px" }}>
            Score: {score}
          </Tag>
          {hasContainer && selectedContainer && (
            <>
              <Tag color="orange" style={{ fontSize: 14, padding: "5px 12px" }}>
                📦 {selectedContainer.code}
              </Tag>
              <Tag
                color={containerStatus === "full" ? "red" : "green"}
                style={{ fontSize: 14, padding: "5px 12px" }}
              >
                {containerStatus === "full" ? "Đầy hàng" : "Rỗng"}
              </Tag>
            </>
          )}
          {selectedDriver && (
            <Tag color="purple" style={{ fontSize: 14, padding: "5px 12px" }}>
              👤 {selectedDriver.name}
            </Tag>
          )}
          <Tag color="cyan" style={{ fontSize: 14, padding: "5px 12px" }}>
            🎮 WASD: Di chuyển | E: Tương tác
          </Tag>
        </Space>
      </Card>

      <canvas
        ref={canvasRef}
        width={1600}
        height={900}
        style={{
          border: "4px solid #333",
          borderRadius: 8,
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      />

      {/* Gate Modal - continuing... */}
    </div>
  );
}
