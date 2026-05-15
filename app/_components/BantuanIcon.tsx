import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * Render ikon untuk item Bantuan secara konsisten.
 * Mendukung format baru (lib: "mci") dan legacy (fa, lucide, dll).
 * Semua nama ikon dimapping ke MaterialCommunityIcons.
 */

const ICON_MAP: Record<string, string> = {
  // Social media
  "whatsapp": "whatsapp",
  "facebook": "facebook",
  "facebook-messenger": "facebook-messenger",
  "twitter": "twitter",
  "x-twitter": "twitter",
  "instagram": "instagram",
  "youtube": "youtube",
  "tiktok": "music-note",
  "telegram": "telegram",
  "snapchat": "snapchat",
  "pinterest": "pinterest",
  "reddit": "reddit",
  "discord": "discord",
  "slack": "slack",
  "spotify": "spotify",
  "github": "github",
  "linkedin": "linkedin",
  // Communication
  "phone": "phone-outline",
  "phone-outline": "phone-outline",
  "email": "email-outline",
  "email-outline": "email-outline",
  "mail": "email-outline",
  "chat": "chat-outline",
  "chat-outline": "chat-outline",
  "message-circle": "chat-outline",
  "headset": "headset",
  // Info / UI
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
  "book-open": "book-open-outline",
  "book-open-outline": "book-open-outline",
  "alert-circle": "alert-circle-outline",
  "alert-circle-outline": "alert-circle-outline",
  "store": "store-outline",
  "store-outline": "store-outline",
  "shopping": "shopping-outline",
  "shopping-outline": "shopping-outline",
  "circle": "circle-outline",
  "circle-outline": "circle-outline",
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

interface BantuanIconProps {
  iconName: string;
  color: string;
  size?: number;
  lib?: string;
}

export function BantuanIcon({ iconName, color, size = 20 }: BantuanIconProps) {
  return (
    <MaterialCommunityIcons
      name={resolveIconName(iconName) as any}
      size={size}
      color={color}
    />
  );
}
// sync-trigger
