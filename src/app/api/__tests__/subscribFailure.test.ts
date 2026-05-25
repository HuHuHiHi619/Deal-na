// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from "vitest";
import { supabase } from "@/app/lib/supabase";
import { useRoomRealtimeStore } from "@/app/store/room/useRoomRealtimeStore";
import { useOptionRealtimeStore } from "@/app/store/option/useOptionRealtimeStore";
import { useVoteRealtimeStore } from "@/app/store/vote/useVoteRealtimeStore";

vi.mock("@/app/lib/supabase", () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/app/store/room/useRoomMemberStore", () => ({
  useRoomMemberStore: {
    getState: () => ({ addMember: vi.fn() }),
  },
}));

vi.mock("@/app/store/option/useOptionStore", () => ({
  useOptionStore: {
    getState: () => ({ addOption: vi.fn(), removeOption: vi.fn() }),
  },
}));

vi.mock("@/app/store/vote/useVoteStore", () => ({
  useVoteStore: {
    getState: () => ({ addVote: vi.fn(), deleteVote: vi.fn() }),
  },
}));

function makeMockChannel() {
  let cb: ((status: string) => void) | undefined;
  const ch = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((callback: (status: string) => void) => {
      cb = callback;
      return ch;
    }),
  };
  return { ch, trigger: (status: string) => cb?.(status) };
}

describe('Batch 1 — Realtime subscription rejection paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRoomRealtimeStore.setState({ subscribed: false });
    useOptionRealtimeStore.setState({ subscribed: false });
    useVoteRealtimeStore.setState({ subscribed: false });
  });

  describe('useRoomRealtimeStore', () => {
    it('rejects on CHANNEL_ERROR', async () => {
      const { ch, trigger } = makeMockChannel();
      vi.mocked(supabase.channel).mockReturnValue(ch as any);
      const promise = useRoomRealtimeStore.getState().subscribe('test-room');
      trigger('CHANNEL_ERROR');
      await expect(promise).rejects.toThrow('Realtime subscription failed: CHANNEL_ERROR');
    });

    it('rejects on TIMED_OUT', async () => {
      const { ch, trigger } = makeMockChannel();
      vi.mocked(supabase.channel).mockReturnValue(ch as any);
      const promise = useRoomRealtimeStore.getState().subscribe('test-room');
      trigger('TIMED_OUT');
      await expect(promise).rejects.toThrow('Realtime subscription failed: TIMED_OUT');
    });

    it('resolves on SUBSCRIBED', async () => {
      const { ch, trigger } = makeMockChannel();
      vi.mocked(supabase.channel).mockReturnValue(ch as any);
      const promise = useRoomRealtimeStore.getState().subscribe('test-room');
      trigger('SUBSCRIBED');
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('useOptionRealtimeStore', () => {
    it('rejects on CHANNEL_ERROR', async () => {
      const { ch, trigger } = makeMockChannel();
      vi.mocked(supabase.channel).mockReturnValue(ch as any);
      const promise = useOptionRealtimeStore.getState().subscribe('test-room');
      trigger('CHANNEL_ERROR');
      await expect(promise).rejects.toThrow('Realtime subscription failed: CHANNEL_ERROR');
    });

    it('rejects on TIMED_OUT', async () => {
      const { ch, trigger } = makeMockChannel();
      vi.mocked(supabase.channel).mockReturnValue(ch as any);
      const promise = useOptionRealtimeStore.getState().subscribe('test-room');
      trigger('TIMED_OUT');
      await expect(promise).rejects.toThrow('Realtime subscription failed: TIMED_OUT');
    });

    it('resolves on SUBSCRIBED', async () => {
      const { ch, trigger } = makeMockChannel();
      vi.mocked(supabase.channel).mockReturnValue(ch as any);
      const promise = useOptionRealtimeStore.getState().subscribe('test-room');
      trigger('SUBSCRIBED');
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('useVoteRealtimeStore', () => {
    it('rejects on CHANNEL_ERROR', async () => {
      const { ch, trigger } = makeMockChannel();
      vi.mocked(supabase.channel).mockReturnValue(ch as any);
      const promise = useVoteRealtimeStore.getState().subscribe('test-room');
      trigger('CHANNEL_ERROR');
      await expect(promise).rejects.toThrow('Realtime subscription failed: CHANNEL_ERROR');
    });

    it('rejects on TIMED_OUT', async () => {
      const { ch, trigger } = makeMockChannel();
      vi.mocked(supabase.channel).mockReturnValue(ch as any);
      const promise = useVoteRealtimeStore.getState().subscribe('test-room');
      trigger('TIMED_OUT');
      await expect(promise).rejects.toThrow('Realtime subscription failed: TIMED_OUT');
    });

    it('resolves on SUBSCRIBED', async () => {
      const { ch, trigger } = makeMockChannel();
      vi.mocked(supabase.channel).mockReturnValue(ch as any);
      const promise = useVoteRealtimeStore.getState().subscribe('test-room');
      trigger('SUBSCRIBED');
      await expect(promise).resolves.toBeUndefined();
    });
  });
});
