import { create } from 'zustand'
import { Evaluation } from '@/types/models'

const MAX_CACHE_SIZE = 50

interface EvaluationState {
  cache: Map<string, Evaluation>
  addToCache: (id: string, evaluation: Evaluation) => void
  getFromCache: (id: string) => Evaluation | undefined
  clearCache: () => void
}

export const useEvaluationStore = create<EvaluationState>((set, get) => ({
  cache: new Map(),

  addToCache: (id, evaluation) =>
    set((state) => {
      const newCache = new Map(state.cache)
      if (newCache.size >= MAX_CACHE_SIZE) {
        const firstKey = newCache.keys().next().value
        if (firstKey !== undefined) newCache.delete(firstKey)
      }
      newCache.set(id, evaluation)
      return { cache: newCache }
    }),

  getFromCache: (id) => get().cache.get(id),

  clearCache: () => set({ cache: new Map() }),
}))
