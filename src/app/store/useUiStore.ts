import { create } from "zustand";

interface UiState {
  loading: Record<string, boolean>;
  setLoading: (key: string, value: boolean) => void;
  isLoading: (key: string) => boolean;
}

export const useUiStore = create<UiState>((set, get) => ({
  loading: {},
  setLoading: (key, value) => {
      set((state) => ({ loading: { ...state.loading, [key]: value } }))
  },
  isLoading: (key) => !!get().loading[key],
}));
