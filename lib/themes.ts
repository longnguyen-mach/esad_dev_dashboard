/** Visual themes — layout/format stay fixed; only look-and-feel changes. */
export type ThemeId =
  | "default"
  | "light"
  | "dark"
  | "futuristic"
  | "lucky";

/** Every selectable theme maps 1:1 to a concrete look (including Lucky). */
export type ConcreteThemeId = ThemeId;

export const THEME_OPTIONS: ReadonlyArray<{
  id: ThemeId;
  label: string;
  description: string;
}> = [
  {
    id: "default",
    label: "Theme Default",
    description: "Original dashboard theme",
  },
  {
    id: "light",
    label: "Theme 1: Light",
    description: "Lighter dashboard surfaces",
  },
  {
    id: "dark",
    label: "Theme 2: Dark",
    description: "Darker dashboard surfaces",
  },
  {
    id: "futuristic",
    label: "Theme 3: Futuristic",
    description: "Cool cyan defense motifs",
  },
  {
    id: "lucky",
    label: "Theme 4: Lucky",
    description: "Warm brass field-command look",
  },
];

/**
 * @deprecated Lucky is now its own concrete theme (no longer rolls into others).
 * Kept for tests / callers that still import the pool name.
 */
export const LUCKY_THEME_POOL: readonly ConcreteThemeId[] = ["lucky"] as const;

export function isThemeId(value: string): value is ThemeId {
  return THEME_OPTIONS.some((option) => option.id === value);
}

export function resolveThemeId(
  themeId: ThemeId,
  _random: () => number = Math.random,
): ConcreteThemeId {
  return themeId;
}
