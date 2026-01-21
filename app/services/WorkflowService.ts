import {
  WorkflowModel,
  WorkflowCreateDTO,
  WorkflowUpdateDTO,
  WorkflowStepModel,
  DEFAULT_WORKFLOW_STEPS,
  ContainerDirection,
} from '../models/Workflow.model';

/**
 * Workflow Service
 * Manages the complete container yard workflow
 * TODO: Replace with actual database calls when migrating
 */
class WorkflowService {
  private workflows: WorkflowModel[] = [];

  /**
   * Create new workflow
   */
  async create(data: WorkflowCreateDTO): Promise<WorkflowModel> {
    // TODO: Replace with database insert
    // return await db.workflows.create({ data });
    
    const now = new Date().toISOString();
    const totalEstimatedTime = DEFAULT_WORKFLOW_STEPS.reduce(
      (sum, step) => sum + step.estimatedDuration,
      0
    );

    const steps: WorkflowStepModel[] = DEFAULT_WORKFLOW_STEPS.map((template, index) => ({
      id: `STEP-${Date.now()}-${index}`,
      ...template,
      status: index === 0 ? 'in-progress' : 'pending',
      startedAt: index === 0 ? now : undefined,
    }));

    const workflow: WorkflowModel = {
      id: `WF-${Date.now()}`,
      ...data,
      cargoType: data.cargoType || 'general',
      priority: data.priority || 'medium',
      currentStep: 0,
      steps,
      status: 'in-progress',
      startTime: now,
      estimatedCompletion: new Date(
        Date.now() + totalEstimatedTime * 1000
      ).toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.push(workflow);
    return Promise.resolve(workflow);
  }

  /**
   * Get workflow by ID
   */
  async getById(id: string): Promise<WorkflowModel | null> {
    // TODO: Replace with database query
    // return await db.workflows.findUnique({ where: { id } });
    const workflow = this.workflows.find(w => w.id === id);
    return Promise.resolve(workflow || null);
  }

  /**
   * Get workflow by job ID
   */
  async getByJobId(jobId: string): Promise<WorkflowModel | null> {
    // TODO: Replace with database query
    // return await db.workflows.findFirst({ where: { jobId } });
    const workflow = this.workflows.find(w => w.jobId === jobId);
    return Promise.resolve(workflow || null);
  }

  /**
   * Get active workflows
   */
  async getActive(): Promise<WorkflowModel[]> {
    // TODO: Replace with database query
    // return await db.workflows.findMany({ where: { status: 'in-progress' } });
    const active = this.workflows.filter(w => w.status === 'in-progress');
    return Promise.resolve(active);
  }

  /**
   * Complete current step and move to next
   */
  async completeStep(workflowId: string): Promise<WorkflowModel | null> {
    // TODO: Replace with database transaction
    const workflow = await this.getById(workflowId);
    if (!workflow) return null;

    const currentStepIndex = workflow.currentStep;
    const currentStep = workflow.steps[currentStepIndex];

    if (!currentStep) return null;

    // Complete current step
    const now = new Date().toISOString();
    currentStep.status = 'completed';
    currentStep.completedAt = now;
    
    if (currentStep.startedAt) {
      const duration = (new Date(now).getTime() - new Date(currentStep.startedAt).getTime()) / 1000;
      currentStep.actualDuration = duration;
    }

    // Move to next step
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < workflow.steps.length) {
      workflow.steps[nextStepIndex].status = 'in-progress';
      workflow.steps[nextStepIndex].startedAt = now;
      workflow.currentStep = nextStepIndex;
    } else {
      // All steps completed
      workflow.status = 'completed';
      workflow.actualCompletion = now;
    }

    workflow.updatedAt = now;

    const index = this.workflows.findIndex(w => w.id === workflowId);
    if (index !== -1) {
      this.workflows[index] = workflow;
    }

    return Promise.resolve(workflow);
  }

  /**
   * Assign yard slot to workflow
   */
  async assignSlot(workflowId: string, slotId: string): Promise<WorkflowModel | null> {
    // TODO: Replace with database update
    return this.update(workflowId, { assignedSlot: slotId });
  }

  /**
   * Assign door to workflow
   */
  async assignDoor(workflowId: string, doorId: string): Promise<WorkflowModel | null> {
    // TODO: Replace with database update
    return this.update(workflowId, { assignedDoor: doorId });
  }

  /**
   * Set seal number
   */
  async setSealNumber(workflowId: string, sealNumber: string): Promise<WorkflowModel | null> {
    // TODO: Replace with database update
    return this.update(workflowId, { sealNumber });
  }

  /**
   * Update workflow
   */
  async update(id: string, data: WorkflowUpdateDTO): Promise<WorkflowModel | null> {
    // TODO: Replace with database update
    // return await db.workflows.update({ where: { id }, data });
    const index = this.workflows.findIndex(w => w.id === id);
    if (index === -1) return Promise.resolve(null);

    this.workflows[index] = {
      ...this.workflows[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return Promise.resolve(this.workflows[index]);
  }

  /**
   * Cancel workflow
   */
  async cancel(id: string, reason?: string): Promise<WorkflowModel | null> {
    // TODO: Replace with database update
    const workflow = await this.update(id, { status: 'cancelled' });
    if (workflow && workflow.steps[workflow.currentStep]) {
      workflow.steps[workflow.currentStep].status = 'failed';
      workflow.steps[workflow.currentStep].data = { cancelReason: reason };
    }
    return workflow;
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
export default workflowService;

