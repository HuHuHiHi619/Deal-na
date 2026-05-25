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
  optionsMap: Map<string, Option>;
  setOptions: (options: Option[]) => void;
  addOption: (option: Option) => void;
  removeOption: (optionId: string) => void;

  // API actions
  fetchOption: (roomId: string) => Promise<void>;
  deleteOption: (optionId: string) => Promise<void>;
}

export const selectOptions = (state: OptionState) => Array.from(state.optionsMap.values());

export const useOptionStore = create<OptionState>((set, get) => ({
  optionsMap: new Map(),

  setOptions: (options) =>
    set({ optionsMap: new Map(options.map((o) => [o.id, o])) }),

  addOption: (option) => {
    if (!get().optionsMap.has(option.id)) {
      const next = new Map(get().optionsMap);
      next.set(option.id, option);
      set({ optionsMap: next });
    }
  },

  removeOption: (optionId) => {
    const next = new Map(get().optionsMap);
    next.delete(optionId);
    set({ optionsMap: next });
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
        set({ optionsMap: new Map((data.options as Option[]).map((o) => [o.id, o])) });
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
