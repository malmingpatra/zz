import React from "react";
import { Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * Render ikon untuk item Bantuan secara konsisten.
 * Mendukung format baru (lib: "mci") dan legacy (fa, lucide, dll).
 * Semua nama ikon dimapping ke MaterialCommunityIcons.
 */

// Nama-nama ini sudah diverifikasi valid di MaterialCommunityIcons v7+
// CATATAN: Ikon brand (telegram, tiktok, snapchat, dll) dihapus dari MDI v6+
// Gunakan alternatif yang visual mirip
const ICON_MAP: Record<string, string> = {
  // Social media — pakai alternatif untuk yang sudah dihapus dari MDI v6+
  "whatsapp": "whatsapp",                    // ✅ masih ada
  "facebook": "facebook",                    // ✅ masih ada
  "facebook-messenger": "message-processing",// ❌ dihapus → alternatif
  "twitter": "twitter",                      // ✅ masih ada
  "x-twitter": "alpha-x-circle-outline",    // ❌ tidak ada → alternatif
  "instagram": "instagram",                  // ✅ masih ada
  "youtube": "youtube",                      // ✅ masih ada
  "tiktok": "music-note-outline",            // ❌ tidak ada → alternatif
  "telegram": "send-circle-outline",         // ❌ dihapus MDI v6 → alternatif (logo mirip)
  "snapchat": "ghost-outline",               // ❌ tidak ada → alternatif (ghost = snapchat)
  "pinterest": "pinterest",                  // ✅ masih ada
  "reddit": "reddit",                        // ✅ masih ada
  "discord": "discord",                      // ✅ masih ada
  "slack": "slack",                          // ✅ masih ada
  "spotify": "spotify",                      // ✅ masih ada
  "github": "github",                        // ✅ masih ada
  "linkedin": "linkedin",                    // ✅ masih ada
  // Communication — verified valid
  "phone": "phone-outline",
  "phone-outline": "phone-outline",
  "email": "email-outline",
  "email-outline": "email-outline",
  "mail": "email-outline",
  "chat": "chat-outline",
  "chat-outline": "chat-outline",
  "message-circle": "message-outline",
  "message-outline": "message-outline",
  "headset": "headset",
  // Info / UI — verified valid
  "web": "web",
  "globe": "web",
  "map-marker": "map-marker-outline",
  "map-marker-outline": "map-marker-outline",
  "map-pin": "map-marker-outline",
  "location": "map-marker-outline",
  "help-circle": "help-circle-outline",
  "help-circle-outline": "help-circle-outline",
  "question": "help-circle-outline",
  "information": "information-outline",
  "information-outline": "information-outline",
  "info": "information-outline",
  "shield": "shield-check-outline",
  "shield-check-outline": "shield-check-outline",
  "book-open": "book-open-page-variant-outline",
  "book-open-outline": "book-open-page-variant-outline",
  "alert-circle": "alert-circle-outline",
  "alert-circle-outline": "alert-circle-outline",
  "store": "store-outline",
  "store-outline": "store-outline",
  "shopping": "shopping-outline",
  "shopping-outline": "shopping-outline",
  "circle": "circle-outline",
  "circle-outline": "circle-outline",
  // send-circle untuk backward compat data lama
  "send": "send-circle-outline",
  "send-circle-outline": "send-circle-outline",
};

// Emoji fallback jika nama MCI tidak valid
const EMOJI_FALLBACK: Record<string, string> = {
  "telegram": "✈️",
  "tiktok": "🎵",
  "snapchat": "👻",
  "facebook-messenger": "💬",
};

export function resolveIconName(iconName: string): string {
  let name = (iconName || "").trim().toLowerCase();
  // Strip prefix FontAwesome lama
  name = name.replace(/^fa-brands\s+fa-/, "");
  name = name.replace(/^fab\s+fa-/, "");
  name = name.replace(/^fa-solid\s+fa-/, "");
  name = name.replace(/^fas\s+fa-/, "");
  name = name.replace(/^fa-/, "");
  // Ambil kata terakhir jika masih ada spasi
  if (name.includes(" ")) {
    name = name.split(" ").pop() || name;
  }
  return ICON_MAP[name] || name || "help-circle-outline";
}

// Cek apakah nama ikon valid di MCI (ada di glyphMap)
function isValidMCIIcon(name: string): boolean {
  try {
    const glyphMap = (MaterialCommunityIcons as any).glyphMap;
    return glyphMap ? name in glyphMap : true; // Kalau glyphMap tidak ada, anggap valid
  } catch {
    return true;
  }
}

interface BantuanIconProps {
  iconName: string;
  color: string;
  size?: number;
  lib?: string;
}

export function BantuanIcon({ iconName, color, size = 20 }: BantuanIconProps) {
  const resolved = resolveIconName(iconName);
  const isValid = isValidMCIIcon(resolved);

  // Cek apakah ada emoji fallback untuk nama asli
  const cleanName = (iconName || "").trim().toLowerCase().replace(/^fa-/, "");
  const emoji = EMOJI_FALLBACK[cleanName] || EMOJI_FALLBACK[resolved];

  if (!isValid && emoji) {
    // Render emoji sebagai fallback
    return (
      <Text style={{ fontSize: size * 0.9, lineHeight: size * 1.1, textAlign: "center" }}>
        {emoji}
      </Text>
    );
  }

  return (
    <MaterialCommunityIcons
      name={resolved as any}
      size={size}
      color={color}
    />
  );
}
// sync-trigger
