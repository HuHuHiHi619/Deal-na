import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MockAuth {
  mockUser: { id: string; username: string } | null;
  login: (user: { id: string; username: string }) => void;
  logout: () => void;
}

export const useMockAuth = create<MockAuth>()(
  persist(
    (set) => ({
      mockUser: null,
      login: (user) => set({ mockUser: user }),
      logout: () => set({ mockUser: null }),
    }),
    { name: "mock-auth-storage" } // key ใน localStorage
  )
);
