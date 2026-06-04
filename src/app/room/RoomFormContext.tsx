"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { takeAnotherRound } from "@/app/lib/anotherRound";

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
  const [optionsInput, setOptionsInput] = useState<string[]>(['', '']);

  // Hydrate from an "another round" seed (tie on the Results page). Read in an
  // effect, not a useState initializer, to avoid an SSR/client hydration mismatch.
  useEffect(() => {
    const seed = takeAnotherRound();
    if (!seed) return;
    if (seed.title) setTitleInput(seed.title);
    if (seed.options.length >= 2) setOptionsInput(seed.options);
  }, []);

  const setTitle = (title: string) => setTitleInput(title);
  const addOptionInput = () => setOptionsInput(prev => [...prev, '']);
  // Keep at least 2 options — the minimum a vote needs.
  const removeOptionInput = (index: number) => {
    setOptionsInput(prev =>
      prev.length > 2 ? prev.filter((_, i) => i !== index) : prev
    );
  };
  const clearForm = () => {
    setTitleInput('');
    setOptionsInput(['', '']);
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
