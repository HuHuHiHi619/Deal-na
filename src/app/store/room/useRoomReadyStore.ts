import { create } from "zustand";
import { RealtimeStore } from "../option/useOptionRealtimeStore";

export const useRoomReadyStore = create<RealtimeStore>((set) => ({
    channel : null,
    subscribe : () => {},
    unsubscribe : () => {}
}))