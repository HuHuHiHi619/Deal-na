import "@testing-library/jest-dom";
import { render, screen, fireEvent, act } from "@testing-library/react";
import WinnerReveal from "./WinnerReveal";

const winner = [{ title: "Pizza", voteCount: 3 }];

describe("WinnerReveal", () => {
  it("mounts and renders the winner content", () => {
    render(<WinnerReveal winners={winner} totalVotes={5} onDone={() => {}} />);
    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.getByText("The deal is")).toBeInTheDocument();
  });

  it("shows the dark scrim immediately on mount (no fade-in peek)", () => {
    const { container } = render(
      <WinnerReveal winners={winner} totalVotes={5} onDone={() => {}} />
    );
    const overlay = container.firstChild as HTMLElement;
    // opaque from the first frame so the results never peek through
    expect(overlay.className).toContain("opacity-100");
    expect(overlay.className).toContain("bg-scrim");
  });

  it("tap → leaving, then transitionEnd fires onDone", () => {
    const onDone = vi.fn();
    const { container } = render(
      <WinnerReveal winners={winner} totalVotes={5} onDone={onDone} />
    );
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain("opacity-100");

    act(() => {
      fireEvent.click(overlay);
    });
    expect(overlay.className).toContain("opacity-0"); // leaving
    expect(onDone).not.toHaveBeenCalled(); // not until the fade-out finishes

    fireEvent.transitionEnd(overlay);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("renders tie framing for multiple winners (no winner card copy)", () => {
    render(
      <WinnerReveal
        winners={[
          { title: "Pizza", voteCount: 2 },
          { title: "Tacos", voteCount: 2 },
        ]}
        totalVotes={4}
        onDone={() => {}}
      />
    );
    expect(screen.getByText("It's a tie")).toBeInTheDocument();
    expect(screen.queryByText("The deal is")).not.toBeInTheDocument();
  });
});
