import { create } from "zustand";
import { useRoomForm } from "../useRoomForm";
import { createOption, deleteOption } from "@/app/services/options";
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
  fetchOption : (roomId : string) => Promise<void>
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
  fetchOption : async (roomId : string) => {
    await actionWrapper("fetchOptionsLoading",{
      action :async () => {
        const response = await fetch(`/api/option/${roomId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        set({ options: data.options });
      }
    })
  },
  
  createOption: async () => {
    const state = useRoomForm.getState();
    const validOptions = state.optionsInput.filter((option) => option !== "");

    await actionWrapper("createOptionLoading", {
      action: async ({ roomId, userId }) => {
        await createOption({ roomId, options: validOptions, userId });
      },
      onSuccess: useRoomForm.getState().clearForm,
    });
  },
  deleteOption: async (optionId) => {
    await actionWrapper("deleteOptionLoading",{
      action :async ({ roomId , userId }) => await deleteOption({optionId , roomId , userId})
    }
    );
  },
}));
