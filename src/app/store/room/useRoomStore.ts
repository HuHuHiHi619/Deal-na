import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useUiStore } from "../useUiStore";
import { createRoomAPI, joinRoomAPI } from "../../lib/roomAPI";
import { Option, useOptionStore } from "../option/useOptionStore";
import { useRoomRealtimeStore } from "./useRoomRealtimeStore";
import { useOptionRealtimeStore } from "../option/useOptionRealtimeStore";
import { useVoteRealtimeStore } from "../vote/useVoteRealtimeStore";
import { useRoomRealtimeReadyStore } from "./useRoomRealtimeReadyStore";
import { useVoteStore } from "../vote/useVoteStore";
import { useRoomReadyStore } from "./useRoomReadyStore";
import { useRoomMemberStore } from "./useRoomMemberStore";

interface Room {
  id: string;
  roomCode: string;
  title: string;
  status: "open" | "closed";
  createdAt: string;
  expiredAt: string;
  url?: string;
  options?: Option[];
}

interface RoomState {
  // State
  currentRoom: Room | null;
  rooms: Room[];
  error: string | null;
  hasExit : boolean

  // Actions
  setError: (error: string | null) => void;
  clearError: () => void;

  // API Actions
  createRoom: (
    title: string,
    options: string[],
    userId: string
  ) => Promise<void>;
  joinRoom: (roomCode: string, userId: string) => Promise<any>;
  exitRoom: () => void;
}

export const useRoom = create<RoomState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentRoom: null,
      rooms: [],
      hasExit : false,
      error: null,

      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Create room
      createRoom: async (title: string, options: string[], userId: string) => {
        useUiStore.getState().setLoading("createRoomLoading", true);
        set({ error: null });
        console.log("create room input", { title, options });

        try {
          const data = await createRoomAPI(title, options, userId);

          const room: Room = {
            id: data.room.id,
            roomCode: data.room.room_code,
            title: data.room.title,
            status: data.room.status || "open",
            createdAt: data.room.createdAt || new Date().toISOString(),
            expiredAt:
              data.room.expiredAt ||
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), //  24 ชั่วโมง
            url: data.room.url,
            options: data.options,
          };

          set({
            currentRoom: room,
            rooms: [...get().rooms, room],
          });

          useOptionStore.getState().setOptions(data.options || []);
        } catch (error: any) {
          console.error("Failed to create room:", error);
          set({ error: "Failed to create room" });
        } finally {
          useUiStore.getState().setLoading("createRoomLoading", false);
        }
      },

      // Join room
      joinRoom: async (roomCode: string, userId: string) => {
        useUiStore.getState().setLoading("joinRoomLoading", true);
        set({ error: null , hasExit : false});
        try {
          const data = await joinRoomAPI(roomCode, userId);

          const roomData: Room = {
            id: data.room.id,
            roomCode: data.room.room_code,
            title: data.room.title,
            status: data.room.status || "open",
            createdAt: data.room.createdAt || new Date().toISOString(),
            expiredAt:
              data.room.expiredAt ||
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            url: data.room.url,
            options: data.room.options || [],
          };

          set({
            currentRoom: roomData,
          });

          useOptionStore.getState().setOptions(data.room.options || []);

          return data;
        } catch (error: any) {
          console.error("Failed to join room:", error);
          set({ error: error.message || "Failed to join room" });
          return null;
        } finally {
          useUiStore.getState().setLoading("joinRoomLoading", false);
        }
      },

      // Clear room
      exitRoom: () => {
        console.log("🚪 Exiting room...");

        // 1. Unsubscribe realtime ทุก channel
        const { unsubscribe: unsubRoom } = useRoomRealtimeStore.getState();
        const { unsubscribe: unsubOption } = useOptionRealtimeStore.getState();
        const { unsubscribe: unsubVote } = useVoteRealtimeStore.getState();
        const { unsubscribe: unsubReady } =
          useRoomRealtimeReadyStore.getState();

        unsubRoom();
        unsubOption();
        unsubVote();
        unsubReady();

        // 2. Clear room data
        set({ currentRoom: null, error: null , hasExit : true});

        // 3. Clear related stores (ถ้ามี)

        useVoteStore.getState().clearVotes?.();
        useRoomReadyStore.getState().clearReady?.();
        useRoomMemberStore.getState().clearMembers?.();
        useOptionStore.getState().setOptions([]);
        console.log('✅ Room exited successfully');

      },

     
    }),
    {
      name: "room-storage", // unique name for localStorage key
      partialize: (state) => ({
        currentRoom: state.currentRoom,
        rooms: state.rooms,
        // Don't persist loading, error, and form input states
      }),
    }
  )
);
