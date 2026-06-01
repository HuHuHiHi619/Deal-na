"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export interface RoomFormContextValue {
  titleInput: string;
  optionsInput: string[];
  setTitle: (title: string) => void;
  setOptionsInput: (options: string[]) => void;
  addOptionInput: () => void;
  removeOptionInput: (index: number) => void;
  clearForm: () => void;
}

const RoomFormContext = createContext<RoomFormContextValue | null>(null);

export function RoomFormProvider({ children }: { children: ReactNode }) {
  const [titleInput, setTitleInput] = useState('');
  const [optionsInput, setOptionsInput] = useState<string[]>(['']);

  const setTitle = (title: string) => setTitleInput(title);
  const addOptionInput = () => setOptionsInput(prev => [...prev, '']);
  const removeOptionInput = (index: number) => {
    setOptionsInput(prev =>
      prev.length >= 3 ? prev.filter((_, i) => i !== index) : prev
    );
  };
  const clearForm = () => {
    setTitleInput('');
    setOptionsInput(['']);
  };

  return (
    <RoomFormContext.Provider
      value={{ titleInput, optionsInput, setTitle, setOptionsInput, addOptionInput, removeOptionInput, clearForm }}
    >
      {children}
    </RoomFormContext.Provider>
  );
}

export function useRoomFormContext(): RoomFormContextValue | null {
  return useContext(RoomFormContext);
}
