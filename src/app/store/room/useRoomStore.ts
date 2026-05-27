import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useUiStore } from "../useUiStore";
import { useAuth } from "../auth/useAuth";
import { createRoomAPI, joinRoomAPI } from "../../lib/roomAPI";

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
  // State
  currentRoom: Room | null;
  rooms: Room[];
  error: string | null;
  isJoin: boolean;
  hasExit: boolean;

  // Actions
  setError: (error: string | null) => void;
  clearError: () => void;
  setCurrentRoom: (room: Room) => void;

  // API Actions
  createRoom: (
    title: string,
    options: string[],
  ) => Promise<void>;
  joinRoom: (roomId: string) => Promise<Room | null>;
  startRoom: (roomId: string) => Promise<void>;
  exitRoom: () => void;
}

export const useRoom = create<RoomState>()(
  persist(
    (set, get) => ({
      currentRoom: null,
      rooms: [],
      hasExit: false,
      error: null,
      isJoin: false,

      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      setCurrentRoom: (room: Room) => set({ currentRoom: room }),

      createRoom: async (title: string, options: string[]) => {
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

          set({
            currentRoom: room,
            rooms: [...get().rooms, room],
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to create room";
          set({ error: message });
          throw error;
        }
      },

      // Join room
      joinRoom: async (roomId: string) => {
        useUiStore.getState().setLoading("joinRoomLoading", true);

        const state = get();
        if (state.isJoin) {
          return null
        }

        set({ error: null, isJoin: true });
        try {
          const token = useAuth.getState().session?.access_token;
          if (!token) throw new Error("Session expired. Please log in again.");
          const data = await joinRoomAPI(roomId, token);

          if (data.error) {
            throw new Error(data.error);
          }

          if (!data) {
            throw new Error("No data returned from API");
          }

          const roomData = data.room || data;

          if (!roomData || !roomData.id) {
            console.error("Invalid room data:", data);
            throw new Error("Invalid room data received");
          }
          const room: Room = {
            id: roomData.id,
            roomCode: roomData.room_code || roomData.roomCode,
            title: roomData.title || "Untitled Room",
            status: roomData.status || "open",
            createdAt:
              roomData.createdAt ||
              roomData.created_at ||
              new Date().toISOString(),
            expiredAt:
              roomData.expiredAt ||
              roomData.expired_at ||
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            createdBy: roomData.created_by ?? "",
            startedAt: null,
            url: roomData.url || `/room/${roomId}`,
          };

          set({ currentRoom: room, hasExit: false });

          return room;
        } catch (error: unknown) {
          console.error("❌ Failed to join room:", error);
          const message = error instanceof Error
            ? error.message
            : "Failed to join room";

          set({ error: message, isJoin: false });
          throw error;
        } finally {
          useUiStore.getState().setLoading("joinRoomLoading", false);
        }
      },

      startRoom: async (roomId: string) => {
        const cur = get().currentRoom;
        if (!cur) return;
        // Optimistic update so the lobby effect fires immediately
        set({ currentRoom: { ...cur, startedAt: new Date().toISOString() } });
        const token = useAuth.getState().session?.access_token;
        if (!token) throw new Error("Session expired");
        const res = await fetch(`/api/room/${roomId}/start`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error("Failed to start room");
      },

      // Clear room
      exitRoom: () => {
        set({ currentRoom: null, error: null, hasExit: true, isJoin: false });
      },
    }),
    {
      name: "room-storage", 
      partialize: (state) => ({
        currentRoom: state.currentRoom,
        rooms: state.rooms
      }),
    }
  )
);
