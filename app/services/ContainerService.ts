import { ContainerModel, ContainerCreateDTO, ContainerUpdateDTO } from '../models/Container.model';
import mockData from '../data/mockData.json';

/**
 * Container Service
 * Handles all container-related operations
 * TODO: Replace with actual database calls when migrating
 */
class ContainerService {
  private containers: ContainerModel[];

  constructor() {
    // Load from mock data
    this.containers = mockData.containers as ContainerModel[];
  }

  /**
   * Get all containers
   */
  async getAll(): Promise<ContainerModel[]> {
    // TODO: Replace with database query
    // return await db.containers.findMany();
    return Promise.resolve(this.containers);
  }

  /**
   * Get container by ID
   */
  async getById(id: string): Promise<ContainerModel | null> {
    // TODO: Replace with database query
    // return await db.containers.findUnique({ where: { id } });
    const container = this.containers.find(c => c.id === id);
    return Promise.resolve(container || null);
  }

  /**
   * Get container by code
   */
  async getByCode(code: string): Promise<ContainerModel | null> {
    // TODO: Replace with database query
    // return await db.containers.findUnique({ where: { code } });
    const container = this.containers.find(c => c.code === code);
    return Promise.resolve(container || null);
  }

  /**
   * Get containers by status
   */
  async getByStatus(status: 'empty' | 'full' | 'damaged'): Promise<ContainerModel[]> {
    // TODO: Replace with database query
    // return await db.containers.findMany({ where: { status } });
    const filtered = this.containers.filter(c => c.status === status);
    return Promise.resolve(filtered);
  }

  /**
   * Create new container
   */
  async create(data: ContainerCreateDTO): Promise<ContainerModel> {
    // TODO: Replace with database insert
    // return await db.containers.create({ data });
    const newContainer: ContainerModel = {
      id: `CONT-${Date.now()}`,
      ...data,
      color: this.getColorByStatus(data.status),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.containers.push(newContainer);
    return Promise.resolve(newContainer);
  }

  /**
   * Update container
   */
  async update(id: string, data: ContainerUpdateDTO): Promise<ContainerModel | null> {
    // TODO: Replace with database update
    // return await db.containers.update({ where: { id }, data });
    const index = this.containers.findIndex(c => c.id === id);
    if (index === -1) return Promise.resolve(null);

    this.containers[index] = {
      ...this.containers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return Promise.resolve(this.containers[index]);
  }

  /**
   * Delete container
   */
  async delete(id: string): Promise<boolean> {
    // TODO: Replace with database delete
    // await db.containers.delete({ where: { id } });
    const index = this.containers.findIndex(c => c.id === id);
    if (index === -1) return Promise.resolve(false);

    this.containers.splice(index, 1);
    return Promise.resolve(true);
  }

  /**
   * Get available containers (empty or ready for pickup)
   */
  async getAvailable(): Promise<ContainerModel[]> {
    // TODO: Replace with database query
    // return await db.containers.findMany({ where: { status: 'empty' } });
    const available = this.containers.filter(c => c.status === 'empty');
    return Promise.resolve(available);
  }

  // Helper methods
  private getColorByStatus(status: string): string {
    switch (status) {
      case 'empty': return '#4CAF50';
      case 'full': return '#FF9800';
      case 'damaged': return '#F44336';
      default: return '#9E9E9E';
    }
  }
}

// Export singleton instance
export const containerService = new ContainerService();
export default containerService;

