export interface GateTransactionModel {
  id: string;
  type: 'check-in' | 'check-out';
  driverId: string;
  vehicleId: string;
  containerId: string;
  timestamp: string;
  gateNumber: string;
  purpose?: 'pickup' | 'delivery' | 'return';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  documents?: {
    deliveryOrder?: string;
    bookingNumber?: string;
    verified: boolean;
  };
  sealNumber?: string;
  weight?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GateTransactionCreateDTO {
  type: 'check-in' | 'check-out';
  driverId: string;
  vehicleId: string;
  containerId: string;
  gateNumber: string;
  purpose?: 'pickup' | 'delivery' | 'return';
  documents?: {
    deliveryOrder?: string;
    bookingNumber?: string;
  };
}

export interface GateTransactionUpdateDTO {
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  sealNumber?: string;
  weight?: number;
  notes?: string;
}

