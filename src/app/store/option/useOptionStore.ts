import { create } from "zustand";
import { useRoomForm } from "../useRoomForm";
import { actionWrapper } from "@/app/utils/actionWrapper";

export interface Option {
  id: string;
  room_id: string;
  title: string;
  user_id: string;
  createdBy: string;
}

export interface OptionState {
  options: Option[];
  setOptions: (options: Option[]) => void;
  addOption: (option: Option) => void;
  removeOption: (optionId: string) => void;

  // API actions
  fetchOption: (roomId: string) => Promise<void>;
  createOption: (
    roomId: string,
    title: string,
    userId: string
  ) => Promise<void>;
  deleteOption: (optionId: string) => Promise<void>;
}

export const useOptionStore = create<OptionState>((set, get) => ({
  options: [],

  setOptions: (options) => set({ options }),
  addOption: (option) => {
    const exists = get().options.some((opt) => opt.id === option.id);
    if (!exists) {
      set({ options: [...get().options, option] });
    }
  },
  removeOption: (optionId) => {
    set({ options: [...get().options.filter((opt) => opt.id !== optionId)] });
  },

  // API
  fetchOption: async (roomId: string) => {
    await actionWrapper("fetchOptionsLoading", {
      action: async ({ token }) => {
        const response = await fetch(`/api/option/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        set({ options: data.options });
      },
    });
  },

  createOption: async () => {
    const state = useRoomForm.getState();
    const validOptions = state.optionsInput.filter((option) => option !== "");

    await actionWrapper("createOptionLoading", {
      action: async ({ roomId, token }) => {
        const res = await fetch(`/api/option/${roomId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ options: validOptions }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      },
      onSuccess: useRoomForm.getState().clearForm,
    });
  },

  deleteOption: async (optionId) => {
    await actionWrapper("deleteOptionLoading", {
      action: async ({ roomId, token }) => {
        const res = await fetch(`/api/option/${roomId}/${optionId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      },
    });
  },
}));
