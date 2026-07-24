/** Visual themes — layout/format stay fixed; only look-and-feel changes. */
export type ThemeId =
  | "default"
  | "light"
  | "dark"
  | "futuristic"
  | "lucky";

export type ConcreteThemeId = Exclude<ThemeId, "lucky">;

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
    description: "Defense motifs in the background",
  },
  {
    id: "lucky",
    label: "Theme 4: Lucky",
    description: "Random defense / war theme",
  },
];

/** Defense / war themes Lucky may resolve to. */
export const LUCKY_THEME_POOL: readonly ConcreteThemeId[] = [
  "default",
  "dark",
  "futuristic",
] as const;

export function isThemeId(value: string): value is ThemeId {
  return THEME_OPTIONS.some((option) => option.id === value);
}

export function resolveThemeId(
  themeId: ThemeId,
  random: () => number = Math.random,
): ConcreteThemeId {
  if (themeId !== "lucky") return themeId;
  const index = Math.floor(random() * LUCKY_THEME_POOL.length);
  return LUCKY_THEME_POOL[index] ?? "default";
}
