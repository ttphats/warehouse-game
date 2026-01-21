export interface Factory {
  id: number
  name: string
  x: number
  y: number
  color: string
}

export interface Task {
  id: number
  description: string
  completed: boolean
  reward: number
}

export interface Position2D {
  x: number
  y: number
}

export interface GameState {
  containerPosition: Position2D
  containerRotation: number
  containerSpeed: number
  inventory: string[]
  score: number
  tasks: Task[]
  factories: Factory[]
  currentFactory: number | null
  updateContainerPosition: (position: Position2D) => void
  updateContainerRotation: (rotation: number) => void
  addToInventory: (item: string) => void
  setCurrentFactory: (factoryId: number | null) => void
  completeTask: (taskId: number) => void
  resetGame: () => void
}

export interface KeyboardControls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  action: boolean
}

export interface Driver {
  id: string
  name: string
  licenseNumber: string
  phone: string
  company: string
  status: 'available' | 'on-duty' | 'off-duty'
  currentVehicle: string | null
  rating: number
  totalTrips: number
}

export interface Container {
  id: string
  code: string
  type: '20ft' | '40ft' | '40ft-HC' | '20ft-Reefer'
  status: 'empty' | 'full' | 'damaged'
  owner: string
  weight: number
  maxWeight: number
  color: string
  cargo?: string
  temperature?: number
}

export interface GateTransaction {
  id: string
  type: 'check-in' | 'check-out'
  driverId: string
  vehicleId: string
  containerId: string
  timestamp: string
  gateNumber: string
  purpose?: 'pickup' | 'delivery' | 'return'
  status: 'pending' | 'in-progress' | 'completed'
  documents?: {
    deliveryOrder?: string
    bookingNumber?: string
    verified: boolean
  }
  sealNumber?: string
  weight?: number
}

export interface WorkflowStep {
  step: number
  name: string
  description: string
  requiredDocuments?: string[]
  estimatedTime: number
}

export interface JobStep {
  step: number
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
}

export interface ActiveJob {
  id: string
  driverId: string
  containerId: string
  vehicleId: string
  type: 'import' | 'export' | 'transfer'
  currentStep: number
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  startTime: string
  estimatedCompletion: string
  fromLocation: string
  toLocation: string
  steps: JobStep[]
}

