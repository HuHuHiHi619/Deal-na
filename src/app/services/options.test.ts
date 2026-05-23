import { vi, describe, it, expect, beforeEach } from "vitest";
import { getOptions, createOption, deleteOption } from "./options";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: { from: vi.fn() },
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

const mockFrom = vi.mocked(supabase.from);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getOptions", () => {
  it("returns data on success", async () => {
    const mockData = [{ id: "1", title: "opt", room_id: "room-1", user_id: "user-1" }];
    mockFrom.mockReturnValue(buildChain({ data: mockData, error: null }) as never);

    const result = await getOptions("room-1");

    expect(mockFrom).toHaveBeenCalledWith("options");
    expect(result).toEqual(mockData);
  });

  it("returns undefined and logs on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockReturnValue(buildChain({ data: null, error: { message: "DB error" } }) as never);

    const result = await getOptions("room-1");

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("filters by room_id", async () => {
    const chain = buildChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain as never);

    await getOptions("room-abc");

    expect(chain.eq).toHaveBeenCalledWith("room_id", "room-abc");
  });
});

describe("createOption", () => {
  const props = { roomId: "room-1", options: ["yes", "no"], userId: "user-1" };

  it("returns data on success", async () => {
    const mockData = { id: "opt-1", title: "yes" };
    mockFrom.mockReturnValue(buildChain({ data: mockData, error: null }) as never);

    const result = await createOption(props);

    expect(result).toEqual(mockData);
  });

  it("inserts with room_id column (not roomId)", async () => {
    const chain = buildChain({ data: { id: "opt-1" }, error: null });
    mockFrom.mockReturnValue(chain as never);

    await createOption(props);

    expect(chain.insert).toHaveBeenCalledWith([
      { room_id: "room-1", title: "yes", user_id: "user-1" },
      { room_id: "room-1", title: "no", user_id: "user-1" },
    ]);
  });

  it("returns undefined and logs on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockReturnValue(buildChain({ data: null, error: { message: "insert failed" } }) as never);

    const result = await createOption(props);

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("deleteOption", () => {
  const props = { optionId: "opt-1", roomId: "room-1", userId: "user-1" };

  it("returns true on success", async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }) as never);

    const result = await deleteOption(props);

    expect(result).toBe(true);
  });

  it("returns false on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFrom.mockReturnValue(buildChain({ data: null, error: { message: "delete failed" } }) as never);

    const result = await deleteOption(props);

    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });

  it("filters by room_id, id, and user_id", async () => {
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain as never);

    await deleteOption(props);

    expect(chain.eq).toHaveBeenCalledWith("room_id", "room-1");
    expect(chain.eq).toHaveBeenCalledWith("id", "opt-1");
    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
