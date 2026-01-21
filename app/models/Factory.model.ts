export interface FactoryModel {
  id: number;
  name: string;
  code: string; // e.g., FAC-A
  x: number; // Position on map
  y: number;
  color: string; // UI color
  type: 'manufacturing' | 'warehouse' | 'distribution' | 'port';
  capacity: number; // Max containers
  currentLoad?: number; // Current containers
  createdAt?: string;
  updatedAt?: string;
}

export interface FactoryCreateDTO {
  name: string;
  code: string;
  x: number;
  y: number;
  type: 'manufacturing' | 'warehouse' | 'distribution' | 'port';
  capacity: number;
}

export interface FactoryUpdateDTO {
  name?: string;
  capacity?: number;
  currentLoad?: number;
}

