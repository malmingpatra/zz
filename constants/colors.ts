// ─────────────────────────────────────────────────────────────────────────────
// BASE TOKEN SETS
// ─────────────────────────────────────────────────────────────────────────────

/** Shared light-mode structural tokens (background, card, border, text, etc.) */
const lightBase = {
  text: "#111110",
  background: "#F5F5F0",
  foreground: "#111110",
  card: "#FFFFFF",
  cardForeground: "#111110",
  primaryForeground: "#FFFFFF",
  secondary: "#F0F0EA",
  secondaryForeground: "#333330",
  muted: "#F0F0EA",
  mutedForeground: "#AAAAAA",
  destructive: "#E53000",
  destructiveForeground: "#FFFFFF",
  border: "#E4E4DC",
  input: "#D8D8D0",
  topbar: "#FFFFFF",
  topbarBorder: "#E0E0D8",
  stokOkBg: "#E6F4EC",
  stokOkText: "#1A6B3C",
  stokOkBorder: "#B8DECA",
  stokWarnBg: "#FFF3DC",
  stokWarnText: "#8A5A00",
  stokWarnBorder: "#F0D890",
};

/** Shared dark-mode structural tokens */
const darkBase = {
  text: "#F5F5F0",
  background: "#111110",
  foreground: "#F5F5F0",
  card: "#1C1C1A",
  cardForeground: "#F5F5F0",
  primaryForeground: "#111110",
  secondary: "#2A2A28",
  secondaryForeground: "#D8D8D0",
  muted: "#2A2A28",
  mutedForeground: "#888885",
  destructive: "#FF4500",
  destructiveForeground: "#FFFFFF",
  border: "#3A3A38",
  input: "#3A3A38",
  topbar: "#1C1C1A",
  topbarBorder: "#3A3A38",
  stokWarnBg: "#4A3B1C",
  stokWarnText: "#E6B86C",
  stokWarnBorder: "#78653A",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — builds a light variant from an accent color
// ─────────────────────────────────────────────────────────────────────────────
function light(
  primary: string,
  accent: string,
  accentFg: string,
  stokOkText?: string,
  stokOkBorder?: string,
  stokOkBg?: string
) {
  return {
    ...lightBase,
    tint: primary,
    primary,
    accent,
    accentForeground: accentFg,
    stokOkText: stokOkText ?? lightBase.stokOkText,
    stokOkBorder: stokOkBorder ?? lightBase.stokOkBorder,
    stokOkBg: stokOkBg ?? lightBase.stokOkBg,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — builds a dark variant from an accent color
// ─────────────────────────────────────────────────────────────────────────────
function dark(
  primary: string,
  accent: string,
  accentFg: string,
  stokOkBg: string,
  stokOkText: string,
  stokOkBorder: string
) {
  return {
    ...darkBase,
    tint: primary,
    primary,
    accent,
    accentForeground: accentFg,
    stokOkBg,
    stokOkText,
    stokOkBorder,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT THEMES
// ─────────────────────────────────────────────────────────────────────────────
const lightThemes = {
  /** Hijau Toko — default */
  classic: light("#1A6B47", "#E6F4EC", "#1A6B47"),

  /** Biru Laut */
  modern: light("#185FA5", "#EBF3FA", "#185FA5", "#185FA5", "#B4D1EB", "#EBF3FA"),

  /** Ungu Royal */
  royal: light("#534AB7", "#F0EFFF", "#534AB7", "#534AB7", "#C8C4F5", "#F0EFFF"),

  /** Amber Hangat */
  sunset: light("#BA7517", "#FFF8ED", "#BA7517", "#BA7517", "#F5DFBA", "#FFF8ED"),

  /** Merah Bold */
  bold: light("#A32D2D", "#FDECEC", "#A32D2D", "#A32D2D", "#F5BABA", "#FDECEC"),

  /** Abu Netral */
  neutral: light("#5F5E5A", "#F2F2F1", "#5F5E5A", "#5F5E5A", "#D0D0CE", "#F2F2F1"),

  /** Teal Segar */
  teal: light("#0E7C7B", "#E5F5F5", "#0E7C7B", "#0E7C7B", "#A8DCDC", "#E5F5F5"),

  /** Mawar */
  rose: light("#C2185B", "#FDEEF5", "#C2185B", "#C2185B", "#F0B3CF", "#FDEEF5"),

  /** Indigo */
  indigo: light("#3949AB", "#EEF0FF", "#3949AB", "#3949AB", "#B8C0F0", "#EEF0FF"),

  /** Jeruk */
  orange: light("#D84315", "#FFF0EC", "#D84315", "#D84315", "#F5C2B0", "#FFF0EC"),
};

// ─────────────────────────────────────────────────────────────────────────────
// DARK THEMES
// ─────────────────────────────────────────────────────────────────────────────
const darkThemes = {
  /** Gelap Hijau */
  dark: dark("#2DB77B", "#1A3A2C", "#8FC7A5", "#1A3A2C", "#8FC7A5", "#2E5E4E"),

  /** Gelap Biru */
  "dark-blue": dark("#4D9FD6", "#152840", "#7EC5F0", "#152840", "#7EC5F0", "#1E4A70"),

  /** Gelap Ungu */
  "dark-royal": dark("#8B81E8", "#22204A", "#C2BEF8", "#22204A", "#C2BEF8", "#3C3880"),

  /** Gelap Amber */
  "dark-sunset": dark("#F0A530", "#3D2E0A", "#F5CC7E", "#3D2E0A", "#F5CC7E", "#7A5C1E"),

  /** Gelap Merah */
  "dark-bold": dark("#E05C5C", "#3A1515", "#F2A0A0", "#3A1515", "#F2A0A0", "#6B2B2B"),

  /** Gelap Abu */
  "dark-neutral": dark("#B0AEA8", "#2A2A28", "#E0DFDA", "#2A2A28", "#E0DFDA", "#5A5A55"),

  /** Abyss — sangat gelap */
  abyss: dark("#5E9BF0", "#0A0E18", "#97BFF7", "#0C1826", "#6AAEF5", "#1A3A66"),

  /** Midnight Teal */
  "dark-teal": dark("#29BBBA", "#0A2222", "#7FD8D7", "#0A2222", "#7FD8D7", "#1A5252"),
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
const colors = {
  ...lightThemes,
  ...darkThemes,
  radius: 8,
};

export type ThemeKey = keyof Omit<typeof colors, "radius">;

export const LIGHT_THEME_KEYS: ThemeKey[] = [
  "classic", "modern", "royal", "sunset", "bold", "neutral",
  "teal", "rose", "indigo", "orange",
];

export const DARK_THEME_KEYS: ThemeKey[] = [
  "dark", "dark-blue", "dark-royal", "dark-sunset",
  "dark-bold", "dark-neutral", "abyss", "dark-teal",
];

export default colors;
