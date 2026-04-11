import { render , screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import '@testing-library/jest-dom';
import userEvent from "@testing-library/user-event";

const mockImplementations = {
  default: {
    handleExit: vi.fn(),
    isLoading: false,
    error: null as string | null,
  },
  loading: {
    handleExit: vi.fn(),
    isLoading: true,
    error: null,
  },
  error: {
    handleExit: vi.fn(),
    isLoading: false,
    error: 'Test Error message',
  }
}

let currentMock = mockImplementations.default;

vi.mock("@/app/hooks/useExitRoom", () => ({
  useExitRoom : () => currentMock
}) )

describe('ExitRoomButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.values(mockImplementations).forEach((mock) => {
        if(typeof mock.handleExit === 'function') {
          mock.handleExit.mockClear();
        }
    })

    currentMock = mockImplementations.default;
    vi.resetModules();
  });

  describe('default state', () => {
    it('render ExitRoomButton correctly', async () => {
      const { default: ExitRoomButton } = await import('./ExitRoomButton');
      render(<ExitRoomButton />)

      const btn = screen.getByRole('button')
      expect(btn).toBeInTheDocument()
    })

    it('calls handleExitRoom when button is clicked' , async () => {
      const { default: ExitRoomButton } = await import('./ExitRoomButton');
      render(<ExitRoomButton />)

      const btn = screen.getByRole('button')
      await userEvent.click(btn)
      expect(mockImplementations.default.handleExit).toHaveBeenCalledTimes(1)
    })

  })
  describe('loading state', () => {
    it('show loading text when isLoading is true', async () => {
      currentMock = mockImplementations.loading
      vi.resetModules()

      const { default : ExitRoomButton } = await import('./ExitRoomButton')
      render(<ExitRoomButton />)

      expect(screen.getByText('Exiting room...')).toBeInTheDocument()
    })
  })
  describe('error state', () => {
    it('show error text when errir exists', async () => {
      currentMock = mockImplementations.error
      vi.resetModules()

      const { default : ExitRoomButton } = await import('./ExitRoomButton')
      render(<ExitRoomButton />)

      expect(screen.getByText('Test Error message')).toBeInTheDocument()
    })
  })

})