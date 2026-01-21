import { YardSlotModel, YardSlotCreateDTO, YardSlotUpdateDTO } from '../models/YardSlot.model';

/**
 * Yard Service
 * Handles yard slot management and container placement
 * TODO: Replace with actual database calls when migrating
 */
class YardService {
  private slots: YardSlotModel[] = [];

  constructor() {
    // Initialize yard slots (3 rows x 10 columns) - new layout
    this.initializeYard(3, 10);
  }

  /**
   * Initialize yard with grid layout
   */
  private initializeYard(rows: number, columns: number) {
    const YARD_X = 100;
    const YARD_Y = 50;
    const SLOT_WIDTH = 120;
    const SLOT_HEIGHT = 80;
    const SPACING_X = 140; // 120 + 20 gap
    const SPACING_Y = 90;  // 80 + 10 gap

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const slotId = `Y${row + 1}-${col + 1}`; // Y1-1, Y1-2, etc.
        this.slots.push({
          id: slotId,
          row,
          column: col,
          containerId: null,
          stackPosition: 1,
          x: YARD_X + col * SPACING_X,
          y: YARD_Y + row * SPACING_Y,
          width: SLOT_WIDTH,
          height: SLOT_HEIGHT,
          occupied: Math.random() > 0.7, // Random initial occupation
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Get all yard slots
   */
  async getAll(): Promise<YardSlotModel[]> {
    // TODO: Replace with database query
    // return await db.yardSlots.findMany();
    return Promise.resolve(this.slots);
  }

  /**
   * Get slot by ID
   */
  async getById(id: string): Promise<YardSlotModel | null> {
    // TODO: Replace with database query
    // return await db.yardSlots.findUnique({ where: { id } });
    const slot = this.slots.find(s => s.id === id);
    return Promise.resolve(slot || null);
  }

  /**
   * Get available (empty) slots
   */
  async getAvailable(): Promise<YardSlotModel[]> {
    // TODO: Replace with database query
    // return await db.yardSlots.findMany({ where: { occupied: false } });
    const available = this.slots.filter(s => !s.occupied);
    return Promise.resolve(available);
  }

  /**
   * Get occupied slots
   */
  async getOccupied(): Promise<YardSlotModel[]> {
    // TODO: Replace with database query
    // return await db.yardSlots.findMany({ where: { occupied: true } });
    const occupied = this.slots.filter(s => s.occupied);
    return Promise.resolve(occupied);
  }

  /**
   * Park container in slot
   */
  async parkContainer(slotId: string, containerId: string): Promise<YardSlotModel | null> {
    // TODO: Replace with database transaction
    // return await db.yardSlots.update({ 
    //   where: { id: slotId }, 
    //   data: { containerId, occupied: true } 
    // });
    const index = this.slots.findIndex(s => s.id === slotId);
    if (index === -1) return Promise.resolve(null);

    if (this.slots[index].occupied) {
      throw new Error(`Slot ${slotId} is already occupied`);
    }

    this.slots[index] = {
      ...this.slots[index],
      containerId,
      occupied: true,
      updatedAt: new Date().toISOString(),
    };

    return Promise.resolve(this.slots[index]);
  }

  /**
   * Remove container from slot
   */
  async removeContainer(slotId: string): Promise<YardSlotModel | null> {
    // TODO: Replace with database update
    // return await db.yardSlots.update({ 
    //   where: { id: slotId }, 
    //   data: { containerId: null, occupied: false } 
    // });
    const index = this.slots.findIndex(s => s.id === slotId);
    if (index === -1) return Promise.resolve(null);

    this.slots[index] = {
      ...this.slots[index],
      containerId: null,
      occupied: false,
      updatedAt: new Date().toISOString(),
    };

    return Promise.resolve(this.slots[index]);
  }

  /**
   * Find slot by container ID
   */
  async findByContainerId(containerId: string): Promise<YardSlotModel | null> {
    // TODO: Replace with database query
    // return await db.yardSlots.findFirst({ where: { containerId } });
    const slot = this.slots.find(s => s.containerId === containerId);
    return Promise.resolve(slot || null);
  }

  /**
   * Get yard utilization stats
   */
  async getStats(): Promise<{
    total: number;
    occupied: number;
    available: number;
    utilizationRate: number;
  }> {
    // TODO: Replace with database aggregation
    const total = this.slots.length;
    const occupied = this.slots.filter(s => s.occupied).length;
    const available = total - occupied;
    const utilizationRate = (occupied / total) * 100;

    return Promise.resolve({
      total,
      occupied,
      available,
      utilizationRate,
    });
  }
}

// Export singleton instance
export const yardService = new YardService();
export default yardService;

