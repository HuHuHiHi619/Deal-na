import { create } from "zustand";

interface UiState {
  loading: Record<string, boolean>;
  isPopup : boolean
  setLoading: (key: string, value: boolean) => void;
  isLoading: (key: string) => boolean;
  setIsPopup : (value : boolean) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  loading: {},
  isPopup : false,
  setLoading: (key, value) => {
      set((state) => ({ loading: { ...state.loading, [key]: value } }))
  },
  isLoading: (key) => !!get().loading[key],
  setIsPopup : (value) => set({ isPopup : value }),
}));
