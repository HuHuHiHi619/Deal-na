import { vi } from "vitest";

const mockExitRoom = vi.fn()
const mockSetIsPopup = vi.fn();
const mockSetLoading = vi.fn();
const mockExecute = vi.fn(async (fn) => await fn());

vi.mock('../store/room/useRoomStore' , () => ({
    useRoom : vi.fn(() => ({
        exitRoom : mockExitRoom
    }))
}))

vi.mock("../store/useUiStore", () => ({
  useUiStore: () => ({
    setIsPopup: mockSetIsPopup,
    setLoading: mockSetLoading,
  }),
}));

vi.mock("../hooks/useAsyncAction", () => ({
  useAsyncAction: vi.fn(() => ({
    execute: mockExecute,
    isLoading: false,
    error: null,
  })),
}));