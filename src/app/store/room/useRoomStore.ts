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

export interface Room {
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
  isJoin: boolean;
  hasExit: boolean;

  // Actions
  setError: (error: string | null) => void;
  clearError: () => void;

  // API Actions
  createRoom: (
    title: string,
    options: string[],
    userId: string
  ) => Promise<void>;
  joinRoom: (roomId: string, userId: string) => Promise<Room | null>;  // แก้ any
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

      createRoom: async (title: string, options: string[], userId: string) => {
        set({ error: null });
        console.log("create room input", { title, options, userId });
        
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
       
      },

      // Join room
      joinRoom: async (roomId: string, userId: string) => {
        useUiStore.getState().setLoading("joinRoomLoading", true);

        const state = get();
        if (state.isJoin) {
          console.log("room already joined");
          return null
        }

        set({ error: null, isJoin: true });
        try {
          const data = await joinRoomAPI(roomId, userId);
          console.log("📦 joinRoom API response:", data);

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
            url: roomData.url || `/room/${roomId}`,
            options: data.options || [],
          };

          console.log("✅ Room data processed:", room);

          set({
            currentRoom: room,
            hasExit: false,
          });

          if (data.options && Array.isArray(data.options)) {
            useOptionStore.getState().setOptions(data.options);
          }

          return room;
        } catch (error: unknown) {
          console.error("❌ Failed to join room:", error);
          const message = error instanceof Error 
            ? error.message 
            : "Failed to join room";

          set({ error: message });
          throw error;
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
        const { unsubscribe: unsubReady } = useRoomRealtimeReadyStore.getState();

        unsubRoom();
        unsubOption();
        unsubVote();
        unsubReady();

        // 2. Clear room data
        set({ currentRoom: null, error: null, hasExit: true });

        // 3. Clear related stores 
        useVoteStore.getState().clearVotes?.();
        useRoomReadyStore.getState().clearReady?.();
        useRoomMemberStore.getState().clearMembers?.();
        useOptionStore.getState().setOptions([]);
        console.log("✅ Room exited successfully");
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
