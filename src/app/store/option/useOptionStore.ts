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
  deleteOption: (optionId: string) => Promise<void>;
}

export const selectOptions = (state: OptionState) => Array.from(state.optionsMap.values());

export const useOptionStore = create<OptionState>((set) => ({
  optionsMap: new Map(),

  setOptions: (options) =>
    set({ optionsMap: new Map(options.map((o) => [o.id, o])) }),

  deleteOption: async (optionId) => {
    await actionWrapper("deleteOptionLoading", {
      action: async ({ roomId, token }) => {
        const res = await fetch(`/api/option/${roomId}/${optionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      },
    });
  },
}));
