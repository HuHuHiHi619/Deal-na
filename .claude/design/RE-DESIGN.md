# redesign.md — Confetti Pop Redesign

## Design System (source of truth)
- All colors / radii / shadows / font sizes are defined in `src/theme.css` (Tailwind v4 `@theme`)
  **Never hardcode hex values or arbitrary px in components** — always import tokens via utility classes
- To add a new value: add it to `theme.css` first, then use it. Never put raw values in className.
- Reference component (correct pattern): `src/components.tsx` — follow this pattern
- Full spec: `design-refs/confetti-pop-spec.md`
- Screenshots: `design-refs/target/` (destination) / `design-refs/current/` (current state)

## UI Rules
- Use utility classes from theme only: `bg-cream`, `text-ink`, `rounded-3xl`, `shadow-lg`,
  `type-title`, `bg-brand-gradient`, `bg-mint-tint`, etc.
- Typography: use `type-*` classes (display/title/heading/body/caption/eyebrow/numeral) — never set font size manually
- Button/winner gradients: `bg-brand-gradient` (coral→pink at 135°) only
- App-wide font: Fredoka — no other fonts allowed
- Confetti: keep to 6–10 pieces per screen, opacity ~0.6, avoid generating too frequently
- No emoji in UI chrome (buttons/labels) — allowed only in user-generated content
- Style reference: playful but clean (Duolingo / Gen-Z app style), not generic purple gradients

## Redesign Workflow (per screen)
1. Read the spec section for that screen + target screenshot
2. Modify components using tokens from `theme.css` only
3. Open localhost in Chrome → **take screenshot of actual result → compare with target**
4. If mismatch → iterate from step 2 | If match → commit separately per screen
> Never claim "done" without completing step 3 screenshot comparison

