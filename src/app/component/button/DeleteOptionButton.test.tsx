import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom';


const mockImplementations = {
  default: {
    onClickMock: vi.fn(),
    disabled: false,
  },
  disable: {
    onClickMock: vi.fn(),
    disabled: true,
  },
};

let currentMock = mockImplementations.default;

describe("deleteOptionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.values(mockImplementations).forEach((mock) => {
      if (typeof mock.onClickMock === "function") {
        mock.onClickMock.mockClear();
      }
    });

    currentMock = mockImplementations.default;
    vi.resetModules();
  });

  describe("default state", () => {
    it("render deleteOptionButton correctly", async () => {
      const { default: DeleteOptionButton } = await import(
        "./DeleteOptionButton"
      );

      render(
        <DeleteOptionButton
          onClick={mockImplementations.default.onClickMock}
          disabled={mockImplementations.default.disabled}
        />
      );

      const btn = screen.getByRole("button");
      expect(btn).toBeInTheDocument();
    });

    it("calls onclick when button is clicked", async () => {
      const { default: DeleteOptionButton } = await import(
        "./DeleteOptionButton"
      );

      render(
        <DeleteOptionButton
          onClick={mockImplementations.default.onClickMock}
          disabled={mockImplementations.default.disabled}
        />
      );

      const btn = screen.getByRole("button");
      await userEvent.click(btn);

      expect(mockImplementations.default.onClickMock).toHaveBeenCalledTimes(1);
    });

    it("button is not disable when disabled is false", async () => {
      const { default: DeleteOptionButton } = await import(
        "./DeleteOptionButton"
      );
      render(
        <DeleteOptionButton
          onClick={mockImplementations.default.onClickMock}
          disabled={mockImplementations.default.disabled}
        />
      );
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });
  describe("disable state", () => {
    it("button is disable when disabled is true", async () => {
      const { default: DeleteOptionButton } = await import(
        "./DeleteOptionButton"
      );

      render(
        <DeleteOptionButton
          onClick={mockImplementations.disable.onClickMock}
          disabled={mockImplementations.disable.disabled}
        />
      );

      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
    });

    it("does not call onclick when button is disabled", async () => {
      const { default: DeleteOptionButton } = await import(
        "./DeleteOptionButton"
      );

      render(
        <DeleteOptionButton
          onClick={mockImplementations.disable.onClickMock}
          disabled={mockImplementations.disable.disabled}
        />
      );

      const btn = screen.getByRole("button");
      userEvent.click(btn);

      expect(mockImplementations.disable.onClickMock).not.toHaveBeenCalled();
    });
  });
});
