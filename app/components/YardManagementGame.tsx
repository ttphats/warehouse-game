"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Tag, Space, Button, message } from "antd";
import {
  containerService,
  driverService,
  workflowService,
  yardService,
} from "../services";
import { WorkflowModel, CameraMode } from "../models/Workflow.model";
import TaskAssignment, { TaskData } from "./TaskAssignment";
import WorkflowTracker from "./WorkflowTracker";

export default function YardManagementGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state
  const [truckPos, setTruckPos] = useState({ x: 150, y: 500 });
  const [truckRotation, setTruckRotation] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>("overview");

  // Workflow state
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowModel | null>(
    null,
  );
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Data
  const [containers, setContainers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [yardSlots, setYardSlots] = useState<any[]>([]);

  // Map dimensions
  const CANVAS_WIDTH = 1600;
  const CANVAS_HEIGHT = 900;

  // Map areas - New layout
  const ROAD = { x: 0, y: 750, w: CANVAS_WIDTH, h: 150 }; // Bottom road
  const GATE = { x: 50, y: 600, w: 120, h: 120 }; // Left gate

  // Building - Small, centered
  const BUILDING = { x: 700, y: 350, w: 200, h: 150 };

  // Doors - Horizontal row above building (10 doors)
  const DOORS = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    x: 100 + i * 140,
    y: 280,
    width: 120,
    height: 50,
    label: `D${i + 1}`,
  }));

  // Yard slots - Horizontal rows above doors (3 rows x 10 columns)
  const YARD_ROWS = 3;
  const YARD_COLS = 10;
  const SLOT_WIDTH = 120;
  const SLOT_HEIGHT = 80;
  const YARD_START_X = 100;
  const YARD_START_Y = 50;

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [containersData, driversData, slotsData] = await Promise.all([
      containerService.getAll(),
      driverService.getAll(),
      yardService.getAll(),
    ]);
    setContainers(containersData);
    setDrivers(driversData);
    setYardSlots(slotsData);
  };

  // Handle task assignment
  const handleAssignTask = async (taskData: TaskData) => {
    try {
      const workflow = await workflowService.create({
        jobId: `JOB-${Date.now()}`,
        ...taskData,
      });

      setCurrentWorkflow(workflow);
      message.success(`✅ Workflow created: ${workflow.asnNumber}`);

      // Update driver status
      await driverService.update(taskData.driverId, { status: "on-duty" });

      // Reload data
      loadData();
    } catch (error) {
      message.error("Failed to create workflow");
      console.error(error);
    }
  };

  // Complete current step
  const handleCompleteStep = async () => {
    if (!currentWorkflow) return;

    try {
      const updated = await workflowService.completeStep(currentWorkflow.id);
      if (updated) {
        setCurrentWorkflow(updated);
        message.success(`✅ Step ${updated.currentStep} completed`);

        // Check if workflow is complete
        if (updated.status === "completed") {
          message.success("🎉 Workflow completed!");
          setCurrentWorkflow(null);
          loadData();
        }
      }
    } catch (error) {
      message.error("Failed to complete step");
      console.error(error);
    }
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

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;

      // E key for interactions
      if (e.key.toLowerCase() === "e") {
        const atGate =
          pos.x > GATE.x &&
          pos.x < GATE.x + GATE.w &&
          pos.y > GATE.y &&
          pos.y < GATE.y + GATE.h;

        if (atGate && !currentWorkflow) {
          setShowTaskModal(true);
        }
      }

      // Space to complete step
      if (e.key === " " && currentWorkflow) {
        e.preventDefault();
        handleCompleteStep();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const draw = () => {
      // Clear background - lighter color
      ctx.fillStyle = "#e8f5e9";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid
      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_WIDTH; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < CANVAS_HEIGHT; i += 100) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_WIDTH, i);
        ctx.stroke();
      }

      // === YARD SLOTS (Top - 3 rows) ===
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      ctx.fillText("📦 YARD SLOTS", YARD_START_X, YARD_START_Y - 15);

      for (let row = 0; row < YARD_ROWS; row++) {
        for (let col = 0; col < YARD_COLS; col++) {
          const x = YARD_START_X + col * (SLOT_WIDTH + 20);
          const y = YARD_START_Y + row * (SLOT_HEIGHT + 10);
          const slotId = `Y${row + 1}-${col + 1}`;

          // Find if slot is occupied
          const slot = yardSlots.find((s) => s.id === slotId);
          const isOccupied = slot?.occupied || false;

          if (isOccupied) {
            // Occupied - red container
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(x, y, SLOT_WIDTH, SLOT_HEIGHT);
            ctx.strokeStyle = "#c0392b";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, SLOT_WIDTH, SLOT_HEIGHT);
          } else {
            // Empty - dashed outline
            ctx.strokeStyle = "#bdbdbd";
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.strokeRect(x, y, SLOT_WIDTH, SLOT_HEIGHT);
            ctx.setLineDash([]);
          }

          // Slot label
          ctx.fillStyle = isOccupied ? "#fff" : "#757575";
          ctx.font = "bold 14px Arial";
          ctx.textAlign = "center";
          ctx.fillText(slotId, x + SLOT_WIDTH / 2, y + SLOT_HEIGHT / 2 + 5);
        }
      }

      // === DOORS (Below yard - horizontal row) ===
      ctx.fillStyle = "#2196F3";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      ctx.fillText("🚪 LOADING DOORS", YARD_START_X, 260);

      DOORS.forEach((door) => {
        // Door background
        ctx.fillStyle = "#1976D2";
        ctx.fillRect(door.x, door.y, door.width, door.height);
        ctx.strokeStyle = "#0D47A1";
        ctx.lineWidth = 3;
        ctx.strokeRect(door.x, door.y, door.width, door.height);

        // Door label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(door.label, door.x + door.width / 2, door.y + 32);
      });

      // === BUILDING (Small, centered below doors) ===
      ctx.fillStyle = "#8D6E63";
      ctx.fillRect(BUILDING.x, BUILDING.y, BUILDING.w, BUILDING.h);
      ctx.strokeStyle = "#5D4037";
      ctx.lineWidth = 4;
      ctx.strokeRect(BUILDING.x, BUILDING.y, BUILDING.w, BUILDING.h);

      // Roof
      ctx.fillStyle = "#D32F2F";
      ctx.beginPath();
      ctx.moveTo(BUILDING.x - 20, BUILDING.y);
      ctx.lineTo(BUILDING.x + BUILDING.w / 2, BUILDING.y - 30);
      ctx.lineTo(BUILDING.x + BUILDING.w + 20, BUILDING.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Building label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🏭", BUILDING.x + BUILDING.w / 2, BUILDING.y + 60);
      ctx.font = "bold 14px Arial";
      ctx.fillText("WAREHOUSE", BUILDING.x + BUILDING.w / 2, BUILDING.y + 85);

      // === GATE (Left side) ===
      ctx.fillStyle = "#795548";
      ctx.fillRect(GATE.x, GATE.y, GATE.w, GATE.h);
      ctx.strokeStyle = "#4E342E";
      ctx.lineWidth = 5;
      ctx.strokeRect(GATE.x, GATE.y, GATE.w, GATE.h);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🚪", GATE.x + GATE.w / 2, GATE.y + 50);
      ctx.font = "bold 16px Arial";
      ctx.fillText("GATE", GATE.x + GATE.w / 2, GATE.y + 75);
      ctx.font = "12px Arial";
      ctx.fillText("Press E", GATE.x + GATE.w / 2, GATE.y + 95);

      // === ROAD (Bottom) ===
      ctx.fillStyle = "#424242";
      ctx.fillRect(ROAD.x, ROAD.y, ROAD.w, ROAD.h);

      // Road markings
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.setLineDash([50, 30]);
      ctx.beginPath();
      ctx.moveTo(0, ROAD.y + 75);
      ctx.lineTo(CANVAS_WIDTH, ROAD.y + 75);
      ctx.stroke();
      ctx.setLineDash([]);

      // Road border
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.strokeRect(ROAD.x, ROAD.y, ROAD.w, ROAD.h);

      // Update truck position
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

      pos.x = Math.max(40, Math.min(CANVAS_WIDTH - 40, pos.x));
      pos.y = Math.max(40, Math.min(CANVAS_HEIGHT - 40, pos.y));

      setTruckPos(pos);
      setTruckRotation(rot);

      // Draw truck
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(rot);

      const truckColor = currentWorkflow ? "#FFD700" : "#4A90E2";
      ctx.fillStyle = truckColor;
      ctx.fillRect(-25, -40, 50, 80);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeRect(-25, -40, 50, 80);

      ctx.fillStyle = "#E74C3C";
      ctx.fillRect(-20, -48, 40, 12);
      ctx.strokeRect(-20, -48, 40, 12);

      if (currentWorkflow) {
        ctx.fillStyle = "#000";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(currentWorkflow.asnNumber.slice(0, 10), 0, -15);
      }

      ctx.restore();

      requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [truckPos, truckRotation, currentWorkflow]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#1a1a1a",
        padding: 20,
      }}
    >
      {/* Header */}
      <Card style={{ marginBottom: 15 }}>
        <Space size="large">
          <Button type="primary" onClick={() => setShowTaskModal(true)}>
            📋 Giao Nhiệm Vụ Mới
          </Button>
          {currentWorkflow && (
            <>
              <Tag color="processing">ASN: {currentWorkflow.asnNumber}</Tag>
              <Tag color="blue">Step {currentWorkflow.currentStep + 1}/8</Tag>
              <Button onClick={handleCompleteStep}>✅ Complete Step</Button>
            </>
          )}
        </Space>
      </Card>

      <div style={{ display: "flex", gap: 15 }}>
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ border: "4px solid #333", borderRadius: 8, flex: 1 }}
        />

        {/* Workflow Tracker */}
        {currentWorkflow && (
          <div style={{ width: 400 }}>
            <WorkflowTracker workflow={currentWorkflow} />
          </div>
        )}
      </div>

      {/* Task Assignment Modal */}
      <TaskAssignment
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onAssign={handleAssignTask}
        drivers={drivers}
        containers={containers}
      />
    </div>
  );
}
