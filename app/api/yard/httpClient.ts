/**
 * HTTP API Client Implementation
 * Real backend API calls using fetch
 * 
 * TO USE THIS CLIENT:
 * 1. Set NEXT_PUBLIC_USE_MOCK_API=false in .env
 * 2. Set NEXT_PUBLIC_API_URL=http://your-backend-url/api in .env
 * 3. Ensure backend implements the same API contract defined in types.ts
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

export class HttpYardApiClient implements IYardApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async getTrucks(params?: GetTrucksParams): Promise<TruckData[]> {
    const url = params?.zoneId
      ? `${this.baseUrl}/yard/trucks?zone=${params.zoneId}`
      : `${this.baseUrl}/yard/trucks`;

    const response = await fetch(url);
    return this.handleResponse<TruckData[]>(response);
  }

  async getYardSlots(params?: GetSlotsParams): Promise<YardSlotData[]> {
    const url = params?.zoneId
      ? `${this.baseUrl}/yard/slots?zone=${params.zoneId}`
      : `${this.baseUrl}/yard/slots`;

    const response = await fetch(url);
    return this.handleResponse<YardSlotData[]>(response);
  }

  async getYardStatistics(): Promise<YardStatistics> {
    const response = await fetch(`${this.baseUrl}/yard/statistics`);
    return this.handleResponse<YardStatistics>(response);
  }

  async checkInTruck(request: CheckInRequest): Promise<CheckInResponse> {
    const response = await fetch(`${this.baseUrl}/yard/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return this.handleResponse<CheckInResponse>(response);
  }

  async updateTruckPosition(
    truckId: string,
    request: UpdateTruckPositionRequest,
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/yard/trucks/${truckId}/position`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    await this.handleResponse<void>(response);
  }

  async parkTruck(truckId: string, request: ParkTruckRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/yard/trucks/${truckId}/park`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    await this.handleResponse<void>(response);
  }

  async checkOutTruck(truckId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/yard/trucks/${truckId}`, {
      method: "DELETE",
    });
    await this.handleResponse<void>(response);
  }

  async updateContainerStatus(
    containerNumber: string,
    request: UpdateContainerStatusRequest,
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/yard/containers/${containerNumber}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );
    await this.handleResponse<void>(response);
  }
}

