"use client";

import { useEffect, useRef, useState } from "react";
import { YardContainer, CreateContainerDTO } from "../types/container.types";
import {
  getAllContainers,
  createContainer,
  updateContainerState,
  getContainerStatistics,
} from "../services/containerManagementService";
import { AVAILABLE_ASNS, getAvailableASNs, ASN } from "../data/asnData";

interface Slot {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TruckAnimation {
  containerId: string;
  containerNumber: string;
  trailerId: string;
  x: number;
  y: number;
  targetSlotId: number;
  targetX: number;
  targetY: number;
  phase: "entering" | "moving" | "parking" | "parked";
}

interface ParkedTruck {
  slotId: number;
  containerNumber: string;
  trailerId: string;
  x: number;
  y: number;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

// Yard slots configuration (ở trên)
const YARD_SLOTS: Slot[] = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  x: 50 + i * 150,
  y: 80,
  w: 140,
  h: 180,
}));

// Dock doors configuration (ở dưới)
const DOCK_DOORS: Slot[] = Array.from({ length: 10 }, (_, i) => ({
  id: 415 + i,
  x: 50 + i * 150,
  y: 620,
  w: 140,
  h: 180,
}));

export default function YardManagement() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containers, setContainers] = useState<YardContainer[]>([]);
  const [trucks, setTrucks] = useState<TruckAnimation[]>([]);
  const [parkedTrucks, setParkedTrucks] = useState<ParkedTruck[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [autoSpawn, setAutoSpawn] = useState(false);
  const [spawnInterval, setSpawnInterval] = useState(10); // seconds
  const [availableASNs, setAvailableASNs] = useState<ASN[]>(AVAILABLE_ASNS);
  const [usedASNs, setUsedASNs] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Sync containers from service periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const data = getAllContainers({ state: ["in_yard", "arriving"] });
      setContainers(data);
      setStatistics(getContainerStatistics());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Auto spawn containers
  useEffect(() => {
    if (!autoSpawn) return;

    const interval = setInterval(() => {
      spawnRandomContainer();
    }, spawnInterval * 1000);

    return () => clearInterval(interval);
  }, [autoSpawn, spawnInterval]);

  // Animation loop - needs to re-run when state changes to see updated values
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const animate = () => {
      drawYard(ctx);
      updateTrucks();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [containers, trucks, parkedTrucks]); // Re-run when state changes

  const loadData = () => {
    const data = getAllContainers({ state: ["in_yard", "arriving"] });
    setContainers(data);
    setStatistics(getContainerStatistics());

    // Update used ASNs
    const used = data.map((c) => c.asnNumber);
    setUsedASNs(used);
    setAvailableASNs(getAvailableASNs(used));

    // Sync parked trucks with containers in yard
    // Remove parked trucks if container is no longer in that slot
    setParkedTrucks((prevParked) => {
      return prevParked.filter((parkedTruck) => {
        const containerStillThere = data.some(
          (c) =>
            c.currentLocation.type === "yard" &&
            c.currentLocation.slotId === parkedTruck.slotId &&
            c.containerNumber === parkedTruck.containerNumber,
        );
        return containerStillThere;
      });
    });
  };

  const spawnRandomContainer = () => {
    // Get available ASNs (not yet used)
    const available = getAvailableASNs(usedASNs);

    if (available.length === 0) {
      return;
    }

    // Pick random ASN from available list
    const randomASN = available[Math.floor(Math.random() * available.length)];

    const dto: CreateContainerDTO = {
      containerNumber: randomASN.containerNumber,
      containerType: randomASN.containerType,
      status: randomASN.status,
      asnNumber: randomASN.asnNumber,
      taskType: randomASN.type,
      factoryId: randomASN.factoryId,
      factoryName: randomASN.factoryName,
      poNumber: randomASN.poNumber,
      supplier: randomASN.supplier,
      expectedItems: randomASN.expectedItems,
      weight: randomASN.weight,
    };

    const newContainer = createContainer(dto);

    // Generate random trailer ID
    const trailerId = `TRL-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    // Capture current state for slot finding
    const currentParkedTrucks = parkedTrucks;

    // Update trucks state and find empty slot in the same update
    setTrucks((prevTrucks) => {
      // Find empty slot using current state
      const emptySlot = findEmptySlotWithState(prevTrucks, currentParkedTrucks);

      if (!emptySlot) {
        return prevTrucks;
      }

      // Create truck animation
      const truck: TruckAnimation = {
        containerId: newContainer.id,
        containerNumber: newContainer.containerNumber,
        trailerId: trailerId,
        x: -100, // Start from left
        y: 350,
        targetSlotId: emptySlot.id,
        targetX: emptySlot.x + emptySlot.w / 2,
        targetY: emptySlot.y + emptySlot.h / 2,
        phase: "entering",
      };

      // Update used ASNs only when truck is created successfully
      setUsedASNs((prev) => [...prev, newContainer.asnNumber]);
      setAvailableASNs(getAvailableASNs([...usedASNs, newContainer.asnNumber]));

      return [...prevTrucks, truck];
    });
  };

  // Helper function to find empty slot - only use trucks and parkedTrucks
  // Don't use containers because they update async and cause race conditions
  const findEmptySlotWithState = (
    currentTrucks: TruckAnimation[],
    currentParkedTrucks: ParkedTruck[],
  ): Slot | null => {
    // Get slots targeted by trucks (including moving trucks)
    // This is the source of truth for slot reservation
    const targetedSlots = currentTrucks.map((t) => t.targetSlotId);

    // Get slots with parked trucks
    const parkedSlots = currentParkedTrucks.map((t) => t.slotId);

    // Combine reserved slots (don't use containers - they update async)
    const reservedSlots = [...targetedSlots, ...parkedSlots];

    for (const slot of YARD_SLOTS) {
      if (!reservedSlots.includes(slot.id)) {
        return slot;
      }
    }
    return null;
  };

  const updateTrucks = () => {
    setTrucks((prevTrucks) => {
      const updatedTrucks = prevTrucks.map((truck) => {
        if (truck.phase === "parked") return truck;

        const speed = 1; // Very slow speed for realistic factory operations

        if (truck.phase === "entering") {
          // Move to yard entrance
          truck.x += speed;
          if (truck.x >= 100) {
            truck.phase = "moving";
          }
        } else if (truck.phase === "moving") {
          // Move to target slot
          const dx = truck.targetX - truck.x;
          const dy = truck.targetY - truck.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < speed) {
            truck.x = truck.targetX;
            truck.y = truck.targetY;
            truck.phase = "parking";
          } else {
            truck.x += (dx / distance) * speed;
            truck.y += (dy / distance) * speed;
          }
        } else if (truck.phase === "parking") {
          // Park the container
          updateContainerState({
            containerId: truck.containerId,
            state: "in_yard",
            location: {
              type: "yard",
              slotId: truck.targetSlotId,
              position: { x: truck.targetX, y: truck.targetY },
            },
          });

          // Add to parked trucks immediately
          setParkedTrucks((prev) => {
            // Check if already parked (avoid duplicates)
            const alreadyParked = prev.some(
              (p) => p.containerNumber === truck.containerNumber,
            );
            if (alreadyParked) return prev;

            return [
              ...prev,
              {
                slotId: truck.targetSlotId,
                containerNumber: truck.containerNumber,
                trailerId: truck.trailerId,
                x: truck.targetX,
                y: truck.targetY,
              },
            ];
          });

          truck.phase = "parked";
        }

        return truck;
      });

      // Keep parked trucks in animation for rendering
      return updatedTrucks;
    });
  };

  const drawYard = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Header panel
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, 70);

    // Title
    ctx.fillStyle = "#00E676";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏭 Yard Management System", CANVAS_WIDTH / 2, 35);

    // Yard Slots Label
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 16px Arial";
    ctx.fillText("🅿️ YARD PARKING SLOTS", CANVAS_WIDTH / 2, 60);

    // Background - Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 300);
    skyGradient.addColorStop(0, "#2C3E50");
    skyGradient.addColorStop(1, "#34495E");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 300);

    // Yard ground (asphalt)
    ctx.fillStyle = "#3A3A3A";
    ctx.fillRect(0, 70, CANVAS_WIDTH, 200);

    // Yellow dashed lines (top and bottom of yard)
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(0, YARD_SLOTS[0].y);
    ctx.lineTo(CANVAS_WIDTH, YARD_SLOTS[0].y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, YARD_SLOTS[0].y + YARD_SLOTS[0].h);
    ctx.lineTo(CANVAS_WIDTH, YARD_SLOTS[0].y + YARD_SLOTS[0].h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw yard slots
    YARD_SLOTS.forEach((slot, index) => {
      const isOccupied = containers.some(
        (c) =>
          c.currentLocation.type === "yard" &&
          c.currentLocation.slotId === slot.id,
      );

      // Slot border (white vertical lines)
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(slot.x, slot.y);
      ctx.lineTo(slot.x, slot.y + slot.h);
      ctx.stroke();

      // Right border for last slot
      if (index === YARD_SLOTS.length - 1) {
        ctx.beginPath();
        ctx.moveTo(slot.x + slot.w, slot.y);
        ctx.lineTo(slot.x + slot.w, slot.y + slot.h);
        ctx.stroke();
      }

      // Slot number background
      const bgWidth = 50;
      const bgHeight = 45;
      ctx.fillStyle = isOccupied
        ? "rgba(255, 87, 34, 0.9)"
        : "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(
        slot.x + slot.w / 2 - bgWidth / 2,
        slot.y + 10,
        bgWidth,
        bgHeight,
      );

      // Slot number
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.fillText(String(slot.id), slot.x + slot.w / 2, slot.y + 42);

      // Container info if occupied
      if (isOccupied) {
        const container = containers.find(
          (c) =>
            c.currentLocation.type === "yard" &&
            c.currentLocation.slotId === slot.id,
        );
        if (container) {
          // Container ID board
          const boardWidth = slot.w - 4;
          const boardHeight = 42;
          const boardX = slot.x + 2;
          const boardY = slot.y - 48;

          ctx.fillStyle = "#1E3A8A";
          ctx.fillRect(boardX, boardY, boardWidth, boardHeight);
          ctx.strokeStyle = "#FCD34D";
          ctx.lineWidth = 3;
          ctx.strokeRect(boardX, boardY, boardWidth, boardHeight);

          ctx.fillStyle = "#FEF08A";
          ctx.font = "bold 14px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            container.containerNumber,
            slot.x + slot.w / 2,
            boardY + boardHeight / 2,
          );
        }
      }
    });

    // Road divider
    ctx.fillStyle = "#5A5A5A";
    ctx.fillRect(0, 280, CANVAS_WIDTH, 80);

    // Road yellow dashed lines
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 12]);
    ctx.beginPath();
    ctx.moveTo(0, 295);
    ctx.lineTo(CANVAS_WIDTH, 295);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 345);
    ctx.lineTo(CANVAS_WIDTH, 345);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dock Doors Label (fixed position)
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🚪 LOADING DOCK DOORS", CANVAS_WIDTH / 2, 415);

    // Warehouse building
    const warehouseGradient = ctx.createLinearGradient(0, 380, 0, 900);
    warehouseGradient.addColorStop(0, "#546E7A");
    warehouseGradient.addColorStop(1, "#455A64");
    ctx.fillStyle = warehouseGradient;
    ctx.fillRect(0, 380, CANVAS_WIDTH, 520);

    // Warehouse roof
    ctx.fillStyle = "#37474F";
    ctx.fillRect(0, 380, CANVAS_WIDTH, 20);

    // Draw dock doors
    DOCK_DOORS.forEach((door) => {
      const isOccupied = containers.some(
        (c) =>
          c.currentLocation.type === "dock" &&
          c.currentLocation.slotId === door.id,
      );

      // Door (shutter style)
      ctx.fillStyle = isOccupied ? "#FFA726" : "#78909C";
      ctx.fillRect(door.x, door.y, door.w, door.h);

      // Shutter lines
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 2;
      for (let i = 0; i < door.h; i += 12) {
        ctx.beginPath();
        ctx.moveTo(door.x, door.y + i);
        ctx.lineTo(door.x + door.w, door.y + i);
        ctx.stroke();
      }

      // Door frame
      ctx.strokeStyle = isOccupied ? "#FF6F00" : "#37474F";
      ctx.lineWidth = isOccupied ? 5 : 3;
      ctx.strokeRect(door.x, door.y, door.w, door.h);

      // Door number
      ctx.fillStyle = "#000000";
      ctx.fillRect(door.x + 15, door.y - 32, door.w - 30, 28);
      ctx.fillStyle = isOccupied ? "#FFD700" : "#FFFFFF";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(String(door.id), door.x + door.w / 2, door.y - 10);
    });

    // Draw moving trucks
    trucks.forEach((truck) => {
      drawTruck(ctx, truck.x, truck.y, truck.containerNumber, truck.trailerId);
    });

    // Draw parked trucks
    parkedTrucks.forEach((truck) => {
      drawTruck(ctx, truck.x, truck.y, truck.containerNumber, truck.trailerId);
    });
  };

  const drawTruck = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    containerNumber: string,
    trailerId?: string,
  ) => {
    ctx.save();

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(x - 30, y + 45, 60, 10);

    // Container/Trailer (thùng container phía sau)
    ctx.fillStyle = "#E74C3C";
    ctx.fillRect(x - 25, y - 50, 50, 15);
    ctx.strokeStyle = "#C0392B";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 25, y - 50, 50, 15);

    // Container number trên thùng
    if (containerNumber) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.fillText(containerNumber, x, y - 42);
    }

    // Cab (đầu xe)
    ctx.fillStyle = "#3498DB";
    ctx.fillRect(x - 30, y - 35, 60, 70);
    ctx.strokeStyle = "#2980B9";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 30, y - 35, 60, 70);

    // Cab highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(x - 30, y - 35, 20, 70);

    // Windshield
    ctx.fillStyle = "#85C1E9";
    ctx.fillRect(x - 20, y - 25, 40, 25);

    // Wheels
    ctx.fillStyle = "#2C3E50";
    ctx.beginPath();
    ctx.arc(x - 15, y + 35, 8, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 35, 8, 0, Math.PI * 2);
    ctx.fill();

    // Wheel rims
    ctx.fillStyle = "#95A5A6";
    ctx.beginPath();
    ctx.arc(x - 15, y + 35, 4, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 35, 4, 0, Math.PI * 2);
    ctx.fill();

    // Trailer ID (bên dưới xe)
    if (trailerId) {
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(trailerId, x, y + 55);
    }

    ctx.restore();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">🚛 Yard Management System</h1>
          <p className="text-sm text-gray-400">
            Tự động điều phối container vào yard slots từ ASN list
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 p-6 h-[calc(100vh-80px)]">
        {/* Canvas Area */}
        <div className="flex-1 bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col">
          {/* Canvas Container */}
          <div className="flex-1 flex items-center justify-center relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="max-w-full max-h-full"
              style={{ display: "block" }}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 flex flex-col gap-4">
          {/* Statistics Summary */}
          {statistics && (
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl shadow-xl border border-blue-700 p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                📊 Thống Kê Container
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Total */}
                <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-600">
                  <div className="text-xs text-blue-300 mb-1">Tổng</div>
                  <div className="text-2xl font-bold text-white">
                    {statistics.total}
                  </div>
                </div>

                {/* In Yard */}
                <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-600">
                  <div className="text-xs text-blue-300 mb-1">Trong Yard</div>
                  <div className="text-2xl font-bold text-green-400">
                    {statistics.inYard}
                  </div>
                </div>

                {/* Arriving */}
                <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-600">
                  <div className="text-xs text-blue-300 mb-1">Đang đến</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {statistics.byState.arriving}
                  </div>
                </div>

                {/* Available ASNs */}
                <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-600">
                  <div className="text-xs text-blue-300 mb-1">ASN Còn lại</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {availableASNs.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4">
            <h3 className="text-lg font-bold text-white mb-4">🎮 Điều Khiển</h3>
            <div className="space-y-3">
              <button
                onClick={spawnRandomContainer}
                disabled={availableASNs.length === 0}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition font-bold"
              >
                ➕ Thêm Container Ngẫu Nhiên
              </button>

              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold">Auto Spawn:</label>
                  <input
                    type="checkbox"
                    checked={autoSpawn}
                    onChange={(e) => setAutoSpawn(e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Interval:</span>
                  <input
                    type="number"
                    value={spawnInterval}
                    onChange={(e) => setSpawnInterval(Number(e.target.value))}
                    min="5"
                    max="60"
                    className="flex-1 px-3 py-2 bg-gray-600 rounded text-center"
                  />
                  <span className="text-xs text-gray-300">giây</span>
                </div>
              </div>
            </div>
          </div>

          {/* Container List */}
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4">
              📦 Danh Sách Containers
            </h3>
            <div className="overflow-y-auto flex-1">
              <div className="space-y-2">
                {containers.map((container) => (
                  <div
                    key={container.id}
                    className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-bold">
                        {container.containerNumber}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          container.state === "in_yard"
                            ? "bg-green-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {container.state === "in_yard" ? "In Yard" : "Arriving"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-bold">
                          {container.containerType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Supplier:</span>
                        <span className="font-bold truncate ml-2">
                          {container.supplier}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-bold text-yellow-400">
                          {container.currentLocation.type === "yard"
                            ? `Slot #${container.currentLocation.slotId}`
                            : "On Road"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
