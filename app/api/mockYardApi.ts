/**
 * Mock API Layer for Yard Management
 * 
 * This file simulates backend API calls.
 * To migrate to real backend:
 * 1. Replace mock functions with actual fetch/axios calls
 * 2. Update BASE_URL to your backend endpoint
 * 3. Keep the same interface/types
 */

import type { YardContainer } from "../types/container.types";
import type { ContainerStatus } from "../components/TruckRenderer";

// ============================================
// API Configuration
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const USE_MOCK = true; // Set to false when backend is ready

// ============================================
// Types for API Requests/Responses
// ============================================

export interface TruckData {
  id: string;
  truckPlateNo: string;
  trailerPlateNo: string;
  containerNumber: string;
  containerStatus: ContainerStatus;
  position: {
    x: number;
    y: number;
  };
  phase: "at_gate" | "entering" | "moving" | "parking" | "parked";
  targetSlotId?: number;
  checkInTime?: string;
}

export interface YardSlotData {
  slotId: number;
  zoneId: string;
  isOccupied: boolean;
  containerNumber?: string;
  containerStatus?: ContainerStatus;
  truckPlateNo?: string;
  trailerPlateNo?: string;
}

export interface YardStatistics {
  totalSlots: number;
  occupiedSlots: number;
  emptySlots: number;
  fullContainers: number;
  emptyContainers: number;
  loadingContainers: number;
  unloadingContainers: number;
}

export interface CheckInRequest {
  truckPlateNo: string;
  trailerPlateNo: string;
  containerNumber: string;
  asnNumber: string;
  expectedTime: string;
}

export interface CheckInResponse {
  success: boolean;
  truckId: string;
  assignedSlotId?: number;
  message: string;
}

// ============================================
// Mock Data Store (simulates database)
// ============================================

let mockTrucks: TruckData[] = [];
let mockSlots: YardSlotData[] = [];

// Initialize mock slots for 6 zones, 16 slots each
const initializeMockSlots = () => {
  if (mockSlots.length > 0) return;
  
  for (let zone = 1; zone <= 6; zone++) {
    for (let slot = 1; slot <= 16; slot++) {
      const slotId = (zone - 1) * 16 + slot;
      mockSlots.push({
        slotId,
        zoneId: String(zone).padStart(2, "0"),
        isOccupied: false,
      });
    }
  }
};

initializeMockSlots();

// ============================================
// Mock API Functions
// ============================================

/**
 * Get all trucks in the yard
 * Backend equivalent: GET /api/yard/trucks
 */
export const getTrucks = async (zoneId?: string): Promise<TruckData[]> => {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    if (zoneId) {
      return mockTrucks.filter((truck) => {
        // Filter by zone based on target slot
        if (!truck.targetSlotId) return false;
        const truckZone = Math.ceil(truck.targetSlotId / 16);
        return String(truckZone).padStart(2, "0") === zoneId;
      });
    }
    
    return mockTrucks;
  }
  
  // Real API call (when backend is ready)
  const url = zoneId ? `${BASE_URL}/yard/trucks?zone=${zoneId}` : `${BASE_URL}/yard/trucks`;
  const response = await fetch(url);
  return response.json();
};

/**
 * Get yard slots status
 * Backend equivalent: GET /api/yard/slots
 */
export const getYardSlots = async (zoneId?: string): Promise<YardSlotData[]> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    if (zoneId) {
      return mockSlots.filter((slot) => slot.zoneId === zoneId);
    }
    
    return mockSlots;
  }
  
  const url = zoneId ? `${BASE_URL}/yard/slots?zone=${zoneId}` : `${BASE_URL}/yard/slots`;
  const response = await fetch(url);
  return response.json();
};

/**
 * Get yard statistics
 * Backend equivalent: GET /api/yard/statistics
 */
export const getYardStatistics = async (): Promise<YardStatistics> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const totalSlots = mockSlots.length;
    const occupiedSlots = mockSlots.filter((s) => s.isOccupied).length;
    const emptySlots = totalSlots - occupiedSlots;

    const fullContainers = mockSlots.filter((s) => s.containerStatus === "full").length;
    const emptyContainers = mockSlots.filter((s) => s.containerStatus === "empty").length;
    const loadingContainers = mockSlots.filter((s) => s.containerStatus === "loading").length;
    const unloadingContainers = mockSlots.filter((s) => s.containerStatus === "unloading").length;

    return {
      totalSlots,
      occupiedSlots,
      emptySlots,
      fullContainers,
      emptyContainers,
      loadingContainers,
      unloadingContainers,
    };
  }

  const response = await fetch(`${BASE_URL}/yard/statistics`);
  return response.json();
};

