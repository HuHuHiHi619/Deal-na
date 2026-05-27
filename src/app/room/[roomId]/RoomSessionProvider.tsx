"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase";
import { useAuth } from "@/app/store/auth/useAuth";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useRoomMemberStore } from "@/app/store/room/useRoomMemberStore";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import { useRoomReadyStore } from "@/app/store/room/useRoomReadyStore";
import { useUiStore } from "@/app/store/useUiStore";

// ─── versionedFetch helpers ───────────────────────────────────────────────
// Module-level version counters survive re-renders; last call wins.
let membersVer = 0;
async function fetchMembers(roomId: string, token: string) {
  const v = ++membersVer;
  const res = await fetch(`/api/room/${roomId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok || membersVer !== v) return;
  const data: string[] = await res.json();
  if (membersVer !== v) return;
  useRoomMemberStore.getState().setMembers(data);
}

let optionsVer = 0;
async function fetchOptions(roomId: string, token: string) {
  const v = ++optionsVer;
  const res = await fetch(`/api/option/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok || optionsVer !== v) return;
  const { options } = await res.json();
  if (optionsVer !== v) return;
  useOptionStore.getState().setOptions(options ?? []);
}

let votesVer = 0;
async function fetchVotes(roomId: string, token: string) {
  const v = ++votesVer;
  const res = await fetch(`/api/vote/result?roomId=${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok || votesVer !== v) return;
  const data = await res.json();
  if (votesVer !== v) return;
  useVoteStore.getState().setVotes(data.votes ?? []);
  useVoteStore.getState().setVoteResults(data.formattedResult ?? []);
}

let roomVer = 0;
async function fetchRoom(roomId: string, token: string) {
  const v = ++roomVer;
  const res = await fetch(`/api/room/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok || roomVer !== v) return;
  const { room: r } = await res.json();
  if (roomVer !== v) return;
  useRoom.getState().setCurrentRoom({
    id: r.id,
    roomCode: r.room_code,
    title: r.title,
    status: r.status,
    createdAt: r.created_at,
    expiredAt: r.expired_at,
    createdBy: r.created_by,
    startedAt: r.started_at ?? null,  // INV-7: null until server writes
    url: `/room/${r.id}`,
  });
}

function makeDebounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

interface PresencePayload {
  userId: string;
  name?: string;
  isReady: boolean;
}

function syncPresence(ch: RealtimeChannel) {
  const state = ch.presenceState<PresencePayload>();
  const allUsers = Object.keys(state);
  useRoomReadyStore.getState().setTotalMembers(allUsers.length);
  useRoomReadyStore.getState().setReady(
    allUsers.filter((k) => state[k]?.[0]?.isReady === true)
  );
  useRoomReadyStore.getState().setMemberNames(
    new Map(allUsers.map((k) => [k, state[k]?.[0]?.name ?? k]))
  );
}

// ─── Context ──────────────────────────────────────────────────────────────
interface RoomSessionContextValue {
  isJoined: boolean;
  error: string | null;
  sendReady: ((userId: string, name?: string) => Promise<boolean>) | null;
}

const RoomSessionContext = createContext<RoomSessionContextValue>({
  isJoined: false,
  error: null,
  sendReady: null,
});

export function useRoomSession() {
  return useContext(RoomSessionContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────
export function RoomSessionProvider({
  roomId,
  children,
}: {
  roomId: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // channelRef: used by sendReady outside the effect
  const channelRef = useRef<RealtimeChannel | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const token = useAuth.getState().session?.access_token;
    if (!token) return;

    let aborted = false;

    // Stage 2 — single channel construction; presence key bound here (INV-3)
    const debouncedFetchVotes = makeDebounce(() => fetchVotes(roomId, token), 50);

    const ch = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: userId } },
    });

    // All 8 handlers registered BEFORE subscribe (INV-4)
    ch
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "room", filter: `id=eq.${roomId}` },
        () => fetchRoom(roomId, token))
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        () => fetchMembers(roomId, token))
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        () => fetchMembers(roomId, token))
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "options", filter: `room_id=eq.${roomId}` },
        () => fetchOptions(roomId, token))
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "options", filter: `room_id=eq.${roomId}` },
        () => fetchOptions(roomId, token))
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `room_id=eq.${roomId}` },
        debouncedFetchVotes)
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "votes", filter: `room_id=eq.${roomId}` },
        debouncedFetchVotes)
      .on("presence", { event: "sync" }, () => syncPresence(ch));

    // Stage 3 — subscribe; rejects on CHANNEL_ERROR / TIMED_OUT (INV-5)
    const subscribePromise = new Promise<void>((resolve, reject) => {
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          supabase.removeChannel(ch);
          reject(new Error(`Realtime channel ${status}`));
        }
      });
    });

    // Stage 4 — bootstrap (runs only after SUBSCRIBED)
    subscribePromise
      .then(async () => {
        if (aborted) { supabase.removeChannel(ch); return; }

        await Promise.all([
          // [0] join (idempotent — returns alreadyMember:true if already joined)
          fetch(`/api/room/${roomId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }),
          fetchRoom(roomId, token),       // [1] full room snapshot
          fetchMembers(roomId, token),    // [2] member list
          fetchOptions(roomId, token),    // [3] options
          fetchVotes(roomId, token),      // [4] votes + results
        ]);

        if (aborted) return;

        channelRef.current = ch;
        setIsJoined(true);

        // Presence self-track (fire-and-forget; sync event self-corrects)
        const name =
          user?.user_metadata?.name ??
          user?.user_metadata?.full_name ??
          user?.email ??
          undefined;
        ch.track({ userId, name, isReady: false, joinedAt: new Date().toISOString() });
      })
      .catch((err: Error) => {
        if (aborted) return;
        setError(err.message);
        useUiStore.getState().setError("subscriptionError", err.message);
      });

    // Stage 8 — cleanup: runs on unmount OR when [roomId, userId] changes
    return () => {
      aborted = true;           // guard all in-flight .then() callbacks
      channelRef.current = null;

      ch.untrack().catch(() => {}).finally(() => supabase.removeChannel(ch));

      // Store clear — total before next session begins (INV-8)
      useRoomMemberStore.getState().clearMembers();
      useOptionStore.getState().setOptions([]);
      useVoteStore.getState().clearVotes();
      useRoomReadyStore.getState().clearReady();
      useRoom.getState().exitRoom();

      setIsJoined(false);
      setError(null);
    };
  }, [roomId, userId]); // dep guard prevents duplicate subscriptions (INV-6)

  const sendReady = useCallback(
    async (sendUserId: string, name?: string): Promise<boolean> => {
      const ch = channelRef.current;
      if (!ch || ch.state !== "joined") throw new Error("Channel not ready");
      const result = await ch.track({
        userId: sendUserId,
        name,
        isReady: true,
        readyAt: new Date().toISOString(),
      });
      return result === "ok";
    },
    []
  );

  return (
    <RoomSessionContext.Provider value={{ isJoined, error, sendReady }}>
      {children}
    </RoomSessionContext.Provider>
  );
}
