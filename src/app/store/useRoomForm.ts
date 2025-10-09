import { create } from "zustand";

interface RoomFormState {
  titleInput: string;
  optionsInput: string[];
  setTitle: (title: string) => void;
  setOptionsInput: (options: string[]) => void;
  addOptionInput: () => void;
  removeOptionInput: (index: number) => void;
  clearForm: () => void;
}

export const useRoomForm = create<RoomFormState>((set , get) => ({
    titleInput : '',
    optionsInput : [''],

    setTitle : (title) => set({ titleInput : title }),
    setOptionsInput : (options) => set({ optionsInput : options }),
    addOptionInput : () => set({ optionsInput : [...get().optionsInput  , ""] }),
    removeOptionInput : (index) => { 
        const current = get().optionsInput
        if(current.length >= 3) {
            set({ optionsInput : current.filter((_, i) => i !== index) })
        }
     },
     clearForm : () => set({  
        titleInput : '',
        optionsInput : ['']
     })

}))