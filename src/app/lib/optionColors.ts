/**
 * Shared option-color cycle (Confetti Pop).
 * An option keeps its color across Create badge → Vote chip → Results dot/bar,
 * indexed by its position in the option list. Colors come from theme.css tokens.
 */
export const OPTION_COLORS = ["coral", "sun", "mint", "sky", "lilac"] as const;
export type OptionColor = (typeof OPTION_COLORS)[number];

export const optionColorAt = (i: number): OptionColor =>
  OPTION_COLORS[((i % OPTION_COLORS.length) + OPTION_COLORS.length) % OPTION_COLORS.length];

export const optionBg: Record<OptionColor, string> = {
  coral: "bg-coral",
  sun: "bg-sun",
  mint: "bg-mint",
  sky: "bg-sky",
  lilac: "bg-lilac",
};

export const optionText: Record<OptionColor, string> = {
  coral: "text-coral",
  sun: "text-sun",
  mint: "text-mint",
  sky: "text-sky",
  lilac: "text-lilac",
};

export const optionBorder: Record<OptionColor, string> = {
  coral: "border-coral",
  sun: "border-sun",
  mint: "border-mint",
  sky: "border-sky",
  lilac: "border-lilac",
};
