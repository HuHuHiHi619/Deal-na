import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

const mockImplementations = {
  default: {
    handleCreateRoom: vi.fn(),
    isLoading: false,
    error: null as string | null,
  },
  loading: {
    handleCreateRoom: vi.fn(),
    isLoading: true,
    error: null,
  },
  error: {
    handleCreateRoom: vi.fn(),
    isLoading: false,
    error: 'Test Error message',
  }
};

let currentMock = mockImplementations.default;

vi.mock('../../hooks/useCreateRoom', () => ({
  useCreateRoom: () => currentMock
}));

describe('CreateRoomButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset ทุก mock functions
    Object.values(mockImplementations).forEach(mock => {
      if (typeof mock.handleCreateRoom === 'function') {
        mock.handleCreateRoom.mockClear();
      }
    });
    
    // กลับไปใช้ default mock
    currentMock = mockImplementations.default;
    
    // reset module cache
    vi.resetModules();
  });

  describe('Default state', () => {
    it('renders button with correct text', async () => {
      const { default: CreateRoomButton } = await import('./CreateRoomButton');
      render(<CreateRoomButton />);

      expect(screen.getByText('PREPARE DEAL')).toBeInTheDocument();
    });

    it('calls handleCreateRoom when button is clicked', async () => {
      const { default: CreateRoomButton } = await import('./CreateRoomButton');
      render(<CreateRoomButton />);

      const btn = screen.getByRole('button');
      await userEvent.click(btn);

      expect(mockImplementations.default.handleCreateRoom).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading state', () => {
    it('shows loading text when isLoading is true', async () => {
      currentMock = mockImplementations.loading;
      vi.resetModules();
      
      const { default: CreateRoomButton } = await import('./CreateRoomButton');
      render(<CreateRoomButton />);

      expect(screen.getByText('CREATING...')).toBeInTheDocument();
      expect(screen.queryByText('PREPARE DEAL')).not.toBeInTheDocument();
    });

    it('disables button when loading', async () => {
      currentMock = mockImplementations.loading;
      vi.resetModules();
      
      const { default: CreateRoomButton } = await import('./CreateRoomButton');
      render(<CreateRoomButton />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-60');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('does not call handleCreateRoom when clicked during loading', async () => {
      currentMock = mockImplementations.loading;
      vi.resetModules();
      
      const { default: CreateRoomButton } = await import('./CreateRoomButton');
      render(<CreateRoomButton />);

      const btn = screen.getByRole('button');
      await userEvent.click(btn);

      expect(mockImplementations.loading.handleCreateRoom).not.toHaveBeenCalled();
    });
  });

  describe('Error state', () => {
    it('displays error message when error exists', async () => {
      currentMock = mockImplementations.error;
      vi.resetModules();
      
      const { default: CreateRoomButton } = await import('./CreateRoomButton');
      render(<CreateRoomButton />);

      expect(screen.getByText('Test Error message')).toBeInTheDocument();
    });

    it('button still works when error is shown', async () => {
      currentMock = mockImplementations.error;
      vi.resetModules();
      
      const { default: CreateRoomButton } = await import('./CreateRoomButton');
      render(<CreateRoomButton />);

      const btn = screen.getByRole('button');
      await userEvent.click(btn);

      expect(mockImplementations.error.handleCreateRoom).toHaveBeenCalledTimes(1);
    });
  });

  
});