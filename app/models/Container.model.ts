export interface ContainerModel {
  id: string;
  code: string; // Container number (e.g., ABCD1234567)
  type: '20ft' | '40ft' | '40ft-HC' | '20ft-Reefer';
  status: 'empty' | 'full' | 'damaged';
  owner: string; // Shipping line (Maersk, MSC, etc.)
  weight: number; // Current weight in kg
  maxWeight: number; // Maximum weight capacity
  color: string; // For UI display
  cargo?: string; // Cargo description
  temperature?: number; // For reefer containers
  createdAt?: string;
  updatedAt?: string;
}

export interface ContainerCreateDTO {
  code: string;
  type: '20ft' | '40ft' | '40ft-HC' | '20ft-Reefer';
  status: 'empty' | 'full' | 'damaged';
  owner: string;
  weight: number;
  maxWeight: number;
  cargo?: string;
  temperature?: number;
}

export interface ContainerUpdateDTO {
  status?: 'empty' | 'full' | 'damaged';
  weight?: number;
  cargo?: string;
  temperature?: number;
}

