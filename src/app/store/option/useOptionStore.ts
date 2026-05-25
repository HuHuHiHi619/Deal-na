import { create } from "zustand";
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
