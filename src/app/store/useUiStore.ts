import { create } from "zustand";

interface UiState {
  isPopup: boolean
  loading: Record<string, boolean>
  error: Record<string, string | null>
  setIsPopup : (value : boolean) => void
  setLoading: (key: string, value: boolean) => void
  setError: (key: string, message: string | null) => void
  getError: (key: string) => string | null
  isLoading: (key: string) => boolean
  clearAll: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  loading: {loadingSession: true,},
  error: {},
  isPopup: false,

  // Popup actions
  setIsPopup: (value) => set({ isPopup: value }),

  // Loading actions
  setLoading: (key, value) => set((state) => ({ loading : { ...state.loading, [key] : value } })),
  isLoading : (key) => !!get().loading[key],

  // Error actions
  setError : (key , message) => set((state) => ({ ...state.error , [key] : message })),
  getError : (key) => get().error[key] || null,
  clearAll : () => set({ error : {} , loading : {} }),

}));
