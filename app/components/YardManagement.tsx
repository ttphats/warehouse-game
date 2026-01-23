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
import DashboardLayout from "./DashboardLayout";
import {
  drawTruck,
  drawContainer,
  getContainerColor,
  type ContainerStatus,
} from "./TruckRenderer";

interface Slot {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  area?: "top" | "bottom" | "left" | "right" | "topYard" | "bottomYard"; // Parking area
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
  phase:
    | "at_gate"
    | "entering"
    | "moving_to_lane" // New phase: moving to lane via waypoint (avoiding warehouse)
    | "moving"
    | "approaching"
    | "turning"
    | "backing"
    | "parked";
  waitTimer?: number; // Timer for waiting at gate (in frames)
  approachX?: number; // Position to stop before backing into slot
  approachY?: number;
  laneX?: number; // Lane position X (final approach position)
  laneY?: number; // Lane position Y (final approach position)
  waypointX?: number; // Waypoint X (to avoid warehouse)
  waypointY?: number; // Waypoint Y (to avoid warehouse)
  rotation?: number; // Rotation angle in radians (0 = up, Math.PI/2 = right, Math.PI = down, -Math.PI/2 = left)
}

interface ParkedTruck {
  slotId: number;
  containerNumber: string;
  trailerId: string;
  x: number;
  y: number;
  rotation: number; // Rotation based on slot area
  area?: "top" | "bottom" | "left" | "right" | "topYard" | "bottomYard";
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

// Slot orientation config - Dễ dàng tùy chỉnh hướng và kích thước slot
const SLOT_CONFIG = {
  // Horizontal slots (top/bottom areas) - Slot nằm ngang
  horizontal: {
    width: 40, // Rộng (chiều ngang)
    height: 80, // Dài (chiều dọc) - vừa xe 60px
    orientation: "vertical", // Xe đậu theo chiều dọc
  },
  // Vertical slots (left/right areas) - Slot nằm dọc
  vertical: {
    width: 80, // Dài (chiều ngang) - vừa xe 60px
    height: 40, // Rộng (chiều dọc)
    orientation: "horizontal", // Xe đậu theo chiều ngang
  },
  gap: 8, // Khoảng cách giữa các slots
};

// Lane config - Làn đường cho xe di chuyển (wrap box cho mỗi dãy slot)
const LANE_CONFIG = {
  width: 60, // Độ rộng lane (đủ cho xe 25px + margin)
  color: "#A1A1AA", // Màu lane (asphalt)
  borderColor: "#71717A", // Màu viền lane
};

// Layout configuration - Optimized for 20-30 slots per zone
const LAYOUT = {
  // Warehouse center position
  warehouseY: 320,
  warehouseHeight: 100,

  // Dock doors - 12 slots each side
  dockCols: 12,

  // Spacing between areas - ĐỀU NHAU 4 PHÍA
  uniformSpacing: 60,
  get yardDockSpacing() {
    return this.uniformSpacing;
  },
  get sideSpacing() {
    return this.uniformSpacing;
  },

  // Calculated positions - căn giữa canvas
  get warehouseWidth() {
    return (
      this.dockCols * (SLOT_CONFIG.horizontal.width + SLOT_CONFIG.gap) -
      SLOT_CONFIG.gap
    );
  },
  get warehouseX() {
    return (CANVAS_WIDTH - this.warehouseWidth) / 2;
  },
  // Parking areas - dock doors 2 phía + yard slots xung quanh
  parking: {
    // Top dock doors - HORIZONTAL SLOTS
    topDock: {
      get x() {
        return LAYOUT.warehouseX;
      },
      get y() {
        return LAYOUT.warehouseY - SLOT_CONFIG.horizontal.height;
      },
      get slotWidth() {
        return SLOT_CONFIG.horizontal.width;
      },
      get slotHeight() {
        return SLOT_CONFIG.horizontal.height;
      },
      get gap() {
        return SLOT_CONFIG.gap;
      },
      rows: 1,
      get cols() {
        return LAYOUT.dockCols;
      },
      area: "top",
    },
    // Bottom dock doors - HORIZONTAL SLOTS
    bottomDock: {
      get x() {
        return LAYOUT.warehouseX;
      },
      get y() {
        return LAYOUT.warehouseY + LAYOUT.warehouseHeight;
      },
      get slotWidth() {
        return SLOT_CONFIG.horizontal.width;
      },
      get slotHeight() {
        return SLOT_CONFIG.horizontal.height;
      },
      get gap() {
        return SLOT_CONFIG.gap;
      },
      rows: 1,
      get cols() {
        return LAYOUT.dockCols;
      },
      area: "bottom",
    },
    // Top yard - SÁT TƯỜNG TRÊN - HORIZONTAL SLOTS
    topYard: {
      get x() {
        return LAYOUT.warehouseX;
      },
      get y() {
        return 25; // Sát tường trên
      },
      get slotWidth() {
        return SLOT_CONFIG.horizontal.width;
      },
      get slotHeight() {
        return SLOT_CONFIG.horizontal.height;
      },
      get gap() {
        return SLOT_CONFIG.gap;
      },
      rows: 1,
      get cols() {
        return LAYOUT.dockCols;
      },
      area: "topYard",
    },
    // Bottom yard - SÁT TƯỜNG DƯỚI - HORIZONTAL SLOTS
    bottomYard: {
      get x() {
        return LAYOUT.warehouseX;
      },
      get y() {
        return CANVAS_HEIGHT - 25 - SLOT_CONFIG.horizontal.height; // Sát tường dưới
      },
      get slotWidth() {
        return SLOT_CONFIG.horizontal.width;
      },
      get slotHeight() {
        return SLOT_CONFIG.horizontal.height;
      },
      get gap() {
        return SLOT_CONFIG.gap;
      },
      rows: 1,
      get cols() {
        return LAYOUT.dockCols;
      },
      area: "bottomYard",
    },
    // Left yard - SÁT TƯỜNG TRÁI - VERTICAL SLOTS (nằm ngang)
    left: {
      get x() {
        return 25; // Sát tường trái
      },
      get y() {
        return LAYOUT.warehouseY - SLOT_CONFIG.vertical.height;
      },
      get slotWidth() {
        return SLOT_CONFIG.vertical.width; // Dài (80px)
      },
      get slotHeight() {
        return SLOT_CONFIG.vertical.height; // Ngắn (40px)
      },
      get gap() {
        return SLOT_CONFIG.gap;
      },
      rows: 4,
      cols: 1,
      area: "left",
    },
    // Right yard - SÁT TƯỜNG PHẢI - VERTICAL SLOTS (nằm ngang)
    right: {
      get x() {
        return CANVAS_WIDTH - 25 - SLOT_CONFIG.vertical.width; // Sát tường phải
      },
      get y() {
        return LAYOUT.warehouseY - SLOT_CONFIG.vertical.height;
      },
      get slotWidth() {
        return SLOT_CONFIG.vertical.width; // Dài (80px)
      },
      get slotHeight() {
        return SLOT_CONFIG.vertical.height; // Ngắn (40px)
      },
      get gap() {
        return SLOT_CONFIG.gap;
      },
      rows: 4,
      cols: 1,
      area: "right",
    },
  },
};

// Roads (đơn giản)
const ROADS = {
  // Main horizontal road
  mainRoad: {
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
};

// Gates (ở 2 góc dưới) - CỔNG NHỎ HƠN
const ENTRY_GATE = {
  x: 50,
  y: CANVAS_HEIGHT - 90,
  width: 80,
  height: 70,
};

const EXIT_GATE = {
  x: CANVAS_WIDTH - 130,
  y: CANVAS_HEIGHT - 90,
  width: 80,
  height: 70,
};

// Generate all parking slots from layout
const generateParkingSlots = (): Slot[] => {
  const slots: Slot[] = [];
  let slotId = 1;

  // Top dock doors
  const topDock = LAYOUT.parking.topDock;
  for (let col = 0; col < topDock.cols; col++) {
    slots.push({
      id: slotId++,
      x: topDock.x + col * (topDock.slotWidth + topDock.gap),
      y: topDock.y,
      w: topDock.slotWidth,
      h: topDock.slotHeight,
      area: "top",
    });
  }

  // Bottom dock doors
  const bottomDock = LAYOUT.parking.bottomDock;
  for (let col = 0; col < bottomDock.cols; col++) {
    slots.push({
      id: slotId++,
      x: bottomDock.x + col * (bottomDock.slotWidth + bottomDock.gap),
      y: bottomDock.y,
      w: bottomDock.slotWidth,
      h: bottomDock.slotHeight,
      area: "bottom",
    });
  }

  // Top yard (phía trên top dock)
  const topYard = LAYOUT.parking.topYard;
  for (let col = 0; col < topYard.cols; col++) {
    slots.push({
      id: slotId++,
      x: topYard.x + col * (topYard.slotWidth + topYard.gap),
      y: topYard.y,
      w: topYard.slotWidth,
      h: topYard.slotHeight,
      area: "topYard",
    });
  }

  // Bottom yard (phía dưới bottom dock)
  const bottomYard = LAYOUT.parking.bottomYard;
  for (let col = 0; col < bottomYard.cols; col++) {
    slots.push({
      id: slotId++,
      x: bottomYard.x + col * (bottomYard.slotWidth + bottomYard.gap),
      y: bottomYard.y,
      w: bottomYard.slotWidth,
      h: bottomYard.slotHeight,
      area: "bottomYard",
    });
  }

  // Left yard slots
  const left = LAYOUT.parking.left;
  for (let row = 0; row < left.rows; row++) {
    slots.push({
      id: slotId++,
      x: left.x,
      y: left.y + row * (left.slotHeight + left.gap),
      w: left.slotWidth,
      h: left.slotHeight,
      area: "left",
    });
  }

  // Right yard slots
  const right = LAYOUT.parking.right;
  for (let row = 0; row < right.rows; row++) {
    slots.push({
      id: slotId++,
      x: right.x,
      y: right.y + row * (right.slotHeight + right.gap),
      w: right.slotWidth,
      h: right.slotHeight,
      area: "right",
    });
  }

  return slots;
};

// All parking slots
const ALL_PARKING_SLOTS = generateParkingSlots();

// Dock doors - top và bottom areas (20 dock doors total)
const DOCK_DOORS: Slot[] = ALL_PARKING_SLOTS.filter(
  (slot) => slot.area === "top" || slot.area === "bottom",
);

// Helper function to get yard slots for a specific zone
const getYardSlotsForZone = (zoneId: string): Slot[] => {
  // Return left and right yard slots only
  return ALL_PARKING_SLOTS.filter(
    (slot) => slot.area === "left" || slot.area === "right",
  );
};

// Zone state type
interface ZoneState {
  containers: YardContainer[];
  trucks: TruckAnimation[];
  parkedTrucks: ParkedTruck[];
}

export default function YardManagement() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [activeZone, setActiveZone] = useState("01");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State for all zones
  const [zoneStates, setZoneStates] = useState<Record<string, ZoneState>>({
    "01": { containers: [], trucks: [], parkedTrucks: [] },
    "02": { containers: [], trucks: [], parkedTrucks: [] },
    "03": { containers: [], trucks: [], parkedTrucks: [] },
    "04": { containers: [], trucks: [], parkedTrucks: [] },
    "05": { containers: [], trucks: [], parkedTrucks: [] },
    "06": { containers: [], trucks: [], parkedTrucks: [] },
  });

  const [statistics, setStatistics] = useState<any>(null);
  const [autoSpawn, setAutoSpawn] = useState(false);
  const [spawnInterval, setSpawnInterval] = useState(10); // seconds
  const [availableASNs, setAvailableASNs] = useState<ASN[]>(AVAILABLE_ASNS);
  const [usedASNs, setUsedASNs] = useState<string[]>([]);
  const [hoveredContainer, setHoveredContainer] = useState<{
    container: YardContainer;
    x: number;
    y: number;
  } | null>(null);

  // Get current zone state
  const currentZone = zoneStates[activeZone];
  const containers = currentZone.containers;
  const trucks = currentZone.trucks;
  const parkedTrucks = currentZone.parkedTrucks;

  // Helper functions to update zone state
  const setContainers = (
    updater: YardContainer[] | ((prev: YardContainer[]) => YardContainer[]),
  ) => {
    setZoneStates((prev) => ({
      ...prev,
      [activeZone]: {
        ...prev[activeZone],
        containers:
          typeof updater === "function"
            ? updater(prev[activeZone].containers)
            : updater,
      },
    }));
  };

  const setTrucks = (
    updater: TruckAnimation[] | ((prev: TruckAnimation[]) => TruckAnimation[]),
  ) => {
    setZoneStates((prev) => ({
      ...prev,
      [activeZone]: {
        ...prev[activeZone],
        trucks:
          typeof updater === "function"
            ? updater(prev[activeZone].trucks)
            : updater,
      },
    }));
  };

  const setParkedTrucks = (
    updater: ParkedTruck[] | ((prev: ParkedTruck[]) => ParkedTruck[]),
  ) => {
    setZoneStates((prev) => ({
      ...prev,
      [activeZone]: {
        ...prev[activeZone],
        parkedTrucks:
          typeof updater === "function"
            ? updater(prev[activeZone].parkedTrucks)
            : updater,
      },
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync containers from service periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStatistics(getContainerStatistics());
    }, 2000); // Update every 2 seconds

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

  // Sync parked trucks when trucks change phase to "parked"
  useEffect(() => {
    const newlyParked = trucks.filter((t) => t.phase === "parked");

    if (newlyParked.length > 0) {
      setParkedTrucks((prev) => {
        const updated = [...prev];

        newlyParked.forEach((truck) => {
          const alreadyParked = updated.some(
            (p) => p.containerNumber === truck.containerNumber,
          );

          if (!alreadyParked) {
            // Find slot to get area
            const slot = ALL_PARKING_SLOTS.find(
              (s) => s.id === truck.targetSlotId,
            );
            const area = slot?.area;

            // Calculate rotation based on area
            // Trái -> quay phải (Math.PI/2), Phải -> quay trái (-Math.PI/2)
            // Trên -> quay xuống (Math.PI), Dưới -> quay lên (0)
            let rotation = 0;
            if (area === "left") {
              rotation = Math.PI / 2; // Quay phải
            } else if (area === "right") {
              rotation = -Math.PI / 2; // Quay trái
            } else if (area === "top" || area === "topYard") {
              rotation = Math.PI; // Quay xuống
            } else if (area === "bottom" || area === "bottomYard") {
              rotation = 0; // Quay lên
            }

            updated.push({
              slotId: truck.targetSlotId,
              containerNumber: truck.containerNumber,
              trailerId: truck.trailerId,
              x: truck.targetX,
              y: truck.targetY,
              rotation: rotation,
              area: area,
            });
          }
        });

        return updated;
      });

      // Remove parked trucks from moving trucks
      setTrucks((prev) => prev.filter((t) => t.phase !== "parked"));
    }
  }, [trucks]);

  // Animation loop - ONLY for drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const animate = () => {
      drawYard(ctx);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeZone, containers, trucks, parkedTrucks, hoveredContainer]); // Re-draw when state changes

  // Truck updates - separate from drawing
  useEffect(() => {
    const interval = setInterval(() => {
      updateTrucks();
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - updateTrucks uses callback

  const loadData = () => {
    const data = getAllContainers({ state: ["in_yard", "arriving"] });

    // Update zone states with containers
    setZoneStates((prev) => {
      const newStates = { ...prev };
      // Distribute containers to zones based on their location
      Object.keys(newStates).forEach((zoneId) => {
        const zoneContainers = data.filter((c) => {
          if (c.currentLocation.type === "yard" && c.currentLocation.slotId) {
            const slotId = c.currentLocation.slotId;
            const containerZone = Math.ceil(slotId / 16);
            return String(containerZone).padStart(2, "0") === zoneId;
          }
          return false;
        });
        newStates[zoneId] = {
          ...newStates[zoneId],
          containers: zoneContainers,
        };
      });
      return newStates;
    });

    setStatistics(getContainerStatistics());

    // Update used ASNs
    const used = data.map((c) => c.asnNumber);
    setUsedASNs(used);
    setAvailableASNs(getAvailableASNs(used));
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

      // Create truck animation - Start from Entry Gate (căn giữa gate)
      const truck: TruckAnimation = {
        containerId: newContainer.id,
        containerNumber: newContainer.containerNumber,
        trailerId: trailerId,
        x: ENTRY_GATE.x + ENTRY_GATE.width / 2, // Căn giữa gate
        y: ENTRY_GATE.y + ENTRY_GATE.height / 2, // Căn giữa gate
        targetSlotId: emptySlot.id,
        targetX: emptySlot.x + emptySlot.w / 2,
        targetY: emptySlot.y + emptySlot.h / 2,
        phase: "at_gate", // Start at gate for check-in
        waitTimer: 0, // Timer for waiting at gate
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
    // Get slots for current zone
    const yardSlots = getYardSlotsForZone(activeZone);

    // Get slots targeted by trucks (including moving trucks)
    // This is the source of truth for slot reservation
    const targetedSlots = currentTrucks.map((t) => t.targetSlotId);

    // Get slots with parked trucks
    const parkedSlots = currentParkedTrucks.map((t) => t.slotId);

    // Combine reserved slots (don't use containers - they update async)
    const reservedSlots = [...targetedSlots, ...parkedSlots];

    for (const slot of yardSlots) {
      if (!reservedSlots.includes(slot.id)) {
        return slot;
      }
    }
    return null;
  };

  const updateTrucks = () => {
    setTrucks((prevTrucks) => {
      // Check if there are any moving trucks
      const hasMovingTrucks = prevTrucks.some((t) => t.phase !== "parked");
      if (!hasMovingTrucks) {
        return prevTrucks; // No changes needed
      }

      const updatedTrucks = prevTrucks.map((truck) => {
        if (truck.phase === "parked") return truck;

        // Clone truck to avoid mutation
        const updatedTruck = { ...truck };
        const speed = 1; // Very slow speed for realistic factory operations

        if (updatedTruck.phase === "at_gate") {
          // Wait at gate for check-in (2 seconds = 120 frames at 60fps)
          updatedTruck.waitTimer = (updatedTruck.waitTimer || 0) + 1;
          if (updatedTruck.waitTimer >= 120) {
            updatedTruck.phase = "entering";
            updatedTruck.waitTimer = 0;
          }
        } else if (updatedTruck.phase === "entering") {
          // Move from gate to safe zone - DƯỚI warehouse
          const safeY = LAYOUT.warehouseY + LAYOUT.warehouseHeight + 150; // Dưới warehouse
          const dy = safeY - updatedTruck.y;

          if (Math.abs(dy) > speed) {
            updatedTruck.y += (dy / Math.abs(dy)) * speed;
          } else {
            updatedTruck.y = safeY;
            updatedTruck.phase = "moving_to_lane";
          }
        } else if (updatedTruck.phase === "moving_to_lane") {
          // Di chuyển đến lane của slot - VÒNG QUANH WAREHOUSE
          if (!updatedTruck.laneX || !updatedTruck.laneY) {
            const slot = ALL_PARKING_SLOTS.find(
              (s) => s.id === updatedTruck.targetSlotId,
            );
            const area = slot?.area;

            // Tính toán lane position (đường đi vòng quanh warehouse)
            if (area === "left") {
              // Left slots: Lane ở bên PHẢI các slot
              updatedTruck.laneX = slot!.x + slot!.w + LANE_CONFIG.width / 2;
              updatedTruck.laneY = slot!.y + slot!.h / 2;
              // Waypoint: đi sang trái warehouse trước
              updatedTruck.waypointX = LAYOUT.warehouseX - 100;
              updatedTruck.waypointY =
                LAYOUT.warehouseY + LAYOUT.warehouseHeight / 2;
            } else if (area === "right") {
              // Right slots: Lane ở bên TRÁI các slot
              updatedTruck.laneX = slot!.x - LANE_CONFIG.width / 2;
              updatedTruck.laneY = slot!.y + slot!.h / 2;
              // Waypoint: đi sang phải warehouse trước
              updatedTruck.waypointX =
                LAYOUT.warehouseX + LAYOUT.warehouseWidth + 100;
              updatedTruck.waypointY =
                LAYOUT.warehouseY + LAYOUT.warehouseHeight / 2;
            } else if (area === "top" || area === "topYard") {
              // Top slots: Lane ở DƯỚI các slot
              updatedTruck.laneX = slot!.x + slot!.w / 2;
              updatedTruck.laneY = slot!.y + slot!.h + LANE_CONFIG.width / 2;
              // Waypoint: không cần (đã ở dưới)
              updatedTruck.waypointX = updatedTruck.laneX;
              updatedTruck.waypointY = updatedTruck.y; // Giữ Y hiện tại
            } else {
              // Bottom slots: Lane ở TRÊN các slot
              updatedTruck.laneX = slot!.x + slot!.w / 2;
              updatedTruck.laneY = slot!.y - LANE_CONFIG.width / 2;
              // Waypoint: không cần (đã ở dưới)
              updatedTruck.waypointX = updatedTruck.laneX;
              updatedTruck.waypointY = updatedTruck.y; // Giữ Y hiện tại
            }
          }

          // Di chuyển đến waypoint trước (tránh warehouse)
          const dxWaypoint = updatedTruck.waypointX! - updatedTruck.x;
          const dyWaypoint = updatedTruck.waypointY! - updatedTruck.y;
          const distWaypoint = Math.sqrt(
            dxWaypoint * dxWaypoint + dyWaypoint * dyWaypoint,
          );

          if (distWaypoint > speed) {
            // Chưa đến waypoint
            updatedTruck.x += (dxWaypoint / distWaypoint) * speed;
            updatedTruck.y += (dyWaypoint / distWaypoint) * speed;
          } else {
            // Đã đến waypoint, chuyển sang moving
            updatedTruck.x = updatedTruck.waypointX!;
            updatedTruck.y = updatedTruck.waypointY!;
            updatedTruck.phase = "moving";
          }
        } else if (updatedTruck.phase === "moving") {
          // Di chuyển từ waypoint đến lane position (approach slot)
          const dxLane = updatedTruck.laneX! - updatedTruck.x;
          const dyLane = updatedTruck.laneY! - updatedTruck.y;
          const distLane = Math.sqrt(dxLane * dxLane + dyLane * dyLane);

          if (distLane > speed) {
            // Chưa đến lane position
            updatedTruck.x += (dxLane / distLane) * speed;
            updatedTruck.y += (dyLane / distLane) * speed;
          } else {
            // Đã đến lane position
            updatedTruck.x = updatedTruck.laneX!;
            updatedTruck.y = updatedTruck.laneY!;
            updatedTruck.phase = "approaching";
            updatedTruck.waitTimer = 0;
          }
        } else if (updatedTruck.phase === "approaching") {
          // Rotate to correct angle for backing into slot
          const slot = ALL_PARKING_SLOTS.find(
            (s) => s.id === updatedTruck.targetSlotId,
          );
          const area = slot?.area;

          let targetRotation = 0;
          if (area === "left") {
            targetRotation = Math.PI / 2; // Face right to back left
          } else if (area === "right") {
            targetRotation = -Math.PI / 2; // Face left to back right
          } else if (area === "top" || area === "topYard") {
            targetRotation = Math.PI; // Face down to back up
          } else {
            targetRotation = 0; // Face up to back down
          }

          updatedTruck.waitTimer = (updatedTruck.waitTimer || 0) + 1;
          const turnProgress = Math.min(updatedTruck.waitTimer / 30, 1);
          updatedTruck.rotation = targetRotation * turnProgress;

          if (updatedTruck.waitTimer >= 30) {
            updatedTruck.rotation = targetRotation;
            updatedTruck.phase = "backing";
          }
        } else if (updatedTruck.phase === "backing") {
          // Back into slot - keep rotation
          const slot = ALL_PARKING_SLOTS.find(
            (s) => s.id === updatedTruck.targetSlotId,
          );
          const area = slot?.area;

          // Set final rotation based on area
          if (area === "left") {
            updatedTruck.rotation = Math.PI / 2;
          } else if (area === "right") {
            updatedTruck.rotation = -Math.PI / 2;
          } else if (area === "top" || area === "topYard") {
            updatedTruck.rotation = Math.PI;
          } else {
            updatedTruck.rotation = 0;
          }

          const dx = updatedTruck.targetX - updatedTruck.x;
          const dy = updatedTruck.targetY - updatedTruck.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < speed) {
            updatedTruck.x = updatedTruck.targetX;
            updatedTruck.y = updatedTruck.targetY;
            updatedTruck.phase = "parked";

            // Park the container
            updateContainerState({
              containerId: updatedTruck.containerId,
              state: "in_yard",
              location: {
                type: "yard",
                slotId: updatedTruck.targetSlotId,
                position: { x: updatedTruck.targetX, y: updatedTruck.targetY },
              },
            });
          } else {
            updatedTruck.x += (dx / distance) * speed;
            updatedTruck.y += (dy / distance) * speed;
          }
        }

        return updatedTruck;
      });

      // Keep parked trucks in animation for rendering
      return updatedTrucks;
    });
  };

  // Helper function to draw parking slot - Realistic warehouse style
  const drawParkingSlot = (
    ctx: CanvasRenderingContext2D,
    slot: Slot,
    isVertical: boolean,
  ) => {
    const isDock = slot.area === "top" || slot.area === "bottom";

    if (isDock) {
      // === DOCK DOOR - Giống cửa kho trong hình ===

      // Door background - dark metal with gradient
      const doorGradient = ctx.createLinearGradient(
        slot.x,
        slot.y,
        slot.x + slot.w,
        slot.y,
      );
      doorGradient.addColorStop(0, "#3F3F46");
      doorGradient.addColorStop(0.5, "#27272A");
      doorGradient.addColorStop(1, "#3F3F46");
      ctx.fillStyle = doorGradient;
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h);

      // Door panels - horizontal lines (giống cửa cuốn)
      ctx.strokeStyle = "#18181B";
      ctx.lineWidth = 2;
      const panelCount = 8;
      for (let i = 1; i < panelCount; i++) {
        const panelY = slot.y + (slot.h / panelCount) * i;
        ctx.beginPath();
        ctx.moveTo(slot.x + 2, panelY);
        ctx.lineTo(slot.x + slot.w - 2, panelY);
        ctx.stroke();
      }

      // Door frame - dark border
      ctx.strokeStyle = "#09090B";
      ctx.lineWidth = 4;
      ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);

      // Door number - yellow on dark background (smaller font)
      ctx.fillStyle = "#FCD34D";
      ctx.font = "bold 11px 'Inter', 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `D${String(slot.id).padStart(2, "0")}`,
        slot.x + slot.w / 2,
        slot.y + slot.h / 2,
      );
    } else {
      // === YARD PARKING - Realistic parking lot style ===

      // Asphalt texture - slightly darker than background
      ctx.fillStyle = "#A1A1AA";
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h);

      // Parking bay lines - white paint (thinner for compact slots)
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;

      // Left line
      ctx.beginPath();
      ctx.moveTo(slot.x, slot.y);
      ctx.lineTo(slot.x, slot.y + slot.h);
      ctx.stroke();

      // Right line (only for last slot in row to close)
      const isLastInRow =
        (slot.area === "topYard" && slot.id === 30) ||
        (slot.area === "bottomYard" && slot.id === 40) ||
        (slot.area === "left" && slot.id === 44) ||
        (slot.area === "right" && slot.id === 51);

      if (isLastInRow) {
        ctx.beginPath();
        ctx.moveTo(slot.x + slot.w, slot.y);
        ctx.lineTo(slot.x + slot.w, slot.y + slot.h);
        ctx.stroke();
      }

      // Top line (for horizontal slots)
      if (slot.area === "topYard" || slot.area === "bottomYard") {
        ctx.beginPath();
        ctx.moveTo(slot.x, slot.y);
        ctx.lineTo(slot.x + slot.w, slot.y);
        ctx.stroke();
      }

      // Bottom line (for horizontal slots)
      if (slot.area === "topYard" || slot.area === "bottomYard") {
        ctx.beginPath();
        ctx.moveTo(slot.x, slot.y + slot.h);
        ctx.lineTo(slot.x + slot.w, slot.y + slot.h);
        ctx.stroke();
      }

      // Corner markers (yellow) - smaller for compact slots
      ctx.fillStyle = "#FCD34D";
      const cornerSize = 5;

      // Top-left corner
      ctx.fillRect(slot.x + 2, slot.y + 2, cornerSize, 1.5);
      ctx.fillRect(slot.x + 2, slot.y + 2, 1.5, cornerSize);

      // Top-right corner
      ctx.fillRect(
        slot.x + slot.w - cornerSize - 2,
        slot.y + 2,
        cornerSize,
        1.5,
      );
      ctx.fillRect(slot.x + slot.w - 3.5, slot.y + 2, 1.5, cornerSize);

      // Parking number - smaller white text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px 'Inter', 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Add shadow for better visibility
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 0.5;

      ctx.fillText(
        `P${String(slot.id).padStart(2, "0")}`,
        slot.x + slot.w / 2,
        slot.y + slot.h / 2,
      );

      ctx.shadowBlur = 0;
    }
  };

  const drawYard = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // === BACKGROUND - Realistic concrete/asphalt ===
    // Base layer - concrete
    ctx.fillStyle = "#C7C5C2";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle texture overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
    for (let i = 0; i < CANVAS_WIDTH; i += 4) {
      for (let j = 0; j < CANVAS_HEIGHT; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }

    // === PERIMETER FENCE (Tường rào xung quanh yard) ===
    const fenceMargin = 15; // Khoảng cách từ edge canvas
    const fenceWidth = 6;

    // Fence - dark gray metal
    ctx.fillStyle = "#52525B";

    // Top fence
    ctx.fillRect(
      fenceMargin,
      fenceMargin,
      CANVAS_WIDTH - fenceMargin * 2,
      fenceWidth,
    );

    // Bottom fence (trừ chỗ cổng)
    ctx.fillRect(
      fenceMargin,
      CANVAS_HEIGHT - fenceMargin - fenceWidth,
      CANVAS_WIDTH - fenceMargin * 2,
      fenceWidth,
    );

    // Left fence
    ctx.fillRect(
      fenceMargin,
      fenceMargin,
      fenceWidth,
      CANVAS_HEIGHT - fenceMargin * 2,
    );

    // Right fence
    ctx.fillRect(
      CANVAS_WIDTH - fenceMargin - fenceWidth,
      fenceMargin,
      fenceWidth,
      CANVAS_HEIGHT - fenceMargin * 2,
    );

    // Fence posts (trụ tường) - darker
    ctx.fillStyle = "#3F3F46";
    const postSize = 10;

    // Corner posts
    ctx.fillRect(fenceMargin - 2, fenceMargin - 2, postSize, postSize); // Top-left
    ctx.fillRect(
      CANVAS_WIDTH - fenceMargin - postSize + 2,
      fenceMargin - 2,
      postSize,
      postSize,
    ); // Top-right
    ctx.fillRect(
      fenceMargin - 2,
      CANVAS_HEIGHT - fenceMargin - postSize + 2,
      postSize,
      postSize,
    ); // Bottom-left
    ctx.fillRect(
      CANVAS_WIDTH - fenceMargin - postSize + 2,
      CANVAS_HEIGHT - fenceMargin - postSize + 2,
      postSize,
      postSize,
    ); // Bottom-right

    // Bỏ kẻ đường - xe sẽ tự động tìm đường đi

    // === WAREHOUSE BUILDING - Modern industrial ===
    // Warehouse wall - light industrial color
    const warehouseGradient = ctx.createLinearGradient(
      LAYOUT.warehouseX,
      LAYOUT.warehouseY,
      LAYOUT.warehouseX,
      LAYOUT.warehouseY + LAYOUT.warehouseHeight,
    );
    warehouseGradient.addColorStop(0, "#E5E7EB");
    warehouseGradient.addColorStop(1, "#D1D5DB");
    ctx.fillStyle = warehouseGradient;
    ctx.fillRect(
      LAYOUT.warehouseX,
      LAYOUT.warehouseY,
      LAYOUT.warehouseWidth,
      LAYOUT.warehouseHeight,
    );

    // Warehouse border - subtle
    ctx.strokeStyle = "#9CA3AF";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      LAYOUT.warehouseX,
      LAYOUT.warehouseY,
      LAYOUT.warehouseWidth,
      LAYOUT.warehouseHeight,
    );

    // Warehouse label - professional
    ctx.fillStyle = "#374151";
    ctx.font = "600 20px 'Inter', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "WAREHOUSE",
      LAYOUT.warehouseX + LAYOUT.warehouseWidth / 2,
      LAYOUT.warehouseY + LAYOUT.warehouseHeight / 2,
    );

