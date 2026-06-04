/**
 * "Another round" seed (Confetti Pop · Results).
 * On a tie, the Results page stashes the topic + options so the Create form
 * can hydrate with the same deal. Survives the route change via sessionStorage
 * (RoomFormContext is per-subtree and would otherwise reset on navigation).
 */
export const ANOTHER_ROUND_KEY = "dealna:another-round";

export interface AnotherRoundSeed {
  title: string;
  options: string[];
}

export function stashAnotherRound(seed: AnotherRoundSeed) {
  try {
    sessionStorage.setItem(ANOTHER_ROUND_KEY, JSON.stringify(seed));
  } catch {
    /* sessionStorage unavailable — skip the pre-fill, not worth failing nav */
  }
}

export function takeAnotherRound(): AnotherRoundSeed | null {
  try {
    const raw = sessionStorage.getItem(ANOTHER_ROUND_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(ANOTHER_ROUND_KEY);
    const parsed = JSON.parse(raw);
    if (typeof parsed?.title !== "string" || !Array.isArray(parsed?.options)) return null;
    return { title: parsed.title, options: parsed.options };
  } catch {
    return null;
  }
}
