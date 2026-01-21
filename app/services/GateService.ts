import { GateTransactionModel, GateTransactionCreateDTO, GateTransactionUpdateDTO } from '../models/GateTransaction.model';
import mockData from '../data/mockData.json';

/**
 * Gate Service
 * Handles gate check-in/check-out operations
 * TODO: Replace with actual database calls when migrating
 */
class GateService {
  private transactions: GateTransactionModel[];

  constructor() {
    this.transactions = mockData.gateTransactions as GateTransactionModel[];
  }

  /**
   * Get all gate transactions
   */
  async getAll(): Promise<GateTransactionModel[]> {
    // TODO: Replace with database query
    // return await db.gateTransactions.findMany({ orderBy: { timestamp: 'desc' } });
    return Promise.resolve([...this.transactions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  }

  /**
   * Get transaction by ID
   */
  async getById(id: string): Promise<GateTransactionModel | null> {
    // TODO: Replace with database query
    // return await db.gateTransactions.findUnique({ where: { id } });
    const transaction = this.transactions.find(t => t.id === id);
    return Promise.resolve(transaction || null);
  }

  /**
   * Get transactions by driver
   */
  async getByDriver(driverId: string): Promise<GateTransactionModel[]> {
    // TODO: Replace with database query
    // return await db.gateTransactions.findMany({ where: { driverId } });
    const filtered = this.transactions.filter(t => t.driverId === driverId);
    return Promise.resolve(filtered);
  }

  /**
   * Get transactions by container
   */
  async getByContainer(containerId: string): Promise<GateTransactionModel[]> {
    // TODO: Replace with database query
    // return await db.gateTransactions.findMany({ where: { containerId } });
    const filtered = this.transactions.filter(t => t.containerId === containerId);
    return Promise.resolve(filtered);
  }

  /**
   * Create check-in transaction
   */
  async checkIn(data: GateTransactionCreateDTO): Promise<GateTransactionModel> {
    // TODO: Replace with database insert
    // return await db.gateTransactions.create({ data });
    const transaction: GateTransactionModel = {
      id: `GATE-${Date.now()}`,
      ...data,
      type: 'check-in',
      timestamp: new Date().toISOString(),
      status: 'in-progress',
      documents: {
        ...data.documents,
        verified: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transactions.push(transaction);
    return Promise.resolve(transaction);
  }

  /**
   * Create check-out transaction
   */
  async checkOut(data: GateTransactionCreateDTO): Promise<GateTransactionModel> {
    // TODO: Replace with database insert
    const transaction: GateTransactionModel = {
      id: `GATE-${Date.now()}`,
      ...data,
      type: 'check-out',
      timestamp: new Date().toISOString(),
      status: 'in-progress',
      documents: {
        ...data.documents,
        verified: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transactions.push(transaction);
    return Promise.resolve(transaction);
  }

  /**
   * Update transaction
   */
  async update(id: string, data: GateTransactionUpdateDTO): Promise<GateTransactionModel | null> {
    // TODO: Replace with database update
    // return await db.gateTransactions.update({ where: { id }, data });
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) return Promise.resolve(null);

    this.transactions[index] = {
      ...this.transactions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return Promise.resolve(this.transactions[index]);
  }

  /**
   * Complete transaction
   */
  async complete(id: string): Promise<GateTransactionModel | null> {
    // TODO: Replace with database update
    return this.update(id, { status: 'completed' });
  }

  /**
   * Cancel transaction
   */
  async cancel(id: string, reason?: string): Promise<GateTransactionModel | null> {
    // TODO: Replace with database update
    return this.update(id, { 
      status: 'cancelled',
      notes: reason,
    });
  }

  /**
   * Get today's transactions
   */
  async getToday(): Promise<GateTransactionModel[]> {
    // TODO: Replace with database query with date filter
    const today = new Date().toISOString().split('T')[0];
    const filtered = this.transactions.filter(t => 
      t.timestamp.startsWith(today)
    );
    return Promise.resolve(filtered);
  }

  /**
   * Get gate statistics
   */
  async getStats(): Promise<{
    totalCheckIns: number;
    totalCheckOuts: number;
    pending: number;
    completed: number;
  }> {
    // TODO: Replace with database aggregation
    const totalCheckIns = this.transactions.filter(t => t.type === 'check-in').length;
    const totalCheckOuts = this.transactions.filter(t => t.type === 'check-out').length;
    const pending = this.transactions.filter(t => t.status === 'pending' || t.status === 'in-progress').length;
    const completed = this.transactions.filter(t => t.status === 'completed').length;

    return Promise.resolve({
      totalCheckIns,
      totalCheckOuts,
      pending,
      completed,
    });
  }
}

// Export singleton instance
export const gateService = new GateService();
export default gateService;

