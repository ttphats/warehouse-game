"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";

type GameScene = "road" | "gate" | "yard";

// Toast notification helper
const showToast = (
  message: string,
  type: "success" | "error" | "info" = "success",
) => {
  const toast = document.createElement("div");
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-blue-500"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

export default function SimpleGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state
  const [scene, setScene] = useState<GameScene>("road");
  const [truckPos, setTruckPos] = useState({ x: 100, y: 300 });
  const [truckRotation, setTruckRotation] = useState(0);

  // Gate modal
  const [showGateModal, setShowGateModal] = useState(false);
  const [containerStatus, setContainerStatus] = useState<"empty" | "full">(
    "empty",
  );

  // Task assignment
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [containerNumber, setContainerNumber] = useState("");
  const [asnNumber, setAsnNumber] = useState("");
  const [taskType, setTaskType] = useState<"inbound" | "outbound">("inbound");
  const [destination, setDestination] = useState("");
  const [sealNumber, setSealNumber] = useState("");

  // Start game modal
  const [showStartModal, setShowStartModal] = useState(true);
  const [driverName, setDriverName] = useState("");
  const [trailerId, setTrailerId] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  // Yard state
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [targetSlot, setTargetSlot] = useState<{ x: number; y: number } | null>(
    null,
  );

  // History
  const [history, setHistory] = useState<
    Array<{
      id: string;
      time: string;
      container: string;
      driver: string;
      status: string;
      slot: string;
      action: string;
    }>
  >([]);

  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 700;

  // Road scene constants
  const ROAD_GATE_X = 1200;

  // === FACTORIES DATA ===
  const FACTORIES = [
    {
      id: 1,
      name: "Factory A",
      x: 100,
      y: 50,
      w: 150,
      h: 120,
      gateX: 175,
      gateY: 170,
      color: "#78909C",
    },
    {
      id: 2,
      name: "Factory B",
      x: 350,
      y: 70,
      w: 180,
      h: 100,
      gateX: 440,
      gateY: 170,
      color: "#90A4AE",
    },
    {
      id: 3,
      name: "Factory C",
      x: 650,
      y: 40,
      w: 160,
      h: 130,
      gateX: 730,
      gateY: 170,
      color: "#607D8B",
    },
    {
      id: 4,
      name: "Factory D",
      x: 950,
      y: 60,
      w: 140,
      h: 110,
      gateX: 1020,
      gateY: 170,
      color: "#546E7A",
    },
    {
      id: 5,
      name: "Factory E",
      x: 150,
      y: 530,
      w: 170,
      h: 120,
      gateX: 235,
      gateY: 530,
      color: "#78909C",
    },
    {
      id: 6,
      name: "Factory F",
      x: 450,
      y: 550,
      w: 150,
      h: 100,
      gateX: 525,
      gateY: 550,
      color: "#90A4AE",
    },
    {
      id: 7,
      name: "Factory G",
      x: 750,
      y: 520,
      w: 180,
      h: 130,
      gateX: 840,
      gateY: 520,
      color: "#607D8B",
    },
  ];

  // === SIMPLE LAYOUT ===
  // Dock Doors (Top row) - #415 to #430
  const DOCK_DOORS = Array.from({ length: 16 }, (_, i) => ({
    id: 415 + i,
    x: 50 + i * 80,
    y: 80,
    w: 70,
    h: 120,
    occupied: false,
  }));

  // Yard Slots (Bottom row) - #1 to #18
  const YARD_SLOTS = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    x: 50 + i * 70,
    y: 400,
    w: 60,
    h: 120,
    occupied: false,
  }));

  // Handle start game
  const handleStartGame = () => {
    if (!driverName || !trailerId) {
      showToast("Vui lòng chọn đầy đủ thông tin!", "error");
      return;
    }

    setGameStarted(true);
    setShowStartModal(false);
    showToast(
      `✅ Chào mừng tài xế ${driverName}! Trailer ${trailerId}`,
      "success",
    );

    const startRecord = {
      id: `START-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN"),
      container: "-",
      driver: driverName,
      status: "Started",
      slot: "-",
      action: `Bắt đầu - Trailer ${trailerId}`,
    };
    setHistory([startRecord, ...history]);
  };

  // Handle task assignment
  const handleTaskAssign = () => {
    if (!asnNumber || !destination) {
      showToast("Vui lòng nhập đầy đủ thông tin!", "error");
      return;
    }

    // Auto generate container number if not provided
    const finalContainerNumber = containerNumber || `CONT-${Date.now()}`;
    setContainerNumber(finalContainerNumber);

    const taskTypeText =
      taskType === "inbound"
        ? "Giao hàng (Xe Đầy)"
        : "Lấy container rỗng (Xe Rỗng)";

    const newTask = {
      id: `TASK-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN"),
      container: finalContainerNumber,
      driver: driverName,
      status: taskType === "inbound" ? "Full" : "Empty",
      slot: "-",
      action: `Nhận nhiệm vụ: ${taskTypeText} - ASN #${asnNumber} - Đến: ${destination}`,
    };

    setHistory([newTask, ...history]);
    showToast(`✅ Nhiệm vụ: ${taskTypeText} - ASN #${asnNumber}`, "success");
    setShowTaskModal(false);
  };

  // Handle gate check-in
  const handleGateCheckIn = () => {
    if (!containerNumber || !driverName) {
      showToast("Vui lòng nhập thông tin container và tài xế!", "error");
      return;
    }

    const checkInRecord = {
      id: `CHECKIN-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN"),
      container: containerNumber,
      driver: driverName,
      status: containerStatus,
      slot: "-",
      action: "Check-in tại cổng",
    };

    setHistory([checkInRecord, ...history]);
    showToast(
      `✅ Check-in thành công! Container: ${containerStatus}`,
      "success",
    );
    setShowGateModal(false);
    setScene("yard");
    setTruckPos({ x: 100, y: 350 }); // Reset position for yard scene (middle left)
    setTruckRotation(0); // Reset rotation
  };

  // Handle yard slot selection with animation
  const handleSlotClick = (slotId: number) => {
    if (isAnimating) return; // Prevent clicking during animation

    const slot = YARD_SLOTS.find((s) => s.id === slotId);
    if (!slot || slot.occupied) return;

    // Start animation to slot
    setSelectedSlot(String(slotId));
    setTargetSlot({ x: slot.x + slot.w / 2, y: slot.y + slot.h / 2 });
    setIsAnimating(true);
    setAnimationProgress(0);

    // Mark slot as occupied
    slot.occupied = true;

    const parkRecord = {
      id: `PARK-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN"),
      container: containerNumber || "Unknown",
      driver: driverName || "Unknown",
      status: containerStatus,
      slot: `Yard ${slotId}`,
      action: "Đậu vào yard",
    };

    setHistory([parkRecord, ...history]);
    showToast(`✅ Đang di chuyển đến Yard ${slotId}...`, "success");
  };

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let pos = { ...truckPos };
    let rot = truckRotation;
    const keys: Record<string, boolean> = {};
    let animationId: number;
    let lastUpdate = Date.now();

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;

      // E key for gate interaction (only in road scene)
      if (e.key.toLowerCase() === "e" && scene === "road") {
        if (pos.x > ROAD_GATE_X - 100 && pos.x < ROAD_GATE_X + 100) {
          setShowGateModal(true);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const draw = () => {
      const now = Date.now();
      const delta = now - lastUpdate;

      // Throttle to ~30fps instead of 60fps
      if (delta < 33) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastUpdate = now;

      // Clear
      ctx.fillStyle = "#e8f5e9";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (scene === "road") {
        drawRoadScene(ctx);
      } else if (scene === "gate") {
        drawGateScene(ctx);
        // No animation needed for gate scene
        return;
      } else if (scene === "yard") {
        drawYardScene(ctx);

        // Handle animation to yard slot
        if (isAnimating && targetSlot) {
          const progress = animationProgress;

          // Đuôi xe (trailer) hướng xuống về phía số
          // rotation = 0 means đầu xe hướng lên, đuôi hướng xuống
          const targetRot = 0;

          // Animation path: xe đi từ trên xuống (approach from top)
          // Tránh đè lên yard slots bằng cách đi từ phía trên
          const startX = targetSlot.x; // Same X as target
          const startY = 250; // Start from above yard slots

          // Interpolate position (chỉ di chuyển theo Y)
          const currentX = startX;
          const currentY = startY + (targetSlot.y - startY) * progress;

          // Draw moving truck
          drawTruck(ctx, currentX, currentY, targetRot);

          // Update progress
          const newProgress = progress + 0.02; // Animation speed
          if (newProgress >= 1) {
            setIsAnimating(false);
            setAnimationProgress(0);
            setTruckPos({ x: targetSlot.x, y: targetSlot.y });
            setTruckRotation(targetRot);
            setTargetSlot(null);
            showToast(`✅ Đã đậu xong!`, "success");
          } else {
            setAnimationProgress(newProgress);
          }

          // Continue animation
          animationId = requestAnimationFrame(draw);
          return;
        }

        // Draw truck in yard scene (when not animating)
        drawTruck(ctx, pos.x, pos.y, rot);

        // Update truck position in yard (only when not animating)
        if (!isAnimating) {
          const spd = 3;
          let moved = false;

          if (keys["w"] || keys["arrowup"]) {
            pos.x += Math.sin(rot) * spd;
            pos.y -= Math.cos(rot) * spd;
            moved = true;
          }
          if (keys["s"] || keys["arrowdown"]) {
            pos.x -= Math.sin(rot) * spd;
            pos.y += Math.cos(rot) * spd;
            moved = true;
          }
          if (keys["a"] || keys["arrowleft"]) {
            rot -= 0.05;
            moved = true;
          }
          if (keys["d"] || keys["arrowright"]) {
            rot += 0.05;
            moved = true;
          }

          // Keep truck in bounds
          pos.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, pos.x));
          pos.y = Math.max(30, Math.min(CANVAS_HEIGHT - 30, pos.y));

          if (moved) {
            setTruckPos(pos);
            setTruckRotation(rot);
          }
        }
      }

      // Update truck position (only in road scene)
      if (scene === "road") {
        const spd = 4;
        let moved = false;

        if (keys["w"] || keys["arrowup"]) {
          pos.x += Math.sin(rot) * spd;
          pos.y -= Math.cos(rot) * spd;
          moved = true;
        }
        if (keys["s"] || keys["arrowdown"]) {
          pos.x -= Math.sin(rot) * spd;
          pos.y += Math.cos(rot) * spd;
          moved = true;
        }
        if (keys["a"] || keys["arrowleft"]) {
          rot -= 0.06;
          moved = true;
        }
        if (keys["d"] || keys["arrowright"]) {
          rot += 0.06;
          moved = true;
        }

        pos.x = Math.max(40, Math.min(CANVAS_WIDTH - 40, pos.x));
        pos.y = Math.max(40, Math.min(CANVAS_HEIGHT - 40, pos.y));

        // Only update state if actually moved (reduce re-renders)
        if (moved) {
          setTruckPos({ ...pos });
          setTruckRotation(rot);
        }

        // Draw truck
        drawTruck(ctx, pos.x, pos.y, rot);

        // Continue animation loop only for road scene
        animationId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [scene, isAnimating, animationProgress, targetSlot]);

  const drawRoadScene = (ctx: CanvasRenderingContext2D) => {
    // Sky background
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, CANVAS_WIDTH, 200);

    // Ground/grass
    ctx.fillStyle = "#7CB342";
    ctx.fillRect(0, 500, CANVAS_WIDTH, 300);

    // Road scene
    ctx.fillStyle = "#424242";
    ctx.fillRect(0, 250, CANVAS_WIDTH, 200);

    // Road markings
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.setLineDash([50, 30]);
    ctx.beginPath();
    ctx.moveTo(0, 350);
    ctx.lineTo(CANVAS_WIDTH, 350);
    ctx.stroke();
    ctx.setLineDash([]);

    // === FACTORIES/BUILDINGS along the road ===
    const factories = [
      { x: 100, y: 50, w: 150, h: 120, name: "Factory 1" },
      { x: 350, y: 70, w: 180, h: 100, name: "Factory 2" },
      { x: 650, y: 40, w: 160, h: 130, name: "Factory 3" },
      { x: 950, y: 60, w: 140, h: 110, name: "Factory 4" },
      { x: 150, y: 530, w: 170, h: 120, name: "Factory 5" },
      { x: 450, y: 550, w: 150, h: 100, name: "Factory 6" },
      { x: 750, y: 520, w: 180, h: 130, name: "Factory 7" },
    ];

    factories.forEach((factory) => {
      // Building body
      ctx.fillStyle = "#78909C";
      ctx.fillRect(factory.x, factory.y, factory.w, factory.h);
      ctx.strokeStyle = "#455A64";
      ctx.lineWidth = 3;
      ctx.strokeRect(factory.x, factory.y, factory.w, factory.h);

      // Windows
      ctx.fillStyle = "#FFE082";
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const winX = factory.x + 15 + col * 30;
          const winY = factory.y + 15 + row * 30;
          ctx.fillRect(winX, winY, 20, 20);
        }
      }

      // Chimney/smokestack
      ctx.fillStyle = "#546E7A";
      ctx.fillRect(factory.x + factory.w - 30, factory.y - 40, 20, 40);

      // Smoke
      ctx.fillStyle = "rgba(200, 200, 200, 0.6)";
      ctx.beginPath();
      ctx.arc(factory.x + factory.w - 20, factory.y - 50, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(factory.x + factory.w - 15, factory.y - 65, 12, 0, Math.PI * 2);
      ctx.fill();

      // Factory name
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        factory.name,
        factory.x + factory.w / 2,
        factory.y + factory.h / 2,
      );
    });

    // Gate at the end
    ctx.fillStyle = "#795548";
    ctx.fillRect(ROAD_GATE_X, 200, 150, 250);
    ctx.strokeStyle = "#4E342E";
    ctx.lineWidth = 5;
    ctx.strokeRect(ROAD_GATE_X, 200, 150, 250);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🚪", ROAD_GATE_X + 75, 300);
    ctx.font = "bold 20px Arial";
    ctx.fillText("GATE", ROAD_GATE_X + 75, 340);
    ctx.font = "14px Arial";
    ctx.fillText("Press E", ROAD_GATE_X + 75, 365);

    // Instructions
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("🎮 WASD to drive → Drive to GATE →", 50, 100);
  };

  const drawGateScene = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Gate Check-In Scene", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  };

  const drawYardScene = (ctx: CanvasRenderingContext2D) => {
    // Background - light gray
    ctx.fillStyle = "#E0E0E0";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title: Dock Doors
    ctx.fillStyle = "#000";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Dock Doors", CANVAS_WIDTH / 2, 40);

    // === DOCK DOORS (Top row) ===
    DOCK_DOORS.forEach((door) => {
      // Number badge (circle on top)
      ctx.fillStyle = "#00897B";
      ctx.beginPath();
      ctx.arc(door.x + door.w / 2, door.y - 20, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(String(door.id), door.x + door.w / 2, door.y - 15);

      // Parking slot
      if (door.occupied) {
        ctx.fillStyle = "#FF6B35"; // Orange for occupied
      } else {
        ctx.fillStyle = "#fff";
      }
      ctx.fillRect(door.x, door.y, door.w, door.h);

      // Border
      ctx.strokeStyle = "#00897B";
      ctx.lineWidth = 3;
      ctx.strokeRect(door.x, door.y, door.w, door.h);
    });

    // === MIDDLE AREA - Instructions ===
    ctx.fillStyle = "#000";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🎮 WASD to drive", CANVAS_WIDTH / 2, 260);
    ctx.font = "16px Arial";
    ctx.fillText(
      "Click on empty yard slot (white) to park container",
      CANVAS_WIDTH / 2,
      290,
    );

    // === YARD SLOTS (Bottom row) ===
    YARD_SLOTS.forEach((yard) => {
      // Parking slot
      if (yard.occupied) {
        ctx.fillStyle = "#FF6B35"; // Orange for occupied
      } else {
        ctx.fillStyle = "#fff";
      }
      ctx.fillRect(yard.x, yard.y, yard.w, yard.h);

      // Border
      ctx.strokeStyle = "#00897B";
      ctx.lineWidth = 3;
      ctx.strokeRect(yard.x, yard.y, yard.w, yard.h);

      // Number badge (circle on bottom)
      ctx.fillStyle = "#00897B";
      ctx.beginPath();
      ctx.arc(yard.x + yard.w / 2, yard.y + yard.h + 20, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(String(yard.id), yard.x + yard.w / 2, yard.y + yard.h + 25);
    });
  };

  const drawTruck = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rotation: number,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Truck body (cab)
    ctx.fillStyle = "#4A90E2";
    ctx.fillRect(-25, -40, 50, 80);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeRect(-25, -40, 50, 80);

    // Trailer (container box)
    ctx.fillStyle = "#E74C3C";
    ctx.fillRect(-20, -48, 40, 12);
    ctx.strokeRect(-20, -48, 40, 12);

    // Trailer ID on the trailer box (always show if selected)
    if (trailerId) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.fillText(trailerId, 0, -41);
    }

    ctx.restore();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-5">
      {/* Top Bar */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold text-gray-800">
              Scene:{" "}
              {scene === "road"
                ? "🛣️ Road"
                : scene === "gate"
                  ? "🚪 Gate"
                  : "📦 Yard"}
            </div>
            {scene === "yard" && (
              <button
                onClick={() => {
                  setScene("road");
                  setTruckPos({ x: 100, y: 300 });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Back to Road
              </button>
            )}
          </div>
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📋 Giao Nhiệm Vụ
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 15 }}>
        <div style={{ flex: 1 }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              border: "4px solid #333",
              borderRadius: 8,
              background: "#e8f5e9",
            }}
            onClick={(e) => {
              if (scene === "yard") {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                YARD_SLOTS.forEach((slot) => {
                  if (
                    x > slot.x &&
                    x < slot.x + slot.w &&
                    y > slot.y &&
                    y < slot.y + slot.h &&
                    !slot.occupied
                  ) {
                    handleSlotClick(slot.id);
                  }
                });
              }
            }}
          />
        </div>

        {/* History Panel */}
        <Card
          title="📜 Lịch Sử Hoạt Động"
          style={{ width: 400, maxHeight: 750, overflow: "auto" }}
        >
          {history.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", padding: 20 }}>
              Chưa có hoạt động nào
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((item) => (
                <Card
                  key={item.id}
                  size="small"
                  style={{ background: "#f5f5f5" }}
                >
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: "bold", marginBottom: 5 }}>
                      {item.action}
                    </div>
                    <div>🕐 {item.time}</div>
                    <div>📦 Container: {item.container}</div>
                    <div>👤 Tài xế: {item.driver}</div>
                    <div>📊 Trạng thái: {item.status}</div>
                    {item.slot !== "-" && <div>🅿️ Slot: {item.slot}</div>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Start Game Modal */}
      <Modal
        title="🚛 Bắt Đầu Game - Chọn Tài Xế & Trailer"
        open={showStartModal}
        onCancel={() => setShowStartModal(false)}
        onOk={handleStartGame}
        okText="✅ Bắt Đầu"
        closable={false}
        maskClosable={false}
      >
        <Form layout="vertical">
          <Form.Item label="Chọn Tài Xế" required>
            <Select
              placeholder="Chọn tài xế"
              value={driverName}
              onChange={setDriverName}
            >
              <Select.Option value="Nguyễn Văn A">Nguyễn Văn A</Select.Option>
              <Select.Option value="Trần Văn B">Trần Văn B</Select.Option>
              <Select.Option value="Lê Văn C">Lê Văn C</Select.Option>
              <Select.Option value="Phạm Văn D">Phạm Văn D</Select.Option>
              <Select.Option value="Hoàng Văn E">Hoàng Văn E</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Chọn Trailer ID" required>
            <Select
              placeholder="Chọn trailer"
              value={trailerId}
              onChange={setTrailerId}
            >
              <Select.Option value="TRL-001">TRL-001</Select.Option>
              <Select.Option value="TRL-002">TRL-002</Select.Option>
              <Select.Option value="TRL-003">TRL-003</Select.Option>
              <Select.Option value="TRL-004">TRL-004</Select.Option>
              <Select.Option value="TRL-005">TRL-005</Select.Option>
              <Select.Option value="TRL-006">TRL-006</Select.Option>
              <Select.Option value="TRL-007">TRL-007</Select.Option>
              <Select.Option value="TRL-008">TRL-008</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Task Assignment Modal */}
      <Modal
        title="📋 Nhận Nhiệm Vụ - Bước 1"
        open={showTaskModal}
        onCancel={() => setShowTaskModal(false)}
        onOk={handleTaskAssign}
        okText="✅ Nhận Nhiệm Vụ"
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Loại Nhiệm Vụ" required>
            <Select value={taskType} onChange={setTaskType}>
              <Select.Option value="inbound">
                📦 Inbound - Giao hàng (Xe Đầy)
              </Select.Option>
              <Select.Option value="outbound">
                📤 Outbound - Lấy container rỗng (Xe Rỗng)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="ASN Number" required>
            <Input
              placeholder="ASN-12345"
              value={asnNumber}
              onChange={(e) => setAsnNumber(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="Điểm Đến / Kho" required>
            <Select
              placeholder="Chọn điểm đến"
              value={destination}
              onChange={setDestination}
            >
              <Select.Option value="Kho ABC">🏭 Kho ABC</Select.Option>
              <Select.Option value="Kho XYZ">🏭 Kho XYZ</Select.Option>
              <Select.Option value="Warehouse A">🏭 Warehouse A</Select.Option>
              <Select.Option value="Warehouse B">🏭 Warehouse B</Select.Option>
              <Select.Option value="Distribution Center">
                🏭 Distribution Center
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Mã Container (Tùy chọn)">
            <Input
              placeholder="Tự động tạo nếu để trống"
              value={containerNumber}
              onChange={(e) => setContainerNumber(e.target.value)}
            />
          </Form.Item>

          <div
            style={{
              background: taskType === "inbound" ? "#e3f2fd" : "#fff3e0",
              padding: 15,
              borderRadius: 8,
              border: `2px solid ${taskType === "inbound" ? "#2196F3" : "#FF9800"}`,
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: 5 }}>
              {taskType === "inbound" ? "📦 Xe Đầy Hàng" : "📤 Xe Rỗng"}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {taskType === "inbound"
                ? "Container đầy hàng cần giao đến kho để dỡ hàng (Unload)"
                : "Lấy container rỗng hoặc xếp hàng vào container (Load)"}
            </div>
          </div>
        </Form>
      </Modal>

      {/* Gate Check-In Modal */}
      <Modal
        title="🚪 Gate Check-In"
        open={showGateModal}
        onCancel={() => setShowGateModal(false)}
        onOk={handleGateCheckIn}
        okText="✅ Check-In"
      >
        <Form layout="vertical">
          <Form.Item label="Container Number">
            <Input
              placeholder="ABCD1234567"
              value={containerNumber}
              onChange={(e) => setContainerNumber(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Driver Name">
            <Input
              placeholder="Nguyễn Văn A"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Container Status">
            <Select value={containerStatus} onChange={setContainerStatus}>
              <Select.Option value="empty">📦 Empty (Rỗng)</Select.Option>
              <Select.Option value="full">📦 Full (Đầy hàng)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
