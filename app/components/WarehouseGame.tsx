"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";

// Types
type GameScene = "menu" | "road" | "gate" | "yard" | "door" | "checkout";
type TaskType = "inbound" | "outbound";
type ContainerStatus = "empty" | "full";

interface ASN {
  asnNumber: string;
  type: TaskType;
  factoryId: number;
  factoryName: string;
  containerNumber: string;
  containerType: "20ft" | "40ft" | "40ft-HC";
  status: ContainerStatus;
  poNumber: string;
  supplier: string;
  expectedItems: number;
  weight: number;
  locationID?: number; // Unified location (yard slot or dock door)
  locationType?: "yard" | "door"; // Type of location
}

interface Task {
  id: string;
  asn: ASN;
  assignedAt: string;
  status: "assigned" | "in-transit" | "at-gate" | "in-yard" | "completed";
}

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: "info" | "success" | "warning" | "error";
}

interface Truck {
  x: number;
  y: number;
  rotation: number;
  speed: number;
}

interface Slot {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FactoryLayout {
  factoryId: number;
  factoryName: string;
  yardSlots: Slot[];
  dockDoors: Slot[];
}

// Toast notification
const showToast = (
  message: string,
  type: "success" | "error" | "info" = "success",
) => {
  const toast = document.createElement("div");
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-blue-500";
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${bgColor} animate-slide-in`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("animate-fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Pre-defined ASN list (giống nghiệp vụ thật)
const AVAILABLE_ASNS: ASN[] = [
  {
    asnNumber: "ASN-2024-001",
    type: "inbound",
    factoryId: 1,
    factoryName: "Factory A",
    containerNumber: "CONT-ABC-12345",
    containerType: "40ft",
    status: "full",
    poNumber: "PO-2024-0156",
    supplier: "Samsung Electronics",
    expectedItems: 500,
    weight: 18500,
  },
  {
    asnNumber: "ASN-2024-002",
    type: "inbound",
    factoryId: 2,
    factoryName: "Factory B",
    containerNumber: "CONT-XYZ-67890",
    containerType: "20ft",
    status: "full",
    poNumber: "PO-2024-0157",
    supplier: "LG Display",
    expectedItems: 250,
    weight: 9200,
  },
  {
    asnNumber: "ASN-2024-003",
    type: "outbound",
    factoryId: 3,
    factoryName: "Warehouse C",
    containerNumber: "CONT-DEF-11111",
    containerType: "40ft-HC",
    status: "empty",
    poNumber: "PO-2024-0158",
    supplier: "Hyundai Motors",
    expectedItems: 0,
    weight: 3500,
  },
  {
    asnNumber: "ASN-2024-004",
    type: "inbound",
    factoryId: 4,
    factoryName: "Factory D",
    containerNumber: "CONT-GHI-22222",
    containerType: "40ft",
    status: "full",
    poNumber: "PO-2024-0159",
    supplier: "SK Hynix",
    expectedItems: 800,
    weight: 21000,
  },
  {
    asnNumber: "ASN-2024-005",
    type: "outbound",
    factoryId: 5,
    factoryName: "Warehouse E",
    containerNumber: "CONT-JKL-33333",
    containerType: "20ft",
    status: "empty",
    poNumber: "PO-2024-0160",
    supplier: "Posco Steel",
    expectedItems: 0,
    weight: 2800,
  },
  {
    asnNumber: "ASN-2024-006",
    type: "inbound",
    factoryId: 6,
    factoryName: "Distribution Center F",
    containerNumber: "CONT-MNO-44444",
    containerType: "40ft",
    status: "full",
    poNumber: "PO-2024-0161",
    supplier: "Coupang Logistics",
    expectedItems: 1200,
    weight: 19800,
  },
];

export default function WarehouseGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state
  const [scene, setScene] = useState<GameScene>("menu");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  // Player state
  const [driverName, setDriverName] = useState("");
  const [trailerId, setTrailerId] = useState("");
  const [truck, setTruck] = useState<Truck>({
    x: 100,
    y: 300,
    rotation: 0,
    speed: 3,
  });

  // Modals
  const [showStartModal, setShowStartModal] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);

  // Task form - chọn ASN có sẵn
  const [selectedASN, setSelectedASN] = useState<ASN | null>(null);
  const [availableASNs, setAvailableASNs] = useState<ASN[]>(AVAILABLE_ASNS);
  const [nearbyFactory, setNearbyFactory] = useState<string>("");

  // Yard slot selection at gate
  const [selectedYardSlot, setSelectedYardSlot] = useState<number | null>(null);
  const [hoveredYardSlot, setHoveredYardSlot] = useState<number | null>(null);

  // Parked containers tracking (container ID -> slot/door ID)
  const [parkedContainers, setParkedContainers] = useState<
    Record<number, string>
  >({});

  // Parking animation state
  const [isParking, setIsParking] = useState(false);
  const [targetSlot, setTargetSlot] = useState<{
    x: number;
    y: number;
    slotX: number;
    slotY: number;
    slotW: number;
    slotH: number;
    isDoor: boolean; // Track if parking into door or yard
  } | null>(null);
  const [parkingPhase, setParkingPhase] = useState<
    "approach" | "reverse" | "parked"
  >("approach");

  // Auto-driving state (for road scene click-to-move)
  const [isAutoDriving, setIsAutoDriving] = useState(false);
  const [targetFactory, setTargetFactory] = useState<{
    gateX: number;
    gateY: number;
    name: string;
  } | null>(null);

  // Canvas constants
  const CANVAS_WIDTH = 1600;
  const CANVAS_HEIGHT = 900;

  // Scroll offset for yard scene (horizontal scroll)
  const [scrollOffset, setScrollOffset] = useState(0);

  // Factory layouts storage (mỗi nhà máy có layout riêng)
  const [factoryLayouts, setFactoryLayouts] = useState<FactoryLayout[]>([
    {
      factoryId: 1,
      factoryName: "Factory A",
      yardSlots: [
        { id: 1, x: 50, y: 80, w: 140, h: 180 },
        { id: 2, x: 200, y: 80, w: 140, h: 180 },
        { id: 3, x: 350, y: 80, w: 140, h: 180 },
        { id: 4, x: 500, y: 80, w: 140, h: 180 },
        { id: 5, x: 650, y: 80, w: 140, h: 180 },
        { id: 6, x: 800, y: 80, w: 140, h: 180 },
        { id: 7, x: 950, y: 80, w: 140, h: 180 },
        { id: 8, x: 1100, y: 80, w: 140, h: 180 },
        { id: 9, x: 1250, y: 80, w: 140, h: 180 },
        { id: 10, x: 1400, y: 80, w: 140, h: 180 },
      ],
      dockDoors: [
        { id: 415, x: 50, y: 620, w: 140, h: 180 },
        { id: 416, x: 200, y: 620, w: 140, h: 180 },
        { id: 417, x: 350, y: 620, w: 140, h: 180 },
        { id: 418, x: 500, y: 620, w: 140, h: 180 },
        { id: 419, x: 650, y: 620, w: 140, h: 180 },
        { id: 420, x: 800, y: 620, w: 140, h: 180 },
        { id: 421, x: 950, y: 620, w: 140, h: 180 },
        { id: 422, x: 1100, y: 620, w: 140, h: 180 },
        { id: 423, x: 1250, y: 620, w: 140, h: 180 },
        { id: 424, x: 1400, y: 620, w: 140, h: 180 },
      ],
    },
    {
      factoryId: 2,
      factoryName: "Factory B",
      yardSlots: [
        { id: 1, x: 50, y: 80, w: 140, h: 180 },
        { id: 2, x: 200, y: 80, w: 140, h: 180 },
        { id: 3, x: 350, y: 80, w: 140, h: 180 },
        { id: 4, x: 500, y: 80, w: 140, h: 180 },
        { id: 5, x: 650, y: 80, w: 140, h: 180 },
      ],
      dockDoors: [
        { id: 415, x: 50, y: 620, w: 140, h: 180 },
        { id: 416, x: 200, y: 620, w: 140, h: 180 },
        { id: 417, x: 350, y: 620, w: 140, h: 180 },
      ],
    },
    {
      factoryId: 3,
      factoryName: "Factory C",
      yardSlots: [
        { id: 1, x: 50, y: 80, w: 140, h: 180 },
        { id: 2, x: 200, y: 80, w: 140, h: 180 },
        { id: 3, x: 350, y: 80, w: 140, h: 180 },
        { id: 4, x: 500, y: 80, w: 140, h: 180 },
        { id: 5, x: 650, y: 80, w: 140, h: 180 },
        { id: 6, x: 800, y: 80, w: 140, h: 180 },
        { id: 7, x: 950, y: 80, w: 140, h: 180 },
      ],
      dockDoors: [
        { id: 415, x: 50, y: 620, w: 140, h: 180 },
        { id: 416, x: 200, y: 620, w: 140, h: 180 },
        { id: 417, x: 350, y: 620, w: 140, h: 180 },
        { id: 418, x: 500, y: 620, w: 140, h: 180 },
        { id: 419, x: 650, y: 620, w: 140, h: 180 },
      ],
    },
  ]);

  // Get current factory layout
  const getCurrentLayout = () => {
    const factoryId = currentTask?.asn.factoryId || 1;
    return (
      factoryLayouts.find((layout) => layout.factoryId === factoryId) ||
      factoryLayouts[0]
    );
  };

  const currentLayout = getCurrentLayout();
  const YARD_SLOTS = currentLayout.yardSlots;
  const DOCK_DOORS = currentLayout.dockDoors;

  // Factories/Warehouses data - Rộng hơn, nhiều hơn
  const FACTORIES = [
    {
      id: 1,
      name: "Factory A",
      x: 300,
      y: 50,
      w: 250,
      h: 180,
      color: "#546E7A",
      gateX: 425,
      gateY: 230,
    },
    {
      id: 2,
      name: "Factory B",
      x: 700,
      y: 80,
      w: 270,
      h: 170,
      color: "#607D8B",
      gateX: 835,
      gateY: 250,
    },
    {
      id: 3,
      name: "Warehouse C",
      x: 1150,
      y: 60,
      w: 230,
      h: 190,
      color: "#78909C",
      gateX: 1265,
      gateY: 250,
    },
    {
      id: 4,
      name: "Factory D",
      x: 1550,
      y: 70,
      w: 250,
      h: 180,
      color: "#546E7A",
      gateX: 1675,
      gateY: 250,
    },
    {
      id: 5,
      name: "Warehouse E",
      x: 1950,
      y: 60,
      w: 240,
      h: 190,
      color: "#607D8B",
      gateX: 2070,
      gateY: 250,
    },
    {
      id: 6,
      name: "Factory F",
      x: 400,
      y: 600,
      w: 260,
      h: 170,
      color: "#78909C",
      gateX: 530,
      gateY: 600,
    },
    {
      id: 7,
      name: "Distribution Center",
      x: 850,
      y: 580,
      w: 300,
      h: 190,
      color: "#546E7A",
      gateX: 1000,
      gateY: 580,
    },
    {
      id: 8,
      name: "Warehouse H",
      x: 1350,
      y: 590,
      w: 270,
      h: 180,
      color: "#607D8B",
      gateX: 1485,
      gateY: 590,
    },
    {
      id: 9,
      name: "Factory I",
      x: 1820,
      y: 600,
      w: 250,
      h: 170,
      color: "#78909C",
      gateX: 1945,
      gateY: 600,
    },
  ];

  // Animation state
  const [clouds, setClouds] = useState([
    { x: 100, y: 50, w: 120, h: 40, speed: 0.2 },
    { x: 400, y: 80, w: 150, h: 50, speed: 0.15 },
    { x: 800, y: 30, w: 100, h: 35, speed: 0.25 },
    { x: 1200, y: 60, w: 130, h: 45, speed: 0.18 },
  ]);

  // Add activity log
  const addLog = (
    action: string,
    details: string,
    type: ActivityLog["type"] = "info",
  ) => {
    const log: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("vi-VN"),
      action,
      details,
      type,
    };
    setActivityLog((prev) => [log, ...prev]);
  };

  // Handle start game
  const handleStartGame = () => {
    if (!driverName || !trailerId) {
      showToast("Vui lòng chọn đầy đủ thông tin!", "error");
      return;
    }
    setShowStartModal(false);
    setScene("road"); // Chuyển sang road scene
    showToast(`Chào mừng tài xế ${driverName}!`, "success");
    addLog(
      "Bắt đầu ca làm việc",
      `Tài xế: ${driverName}, Trailer: ${trailerId}`,
      "success",
    );
  };

  // Handle task assignment - chọn ASN có sẵn
  const handleTaskAssign = () => {
    if (!selectedASN) {
      showToast("Vui lòng chọn ASN!", "error");
      return;
    }

    const task: Task = {
      id: `TASK-${Date.now()}`,
      asn: selectedASN,
      assignedAt: new Date().toISOString(),
      status: "assigned",
    };

    setCurrentTask(task);
    setShowTaskModal(false);
    setScene("road");

    // Remove ASN from available list
    setAvailableASNs((prev) =>
      prev.filter((asn) => asn.asnNumber !== selectedASN.asnNumber),
    );

    const taskText =
      selectedASN.type === "inbound"
        ? "Giao hàng (Xe Đầy)"
        : "Lấy container rỗng (Xe Rỗng)";
    showToast(
      `Nhiệm vụ: ${taskText} - ASN #${selectedASN.asnNumber}`,
      "success",
    );
    addLog(
      "Nhận nhiệm vụ",
      `${taskText} - ASN #${selectedASN.asnNumber} - Đến: ${selectedASN.factoryName}`,
      "info",
    );
  };

  // Handle canvas click for parking
  // Handle canvas mouse move for hover effect
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (scene !== "yard" || isParking) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Scale mouse coordinates to match canvas internal resolution
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check if hovering over a yard slot
    let foundHover = false;
    for (const slot of YARD_SLOTS) {
      if (
        mouseX >= slot.x &&
        mouseX <= slot.x + slot.w &&
        mouseY >= slot.y &&
        mouseY <= slot.y + slot.h
      ) {
        setHoveredYardSlot(slot.id);
        foundHover = true;
        break;
      }
    }

    if (!foundHover) {
      setHoveredYardSlot(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Scale click coordinates to match canvas internal resolution
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Handle road scene clicks (click-to-move to factory)
    if (scene === "road" && !isAutoDriving) {
      // Check if clicked on a factory
      for (const factory of FACTORIES) {
        if (
          clickX >= factory.x &&
          clickX <= factory.x + factory.w &&
          clickY >= factory.y &&
          clickY <= factory.y + factory.h
        ) {
          // Start auto-driving to factory gate
          setIsAutoDriving(true);
          setTargetFactory({
            gateX: factory.gateX,
            gateY: factory.gateY,
            name: factory.name,
          });
          showToast(`🚗 Đang lái đến ${factory.name}...`, "info");
          addLog("Tự động lái", `Đến ${factory.name}`, "info");
          return;
        }
      }
      return;
    }

    // Handle yard scene clicks
    if (scene !== "yard" || isParking) return;

    // Check if clicked on a yard slot
    for (const slot of YARD_SLOTS) {
      if (
        clickX >= slot.x &&
        clickX <= slot.x + slot.w &&
        clickY >= slot.y &&
        clickY <= slot.y + slot.h
      ) {
        // Assign yard slot to current task (cho phép đổi slot)
        if (currentTask) {
          const oldSlot = currentTask.asn.locationID;
          currentTask.asn.locationID = slot.id;
          currentTask.asn.locationType = "yard";

          if (oldSlot && oldSlot !== slot.id) {
            showToast(`✅ Đổi sang Yard #${slot.id}`, "success");
            addLog("Đổi Yard Slot", `Từ #${oldSlot} → #${slot.id}`, "success");
          } else if (!oldSlot) {
            showToast(`✅ Đã chọn Yard #${slot.id}`, "success");
            addLog("Chọn Yard Slot", `Yard #${slot.id}`, "success");
          }
        }

        // Start parking animation - approach from below the slot
        setIsParking(true);
        setParkingPhase("approach");
        setTargetSlot({
          x: slot.x + slot.w / 2,
          y: slot.y + slot.h + 60, // Position below slot
          slotX: slot.x,
          slotY: slot.y,
          slotW: slot.w,
          slotH: slot.h,
          isDoor: false, // Parking into yard slot
        });
        showToast(`Đang đỗ xe vào Yard #${slot.id}...`, "info");
        addLog("Đỗ xe", `Yard Slot #${slot.id}`, "info");
        return;
      }
    }

    // Check if clicked on a dock door
    for (const door of DOCK_DOORS) {
      if (
        clickX >= door.x &&
        clickX <= door.x + door.w &&
        clickY >= door.y &&
        clickY <= door.y + door.h
      ) {
        // Assign dock door to current task
        if (currentTask) {
          currentTask.asn.locationID = door.id;
          currentTask.asn.locationType = "door";
          showToast(`✅ Đã chọn Door #${door.id}`, "success");
          addLog("Chọn Dock Door", `Door #${door.id}`, "success");
        }

        setIsParking(true);
        setParkingPhase("approach");
        setTargetSlot({
          x: door.x + door.w / 2,
          y: door.y + door.h + 60,
          slotX: door.x,
          slotY: door.y,
          slotW: door.w,
          slotH: door.h,
          isDoor: true, // Parking into dock door
        });
        showToast(`Đang đỗ xe vào Door #${door.id}...`, "info");
        addLog("Đỗ xe", `Dock Door #${door.id}`, "info");
        return;
      }
    }
  };

  // Handle mouse wheel for zoom
  // Removed zoom/pan handlers

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cải thiện chất lượng rendering khi zoom
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Cải thiện text rendering - chống giật chữ
    ctx.textRendering = "optimizeLegibility" as any;
    ctx.font = "14px Arial"; // Set default font

    let animationId: number;
    let truckState = { ...truck };
    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;

      // E key to enter gate
      if (e.key.toLowerCase() === "e" && scene === "road") {
        // Check if near any factory gate
        FACTORIES.forEach((factory) => {
          const dist = Math.sqrt(
            Math.pow(truckState.x - factory.gateX, 2) +
              Math.pow(truckState.y - factory.gateY, 2),
          );
          if (dist < 60) {
            setShowGateModal(true);
            setNearbyFactory(factory.name);
          }
        });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ===== HELPER FUNCTIONS =====

    // Shade color helper (darken/lighten)
    const shadeColor = (color: string, percent: number) => {
      const num = parseInt(color.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = ((num >> 8) & 0x00ff) + amt;
      const B = (num & 0x0000ff) + amt;
      return (
        "#" +
        (
          0x1000000 +
          (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
          (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
          (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1)
      );
    };

    // ===== DRAWING FUNCTIONS =====

    // Draw sky with gradient
    const drawSky = (ctx: CanvasRenderingContext2D) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT / 2);
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(1, "#B0E0E6");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    };

    // Draw clouds
    const drawClouds = (ctx: CanvasRenderingContext2D) => {
      clouds.forEach((cloud) => {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.w / 3, 0, Math.PI * 2);
        ctx.arc(
          cloud.x + cloud.w / 3,
          cloud.y - 10,
          cloud.w / 2.5,
          0,
          Math.PI * 2,
        );
        ctx.arc(cloud.x + cloud.w / 1.5, cloud.y, cloud.w / 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Draw ground with more details
    const drawGround = (ctx: CanvasRenderingContext2D) => {
      // Grass with texture
      const grassGradient = ctx.createLinearGradient(
        0,
        CANVAS_HEIGHT / 2,
        0,
        CANVAS_HEIGHT,
      );
      grassGradient.addColorStop(0, "#8BC34A");
      grassGradient.addColorStop(0.5, "#7CB342");
      grassGradient.addColorStop(1, "#689F38");
      ctx.fillStyle = grassGradient;
      ctx.fillRect(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);

      // Add grass texture (random dots)
      ctx.fillStyle = "rgba(76, 175, 80, 0.3)";
      for (let i = 0; i < 100; i++) {
        const gx = Math.random() * CANVAS_WIDTH;
        const gy = CANVAS_HEIGHT / 2 + Math.random() * (CANVAS_HEIGHT / 2);
        ctx.fillRect(gx, gy, 2, 2);
      }

      // Sidewalk (vỉa hè)
      ctx.fillStyle = "#BDBDBD";
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 100, CANVAS_WIDTH, 20);
      ctx.fillRect(0, CANVAS_HEIGHT / 2 + 80, CANVAS_WIDTH, 20);

      // Road with gradient
      const roadGradient = ctx.createLinearGradient(
        0,
        CANVAS_HEIGHT / 2 - 80,
        0,
        CANVAS_HEIGHT / 2 + 80,
      );
      roadGradient.addColorStop(0, "#616161");
      roadGradient.addColorStop(0.5, "#424242");
      roadGradient.addColorStop(1, "#616161");
      ctx.fillStyle = roadGradient;
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 80, CANVAS_WIDTH, 160);

      // Road edge lines
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2 - 80);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2 - 80);
      ctx.moveTo(0, CANVAS_HEIGHT / 2 + 80);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2 + 80);
      ctx.stroke();

      // Center road markings (dashed yellow line)
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.setLineDash([30, 20]);
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw building (City Island style - improved)
    const drawBuilding = (ctx: CanvasRenderingContext2D, factory: any) => {
      const { x, y, w, h, color, name } = factory;

      // Ground shadow (longer and softer)
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(x + 8, y + h + 5, w + 10, 15);

      // Building base (foundation)
      ctx.fillStyle = "#8D6E63";
      ctx.fillRect(x - 5, y + h - 10, w + 10, 10);

      // Main building with gradient
      const buildingGradient = ctx.createLinearGradient(x, y, x + w, y);
      buildingGradient.addColorStop(0, color);
      buildingGradient.addColorStop(0.5, color);
      buildingGradient.addColorStop(1, shadeColor(color, -20));
      ctx.fillStyle = buildingGradient;
      ctx.fillRect(x, y, w, h);

      // 3D effect - left side (lighter)
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillRect(x, y, w / 4, h);

      // 3D effect - right side (darker)
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(x + (w * 3) / 4, y, w / 4, h);

      // Building outline
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Windows
      const windowRows = 3;
      const windowCols = 4;
      const windowW = 15;
      const windowH = 20;
      const windowSpacingX = (w - windowCols * windowW) / (windowCols + 1);
      const windowSpacingY = (h - windowRows * windowH) / (windowRows + 1);

      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          const wx = x + windowSpacingX + col * (windowW + windowSpacingX);
          const wy = y + windowSpacingY + row * (windowH + windowSpacingY);
          ctx.fillStyle = "#FFF59D";
          ctx.fillRect(wx, wy, windowW, windowH);
          ctx.strokeStyle = "#37474F";
          ctx.lineWidth = 2;
          ctx.strokeRect(wx, wy, windowW, windowH);
        }
      }

      // Roof
      ctx.fillStyle = "#D32F2F";
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + w / 2, y - 30);
      ctx.lineTo(x + w + 10, y);
      ctx.closePath();
      ctx.fill();

      // Chimney & Smoke
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(x + w - 40, y - 50, 20, 50);
      ctx.fillStyle = "rgba(200, 200, 200, 0.6)";
      ctx.beginPath();
      ctx.arc(x + w - 30, y - 60, 10, 0, Math.PI * 2);
      ctx.arc(x + w - 25, y - 75, 12, 0, Math.PI * 2);
      ctx.arc(x + w - 20, y - 90, 8, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(name, x + w / 2, y + h + 25);

      // Gate
      ctx.fillStyle = "#795548";
      ctx.fillRect(factory.gateX - 15, factory.gateY, 30, 40);
      ctx.strokeStyle = "#4E342E";
      ctx.lineWidth = 3;
      ctx.strokeRect(factory.gateX - 15, factory.gateY, 30, 40);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.fillText("GATE", factory.gateX, factory.gateY + 20);
      ctx.font = "10px Arial";
      ctx.fillText("Press E", factory.gateX, factory.gateY + 35);
    };

    // Draw truck (City Island style)
    const drawTruck = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      rotation: number,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(-30, 45, 60, 10);

      // Trailer
      ctx.fillStyle = "#E74C3C";
      ctx.fillRect(-25, -50, 50, 15);
      ctx.strokeStyle = "#C0392B";
      ctx.lineWidth = 3;
      ctx.strokeRect(-25, -50, 50, 15);

      if (trailerId) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(trailerId, 0, -42);
      }

      // Cab
      ctx.fillStyle = "#3498DB";
      ctx.fillRect(-30, -35, 60, 70);
      ctx.strokeStyle = "#2980B9";
      ctx.lineWidth = 3;
      ctx.strokeRect(-30, -35, 60, 70);

      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(-30, -35, 20, 70);

      // Windshield
      ctx.fillStyle = "#85C1E9";
      ctx.fillRect(-20, -25, 40, 25);

      // Wheels
      ctx.fillStyle = "#2C3E50";
      ctx.beginPath();
      ctx.arc(-15, 35, 8, 0, Math.PI * 2);
      ctx.arc(15, 35, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#95A5A6";
      ctx.beginPath();
      ctx.arc(-15, 35, 4, 0, Math.PI * 2);
      ctx.arc(15, 35, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Draw yard board (2D top-down view - Board Game Style)
    const drawYardBoard = (ctx: CanvasRenderingContext2D) => {
      // Background - Concrete texture
      const gradient = ctx.createLinearGradient(
        0,
        0,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );
      gradient.addColorStop(0, "#B0BEC5");
      gradient.addColorStop(0.5, "#90A4AE");
      gradient.addColorStop(1, "#78909C");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Header panel (không scroll)
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, 70);

      // Title (không scroll)
      ctx.fillStyle = "#00E676";
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";
      const factoryName = currentTask?.asn.factoryName || "Yard Management";
      ctx.fillText(`🏭 ${factoryName}`, CANVAS_WIDTH / 2, 35);

      // Yard Slots Section Label (không scroll)
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 16px Arial";
      ctx.fillText("🅿️ YARD PARKING SLOTS", CANVAS_WIDTH / 2, 60);

      // Apply horizontal scroll offset - BẮT ĐẦU SCROLL TỪ ĐÂY
      ctx.save();
      ctx.translate(-scrollOffset, 0);

      // Background - Sky (scroll theo)
      const skyGradient = ctx.createLinearGradient(0, 0, 0, 300);
      skyGradient.addColorStop(0, "#2C3E50");
      skyGradient.addColorStop(1, "#34495E");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH + scrollOffset * 2, 300);

      // Vẽ mặt đất - bãi đỗ xe yard (asphalt) - scroll theo
      ctx.fillStyle = "#3A3A3A";
      ctx.fillRect(0, 70, CANVAS_WIDTH + scrollOffset * 2, 200);

      // Tính toán chiều rộng vạch vàng dựa trên tổng chiều rộng slots
      const totalWidth = Math.max(
        CANVAS_WIDTH,
        (YARD_SLOTS[YARD_SLOTS.length - 1]?.x || 0) + 200,
      );

      // Vạch vàng đứt nét trên cùng (chạy dọc toàn bộ yard)
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.moveTo(0, YARD_SLOTS[0].y);
      ctx.lineTo(totalWidth, YARD_SLOTS[0].y);
      ctx.stroke();

      // Vạch vàng đứt nét dưới cùng (chạy dọc toàn bộ yard)
      ctx.beginPath();
      ctx.moveTo(0, YARD_SLOTS[0].y + YARD_SLOTS[0].h);
      ctx.lineTo(totalWidth, YARD_SLOTS[0].y + YARD_SLOTS[0].h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vẽ yard slots
      YARD_SLOTS.forEach((yard, index) => {
        const isTargetSlot =
          currentTask?.asn.locationID === yard.id &&
          currentTask?.asn.locationType === "yard";
        const isHovered = hoveredYardSlot === yard.id;

        // Highlight nền slot khi target hoặc hover
        if (isTargetSlot) {
          ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
          ctx.fillRect(yard.x, yard.y, yard.w, yard.h);
        } else if (isHovered) {
          ctx.fillStyle = "rgba(100, 200, 255, 0.2)";
          ctx.fillRect(yard.x, yard.y, yard.w, yard.h);
        }

        // Vạch kẻ bên trái slot (vạch trắng dọc)
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(yard.x, yard.y);
        ctx.lineTo(yard.x, yard.y + yard.h);
        ctx.stroke();

        // Vạch kẻ bên phải slot cuối cùng
        if (index === YARD_SLOTS.length - 1) {
          ctx.beginPath();
          ctx.moveTo(yard.x + yard.w, yard.y);
          ctx.lineTo(yard.x + yard.w, yard.y + yard.h);
          ctx.stroke();
        }

        // Số slot với background
        const fontSize = isHovered || isTargetSlot ? 38 : 32;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";

        // Background cho số
        const bgWidth = 50;
        const bgHeight = 45;
        ctx.fillStyle = isTargetSlot
          ? "rgba(255, 215, 0, 0.9)"
          : isHovered
            ? "rgba(100, 181, 246, 0.9)"
            : "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(
          yard.x + yard.w / 2 - bgWidth / 2,
          yard.y + 10,
          bgWidth,
          bgHeight,
        );

        // Số slot
        ctx.fillStyle = isTargetSlot || isHovered ? "#000000" : "#FFFFFF";
        ctx.fillText(String(yard.id), yard.x + yard.w / 2, yard.y + 42);

        // Target indicator
        if (isTargetSlot) {
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 15;
          ctx.fillStyle = "#FFD700";
          ctx.font = "bold 18px Arial";
          ctx.fillText("⭐ TARGET", yard.x + yard.w / 2, yard.y + yard.h - 20);
          ctx.shadowBlur = 0;
        }

        // Hover indicator
        if (isHovered && !isTargetSlot) {
          ctx.fillStyle = "#64B5F6";
          ctx.font = "bold 16px Arial";
          ctx.fillText("👆 CLICK", yard.x + yard.w / 2, yard.y + yard.h - 20);
        }

        // Container ID board (phía trên slot)
        // Kiểm tra xem có container nào đang đỗ ở slot này không
        const parkedContainer =
          currentTask?.asn.locationID === yard.id &&
          currentTask?.asn.locationType === "yard"
            ? currentTask.asn.containerNumber
            : null;

        if (parkedContainer) {
          // Vẽ bảng container ID
          const boardWidth = yard.w - 4;
          const boardHeight = 42;
          const boardX = yard.x + 2;
          const boardY = yard.y - 48;

          // Background bảng (màu xanh đậm)
          ctx.fillStyle = "#1E3A8A";
          ctx.fillRect(boardX, boardY, boardWidth, boardHeight);

          // Border bảng (màu vàng nổi bật)
          ctx.strokeStyle = "#FCD34D";
          ctx.lineWidth = 3;
          ctx.strokeRect(boardX, boardY, boardWidth, boardHeight);

          // Container ID text (màu vàng sáng)
          ctx.fillStyle = "#FEF08A";
          ctx.font = "bold 16px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            parkedContainer,
            yard.x + yard.w / 2,
            boardY + boardHeight / 2,
          );
        }
      });

      // Divider - Đường giữa yard và dock (scroll theo)
      ctx.fillStyle = "#5A5A5A";
      ctx.fillRect(0, 280, totalWidth, 80);

      // Vạch kẻ đường trên
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 12]);
      ctx.beginPath();
      ctx.moveTo(0, 295);
      ctx.lineTo(totalWidth, 295);
      ctx.stroke();

      // Vạch kẻ đường dưới
      ctx.beginPath();
      ctx.moveTo(0, 345);
      ctx.lineTo(totalWidth, 345);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vẽ tòa nhà/warehouse (scroll theo)
      const warehouseGradient = ctx.createLinearGradient(0, 380, 0, 900);
      warehouseGradient.addColorStop(0, "#546E7A");
      warehouseGradient.addColorStop(1, "#455A64");
      ctx.fillStyle = warehouseGradient;
      ctx.fillRect(0, 380, totalWidth, 520);

      // Mái nhà
      ctx.fillStyle = "#37474F";
      ctx.fillRect(0, 380, totalWidth, 20);

      // Dock Doors - Vẽ ô cửa cuốn chi tiết
      DOCK_DOORS.forEach((door) => {
        const isTargetDoor =
          currentTask?.asn.locationID === door.id &&
          currentTask?.asn.locationType === "door";

        // Cửa dock (như cửa cuốn)
        ctx.fillStyle = isTargetDoor ? "#FFA726" : "#78909C";
        ctx.fillRect(door.x, door.y, door.w, door.h);

        // Vân cửa cuốn (horizontal lines)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 2;
        for (let i = 0; i < door.h; i += 12) {
          ctx.beginPath();
          ctx.moveTo(door.x, door.y + i);
          ctx.lineTo(door.x + door.w, door.y + i);
          ctx.stroke();
        }

        // Khung cửa
        ctx.strokeStyle = isTargetDoor ? "#FF6F00" : "#37474F";
        ctx.lineWidth = isTargetDoor ? 5 : 3;
        ctx.strokeRect(door.x, door.y, door.w, door.h);

        // Số door ở trên cửa
        ctx.fillStyle = "#000000";
        ctx.fillRect(door.x + 15, door.y - 32, door.w - 30, 28);
        ctx.fillStyle = isTargetDoor ? "#FFD700" : "#FFFFFF";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText(String(door.id), door.x + door.w / 2, door.y - 10);

        // Đèn báo
        ctx.fillStyle = isTargetDoor ? "#4CAF50" : "#F44336";
        ctx.beginPath();
        ctx.arc(door.x + door.w - 15, door.y + 15, 6, 0, Math.PI * 2);
        ctx.fill();

        // Container ID board (phía trên door - giống yard slot)
        const parkedContainerAtDoor =
          currentTask?.asn.locationID === door.id &&
          currentTask?.asn.locationType === "door"
            ? currentTask.asn.containerNumber
            : null;

        if (parkedContainerAtDoor) {
          // Vẽ bảng container ID
          const boardWidth = door.w - 4;
          const boardHeight = 42;
          const boardX = door.x + 2;
          const boardY = door.y - 88;

          // Background bảng (màu xanh đậm)
          ctx.fillStyle = "#1E3A8A";
          ctx.fillRect(boardX, boardY, boardWidth, boardHeight);

          // Border bảng (màu vàng nổi bật)
          ctx.strokeStyle = "#FCD34D";
          ctx.lineWidth = 3;
          ctx.strokeRect(boardX, boardY, boardWidth, boardHeight);

          // Container ID text (màu vàng sáng)
          ctx.fillStyle = "#FEF08A";
          ctx.font = "bold 16px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            parkedContainerAtDoor,
            door.x + door.w / 2,
            boardY + boardHeight / 2,
          );
        }
      });

      // Draw truck in yard (affected by scroll)
      if (truckState.x && truckState.y) {
        drawTruck(ctx, truckState.x, truckState.y, truckState.rotation);
      }

      // Restore context after scroll
      ctx.restore();
    };

    // Main render loop
    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (scene === "road") {
        // 3D City Island view
        drawSky(ctx);

        // Animate clouds
        setClouds((prev) =>
          prev.map((cloud) => ({
            ...cloud,
            x:
              cloud.x + cloud.speed > CANVAS_WIDTH
                ? -cloud.w
                : cloud.x + cloud.speed,
          })),
        );
        drawClouds(ctx);
        drawGround(ctx);
        FACTORIES.forEach((factory) => drawBuilding(ctx, factory));

        // Auto-driving animation (click-to-move)
        if (isAutoDriving && targetFactory) {
          const dx = targetFactory.gateX - truckState.x;
          const dy = targetFactory.gateY - truckState.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 10) {
            // Drive to factory gate
            const angle = Math.atan2(dy, dx);
            truckState.x += Math.cos(angle) * truckState.speed;
            truckState.y += Math.sin(angle) * truckState.speed;
            truckState.rotation = angle;
            setTruck({ ...truckState });
          } else {
            // Arrived at factory gate
            setIsAutoDriving(false);
            setNearbyFactory(targetFactory.name);
            setShowGateModal(true);
            showToast(`✅ Đã đến ${targetFactory.name}!`, "success");
            addLog("Đến cổng", targetFactory.name, "success");
          }
        } else if (!isAutoDriving) {
          // Manual truck movement (only when not auto-driving)
          let moved = false;
          if (keys["w"] || keys["arrowup"]) {
            truckState.y -= truckState.speed;
            truckState.rotation = 0;
            moved = true;
          }
          if (keys["s"] || keys["arrowdown"]) {
            truckState.y += truckState.speed;
            truckState.rotation = Math.PI;
            moved = true;
          }
          if (keys["a"] || keys["arrowleft"]) {
            truckState.x -= truckState.speed;
            truckState.rotation = -Math.PI / 2;
            moved = true;
          }
          if (keys["d"] || keys["arrowright"]) {
            truckState.x += truckState.speed;
            truckState.rotation = Math.PI / 2;
            moved = true;
          }

          if (moved) setTruck(truckState);
        }

        truckState.x = Math.max(50, Math.min(CANVAS_WIDTH - 50, truckState.x));
        truckState.y = Math.max(50, Math.min(CANVAS_HEIGHT - 50, truckState.y));

        drawTruck(ctx, truckState.x, truckState.y, truckState.rotation);
      } else if (scene === "yard") {
        // 2D Board view for yard management
        drawYardBoard(ctx);

        // Auto-parking animation
        if (isParking && targetSlot) {
          const dx = targetSlot.x - truckState.x;
          const dy = targetSlot.y - truckState.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (parkingPhase === "approach") {
            // Phase 1: Drive to position in front of slot (below the slot)
            if (distance > 5) {
              const angle = Math.atan2(dy, dx);
              truckState.x += Math.cos(angle) * truckState.speed;
              truckState.y += Math.sin(angle) * truckState.speed;
              truckState.rotation = angle;
              setTruck({ ...truckState });
            } else {
              // Reached position, start reversing
              setParkingPhase("reverse");
              // Yard: đầu đỏ hướng xuống (Math.PI), Door: đầu đỏ hướng lên (0)
              truckState.rotation = targetSlot.isDoor ? 0 : Math.PI;
              setTruck({ ...truckState });
            }
          } else if (parkingPhase === "reverse") {
            // Phase 2: Reverse into slot (move upward into the slot)
            const finalY = targetSlot.slotY + targetSlot.slotH / 2; // Center of slot
            const finalX = targetSlot.slotX + targetSlot.slotW / 2; // Center of slot

            const rdx = finalX - truckState.x;
            const rdy = finalY - truckState.y;
            const rdistance = Math.sqrt(rdx * rdx + rdy * rdy);

            if (rdistance > 3) {
              // Reverse slowly into slot (move upward)
              truckState.x += rdx * 0.05; // Adjust X to center
              truckState.y += rdy * 0.1; // Move upward into slot
              setTruck({ ...truckState });
            } else {
              // Parked! Set final position at center of slot
              truckState.x = finalX;
              truckState.y = finalY;
              // Yard: đầu đỏ hướng xuống (Math.PI), Door: đầu đỏ hướng lên (0)
              truckState.rotation = targetSlot.isDoor ? 0 : Math.PI;
              setTruck({ ...truckState });

              setParkingPhase("parked");
              setIsParking(false);
              showToast("✅ Đã đỗ xe thành công!", "success");
              addLog("Hoàn thành", "Xe đã đỗ vào slot", "success");
            }
          }
        } else if (!isParking) {
          // Manual truck movement in yard (only when not auto-parking)
          let moved = false;
          if (keys["w"] || keys["arrowup"]) {
            truckState.y -= truckState.speed;
            truckState.rotation = 0;
            moved = true;
          }
          if (keys["s"] || keys["arrowdown"]) {
            truckState.y += truckState.speed;
            truckState.rotation = Math.PI;
            moved = true;
          }
          if (keys["a"] || keys["arrowleft"]) {
            truckState.x -= truckState.speed;
            truckState.rotation = -Math.PI / 2;
            moved = true;
          }
          if (keys["d"] || keys["arrowright"]) {
            truckState.x += truckState.speed;
            truckState.rotation = Math.PI / 2;
            moved = true;
          }

          if (moved) setTruck(truckState);
        }
      } else {
        // Other scenes
        ctx.fillStyle = "#2C3E50";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#fff";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Scene: ${scene}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [scene, trailerId, FACTORIES, clouds, nearbyFactory, truck]);

  // Handle gate check-in
  const handleGateCheckIn = () => {
    if (!currentTask) {
      showToast("Chưa có nhiệm vụ! Vui lòng nhận nhiệm vụ trước.", "error");
      return;
    }

    // Kiểm tra đúng nhà máy
    if (nearbyFactory !== currentTask.asn.factoryName) {
      showToast(
        `❌ Sai nhà máy! Bạn phải đến ${currentTask.asn.factoryName}`,
        "error",
      );
      return;
    }

    // Vào yard scene để chọn yard slot
    setShowGateModal(false);
    setScene("yard");
    setTruck({ x: 150, y: 350, rotation: 0, speed: 3 });

    showToast(`✅ Check-in thành công!`, "success");
    addLog(
      "Check-in tại cổng",
      `${currentTask.asn.factoryName} - ASN #${currentTask.asn.asnNumber}`,
      "success",
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-white">
                🏭 Warehouse Management System
              </h1>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg">
                <span className="text-gray-400 text-sm">Scene:</span>
                <span className="text-white font-semibold">
                  {scene === "menu" && "📋 Menu"}
                  {scene === "road" && "🛣️ Road"}
                  {scene === "gate" && "🚪 Gate"}
                  {scene === "yard" && "📦 Yard"}
                  {scene === "door" && "🚛 Door"}
                  {scene === "checkout" && "✅ Checkout"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {driverName && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg">
                  <span className="text-gray-400 text-sm">👤</span>
                  <span className="text-white font-medium">{driverName}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-blue-400 font-medium">{trailerId}</span>
                </div>
              )}
              <button
                onClick={() => setShowTaskModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                📋 Nhận Nhiệm Vụ
              </button>
            </div>
          </div>
        </div>
      </nav>

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
              className="cursor-pointer max-w-full max-h-full"
              style={{ display: "block" }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
            />

            {/* Scroll Controls (only in yard scene) */}
            {scene === "yard" && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={() =>
                    setScrollOffset((prev) => Math.max(0, prev - 150))
                  }
                  disabled={scrollOffset === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-full shadow-lg transition-all"
                  title="Scroll Left"
                >
                  ◀
                </button>

                {/* Right Arrow */}
                <button
                  onClick={() => {
                    const maxScroll = Math.max(
                      0,
                      (YARD_SLOTS[YARD_SLOTS.length - 1]?.x || 0) +
                        140 -
                        CANVAS_WIDTH,
                    );
                    setScrollOffset((prev) => Math.min(maxScroll, prev + 150));
                  }}
                  disabled={
                    scrollOffset >=
                    Math.max(
                      0,
                      (YARD_SLOTS[YARD_SLOTS.length - 1]?.x || 0) +
                        140 -
                        CANVAS_WIDTH,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-full shadow-lg transition-all"
                  title="Scroll Right"
                >
                  ▶
                </button>
              </>
            )}
          </div>

          {/* Scroll Bar (only in yard scene) */}
          {scene === "yard" && (
            <div className="bg-gray-900 p-3 border-t border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  Scroll:
                </span>
                <input
                  type="range"
                  min="0"
                  max={Math.max(
                    0,
                    (YARD_SLOTS[YARD_SLOTS.length - 1]?.x || 0) +
                      140 -
                      CANVAS_WIDTH,
                  )}
                  value={scrollOffset}
                  onChange={(e) => setScrollOffset(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {scrollOffset}px
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Activity Log & Task Info */}
        <div className="w-96 flex flex-col gap-4">
          {/* Current Task Card */}
          {currentTask && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">📋 Nhiệm Vụ Hiện Tại</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-200">ASN:</span>
                  <span className="font-bold">
                    #{currentTask.asn.asnNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Loại:</span>
                  <span className="font-bold">
                    {currentTask.asn.type === "inbound"
                      ? "📦 Inbound"
                      : "📤 Outbound"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Nhà máy:</span>
                  <span className="font-bold">
                    🏭 {currentTask.asn.factoryName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Container:</span>
                  <span className="font-bold">
                    {currentTask.asn.containerNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Loại:</span>
                  <span className="font-bold">
                    {currentTask.asn.containerType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Supplier:</span>
                  <span className="font-bold text-xs">
                    {currentTask.asn.supplier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">Trọng lượng:</span>
                  <span className="font-bold">
                    {currentTask.asn.weight.toLocaleString()} kg
                  </span>
                </div>
                {currentTask.asn.locationID && (
                  <div className="flex justify-between">
                    <span className="text-blue-200">
                      {currentTask.asn.locationType === "door"
                        ? "Dock Door:"
                        : "Yard Slot:"}
                    </span>
                    <span className="font-bold text-yellow-300">
                      #{currentTask.asn.locationID}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statistics Summary */}
          {scene === "yard" && (
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl shadow-xl border border-blue-700 p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                📊 Tổng Kết - {currentLayout.factoryName}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Yard Slots Stats */}
                <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-600">
                  <div className="text-xs text-blue-300 mb-1">
                    🅿️ Yard Slots
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">
                    {YARD_SLOTS.length}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">✓ Trống:</span>
                      <span className="font-bold text-green-400">
                        {
                          YARD_SLOTS.filter(
                            (slot) => !parkedContainers[slot.id],
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-red-400">✗ Đang dùng:</span>
                      <span className="font-bold text-red-400">
                        {
                          YARD_SLOTS.filter((slot) => parkedContainers[slot.id])
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dock Doors Stats */}
                <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-600">
                  <div className="text-xs text-blue-300 mb-1">
                    🚪 Dock Doors
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">
                    {DOCK_DOORS.length}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">✓ Trống:</span>
                      <span className="font-bold text-green-400">
                        {
                          DOCK_DOORS.filter(
                            (door) => !parkedContainers[door.id],
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-red-400">✗ Đang dùng:</span>
                      <span className="font-bold text-red-400">
                        {
                          DOCK_DOORS.filter((door) => parkedContainers[door.id])
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Stats */}
              <div className="mt-3 pt-3 border-t border-blue-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-200">Tổng vị trí:</span>
                  <span className="text-lg font-bold text-white">
                    {YARD_SLOTS.length + DOCK_DOORS.length}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-blue-200">Tỷ lệ sử dụng:</span>
                  <span className="text-lg font-bold text-yellow-400">
                    {(
                      (Object.keys(parkedContainers).length /
                        (YARD_SLOTS.length + DOCK_DOORS.length)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Layout Manager */}
          {scene === "yard" && (
            <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-4">
              <h3 className="text-lg font-bold text-white mb-4">
                🏗️ Quản Lý Layout
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      🅿️ Yard Slots ({YARD_SLOTS.length})
                    </span>
                    <button
                      onClick={() => {
                        const newId = prompt("Nhập ID cho Yard Slot mới:");
                        if (newId) {
                          const id = parseInt(newId);
                          if (isNaN(id)) {
                            showToast("ID phải là số!", "error");
                            return;
                          }
                          const exists = YARD_SLOTS.find((s) => s.id === id);
                          if (exists) {
                            showToast(`Yard Slot #${id} đã tồn tại!`, "error");
                            return;
                          }
                          const lastSlot = YARD_SLOTS[YARD_SLOTS.length - 1];
                          const newSlot: Slot = {
                            id,
                            x: lastSlot.x + 150,
                            y: 80,
                            w: 140,
                            h: 180,
                          };
                          setFactoryLayouts((prev) =>
                            prev.map((layout) =>
                              layout.factoryId === currentTask?.asn.factoryId
                                ? {
                                    ...layout,
                                    yardSlots: [...layout.yardSlots, newSlot],
                                  }
                                : layout,
                            ),
                          );
                          showToast(`✅ Đã thêm Yard Slot #${id}`, "success");
                        }
                      }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                    >
                      + Thêm
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      🚪 Dock Doors ({DOCK_DOORS.length})
                    </span>
                    <button
                      onClick={() => {
                        const newId = prompt("Nhập ID cho Dock Door mới:");
                        if (newId) {
                          const id = parseInt(newId);
                          if (isNaN(id)) {
                            showToast("ID phải là số!", "error");
                            return;
                          }
                          const exists = DOCK_DOORS.find((d) => d.id === id);
                          if (exists) {
                            showToast(`Dock Door #${id} đã tồn tại!`, "error");
                            return;
                          }
                          const lastDoor = DOCK_DOORS[DOCK_DOORS.length - 1];
                          const newDoor: Slot = {
                            id,
                            x: lastDoor.x + 150,
                            y: 620,
                            w: 140,
                            h: 180,
                          };
                          setFactoryLayouts((prev) =>
                            prev.map((layout) =>
                              layout.factoryId === currentTask?.asn.factoryId
                                ? {
                                    ...layout,
                                    dockDoors: [...layout.dockDoors, newDoor],
                                  }
                                : layout,
                            ),
                          );
                          showToast(`✅ Đã thêm Dock Door #${id}`, "success");
                        }
                      }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                    >
                      + Thêm
                    </button>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    Layout cho:{" "}
                    <span className="text-green-400 font-bold">
                      {currentLayout.factoryName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div className="flex-1 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden flex flex-col">
            <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
              <h3 className="text-lg font-bold text-white">
                📜 Lịch Sử Hoạt Động
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activityLog.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Chưa có hoạt động nào
                </div>
              ) : (
                activityLog.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      log.type === "success"
                        ? "bg-green-900/20 border-green-500"
                        : log.type === "error"
                          ? "bg-red-900/20 border-red-500"
                          : log.type === "warning"
                            ? "bg-yellow-900/20 border-yellow-500"
                            : "bg-blue-900/20 border-blue-500"
                    }`}
                  >
                    <div className="text-white font-medium text-sm">
                      {log.action}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {log.details}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      🕐 {log.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Start Modal */}
      <Modal
        isOpen={showStartModal}
        onClose={() => {}}
        title="🚛 Bắt Đầu Ca Làm Việc"
        onConfirm={handleStartGame}
        confirmText="✅ Bắt Đầu"
        closable={false}
        width="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn Tài Xế
            </label>
            <select
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Chọn tài xế --</option>
              <option value="Nguyễn Văn A">Nguyễn Văn A</option>
              <option value="Trần Văn B">Trần Văn B</option>
              <option value="Lê Văn C">Lê Văn C</option>
              <option value="Phạm Văn D">Phạm Văn D</option>
              <option value="Hoàng Văn E">Hoàng Văn E</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn Trailer ID
            </label>
            <select
              value={trailerId}
              onChange={(e) => setTrailerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Chọn trailer --</option>
              <option value="TRL-001">TRL-001</option>
              <option value="TRL-002">TRL-002</option>
              <option value="TRL-003">TRL-003</option>
              <option value="TRL-004">TRL-004</option>
              <option value="TRL-005">TRL-005</option>
              <option value="TRL-006">TRL-006</option>
              <option value="TRL-007">TRL-007</option>
              <option value="TRL-008">TRL-008</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Task Assignment Modal - Chọn ASN có sẵn */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="📋 Chọn ASN - Danh Sách Nhiệm Vụ"
        onConfirm={handleTaskAssign}
        confirmText="✅ Nhận Nhiệm Vụ"
        width="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Hướng dẫn:</strong> Chọn một ASN từ danh sách bên dưới.
              Bạn phải đến đúng nhà máy/kho được chỉ định trong ASN.
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {availableASNs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">Không còn ASN nào!</p>
                <p className="text-sm">Tất cả nhiệm vụ đã được nhận.</p>
              </div>
            ) : (
              availableASNs.map((asn) => (
                <div
                  key={asn.asnNumber}
                  onClick={() => setSelectedASN(asn)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedASN?.asnNumber === asn.asnNumber
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-300 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            asn.type === "inbound"
                              ? "bg-green-500 text-white"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {asn.type === "inbound"
                            ? "📦 INBOUND"
                            : "📤 OUTBOUND"}
                        </span>
                        <span className="font-bold text-lg text-gray-800">
                          {asn.asnNumber}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Nhà máy:</span>
                          <span className="ml-2 font-semibold text-gray-800">
                            🏭 {asn.factoryName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Container:</span>
                          <span className="ml-2 font-semibold text-gray-800">
                            {asn.containerNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Loại:</span>
                          <span className="ml-2 font-semibold text-gray-800">
                            {asn.containerType}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Trạng thái:</span>
                          <span className="ml-2 font-semibold text-gray-800">
                            {asn.status === "full" ? "🟢 Đầy" : "⚪ Rỗng"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">PO:</span>
                          <span className="ml-2 font-semibold text-gray-800">
                            {asn.poNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Supplier:</span>
                          <span className="ml-2 font-semibold text-gray-800">
                            {asn.supplier}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Số lượng:</span>
                          <span className="ml-2 font-semibold text-gray-800">
                            {asn.expectedItems} items
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Trọng lượng:</span>
                          <span className="ml-2 font-semibold text-gray-800">
                            {asn.weight.toLocaleString()} kg
                          </span>
                        </div>
                        {asn.locationID && (
                          <div>
                            <span className="text-gray-600">
                              {asn.locationType === "door"
                                ? "Dock Door:"
                                : "Yard Slot:"}
                            </span>
                            <span className="ml-2 font-semibold text-blue-600">
                              #{asn.locationID}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedASN?.asnNumber === asn.asnNumber && (
                      <div className="ml-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedASN && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm text-green-800">
                <strong>Đã chọn:</strong> {selectedASN.asnNumber} - Đến{" "}
                {selectedASN.factoryName}
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Gate Check-In Modal */}
      <Modal
        isOpen={showGateModal}
        onClose={() => setShowGateModal(false)}
        title="🚪 Gate Check-In - Bước 3"
        onConfirm={handleGateCheckIn}
        confirmText="✅ Check-In"
        width="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
            <div className="font-bold text-gray-800 mb-2">
              📦 Thông Tin Container
            </div>
            {currentTask && (
              <div className="space-y-1 text-sm">
                <div>
                  ASN:{" "}
                  <span className="font-bold">
                    #{currentTask.asn.asnNumber}
                  </span>
                </div>
                <div>
                  Container:{" "}
                  <span className="font-bold">
                    {currentTask.asn.containerNumber}
                  </span>
                </div>
                <div>
                  Loại:{" "}
                  <span className="font-bold">
                    {currentTask.asn.type === "inbound"
                      ? "Xe Đầy (Full)"
                      : "Xe Rỗng (Empty)"}
                  </span>
                </div>
                <div>
                  Nhà máy:{" "}
                  <span className="font-bold">
                    🏭 {currentTask.asn.factoryName}
                  </span>
                </div>
                <div>
                  Supplier:{" "}
                  <span className="font-bold">{currentTask.asn.supplier}</span>
                </div>
              </div>
            )}
          </div>
          <div className="text-center text-gray-600">
            Bảo vệ đang scan QR/Barcode...
          </div>
          <div className="text-center text-sm text-blue-600 font-bold mt-2">
            ➡️ Sau khi check-in, chọn Yard Slot trong yard scene
          </div>
        </div>
      </Modal>
    </div>
  );
}
