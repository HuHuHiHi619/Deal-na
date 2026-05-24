import { vi, describe, it, expect, beforeEach } from "vitest";
import { createVote, deleteVote } from "./votes";
import { createServerClient } from "../lib/supabase";

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock("../lib/supabase", () => ({
  createServerClient: vi.fn(() => ({ from: mockFrom })),
}));

function buildChain(result: { data: unknown; error: unknown }) {
  const chain = {
    data: result.data,
    error: result.error,
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
  };
  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createServerClient).mockReturnValue({ from: mockFrom } as never);
});

describe("createVote", () => {
  const props = { roomId: "room-1", optionId: "opt-1", userId: "user-1", token: "test-token" };

  it("returns vote data on success", async () => {
    const mockVote = { id: "vote-1", room_id: "room-1", option_id: "opt-1", user_id: "user-1" };
    mockFrom.mockReturnValue(buildChain({ data: mockVote, error: null }));

    const result = await createVote(props);

    expect(createServerClient).toHaveBeenCalledWith("test-token");
    expect(mockFrom).toHaveBeenCalledWith("votes");
    expect(result).toEqual(mockVote);
  });

  it("inserts correct vote shape", async () => {
    const chain = buildChain({ data: { id: "vote-1" }, error: null });
    mockFrom.mockReturnValue(chain);

    await createVote(props);

    expect(chain.insert).toHaveBeenCalledWith([
      { room_id: "room-1", option_id: "opt-1", user_id: "user-1" },
    ]);
  });

  it("returns false on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockReturnValue(buildChain({ data: null, error: { message: "insert failed" } }));

    const result = await createVote(props);

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("deleteVote", () => {
  const props = { roomId: "room-1", optionId: "opt-1", userId: "user-1", token: "test-token" };

  it("returns true on success", async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }));

    const result = await deleteVote(props);

    expect(createServerClient).toHaveBeenCalledWith("test-token");
    expect(result).toBe(true);
  });

  it("returns false on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockReturnValue(buildChain({ data: null, error: { message: "delete failed" } }));

    const result = await deleteVote(props);

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("filters by room_id, option_id, and user_id", async () => {
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await deleteVote(props);

    expect(chain.eq).toHaveBeenCalledWith("room_id", "room-1");
    expect(chain.eq).toHaveBeenCalledWith("option_id", "opt-1");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
