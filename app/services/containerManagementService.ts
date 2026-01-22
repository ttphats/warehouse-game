/**
 * Container Management Service
 * 
 * This service provides CRUD operations for container management.
 * Currently uses mock data, designed to be easily replaced with database queries.
 * 
 * Migration path:
 * 1. Replace MOCK_CONTAINERS with database queries
 * 2. Add async/await for database operations
 * 3. Add error handling and validation
 * 4. Add transaction support for state changes
 */

import { 
  YardContainer, 
  ContainerFilter, 
  ContainerStatistics,
  CreateContainerDTO,
  UpdateContainerStateDTO,
  ContainerState,
  ContainerHistoryEntry
} from '../types/container.types';
import { MOCK_CONTAINERS } from '../data/containerMockData';

// In-memory storage (will be replaced with database)
let containers: YardContainer[] = [...MOCK_CONTAINERS];

/**
 * Get all containers with optional filtering
 * DB Migration: SELECT * FROM containers WHERE ...
 */
export function getAllContainers(filter?: ContainerFilter): YardContainer[] {
  let result = [...containers];

  if (!filter) return result;

  // Filter by state
  if (filter.state && filter.state.length > 0) {
    result = result.filter(c => filter.state!.includes(c.state));
  }

  // Filter by container type
  if (filter.containerType && filter.containerType.length > 0) {
    result = result.filter(c => filter.containerType!.includes(c.containerType));
  }

  // Filter by status
  if (filter.status && filter.status.length > 0) {
    result = result.filter(c => filter.status!.includes(c.status));
  }

  // Filter by task type
  if (filter.taskType && filter.taskType.length > 0) {
    result = result.filter(c => filter.taskType!.includes(c.taskType));
  }

  // Filter by factory
  if (filter.factoryId && filter.factoryId.length > 0) {
    result = result.filter(c => filter.factoryId!.includes(c.factoryId));
  }

  // Search by container number
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    result = result.filter(c => 
      c.containerNumber.toLowerCase().includes(searchLower) ||
      c.asnNumber.toLowerCase().includes(searchLower) ||
      c.poNumber.toLowerCase().includes(searchLower)
    );
  }

  return result;
}

/**
 * Get container by ID
 * DB Migration: SELECT * FROM containers WHERE id = ?
 */
export function getContainerById(id: string): YardContainer | null {
  return containers.find(c => c.id === id) || null;
}

/**
 * Get container by container number
 * DB Migration: SELECT * FROM containers WHERE containerNumber = ?
 */
export function getContainerByNumber(containerNumber: string): YardContainer | null {
  return containers.find(c => c.containerNumber === containerNumber) || null;
}

/**
 * Get containers by location
 * DB Migration: SELECT * FROM containers WHERE currentLocation.type = ? AND currentLocation.slotId = ?
 */
export function getContainersByLocation(type: 'yard' | 'dock', slotId?: number): YardContainer[] {
  return containers.filter(c => {
    if (c.currentLocation.type !== type) return false;
    if (slotId !== undefined && c.currentLocation.slotId !== slotId) return false;
    return true;
  });
}

/**
 * Create new container entry
 * DB Migration: INSERT INTO containers ...
 */
export function createContainer(dto: CreateContainerDTO): YardContainer {
  const now = new Date().toISOString();
  const newContainer: YardContainer = {
    id: `cnt-${Date.now()}`,
    ...dto,
    state: 'arriving',
    currentLocation: {
      type: 'road'
    },
    createdAt: now,
    updatedAt: now,
    history: [
      {
        id: `hist-${Date.now()}-1`,
        timestamp: now,
        action: 'Container created and dispatched',
        state: 'arriving',
        location: { type: 'road' },
        performedBy: 'System'
      }
    ]
  };

  containers.push(newContainer);
  return newContainer;
}

