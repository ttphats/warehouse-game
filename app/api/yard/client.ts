/**
 * API Client - Abstract interface for yard management API
 * This defines the contract that both mock and real implementations must follow
 */

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

/**
 * Abstract API Client Interface
 * Implement this interface for both mock and real API
 */
export interface IYardApiClient {
  // Truck operations
  getTrucks(params?: GetTrucksParams): Promise<TruckData[]>;
  checkInTruck(request: CheckInRequest): Promise<CheckInResponse>;
  updateTruckPosition(truckId: string, request: UpdateTruckPositionRequest): Promise<void>;
  parkTruck(truckId: string, request: ParkTruckRequest): Promise<void>;
  checkOutTruck(truckId: string): Promise<void>;

  // Slot operations
  getYardSlots(params?: GetSlotsParams): Promise<YardSlotData[]>;

  // Container operations
  updateContainerStatus(containerNumber: string, request: UpdateContainerStatusRequest): Promise<void>;

  // Statistics
  getYardStatistics(): Promise<YardStatistics>;
}

/**
 * API Client Factory
 * Returns the appropriate client based on configuration
 */
export const createYardApiClient = (): IYardApiClient => {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

  if (useMock) {
    // Use mock implementation
    const { MockYardApiClient } = require("./mockClient");
    return new MockYardApiClient();
  } else {
    // Use real HTTP implementation
    const { HttpYardApiClient } = require("./httpClient");
    return new HttpYardApiClient();
  }
};

// Singleton instance
let apiClientInstance: IYardApiClient | null = null;

/**
 * Get API Client instance (singleton)
 */
export const getYardApiClient = (): IYardApiClient => {
  if (!apiClientInstance) {
    apiClientInstance = createYardApiClient();
  }
  return apiClientInstance;
};

