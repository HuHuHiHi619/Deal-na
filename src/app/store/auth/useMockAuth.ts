import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MockAuth {
  mockUser: { id: string; username: string } | null;
  hydrated: boolean;
  login: (user: { id: string; username: string }) => void;
  logout: () => void;
}

export const useMockAuth = create<MockAuth>()(
  persist(
    (set) => ({
      mockUser: null,
      hydrated: false,
      login: (user) => set({ mockUser: user }),
      logout: () => set({ mockUser: null }),
    }),
    {
      name: "mock-auth-storage",
      onRehydrateStorage: () => (state) => {
        state && (state.hydrated = true);
      },
    }
  )
);
