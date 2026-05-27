import { create } from "zustand";

export type UiKey =
  | 'loadingSession'
  | 'popupQr'
  | 'resultLoading'
  | 'joinRoomLoading'
  | 'exitRoom'
  | 'createRoomLoading'
  | 'fetchOptionsLoading'
  | 'createOptionLoading'
  | 'deleteOptionLoading'
  | 'createVoteLoading'
  | 'deleteVoteLoading'
  | 'loginWithFacebook'
  | 'loginWithGoogle'
  | 'signOut'
  | 'rawTitle'
  | 'sendReady'
  | 'subscriptionError';

interface UiState {
  isPopup: boolean
  loading: Record<string, boolean>
  error: Record<string, string | null>
  setIsPopup : (value : boolean) => void
  setLoading: (key: UiKey, value: boolean) => void
  setError: (key: UiKey, message: string | null) => void
  getError: (key: UiKey) => string | null
  isLoading: (key: UiKey) => boolean
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
  setError : (key , message) => 
    set((state) => ({ 
      error : {...state.error , [key] : message }
    })),
  getError : (key) => get().error[key] || null,
  clearAll : () => set({ error : {} , loading : {} }),

}));
