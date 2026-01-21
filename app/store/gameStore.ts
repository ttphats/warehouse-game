import { create } from 'zustand'
import { GameState, Factory, Task, Driver, ActiveJob, WorkflowStep } from '../types'
import mockData from '../data/mockData.json'

const initialFactories: Factory[] = [
  { id: 1, name: 'Nhà máy A', x: 100, y: 100, color: '#FF6B6B' },
  { id: 2, name: 'Nhà máy B', x: 700, y: 100, color: '#4ECDC4' },
  { id: 3, name: 'Nhà máy C', x: 700, y: 500, color: '#45B7D1' },
  { id: 4, name: 'Nhà máy D', x: 100, y: 500, color: '#FFA07A' },
]

const initialTasks: Task[] = [
  { id: 1, description: 'Chở hàng từ Nhà máy A đến B', completed: false, reward: 10 },
  { id: 2, description: 'Giao hàng đến Nhà máy C', completed: false, reward: 15 },
  { id: 3, description: 'Hoàn thành 5 chuyến hàng', completed: false, reward: 20 },
]

const useGameStore = create<GameState>((set) => ({
  containerPosition: { x: 400, y: 300 },
  containerRotation: 0,
  containerSpeed: 3,
  inventory: [],
  score: 0,
  tasks: initialTasks,
  factories: initialFactories,
  currentFactory: null,

  updateContainerPosition: (position) => set({ containerPosition: position }),
  updateContainerRotation: (rotation) => set({ containerRotation: rotation }),

  addToInventory: (item) => set((state) => ({
    inventory: [...state.inventory, item],
    score: state.score + 5
  })),

  setCurrentFactory: (factoryId) => set({ currentFactory: factoryId }),

  completeTask: (taskId) => set((state) => {
    const task = state.tasks.find(t => t.id === taskId)
    return {
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, completed: true } : t
      ),
      score: state.score + (task?.reward || 0)
    }
  }),

  resetGame: () => set({
    containerPosition: { x: 400, y: 300 },
    containerRotation: 0,
    inventory: [],
    score: 0,
    currentFactory: null,
    tasks: initialTasks.map(task => ({ ...task, completed: false }))
  })
}))

export default useGameStore

