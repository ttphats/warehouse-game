/**
 * Container Management Types
 * Designed for easy migration to database
 */

export type ContainerState = 
  | 'arriving'      // Container đang trên đường đến
  | 'in_yard'       // Container đang đỗ ở yard slot
  | 'at_dock'       // Container đang ở dock door (loading/unloading)
  | 'processing'    // Container đang được xử lý
  | 'completed'     // Container đã hoàn thành
  | 'departed';     // Container đã rời khỏi yard

export type ContainerType = '20ft' | '40ft' | '40ft-HC';
export type ContainerStatus = 'empty' | 'full';
export type TaskType = 'inbound' | 'outbound';

/**
 * Container trong yard - Main entity
 */
export interface YardContainer {
  id: string;                          // Unique ID (DB primary key)
  containerNumber: string;             // Container number (e.g., CONT-ABC-12345)
  containerType: ContainerType;        // 20ft, 40ft, 40ft-HC
  status: ContainerStatus;             // empty or full
  state: ContainerState;               // Current state in workflow
  
  // Location tracking
  currentLocation: {
    type: 'yard' | 'dock' | 'gate' | 'road' | null;
    slotId?: number;                   // Yard slot ID or Dock door ID
    position?: { x: number; y: number }; // Visual position on canvas
  };
  
  // Task/ASN information
  asnNumber: string;                   // ASN reference
  taskType: TaskType;                  // inbound or outbound
  factoryId: number;                   // Destination factory
  factoryName: string;
  
  // Cargo information
  poNumber: string;                    // Purchase Order
  supplier: string;
  expectedItems: number;
  weight: number;                      // kg
  
  // Timestamps (for DB)
  arrivedAt?: string;                  // ISO timestamp
  yardEntryAt?: string;
  dockEntryAt?: string;
  completedAt?: string;
  departedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // History tracking
  history: ContainerHistoryEntry[];
}

/**
 * Container history entry
 */
export interface ContainerHistoryEntry {
  id: string;
  timestamp: string;                   // ISO timestamp
  action: string;                      // e.g., "Entered yard", "Moved to dock"
  state: ContainerState;
  location?: {
    type: 'yard' | 'dock' | 'gate' | 'road';
    slotId?: number;
  };
  performedBy?: string;                // Driver name or system
  notes?: string;
}

/**
 * Container statistics
 */
export interface ContainerStatistics {
  total: number;
  byState: Record<ContainerState, number>;
  byType: Record<ContainerType, number>;
  byStatus: Record<ContainerStatus, number>;
  inYard: number;
  atDock: number;
  averageProcessingTime?: number;      // minutes
}

/**
 * Container filter options
 */
export interface ContainerFilter {
  state?: ContainerState[];
  containerType?: ContainerType[];
  status?: ContainerStatus[];
  taskType?: TaskType[];
  factoryId?: number[];
  search?: string;                     // Search by container number
  dateFrom?: string;
  dateTo?: string;
}

/**
 * DTO for creating new container entry
 */
export interface CreateContainerDTO {
  containerNumber: string;
  containerType: ContainerType;
  status: ContainerStatus;
  asnNumber: string;
  taskType: TaskType;
  factoryId: number;
  factoryName: string;
  poNumber: string;
  supplier: string;
  expectedItems: number;
  weight: number;
}

/**
 * DTO for updating container state
 */
export interface UpdateContainerStateDTO {
  containerId: string;
  state: ContainerState;
  location?: {
    type: 'yard' | 'dock' | 'gate' | 'road';
    slotId?: number;
    position?: { x: number; y: number };
  };
  notes?: string;
}

