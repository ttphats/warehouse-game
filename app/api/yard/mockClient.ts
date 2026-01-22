/**
 * Mock API Client Implementation
 * Simulates backend API with in-memory data
 * 
 * TO SWITCH TO REAL API:
 * 1. Set NEXT_PUBLIC_USE_MOCK_API=false in .env
 * 2. Implement httpClient.ts with real fetch calls
 * 3. No changes needed in components!
 */

import type { IYardApiClient } from "./client";
import type {
  CheckInRequest,
  CheckInResponse,
  TruckData,
  YardSlotData,
  YardStatistics,
  UpdateTruckPositionRequest,
  ParkTruckRequest,
  UpdateContainerStatusRequest,
  GetTrucksParams,
  GetSlotsParams,
} from "./types";

// ============================================
// Mock Data Store (simulates database)
// ============================================

class MockDataStore {
  private trucks: TruckData[] = [];
  private slots: YardSlotData[] = [];

  constructor() {
    this.initializeSlots();
  }

  private initializeSlots() {
    // Create 6 zones, 16 slots each
    for (let zone = 1; zone <= 6; zone++) {
      for (let slot = 1; slot <= 16; slot++) {
        const slotId = (zone - 1) * 16 + slot;
        this.slots.push({
          slotId,
          zoneId: String(zone).padStart(2, "0"),
          isOccupied: false,
        });
      }
    }
  }

  getTrucks() {
    return [...this.trucks];
  }

  getSlots() {
    return [...this.slots];
  }

  addTruck(truck: TruckData) {
    this.trucks.push(truck);
  }

  updateTruck(truckId: string, updates: Partial<TruckData>) {
    const truck = this.trucks.find((t) => t.id === truckId);
    if (truck) {
      Object.assign(truck, updates);
    }
  }

  removeTruck(truckId: string) {
    const index = this.trucks.findIndex((t) => t.id === truckId);
    if (index !== -1) {
      this.trucks.splice(index, 1);
    }
  }

  updateSlot(slotId: number, updates: Partial<YardSlotData>) {
    const slot = this.slots.find((s) => s.slotId === slotId);
    if (slot) {
      Object.assign(slot, updates);
    }
  }

  findEmptySlot(): YardSlotData | undefined {
    return this.slots.find((s) => !s.isOccupied);
  }

  reset() {
    this.trucks = [];
    this.slots = [];
    this.initializeSlots();
  }
}

// Singleton data store
const dataStore = new MockDataStore();

// ============================================
// Mock API Client Implementation
// ============================================

export class MockYardApiClient implements IYardApiClient {
  private simulateDelay(ms: number = 100): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getTrucks(params?: GetTrucksParams): Promise<TruckData[]> {
    await this.simulateDelay();

    let trucks = dataStore.getTrucks();

    if (params?.zoneId) {
      trucks = trucks.filter((truck) => {
        if (!truck.targetSlotId) return false;
        const truckZone = Math.ceil(truck.targetSlotId / 16);
        return String(truckZone).padStart(2, "0") === params.zoneId;
      });
    }

    return trucks;
  }

  async getYardSlots(params?: GetSlotsParams): Promise<YardSlotData[]> {
    await this.simulateDelay();

    let slots = dataStore.getSlots();

    if (params?.zoneId) {
      slots = slots.filter((slot) => slot.zoneId === params.zoneId);
    }

    return slots;
  }

  async getYardStatistics(): Promise<YardStatistics> {
    await this.simulateDelay();

    const slots = dataStore.getSlots();
    const totalSlots = slots.length;
    const occupiedSlots = slots.filter((s) => s.isOccupied).length;
    const emptySlots = totalSlots - occupiedSlots;

    const fullContainers = slots.filter((s) => s.containerStatus === "full").length;
    const emptyContainers = slots.filter((s) => s.containerStatus === "empty").length;
    const loadingContainers = slots.filter((s) => s.containerStatus === "loading").length;
    const unloadingContainers = slots.filter((s) => s.containerStatus === "unloading").length;

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

  async checkInTruck(request: CheckInRequest): Promise<CheckInResponse> {
    await this.simulateDelay(200);

    // Find empty slot
    const emptySlot = dataStore.findEmptySlot();

    if (!emptySlot) {
      return {
        success: false,
        truckId: "",
        message: "No available slots",
      };
    }

    // Create new truck
    const truckId = `TRUCK-${Date.now()}`;
    const newTruck: TruckData = {
      id: truckId,
      truckPlateNo: request.truckPlateNo,
      trailerPlateNo: request.trailerPlateNo,
      containerNumber: request.containerNumber,
      containerStatus: request.containerStatus || "full",
      position: { x: 150, y: 780 }, // Entry gate position
      phase: "at_gate",
      targetSlotId: emptySlot.slotId,
      checkInTime: new Date().toISOString(),
    };

    dataStore.addTruck(newTruck);

    return {
      success: true,
      truckId,
      assignedSlotId: emptySlot.slotId,
      message: "Check-in successful",
    };
  }

  async updateTruckPosition(
    truckId: string,
    request: UpdateTruckPositionRequest,
  ): Promise<void> {
    await this.simulateDelay(50);

    dataStore.updateTruck(truckId, {
      position: request.position,
      phase: request.phase,
    });
  }

  async parkTruck(truckId: string, request: ParkTruckRequest): Promise<void> {
    await this.simulateDelay(100);

    const trucks = dataStore.getTrucks();
    const truck = trucks.find((t) => t.id === truckId);

    if (!truck) {
      throw new Error(`Truck ${truckId} not found`);
    }

    // Update truck status
    dataStore.updateTruck(truckId, {
      phase: "parked",
    });

    // Update slot status
    dataStore.updateSlot(request.slotId, {
      isOccupied: true,
      containerNumber: truck.containerNumber,
      containerStatus: truck.containerStatus,
      truckPlateNo: truck.truckPlateNo,
      trailerPlateNo: truck.trailerPlateNo,
    });
  }

  async checkOutTruck(truckId: string): Promise<void> {
    await this.simulateDelay(200);

    const trucks = dataStore.getTrucks();
    const truck = trucks.find((t) => t.id === truckId);

    if (!truck) {
      throw new Error(`Truck ${truckId} not found`);
    }

    // Free up the slot
    if (truck.targetSlotId) {
      dataStore.updateSlot(truck.targetSlotId, {
        isOccupied: false,
        containerNumber: undefined,
        containerStatus: undefined,
        truckPlateNo: undefined,
        trailerPlateNo: undefined,
      });
    }

    // Remove truck
    dataStore.removeTruck(truckId);
  }

  async updateContainerStatus(
    containerNumber: string,
    request: UpdateContainerStatusRequest,
  ): Promise<void> {
    await this.simulateDelay(100);

    // Update in trucks
    const trucks = dataStore.getTrucks();
    const truck = trucks.find((t) => t.containerNumber === containerNumber);
    if (truck) {
      dataStore.updateTruck(truck.id, {
        containerStatus: request.status,
      });
    }

    // Update in slots
    const slots = dataStore.getSlots();
    const slot = slots.find((s) => s.containerNumber === containerNumber);
    if (slot) {
      dataStore.updateSlot(slot.slotId, {
        containerStatus: request.status,
      });
    }
  }
}

// ============================================
// Helper Functions (for testing/debugging)
// ============================================

/**
 * Reset mock data (useful for testing)
 */
export const resetMockData = () => {
  dataStore.reset();
};

/**
 * Get mock data (useful for debugging)
 */
export const getMockData = () => ({
  trucks: dataStore.getTrucks(),
  slots: dataStore.getSlots(),
});

