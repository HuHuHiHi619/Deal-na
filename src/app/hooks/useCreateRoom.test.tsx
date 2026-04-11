import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- MOCK FUNCTIONS ----
const mockCreateRoom = vi.fn();
const mockSetIsPopup = vi.fn();
const mockSetLoading = vi.fn();
const mockExecute = vi.fn(async (fn) => await fn());

// ---- MOCK MODULES ----
vi.mock("../store/room/useRoomStore", () => ({
  useRoom: vi.fn(() => ({
    createRoom: mockCreateRoom,
  })),
}));

vi.mock("../store/useRoomForm", () => ({
    useRoomForm: vi.fn(() => ({
      titleInput: "test title",
      optionsInput: ["option 1", "option 2"],
    })),
}));

vi.mock("../store/useUiStore", () => ({
  useUiStore: () => ({
    setIsPopup: mockSetIsPopup,
    setLoading: mockSetLoading,
  }),
}));

vi.mock("../store/auth/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "user123" },
  })),
}));

// ---- MOCK VALIDATION ----
vi.mock("../utils/validateForm", () => ({
  validateForm: vi.fn().mockReturnValue({
    valid: true,
    options:  ["option 1", "option 2"],
    error: null,
  }),
}));

// ---- MOCK ASYNC ACTION ----
vi.mock("../hooks/useAsyncAction", () => ({
  useAsyncAction: vi.fn(() => ({
    execute: mockExecute,
    isLoading: false,
    error: null,
  })),
}));

import { useCreateRoom } from "./useCreateRoom";
import { act, renderHook } from "@testing-library/react";

describe("CreateRoom hook", async () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call createRoom with correct arguments", async () => {
    const { result } = renderHook(() => useCreateRoom());
    const { handleCreateRoom } = result.current;

    await act(async () => {
      await handleCreateRoom();
    });

    expect(mockCreateRoom).toHaveBeenCalledWith(
      "test title",
      ["option 1", "option 2"],
      "user123"
    );
  });
});
