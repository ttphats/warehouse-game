export interface YardSlotModel {
  id: string; // e.g., A1, B5
  row: number;
  column: number;
  containerId: string | null;
  stackPosition: number; // 1-5 (for stacking)
  x: number; // Position on canvas
  y: number;
  width: number;
  height: number;
  occupied: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface YardSlotCreateDTO {
  id: string;
  row: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface YardSlotUpdateDTO {
  containerId?: string | null;
  stackPosition?: number;
  occupied?: boolean;
}

