import { create } from 'zustand'

interface ModalState {
  isOpen: boolean
  type: string
  data?: unknown
}

interface NotificationState {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UIState {
  modal: ModalState
  notification: NotificationState | null
  sidebarOpen: boolean
  openModal: (type: string, data?: unknown) => void
  closeModal: () => void
  showNotification: (notification: NotificationState) => void
  clearNotification: () => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  modal:        { isOpen: false, type: '' },
  notification: null,
  sidebarOpen:  true,

  openModal:  (type, data) => set({ modal: { isOpen: true, type, data } }),
  closeModal: ()           => set({ modal: { isOpen: false, type: '' } }),

  showNotification:  (notification) => set({ notification }),
  clearNotification: ()             => set({ notification: null }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
