import { supabase } from "@/app/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useEffect, useRef, useState } from "react";

interface RoomSessionContextValue {
  isJoined: boolean;
  error: string | null;
  totalMembers: number;
  readyMembers: string[];
  memberNames: Map<string, string>;
  sendReady: ((name?: string) => Promise<boolean>) | null;
  sendUnready: (() => Promise<boolean>) | null;
}

interface RoomSessionProps {
  children: React.ReactNode;
  roomId: string;
  userId: string;
  token: string;
}

interface PresenceMeta {
  user_id: string;
  name?: string;
  status?: boolean;
}

export const RoomSessionContext = createContext<RoomSessionContextValue | null>(
  null,
);

export const RoomSessionProvider = ({
  children,
  roomId,
  userId,
  token,
}: RoomSessionProps) => {
  const queryClient = useQueryClient();
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalMembers, setTotalmembers] = useState<number>(0);
  const [readyMembers, setReadyMembers] = useState<string[]>([]);
  const [memberNames, setMemberNames] = useState<Map<string, string>>(
    new Map(),
  );

  const channelRef = useRef<any>(null);

  const invalidatesVotes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["votes", roomId] });
  }, [queryClient, roomId]);

  const invalidatesRoomMembers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["members", roomId] });
  }, [queryClient, roomId]);

  const invalidatesOptions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["options", roomId] });
  }, [queryClient, roomId]);
  
  const invalidatesRoom = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["room", roomId] });
  }, [queryClient, roomId]);

  useEffect(() => {
    const setupChannel = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to join room");

        const channel = supabase
          .channel(`room:${roomId}`, { config: { presence: { key: userId } } })
          .on(
            "presence",
            {
              event: "sync",
            },
            () => {
              const state = channel.presenceState() as Record<
                string,
                PresenceMeta[]
              >;
              const members = Object.values(state).flat();

              setTotalmembers(members.length);

              const readyList: string[] = [];
              const namesMap = new Map<string, string>();

              members.forEach((meta) => {
                namesMap.set(meta.user_id, meta.name || "anonymous");
                if (meta.status) readyList.push(meta.user_id);
              });

              setMemberNames(namesMap);
              setReadyMembers(readyList);
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "votes",
              filter: `room_id=eq.${roomId}`,
            },
            () => invalidatesVotes(),
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "room_members",
              filter: `room_id=eq.${roomId}`,
            },
            () => invalidatesRoomMembers(),
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "options",
              filter: `room_id=eq.${roomId}`,
            },
            () => invalidatesOptions(),
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "room",
              filter: `id=eq.${roomId}`,
            },
            () => invalidatesRoom(),
          );

        channelRef.current = channel;

        channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            try {
              await channel.track({
                user_id: userId,
                name: "Player",
                status: false,
              });
              setIsJoined(true);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to track presence",
              );
            }
          }
        });
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to join room",
        );
      }
    };
    setupChannel();

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
      }
    };
  }, [
    roomId,
    userId,
    invalidatesVotes,
    invalidatesRoomMembers,
    invalidatesOptions,
    invalidatesRoom,
  ]);

  const sendReady = useCallback(
    async (name?: string): Promise<boolean> => {
      if (!channelRef.current) return false;

      try {
        await channelRef.current.track({
          user_id: userId,
          name: name || memberNames.get(userId) || "Player",
          status: true,
        });
        return true;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to ready");
        return false;
      }
    },
    [userId, memberNames],
  );
  const sendUnready = useCallback(async (): Promise<boolean> => {
    if (!channelRef.current) return false;
    try {
      await channelRef.current.track({
        user_id: userId,
        name: memberNames.get(userId) || "Player",
        status: false,
      });

      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to unready");
      return false;
    }
  }, [userId, memberNames]);

  const contextValue: RoomSessionContextValue = {
    isJoined,
    error,
    totalMembers,
    readyMembers,
    memberNames,
    sendReady,
    sendUnready,
  };

  return (
    <RoomSessionContext.Provider value={contextValue}>
      {children}
    </RoomSessionContext.Provider>
  );
};
