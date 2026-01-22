/**
 * API Types - Shared between frontend and backend
 * These types define the contract between client and server
 */

import type { ContainerStatus } from "@/app/components/TruckRenderer";

// ============================================
// Request Types
// ============================================

export interface CheckInRequest {
  truckPlateNo: string;
  trailerPlateNo: string;
  containerNumber: string;
  asnNumber: string;
  containerStatus?: ContainerStatus;
  expectedTime?: string;
}

export interface UpdateTruckPositionRequest {
  position: {
    x: number;
    y: number;
  };
  phase: "at_gate" | "entering" | "moving" | "parking" | "parked";
}

export interface ParkTruckRequest {
  slotId: number;
}

export interface UpdateContainerStatusRequest {
  status: ContainerStatus;
}

// ============================================
// Response Types
// ============================================

export interface CheckInResponse {
  success: boolean;
  truckId: string;
  assignedSlotId?: number;
  message: string;
}

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

// ============================================
// Query Parameters
// ============================================

export interface GetTrucksParams {
  zoneId?: string;
}

export interface GetSlotsParams {
  zoneId?: string;
}

