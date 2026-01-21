export interface JobStepModel {
  step: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
}

export interface JobModel {
  id: string;
  driverId: string;
  containerId: string;
  vehicleId: string;
  type: 'import' | 'export' | 'transfer';
  currentStep: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  startTime: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  fromLocation: string;
  toLocation: string;
  steps: JobStepModel[];
  priority: 'low' | 'medium' | 'high';
  reward?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobCreateDTO {
  driverId: string;
  containerId: string;
  vehicleId: string;
  type: 'import' | 'export' | 'transfer';
  fromLocation: string;
  toLocation: string;
  priority?: 'low' | 'medium' | 'high';
  reward?: number;
}

export interface JobUpdateDTO {
  currentStep?: number;
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  actualCompletion?: string;
  steps?: JobStepModel[];
}

