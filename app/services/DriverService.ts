import { DriverModel, DriverCreateDTO, DriverUpdateDTO } from '../models/Driver.model';
import mockData from '../data/mockData.json';

/**
 * Driver Service
 * Handles all driver-related operations
 * TODO: Replace with actual database calls when migrating
 */
class DriverService {
  private drivers: DriverModel[];

  constructor() {
    this.drivers = mockData.drivers as DriverModel[];
  }

  /**
   * Get all drivers
   */
  async getAll(): Promise<DriverModel[]> {
    // TODO: Replace with database query
    // return await db.drivers.findMany();
    return Promise.resolve(this.drivers);
  }

  /**
   * Get driver by ID
   */
  async getById(id: string): Promise<DriverModel | null> {
    // TODO: Replace with database query
    // return await db.drivers.findUnique({ where: { id } });
    const driver = this.drivers.find(d => d.id === id);
    return Promise.resolve(driver || null);
  }

  /**
   * Get available drivers
   */
  async getAvailable(): Promise<DriverModel[]> {
    // TODO: Replace with database query
    // return await db.drivers.findMany({ where: { status: 'available' } });
    const available = this.drivers.filter(d => d.status === 'available');
    return Promise.resolve(available);
  }

  /**
   * Get drivers on duty
   */
  async getOnDuty(): Promise<DriverModel[]> {
    // TODO: Replace with database query
    // return await db.drivers.findMany({ where: { status: 'on-duty' } });
    const onDuty = this.drivers.filter(d => d.status === 'on-duty');
    return Promise.resolve(onDuty);
  }

  /**
   * Create new driver
   */
  async create(data: DriverCreateDTO): Promise<DriverModel> {
    // TODO: Replace with database insert
    // return await db.drivers.create({ data });
    const newDriver: DriverModel = {
      id: `DRV-${Date.now()}`,
      ...data,
      status: 'available',
      currentVehicle: null,
      rating: 5.0,
      totalTrips: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.drivers.push(newDriver);
    return Promise.resolve(newDriver);
  }

  /**
   * Update driver
   */
  async update(id: string, data: DriverUpdateDTO): Promise<DriverModel | null> {
    // TODO: Replace with database update
    // return await db.drivers.update({ where: { id }, data });
    const index = this.drivers.findIndex(d => d.id === id);
    if (index === -1) return Promise.resolve(null);

    this.drivers[index] = {
      ...this.drivers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return Promise.resolve(this.drivers[index]);
  }

  /**
   * Assign driver to vehicle
   */
  async assignVehicle(driverId: string, vehicleId: string): Promise<DriverModel | null> {
    // TODO: Replace with database update
    return this.update(driverId, {
      currentVehicle: vehicleId,
      status: 'on-duty',
    });
  }

  /**
   * Complete trip and update stats
   */
  async completeTrip(driverId: string, rating?: number): Promise<DriverModel | null> {
    // TODO: Replace with database transaction
    const driver = await this.getById(driverId);
    if (!driver) return null;

    const newTotalTrips = driver.totalTrips + 1;
    const newRating = rating 
      ? (driver.rating * driver.totalTrips + rating) / newTotalTrips
      : driver.rating;

    return this.update(driverId, {
      totalTrips: newTotalTrips,
      rating: newRating,
      status: 'available',
      currentVehicle: null,
    });
  }

  /**
   * Delete driver
   */
  async delete(id: string): Promise<boolean> {
    // TODO: Replace with database delete
    // await db.drivers.delete({ where: { id } });
    const index = this.drivers.findIndex(d => d.id === id);
    if (index === -1) return Promise.resolve(false);

    this.drivers.splice(index, 1);
    return Promise.resolve(true);
  }
}

// Export singleton instance
export const driverService = new DriverService();
export default driverService;

