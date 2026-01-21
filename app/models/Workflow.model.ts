/**
 * Workflow Model
 * Defines the complete container yard workflow from gate-in to gate-out
 */

export type WorkflowStepType =
  | 'RECEIVE_TASK'
  | 'MOVE_TO_GATE'
  | 'GATE_CHECK_IN'
  | 'YARD_FOCUS'
  | 'ENTER_YARD'
  | 'ENTER_DOOR'
  | 'PROCESS_AT_DOOR'
  | 'GATE_CHECK_OUT';

export type ContainerDirection = 'inbound' | 'outbound'; // Đầy hàng vào / Rỗng ra
export type CargoType = 'ecom' | 'general' | 'reefer' | 'hazmat';

export interface WorkflowStepModel {
  id: string;
  type: WorkflowStepType;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  estimatedDuration: number; // seconds
  actualDuration?: number;
  data?: Record<string, any>; // Step-specific data
}

export interface WorkflowModel {
  id: string;
  jobId: string;
  driverId: string;
  containerId: string;
  vehicleId: string;
  
  // Task info
  direction: ContainerDirection; // inbound (đầy) or outbound (rỗng)
  asnNumber: string; // Advanced Shipping Notice number
  destination: string; // e.g., "Kho ABC"
  cargoType: CargoType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Yard assignment
  assignedSlot?: string; // e.g., "Y-15"
  assignedDoor?: string; // e.g., "Door A", "YA 103"
  
  // Seal & security
  sealNumber?: string;
  qrCode?: string;
  
  // Workflow steps
  currentStep: number;
  steps: WorkflowStepModel[];
  
  // Status
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  startTime: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowCreateDTO {
  jobId: string;
  driverId: string;
  containerId: string;
  vehicleId: string;
  direction: ContainerDirection;
  asnNumber: string;
  destination: string;
  cargoType?: CargoType;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface WorkflowUpdateDTO {
  currentStep?: number;
  assignedSlot?: string;
  assignedDoor?: string;
  sealNumber?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  actualCompletion?: string;
}

/**
 * Default workflow steps template
 */
export const DEFAULT_WORKFLOW_STEPS: Omit<WorkflowStepModel, 'id' | 'status' | 'startedAt' | 'completedAt' | 'actualDuration'>[] = [
  {
    type: 'RECEIVE_TASK',
    name: 'Nhận Nhiệm Vụ',
    description: 'Tài xế nhận lệnh giao/lấy hàng',
    estimatedDuration: 60,
    data: {},
  },
  {
    type: 'MOVE_TO_GATE',
    name: 'Di Chuyển Đến Cổng',
    description: 'Xe container chạy trên đường đến cổng kho',
    estimatedDuration: 300,
    data: {},
  },
  {
    type: 'GATE_CHECK_IN',
    name: 'Check-In Tại Cổng',
    description: 'Bảo vệ scan QR/barcode, ghi log',
    estimatedDuration: 120,
    data: {},
  },
  {
    type: 'YARD_FOCUS',
    name: 'Xem Layout Yard',
    description: 'Camera zoom out hiển thị toàn cảnh bãi xe',
    estimatedDuration: 30,
    data: {},
  },
  {
    type: 'ENTER_YARD',
    name: 'Vào Yard',
    description: 'Xe di chuyển vào vị trí được chỉ định',
    estimatedDuration: 180,
    data: {},
  },
  {
    type: 'ENTER_DOOR',
    name: 'Vào Door',
    description: 'Container di chuyển đến door để xử lý',
    estimatedDuration: 240,
    data: {},
  },
  {
    type: 'PROCESS_AT_DOOR',
    name: 'Xử Lý Tại Door',
    description: 'Xếp/dỡ hàng, niêm phong container',
    estimatedDuration: 900, // 15 minutes
    data: {},
  },
  {
    type: 'GATE_CHECK_OUT',
    name: 'Check-Out',
    description: 'Scan lần cuối, đóng ASN, xe rời bãi',
    estimatedDuration: 120,
    data: {},
  },
];

/**
 * Camera focus modes for different workflow steps
 */
export type CameraMode = 
  | 'overview'      // Full map view
  | 'follow-truck'  // Follow truck on road
  | 'gate-focus'    // Zoom to gate
  | 'yard-focus'    // Zoom to yard layout
  | 'door-focus';   // Zoom to specific door

export interface CameraState {
  mode: CameraMode;
  target?: { x: number; y: number };
  zoom: number;
  followEntityId?: string;
}