    // Zone label - modern badge style
    const zoneBadgeX = 30;
    const zoneBadgeY = 20;
    const zoneBadgeWidth = 100;
    const zoneBadgeHeight = 35;

    // Badge background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(zoneBadgeX, zoneBadgeY, zoneBadgeWidth, zoneBadgeHeight);
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2;
    ctx.strokeRect(zoneBadgeX, zoneBadgeY, zoneBadgeWidth, zoneBadgeHeight);

    // Badge text
    ctx.fillStyle = "#1F2937";
    ctx.font = "600 14px 'Inter', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `ZONE ${activeZone}`,
      zoneBadgeX + zoneBadgeWidth / 2,
      zoneBadgeY + zoneBadgeHeight / 2,
    );

    // === DRAW ALL PARKING SLOTS WITH STRIPES ===
    ALL_PARKING_SLOTS.forEach((slot) => {
      const isVertical = slot.area === "left" || slot.area === "right";
      drawParkingSlot(ctx, slot, !isVertical);
    });

    // === DRAW AREA LABELS - Subtle and modern ===
    ctx.font = "500 12px 'Inter', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Top Yard label
    const topYardConfig = LAYOUT.parking.topYard;
    ctx.fillStyle = "#64748B";
    ctx.fillText(
      "YARD PARKING",
      topYardConfig.x + (topYardConfig.slotWidth * topYardConfig.cols) / 2,
      topYardConfig.y - 15,
    );

    // Top Dock label
    const topDockConfig = LAYOUT.parking.topDock;
    ctx.fillStyle = "#475569";
    ctx.fillText(
      "DOCK DOORS",
      topDockConfig.x + (topDockConfig.slotWidth * topDockConfig.cols) / 2,
      topDockConfig.y - 15,
    );

    // Bottom Dock label
    const bottomDockConfig = LAYOUT.parking.bottomDock;
    ctx.fillStyle = "#475569";
    ctx.fillText(
      "DOCK DOORS",
      bottomDockConfig.x +
        (bottomDockConfig.slotWidth * bottomDockConfig.cols) / 2,
      bottomDockConfig.y + bottomDockConfig.slotHeight + 15,
    );

    // Bottom Yard label
    const bottomYardConfig = LAYOUT.parking.bottomYard;
    ctx.fillStyle = "#64748B";
    ctx.fillText(
      "YARD PARKING",
      bottomYardConfig.x +
        (bottomYardConfig.slotWidth * bottomYardConfig.cols) / 2,
      bottomYardConfig.y + bottomYardConfig.slotHeight + 15,
    );

    // === DRAW CONTAINERS IN PARKING SLOTS (modern UI) ===
    ALL_PARKING_SLOTS.forEach((slot) => {
      const container = containers.find(
        (c) =>
          (c.currentLocation.type === "dock" &&
            c.currentLocation.slotId === slot.id) ||
          (c.currentLocation.type === "yard" &&
            c.currentLocation.slotId === slot.id),
      );

      if (container) {
        const isHovered = hoveredContainer?.container.id === container.id;
        const containerStatus = container.status as ContainerStatus;
        const baseColor = getContainerColor(containerStatus);

        // Container size (smaller than slot for padding)
        const padding = 6;
        const containerW = slot.w - padding * 2;
        const containerH = slot.h - padding * 2;
        const containerX = slot.x + padding;
        const containerY = slot.y + padding;

        if (isHovered) {
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        // Draw container with rounded corners (modern look)
        ctx.fillStyle = baseColor;
        ctx.fillRect(containerX, containerY, containerW, containerH);

        // Thicker border for better visibility
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = isHovered ? 4 : 3;
        ctx.strokeRect(containerX, containerY, containerW, containerH);

        ctx.shadowBlur = 0;

        // Container number - LARGER TEXT
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          container.containerNumber,
          containerX + containerW / 2,
          containerY + containerH / 2,
        );
      }
    });

    // === ENTRY/EXIT GATES - Modern minimalist style ===

    // Helper function to draw modern gate
    const drawGate = (
      x: number,
      y: number,
      width: number,
      height: number,
      label: string,
      isEntry: boolean,
    ) => {
      // === MODERN GATE PILLARS ===
      const pillarWidth = 15;
      const pillarHeight = height + 30;

      // Left pillar
      const leftPillarX = x - 20;
      const pillarY = y - 15;

      const pillarGradient = ctx.createLinearGradient(
        leftPillarX,
        pillarY,
        leftPillarX + pillarWidth,
        pillarY,
      );
      pillarGradient.addColorStop(0, "#52525B");
      pillarGradient.addColorStop(1, "#3F3F46");

      ctx.fillStyle = pillarGradient;
      ctx.fillRect(leftPillarX, pillarY, pillarWidth, pillarHeight);

      // Right pillar
      const rightPillarX = x + width + 5;
      ctx.fillRect(rightPillarX, pillarY, pillarWidth, pillarHeight);

      // Pillar caps
      ctx.fillStyle = "#FBBF24";
      ctx.fillRect(leftPillarX - 2, pillarY - 6, pillarWidth + 4, 6);
      ctx.fillRect(rightPillarX - 2, pillarY - 6, pillarWidth + 4, 6);

      // === GATE ROAD SURFACE ===
      ctx.fillStyle = "#71717A";
      ctx.fillRect(x, y, width, height);

      // Road border
      ctx.strokeStyle = isEntry ? "#10B981" : "#EF4444";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Center dashed line
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(x, y + height / 2);
      ctx.lineTo(x + width, y + height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Bỏ overhead sign (không hiển thị chữ ENTRY/EXIT)

      // === BARRIER ARM (Thanh chắn ngang đường) ===
      const barrierWidth = width + 30;
      const barrierHeight = 8;
      const barrierX = x - 15;
      const barrierY = y + height / 2 - barrierHeight / 2;

      // Barrier pole (cột đỡ)
      const poleX = x + width / 2;
      const poleWidth = 10;
      const poleHeight = 35;

      // Pole gradient
      const poleGradient = ctx.createLinearGradient(
        poleX,
        barrierY - poleHeight,
        poleX + poleWidth,
        barrierY - poleHeight,
      );
      poleGradient.addColorStop(0, "#52525B");
      poleGradient.addColorStop(1, "#3F3F46");

      ctx.fillStyle = poleGradient;
      ctx.fillRect(
        poleX - poleWidth / 2,
        barrierY - poleHeight,
        poleWidth,
        poleHeight,
      );

      // Pole cap (nắp cột - vàng cảnh báo)
      ctx.fillStyle = "#FBBF24";
      ctx.fillRect(
        poleX - poleWidth / 2 - 2,
        barrierY - poleHeight,
        poleWidth + 4,
        5,
      );

      // Barrier arm - red/white striped
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(barrierX, barrierY, barrierWidth, barrierHeight);

      // White stripes on barrier
      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < barrierWidth; i += 20) {
        ctx.fillRect(barrierX + i, barrierY, 10, barrierHeight);
      }

      // Barrier border
      ctx.strokeStyle = "#7F1D1D";
      ctx.lineWidth = 2;
      ctx.strokeRect(barrierX, barrierY, barrierWidth, barrierHeight);

      // === DIRECTIONAL ARROW ===
      ctx.font = "700 28px 'Inter', 'Segoe UI', sans-serif";
      ctx.fillStyle = "#FBBF24";
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 4;
      ctx.fillText(isEntry ? "→" : "←", x + width / 2, y + height / 2 + 25);
      ctx.shadowBlur = 0;
    };

    // Draw Entry Gate
    drawGate(
      ENTRY_GATE.x,
      ENTRY_GATE.y,
      ENTRY_GATE.width,
      ENTRY_GATE.height,
      "ENTRY",
      true,
    );

    // Draw Exit Gate
    drawGate(
      EXIT_GATE.x,
      EXIT_GATE.y,
      EXIT_GATE.width,
      EXIT_GATE.height,
      "EXIT",
      false,
    );

    // Draw moving trucks
    trucks.forEach((truck) => {
      const containerStatus = getContainerStatus(truck.containerId);

      drawTruck(ctx, {
        x: truck.x,
        y: truck.y,
        containerNumber: truck.containerNumber,
        trailerId: truck.trailerId,
        containerStatus: containerStatus,
        isParked: false,
        rotation: truck.rotation || 0,
      });

      // Show "CHECK-IN" indicator if truck is at gate
      if (truck.phase === "at_gate") {
        ctx.fillStyle = "rgba(255, 193, 7, 0.9)";
        ctx.fillRect(truck.x - 20, truck.y - 40, 100, 25);
        ctx.strokeStyle = "#F57C00";
        ctx.lineWidth = 2;
        ctx.strokeRect(truck.x - 20, truck.y - 40, 100, 25);

        ctx.fillStyle = "#000000";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("CHECK-IN...", truck.x + 30, truck.y - 22);
      }

      // Show "BACKING..." indicator if truck is backing
      if (truck.phase === "backing") {
        ctx.fillStyle = "rgba(76, 175, 80, 0.9)";
        ctx.fillRect(truck.x - 20, truck.y - 40, 100, 25);
        ctx.strokeStyle = "#388E3C";
        ctx.lineWidth = 2;
        ctx.strokeRect(truck.x - 20, truck.y - 40, 100, 25);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("BACKING...", truck.x + 30, truck.y - 22);
      }
    });

    // Draw parked trucks (with rotation based on area)
    parkedTrucks.forEach((truck) => {
      // Find container status by container number
      const container = containers.find(
        (c) => c.containerNumber === truck.containerNumber,
      );
      const containerStatus = container
        ? (container.status as ContainerStatus)
        : "full";

      drawTruck(ctx, {
        x: truck.x,
        y: truck.y,
        containerNumber: truck.containerNumber,
        trailerId: truck.trailerId,
        containerStatus: containerStatus,
        isParked: true,
        rotation: truck.rotation, // Rotation based on slot area
      });

      // Draw container ID sign - THIẾT KẾ RÕ RÀNG, DỄ NHÌN
      const slot = ALL_PARKING_SLOTS.find((s) => s.id === truck.slotId);
      if (slot) {
        // Sign dimensions - vừa đủ lớn để đọc
        const signWidth = slot.w - 4; // Vừa khít slot
        const signHeight = 18;
        let signX = slot.x + 2;
        let signY = slot.y + 2;

        // Position sign ở góc slot dựa trên area - KHÔNG CHỒNG LÊN XE
        if (truck.area === "left" || truck.area === "right") {
          // Left/Right: Sign ở góc trên slot (horizontal slot)
          signX = slot.x + 2;
          signY = slot.y + 2;
        } else if (truck.area === "top" || truck.area === "topYard") {
          // Top: Sign ở góc dưới slot (xe ở trên, sign ở dưới)
          signX = slot.x + 2;
          signY = slot.y + slot.h - signHeight - 2;
        } else {
          // Bottom: Sign ở góc trên slot (xe ở dưới, sign ở trên)
          signX = slot.x + 2;
          signY = slot.y + 2;
        }

        // Sign background - gradient xanh dương chuyên nghiệp
        const gradient = ctx.createLinearGradient(
          signX,
          signY,
          signX,
          signY + signHeight,
        );
        gradient.addColorStop(0, "#3B82F6"); // Blue-500
        gradient.addColorStop(1, "#2563EB"); // Blue-600
        ctx.fillStyle = gradient;
        ctx.fillRect(signX, signY, signWidth, signHeight);

        // Sign border - darker blue
        ctx.strokeStyle = "#1E40AF"; // Blue-800
        ctx.lineWidth = 1;
        ctx.strokeRect(signX, signY, signWidth, signHeight);

        // Container ID text - white, bold, dễ đọc
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 10px 'Inter', 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Add subtle shadow for better readability
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        ctx.fillText(
          truck.containerNumber,
          signX + signWidth / 2,
          signY + signHeight / 2,
        );

        ctx.shadowBlur = 0;
      }
    });

    // Legend removed from canvas - will be rendered as HTML component below
  };

  // Helper function to get container status from container object
  const getContainerStatus = (containerId: string): ContainerStatus => {
    const container = containers.find((c) => c.id === containerId);
    if (!container) return "full";
    return container.status as ContainerStatus;
  };

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    const container = canvasContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes (e.g., user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <DashboardLayout
      userName="Yard Manager"
      userAvatar=""
      activeZone={activeZone}
      onZoneChange={setActiveZone}
    >
      {/* Main Content */}
      <div className="flex gap-4 p-6 h-full bg-gray-50">
        {/* Canvas Area */}
        <div
          ref={canvasContainerRef}
          className={`flex-1 bg-white flex flex-col relative ${
            isFullscreen
              ? "w-screen h-screen"
              : "rounded-xl shadow-lg overflow-hidden border border-gray-200"
          }`}
        >
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg shadow-md border border-gray-300 transition-all duration-200 hover:shadow-lg"
            title={isFullscreen ? "Exit Fullscreen (ESC)" : "Fullscreen"}
          >
            {isFullscreen ? (
              // Exit fullscreen icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Fullscreen icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>

          {/* Canvas Container */}
          <div
            className={`flex-1 flex items-center justify-center relative ${
              isFullscreen ? "w-full h-full" : ""
            }`}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className={`cursor-pointer ${
                isFullscreen
                  ? "w-full h-full object-contain"
                  : "max-w-full max-h-full"
              }`}
              style={{ display: "block" }}
              onMouseMove={(e) => {
                const canvas = canvasRef.current;
                if (!canvas) return;

                const rect = canvas.getBoundingClientRect();
                const scaleX = CANVAS_WIDTH / rect.width;
                const scaleY = CANVAS_HEIGHT / rect.height;
                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;

                // Check if hovering over any container
                const yardSlots = getYardSlotsForZone(activeZone);
                let foundContainer: YardContainer | null = null;

                // Check dock doors first
                for (const door of DOCK_DOORS) {
                  const container = containers.find(
                    (c) =>
                      c.currentLocation.type === "dock" &&
                      c.currentLocation.slotId === door.id,
                  );

                  if (container) {
                    // Check if mouse is over this dock door
                    if (
                      mouseX >= door.x &&
                      mouseX <= door.x + door.w &&
                      mouseY >= door.y &&
                      mouseY <= door.y + door.h
                    ) {
                      foundContainer = container;
                      break;
                    }
                  }
                }

                // Check yard slots if not found in dock doors
                if (!foundContainer) {
                  for (const slot of yardSlots) {
                    const container = containers.find(
                      (c) =>
                        c.currentLocation.type === "yard" &&
                        c.currentLocation.slotId === slot.id,
                    );

                    if (container) {
                      // Check if mouse is over this slot
                      if (
                        mouseX >= slot.x &&
                        mouseX <= slot.x + slot.w &&
                        mouseY >= slot.y &&
                        mouseY <= slot.y + slot.h
                      ) {
                        foundContainer = container;
                        break;
                      }
                    }
                  }
                }

                // Only update state if container changed (not position)
                if (foundContainer) {
                  if (hoveredContainer?.container.id !== foundContainer.id) {
                    setHoveredContainer({
                      container: foundContainer,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }
                } else {
                  if (hoveredContainer !== null) {
                    setHoveredContainer(null);
                  }
                }
              }}
              onMouseLeave={() => setHoveredContainer(null)}
            />

            {/* Hover Tooltip */}
            {hoveredContainer && (
              <div
                className="fixed bg-gradient-to-br from-gray-900 to-gray-800 text-white px-5 py-4 rounded-xl shadow-2xl border border-gray-700 transition-opacity duration-200"
                style={{
                  left: hoveredContainer.x + 15,
                  top: hoveredContainer.y + 15,
                  zIndex: 9999,
                }}
              >
                {/* Container Number Header */}
                <div className="text-base font-bold mb-3 pb-2 border-b border-gray-600 flex items-center gap-2">
                  <span className="text-blue-400">📦</span>
                  {hoveredContainer.container.containerNumber}
                </div>

                {/* Container Details */}
                <div className="text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-16">ASN:</span>
                    <span className="font-semibold text-yellow-300">
                      {hoveredContainer.container.asnNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-16">Status:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        hoveredContainer.container.status === "full"
                          ? "bg-green-600 text-white"
                          : hoveredContainer.container.status === "empty"
                            ? "bg-orange-600 text-white"
                            : hoveredContainer.container.status === "loading"
                              ? "bg-blue-600 text-white"
                              : "bg-purple-600 text-white"
                      }`}
                    >
                      {hoveredContainer.container.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-16">Location:</span>
                    <span className="font-semibold text-green-300">
                      {hoveredContainer.container.currentLocation.type ===
                        "yard" &&
                      hoveredContainer.container.currentLocation.slotId
                        ? `Yard P${String(hoveredContainer.container.currentLocation.slotId).padStart(2, "0")}`
                        : hoveredContainer.container.currentLocation.type ===
                              "dock" &&
                            hoveredContainer.container.currentLocation.slotId
                          ? `Dock A${hoveredContainer.container.currentLocation.slotId - 414}`
                          : "Unknown"}
                    </span>
                  </div>

                  {hoveredContainer.container.factoryName && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-16">Factory:</span>
                      <span className="font-semibold text-cyan-300">
                        {hoveredContainer.container.factoryName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 flex flex-col gap-4">
          {/* Legend Card - Container Status */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Container Status:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#66BB6A]"></div>
                <span className="text-sm text-gray-600">Full</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#FFA726]"></div>
                <span className="text-sm text-gray-600">Empty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#42A5F5]"></div>
                <span className="text-sm text-gray-600">Loading</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#AB47BC]"></div>
                <span className="text-sm text-gray-600">Unloading</span>
              </div>
            </div>
          </div>

          {/* Statistics Summary */}
          {statistics && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                📊 Thống Kê Container
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Total */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-gray-600 mb-1">Tổng</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {statistics.total}
                  </div>
                </div>

                {/* In Yard */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-gray-600 mb-1">Trong Yard</div>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.inYard}
                  </div>
                </div>

                {/* Arriving */}
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="text-xs text-gray-600 mb-1">Đang đến</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {statistics.byState.arriving}
                  </div>
                </div>

                {/* Available ASNs */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-gray-600 mb-1">ASN Còn lại</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {availableASNs.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-lg">🎮</span>
              <span>Điều Khiển</span>
            </h3>
            <div className="space-y-3">
              <button
                onClick={spawnRandomContainer}
                disabled={availableASNs.length === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-xl transition-all font-semibold text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
              >
                ➕ Thêm Container
              </button>

              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-4 border border-gray-200/60">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Auto Spawn
                  </label>
                  <input
                    type="checkbox"
                    checked={autoSpawn}
                    onChange={(e) => setAutoSpawn(e.target.checked)}
                    className="w-5 h-5 rounded accent-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">
                    Interval:
                  </span>
                  <input
                    type="number"
                    value={spawnInterval}
                    onChange={(e) => setSpawnInterval(Number(e.target.value))}
                    min="5"
                    max="60"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-center text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-600">
                    giây
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Container List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-lg">📦</span>
              <span>Danh Sách Containers</span>
            </h3>
            <div className="overflow-y-auto flex-1 -mr-2 pr-2">
              <div className="space-y-2">
                {containers.map((container) => (
                  <div
                    key={container.id}
                    className="bg-gradient-to-br from-slate-50 to-blue-50/20 rounded-xl p-3.5 hover:shadow-md hover:from-blue-50/40 hover:to-blue-100/30 transition-all border border-gray-200/60"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-mono text-sm font-bold text-gray-900">
                        {container.containerNumber}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          container.state === "in_yard"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        }`}
                      >
                        {container.state === "in_yard" ? "In Yard" : "Arriving"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="font-medium">Type:</span>
                        <span className="font-semibold text-gray-900">
                          {container.containerType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Supplier:</span>
                        <span className="font-semibold text-gray-900 truncate ml-2">
                          {container.supplier}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Location:</span>
                        <span className="font-semibold text-blue-600">
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
    </DashboardLayout>
  );
}
