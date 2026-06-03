import { cn } from "@/app/lib/cn";

/**
 * Hand-placed confetti decoration layer (Confetti Pop design).
 * Sits behind content: render as the first child of a `relative` container.
 * Bits are decorative only — `pointer-events-none`, ~0.6 opacity.
 * Spec: .claude/design/design-spec.md → "Decoration: confetti".
 */

type BitType = "dot" | "ring" | "square" | "squiggle";
type Color = "sun" | "mint" | "lilac" | "coral" | "pink" | "sky";

interface Bit {
  type: BitType;
  color: Color;
  /** position as CSS values, e.g. "8%" / "12px" */
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  /** px size of the bit */
  size?: number;
  /** rotation in degrees (squares/squiggles) */
  rotate?: number;
}

export type ConfettiVariant =
  | "login"
  | "create"
  | "share"
  | "vote"
  | "result";

const dotBg: Record<Color, string> = {
  sun: "bg-sun",
  mint: "bg-mint",
  lilac: "bg-lilac",
  coral: "bg-coral",
  pink: "bg-pink",
  sky: "bg-sky",
};

const ringBorder: Record<Color, string> = {
  sun: "border-sun",
  mint: "border-mint",
  lilac: "border-lilac",
  coral: "border-coral",
  pink: "border-pink",
  sky: "border-sky",
};

// Reference theme tokens, never raw hex.
const stroke: Record<Color, string> = {
  sun: "var(--color-sun)",
  mint: "var(--color-mint)",
  lilac: "var(--color-lilac)",
  coral: "var(--color-coral)",
  pink: "var(--color-pink)",
  sky: "var(--color-sky)",
};

const VARIANTS: Record<ConfettiVariant, Bit[]> = {
  login: [
    { type: "squiggle", color: "lilac", top: "8%", left: "48%", size: 40 },
    { type: "dot", color: "sun", top: "11%", left: "8%", size: 22 },
    { type: "ring", color: "mint", top: "15%", right: "8%", size: 34 },
    { type: "dot", color: "sky", top: "50%", left: "2%", size: 10 },
    { type: "dot", color: "pink", top: "52%", right: "2%", size: 12 },
    { type: "ring", color: "sun", bottom: "21%", left: "9%", size: 26 },
    { type: "dot", color: "mint", bottom: "16%", right: "11%", size: 16 },
    { type: "squiggle", color: "coral", bottom: "5%", right: "22%", size: 36 },
  ],
  create: [
    { type: "squiggle", color: "lilac", top: "7%", left: "50%", size: 40 },
    { type: "dot", color: "sun", top: "10%", left: "2%", size: 16 },
    { type: "ring", color: "mint", top: "12%", right: "3%", size: 30 },
    { type: "dot", color: "coral", top: "33%", right: "10%", size: 12 },
    { type: "square", color: "lilac", top: "27%", left: "6%", size: 18, rotate: 20 },
    { type: "square", color: "sky", top: "49%", left: "4%", size: 20, rotate: -15 },
    { type: "dot", color: "pink", top: "51%", right: "4%", size: 14 },
    { type: "ring", color: "sun", bottom: "18%", left: "9%", size: 26 },
    { type: "dot", color: "mint", bottom: "13%", right: "11%", size: 16 },
  ],
  share: [
    { type: "squiggle", color: "lilac", top: "4%", left: "44%", size: 36 },
    { type: "dot", color: "sun", top: "9%", left: "6%", size: 14 },
    { type: "ring", color: "mint", top: "10%", right: "6%", size: 30 },
    { type: "square", color: "lilac", top: "28%", left: "4%", size: 18, rotate: 22 },
    { type: "dot", color: "sky", top: "31%", left: "6%", size: 14 },
    { type: "dot", color: "coral", top: "34%", right: "6%", size: 12 },
    { type: "square", color: "sky", bottom: "38%", left: "8%", size: 18, rotate: -18 },
    { type: "dot", color: "pink", bottom: "30%", right: "5%", size: 16 },
  ],
  vote: [
    { type: "squiggle", color: "lilac", top: "5%", left: "46%", size: 34 },
    { type: "ring", color: "mint", top: "12%", right: "6%", size: 28 },
    { type: "square", color: "lilac", top: "33%", left: "4%", size: 16, rotate: 20 },
    { type: "dot", color: "pink", top: "52%", right: "3%", size: 14 },
    { type: "ring", color: "sun", bottom: "22%", left: "8%", size: 24 },
    { type: "dot", color: "mint", bottom: "16%", right: "10%", size: 16 },
  ],
  result: [
    { type: "dot", color: "sun", top: "11%", left: "7%", size: 20 },
    { type: "squiggle", color: "lilac", top: "7%", left: "48%", size: 40 },
    { type: "dot", color: "coral", top: "34%", right: "16%", size: 12 },
    { type: "square", color: "sky", top: "52%", left: "6%", size: 22, rotate: -18 },
    { type: "dot", color: "pink", top: "54%", right: "6%", size: 16 },
    { type: "ring", color: "sun", bottom: "20%", left: "9%", size: 26 },
    { type: "dot", color: "mint", bottom: "15%", right: "11%", size: 16 },
  ],
};

function BitView({ bit }: { bit: Bit }) {
  const size = bit.size ?? 16;
  const pos: React.CSSProperties = {
    top: bit.top,
    left: bit.left,
    right: bit.right,
    bottom: bit.bottom,
  };

  if (bit.type === "dot") {
    return (
      <span
        className={cn("absolute rounded-full", dotBg[bit.color])}
        style={{ ...pos, width: size, height: size }}
      />
    );
  }

  if (bit.type === "ring") {
    return (
      <span
        className={cn("absolute rounded-full border-[3px]", ringBorder[bit.color])}
        style={{ ...pos, width: size, height: size }}
      />
    );
  }

  if (bit.type === "square") {
    return (
      <span
        className={cn("absolute rounded-[6px]", dotBg[bit.color])}
        style={{
          ...pos,
          width: size,
          height: size,
          transform: `rotate(${bit.rotate ?? 18}deg)`,
        }}
      />
    );
  }

  // squiggle
  return (
    <svg
      className="absolute"
      style={{ ...pos, transform: `rotate(${bit.rotate ?? 0}deg)` }}
      width={size}
      height={size * 0.4}
      viewBox="0 0 40 16"
      fill="none"
    >
      <path
        d="M2 8c3-6 7-6 10 0s7 6 10 0 7-6 10 0"
        stroke={stroke[bit.color]}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Confetti({
  variant = "login",
  className,
}: {
  variant?: ConfettiVariant;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-60",
        className
      )}
    >
      {VARIANTS[variant].map((bit, i) => (
        <BitView key={i} bit={bit} />
      ))}
    </div>
  );
}