/**
 * Check-in a truck at the gate
 * Backend equivalent: POST /api/yard/check-in
 */
export const checkInTruck = async (
  request: CheckInRequest,
): Promise<CheckInResponse> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Find empty slot
    const emptySlot = mockSlots.find((s) => !s.isOccupied);

    if (!emptySlot) {
      return {
        success: false,
        truckId: "",
        message: "No available slots",
      };
    }

    // Create truck
    const truckId = `TRUCK-${Date.now()}`;
    const newTruck: TruckData = {
      id: truckId,
      truckPlateNo: request.truckPlateNo,
      trailerPlateNo: request.trailerPlateNo,
      containerNumber: request.containerNumber,
      containerStatus: "full", // Default status
      position: { x: 150, y: 780 }, // Entry gate position
      phase: "at_gate",
      targetSlotId: emptySlot.slotId,
      checkInTime: new Date().toISOString(),
    };

    mockTrucks.push(newTruck);

    return {
      success: true,
      truckId,
      assignedSlotId: emptySlot.slotId,
      message: "Check-in successful",
    };
  }

  const response = await fetch(`${BASE_URL}/yard/check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return response.json();
};

/**
 * Update truck position (for animation)
 * Backend equivalent: PATCH /api/yard/trucks/:id/position
 */
export const updateTruckPosition = async (
  truckId: string,
  position: { x: number; y: number },
  phase: TruckData["phase"],
): Promise<void> => {
  if (USE_MOCK) {
    const truck = mockTrucks.find((t) => t.id === truckId);
    if (truck) {
      truck.position = position;
      truck.phase = phase;
    }
    return;
  }

  await fetch(`${BASE_URL}/yard/trucks/${truckId}/position`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ position, phase }),
  });
};

/**
 * Park truck in slot
 * Backend equivalent: POST /api/yard/trucks/:id/park
 */
export const parkTruck = async (
  truckId: string,
  slotId: number,
): Promise<void> => {
  if (USE_MOCK) {
    const truck = mockTrucks.find((t) => t.id === truckId);
    const slot = mockSlots.find((s) => s.slotId === slotId);

    if (truck && slot) {
      truck.phase = "parked";
      slot.isOccupied = true;
      slot.containerNumber = truck.containerNumber;
      slot.containerStatus = truck.containerStatus;
      slot.truckPlateNo = truck.truckPlateNo;
      slot.trailerPlateNo = truck.trailerPlateNo;
    }
    return;
  }

  await fetch(`${BASE_URL}/yard/trucks/${truckId}/park`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slotId }),
  });
};

/**
 * Update container status
 * Backend equivalent: PATCH /api/yard/containers/:containerNumber/status
 */
export const updateContainerStatus = async (
  containerNumber: string,
  status: ContainerStatus,
): Promise<void> => {
  if (USE_MOCK) {
    // Update in trucks
    const truck = mockTrucks.find((t) => t.containerNumber === containerNumber);
    if (truck) {
      truck.containerStatus = status;
    }

    // Update in slots
    const slot = mockSlots.find((s) => s.containerNumber === containerNumber);
    if (slot) {
      slot.containerStatus = status;
    }
    return;
  }

  await fetch(`${BASE_URL}/yard/containers/${containerNumber}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
};

/**
 * Remove truck from yard (check-out)
 * Backend equivalent: DELETE /api/yard/trucks/:id
 */
export const checkOutTruck = async (truckId: string): Promise<void> => {
  if (USE_MOCK) {
    const truckIndex = mockTrucks.findIndex((t) => t.id === truckId);
    if (truckIndex !== -1) {
      const truck = mockTrucks[truckIndex];

      // Free up the slot
      const slot = mockSlots.find((s) => s.containerNumber === truck.containerNumber);
      if (slot) {
        slot.isOccupied = false;
        slot.containerNumber = undefined;
        slot.containerStatus = undefined;
        slot.truckPlateNo = undefined;
        slot.trailerPlateNo = undefined;
      }

      // Remove truck
      mockTrucks.splice(truckIndex, 1);
    }
    return;
  }

  await fetch(`${BASE_URL}/yard/trucks/${truckId}`, {
    method: "DELETE",
  });
};

// ============================================
// Helper Functions
// ============================================

/**
 * Reset mock data (for testing)
 */
export const resetMockData = () => {
  mockTrucks = [];
  mockSlots = [];
  initializeMockSlots();
};

/**
 * Get mock data (for debugging)
 */
export const getMockData = () => ({
  trucks: mockTrucks,
  slots: mockSlots,
});

