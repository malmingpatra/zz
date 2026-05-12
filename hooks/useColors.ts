import colors, { ThemeKey, LIGHT_THEME_KEYS } from "../constants/colors";
import { DatabaseContext } from "../context/DatabaseContext";
import { useContext } from "react";

/**
 * Returns the design tokens for the current color scheme.
 * Falls back to "classic" (light) when the stored key is unknown.
 */
export function useColors() {
  const ctx = useContext(DatabaseContext);
  const userProfile = ctx?.userProfile;
  const themeKey = (userProfile?.theme || "classic") as ThemeKey;

  // Fallback if themeKey doesn't exist in colors
  const palette = colors[themeKey] ?? colors.classic;

  return {
    ...(palette as any),
    radius: colors.radius,
  };
}

/**
 * Returns true when the active theme is a dark variant.
 */
export function useIsDarkTheme(): boolean {
  const ctx = useContext(DatabaseContext);
  const userProfile = ctx?.userProfile;
  const themeKey = (userProfile?.theme || "classic") as ThemeKey;
  return !LIGHT_THEME_KEYS.includes(themeKey);
}