/**
 * Update container state with history tracking
 * DB Migration: BEGIN TRANSACTION; UPDATE containers ...; INSERT INTO container_history ...; COMMIT;
 */
export function updateContainerState(dto: UpdateContainerStateDTO): YardContainer | null {
  const container = containers.find(c => c.id === dto.containerId);
  if (!container) return null;

  const now = new Date().toISOString();
  
  // Update state
  container.state = dto.state;
  container.updatedAt = now;

  // Update location if provided
  if (dto.location) {
    container.currentLocation = dto.location;
  }

  // Update timestamps based on state
  switch (dto.state) {
    case 'in_yard':
      if (!container.yardEntryAt) container.yardEntryAt = now;
      break;
    case 'at_dock':
    case 'processing':
      if (!container.dockEntryAt) container.dockEntryAt = now;
      break;
    case 'completed':
      if (!container.completedAt) container.completedAt = now;
      break;
    case 'departed':
      if (!container.departedAt) container.departedAt = now;
      break;
  }

  // Add history entry
  const historyEntry: ContainerHistoryEntry = {
    id: `hist-${Date.now()}`,
    timestamp: now,
    action: getActionDescription(dto.state, dto.location),
    state: dto.state,
    location: dto.location,
    performedBy: 'System', // TODO: Get from current user
    notes: dto.notes
  };
  container.history.push(historyEntry);

  return container;
}

/**
 * Delete container (soft delete recommended for DB)
 * DB Migration: UPDATE containers SET deleted_at = NOW() WHERE id = ?
 */
export function deleteContainer(id: string): boolean {
  const index = containers.findIndex(c => c.id === id);
  if (index === -1) return false;

  containers.splice(index, 1);
  return true;
}

/**
 * Get container statistics
 * DB Migration: SELECT state, COUNT(*) FROM containers GROUP BY state
 */
export function getContainerStatistics(): ContainerStatistics {
  const stats: ContainerStatistics = {
    total: containers.length,
    byState: {
      arriving: 0,
      in_yard: 0,
      at_dock: 0,
      processing: 0,
      completed: 0,
      departed: 0
    },
    byType: {
      '20ft': 0,
      '40ft': 0,
      '40ft-HC': 0
    },
    byStatus: {
      empty: 0,
      full: 0
    },
    inYard: 0,
    atDock: 0
  };

  containers.forEach(c => {
    stats.byState[c.state]++;
    stats.byType[c.containerType]++;
    stats.byStatus[c.status]++;

    if (c.currentLocation.type === 'yard') stats.inYard++;
    if (c.currentLocation.type === 'dock') stats.atDock++;
  });

  // Calculate average processing time
  const completedContainers = containers.filter(c => c.completedAt && c.arrivedAt);
  if (completedContainers.length > 0) {
    const totalTime = completedContainers.reduce((sum, c) => {
      const arrived = new Date(c.arrivedAt!).getTime();
      const completed = new Date(c.completedAt!).getTime();
      return sum + (completed - arrived);
    }, 0);
    stats.averageProcessingTime = Math.round(totalTime / completedContainers.length / 60000); // Convert to minutes
  }

  return stats;
}

/**
 * Helper function to generate action description
 */
function getActionDescription(state: ContainerState, location?: UpdateContainerStateDTO['location']): string {
  switch (state) {
    case 'arriving':
      return 'Container dispatched';
    case 'in_yard':
      return location?.slotId
        ? `Parked at yard slot #${location.slotId}`
        : 'Entered yard';
    case 'at_dock':
      return location?.slotId
        ? `Moved to dock door #${location.slotId}`
        : 'Moved to dock';
    case 'processing':
      return 'Processing started';
    case 'completed':
      return 'Processing completed';
    case 'departed':
      return 'Container departed';
    default:
      return 'State updated';
  }
}

/**
 * Reset to initial mock data (for testing)
 */
export function resetContainers(): void {
  containers = [...MOCK_CONTAINERS];
}

