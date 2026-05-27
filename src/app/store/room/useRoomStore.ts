import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuth } from "../auth/useAuth";
import { createRoomAPI } from "../../lib/roomAPI";

export interface Room {
  id: string;
  roomCode: string;
  title: string;
  status: "open" | "closed";
  createdAt: string;
  expiredAt: string;
  createdBy: string;
  startedAt: string | null; // null until host starts — INV-7
  url?: string;
}

interface RoomState {
  currentRoom: Room | null;
  rooms: Room[];
  error: string | null;

  setError: (error: string | null) => void;
  clearError: () => void;
  setCurrentRoom: (room: Room) => void;

  createRoom: (title: string, options: string[]) => Promise<void>;
  startRoom: (roomId: string) => Promise<void>;
  exitRoom: () => void;
}

export const useRoom = create<RoomState>()(
  persist(
    (set, get) => ({
      currentRoom: null,
      rooms: [],
      error: null,

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setCurrentRoom: (room) => set({ currentRoom: room }),

      createRoom: async (title, options) => {
        set({ error: null });
        try {
          const token = useAuth.getState().session?.access_token;
          if (!token) throw new Error("Session expired. Please log in again.");
          const data = await createRoomAPI(title, options, token);

          const room: Room = {
            id: data.room.id,
            roomCode: data.room.room_code,
            title: data.room.title,
            status: data.room.status || "open",
            createdAt: data.room.createdAt || new Date().toISOString(),
            expiredAt:
              data.room.expiredAt ||
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            createdBy: data.room.created_by ?? "",
            startedAt: null,
            url: data.room.url,
          };

          set({ currentRoom: room, rooms: [...get().rooms, room] });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Failed to create room";
          set({ error: message });
          throw error;
        }
      },

      startRoom: async (roomId) => {
        const cur = get().currentRoom;
        if (!cur) return;
        // Optimistic update so the lobby effect fires immediately
        set({ currentRoom: { ...cur, startedAt: new Date().toISOString() } });
        const token = useAuth.getState().session?.access_token;
        if (!token) throw new Error("Session expired");
        const res = await fetch(`/api/room/${roomId}/start`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error("Failed to start room");
      },

      exitRoom: () => {
        set({ currentRoom: null, error: null });
      },
    }),
    {
      name: "room-storage",
      partialize: (state) => ({
        currentRoom: state.currentRoom,
        rooms: state.rooms,
      }),
    }
  )
);
