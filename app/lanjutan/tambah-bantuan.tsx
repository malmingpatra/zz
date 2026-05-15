import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../_hooks/useColors";
import { useDatabase } from "../_context/DatabaseContext";
import { useAutoCloseDialog, DialogOverlay } from "../_components/DialogOverlay";
import { ArrowLeft, ChevronRight, Tag, Link as LinkIcon, Plus, Search as SearchIcon, ChevronDown } from "lucide-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Basic color choices
const COLOR_PAIRS = [
  { bg: "#e6f1fb", ic: "#0c447c" },
  { bg: "#eaf3de", ic: "#1a6640" },
  { bg: "#faeeda", ic: "#854f0b" },
  { bg: "#fce8e8", ic: "#791f1f" },
  { bg: "#f5f0ff", ic: "#5b21b6" },
  { bg: "#e8f5f5", ic: "#0e7490" },
  { bg: "#fff3cd", ic: "#854d0e" },
  { bg: "#f0f0f0", ic: "#444444" },
  { bg: "#ffe0f0", ic: "#9d174d" },
  { bg: "#e0fff4", ic: "#065f46" },
];

// Daftar ikon populer MaterialCommunityIcons untuk dipilih
const POPULAR_ICONS = [
  { name: "whatsapp", label: "WhatsApp" },
  { name: "instagram", label: "Instagram" },
  { name: "facebook", label: "Facebook" },
  { name: "telegram", label: "Telegram" },
  { name: "twitter", label: "Twitter/X" },
  { name: "youtube", label: "YouTube" },
  { name: "tiktok", label: "TikTok" },
  { name: "email-outline", label: "Email" },
  { name: "phone-outline", label: "Telepon" },
  { name: "web", label: "Website" },
  { name: "map-marker-outline", label: "Lokasi" },
  { name: "chat-outline", label: "Chat" },
  { name: "headset", label: "CS" },
  { name: "help-circle-outline", label: "FAQ" },
  { name: "information-outline", label: "Info" },
  { name: "shield-check-outline", label: "Privasi" },
  { name: "book-open-outline", label: "Panduan" },
  { name: "alert-circle-outline", label: "Laporan" },
  { name: "store-outline", label: "Toko" },
  { name: "shopping-outline", label: "Belanja" },
  { name: "github", label: "GitHub" },
  { name: "linkedin", label: "LinkedIn" },
  { name: "discord", label: "Discord" },
  { name: "slack", label: "Slack" },
];

export default function TambahBantuan() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { addBantuan, updateBantuan, bantuan } = useDatabase();
  const { dialogContext, setDialogContext } = useAutoCloseDialog();

  const existingBantuan = useMemo(() => {
    return id ? bantuan.find(b => b.id === id) : null;
  }, [id, bantuan]);

  const [nama, setNama] = useState(existingBantuan?.name || "");
  const [link, setLink] = useState(existingBantuan?.link || "");
  const [iconName, setIconName] = useState(existingBantuan?.icon || "whatsapp");
  const [iconSearch, setIconSearch] = useState("");
  
  const initialColor = useMemo(() => {
    if (!existingBantuan) return COLOR_PAIRS[0];
    return COLOR_PAIRS.find(c => c.bg === existingBantuan.bg && c.ic === existingBantuan.color) || COLOR_PAIRS[0];
  }, [existingBantuan]);
  
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [customBg, setCustomBg] = useState(existingBantuan?.bg || "#f0f0f0");
  const [customIc, setCustomIc] = useState(existingBantuan?.color || "#444444");
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickingType, setPickingType] = useState<"bg" | "ic">("bg");

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return POPULAR_ICONS;
    return POPULAR_ICONS.filter(i => 
      i.name.includes(iconSearch.toLowerCase()) || 
      i.label.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);

  const currentBg = isCustomColor ? customBg : selectedColor.bg;
  const currentIc = isCustomColor ? customIc : selectedColor.ic;

  const handleAdd = async () => {
    if (!nama.trim()) return setDialogContext({ title: "Error", message: "Nama harus diisi" });
    if (!link.trim()) return setDialogContext({ title: "Error", message: "Link harus diisi" });
    if (!iconName.trim()) return setDialogContext({ title: "Error", message: "Pilih ikon terlebih dahulu" });
    
    const payload = {
      icon: iconName,
      name: nama.trim(),
      bg: currentBg,
      color: currentIc,
      link: link.trim(),
      lib: "mci" as any,
    };

    if (existingBantuan) {
      await updateBantuan({ ...existingBantuan, ...payload });
      setDialogContext({ 
        title: "Berhasil", 
        message: `"${nama}" telah diperbarui`,
        onConfirm: () => router.back(),
        onCancel: () => router.back()
      });
    } else {
      await addBantuan({
        id: "bant-" + Date.now().toString(),
        ...payload,
      });
      setDialogContext({ 
        title: "Berhasil", 
        message: `"${nama}" telah ditambahkan ke pusat bantuan`,
        onConfirm: () => router.back(),
        onCancel: () => router.back()
      });
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { 
      height: 56, 
      flexDirection: "row", 
      alignItems: "center", 
      paddingHorizontal: 16, 
      backgroundColor: colors.card,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    backBtn: { 
      width: 36, height: 36, borderRadius: 10, 
      backgroundColor: colors.secondary, 
      alignItems: "center", justifyContent: "center", 
      marginRight: 12 
    },
    headerTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground },
    scrollContent: { padding: 12, paddingBottom: 100 },
    previewCard: { 
      backgroundColor: colors.card, borderRadius: 14, 
      borderWidth: 0.5, borderColor: colors.border, 
      padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10 
    },
    prevIconWrap: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    prevInfo: { flex: 1, paddingHorizontal: 12 },
    prevName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2 },
    prevLink: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    fieldGroup: { 
      backgroundColor: colors.card, borderRadius: 14, 
      borderWidth: 0.5, borderColor: colors.border, 
      overflow: "hidden", marginBottom: 10 
    },
    fieldRow: { 
      flexDirection: "row", alignItems: "center", 
      paddingHorizontal: 14, borderBottomWidth: 0.5, 
      borderBottomColor: colors.secondary, minHeight: 52 
    },
    fieldInner: { flex: 1, paddingVertical: 8, paddingHorizontal: 10 },
    fieldLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginBottom: 2 },
    input: { 
      fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground, padding: 0,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0, outlineColor: 'transparent' } as object) : {}),
    },
    iconSection: { 
      backgroundColor: colors.card, borderRadius: 14, 
      borderWidth: 0.5, borderColor: colors.border, 
      overflow: "hidden", marginBottom: 10 
    },
    iconSecHead: { padding: 13, paddingBottom: 8 },
    secLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8 },
    iconSearchRow: { 
      flexDirection: "row", alignItems: "center", gap: 8, 
      backgroundColor: colors.secondary, borderRadius: 9, 
      paddingHorizontal: 10, height: 38,
      marginHorizontal: 13, marginBottom: 10,
    },
    searchInput: { 
      flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0, outlineColor: 'transparent' } as object) : {}),
    },
    iconGridWrap: { paddingHorizontal: 13, paddingBottom: 13 },
    iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    iconOpt: { 
      width: 52, height: 52, borderRadius: 12, 
      borderWidth: 1.5, borderColor: colors.border, 
      backgroundColor: colors.card, 
      alignItems: "center", justifyContent: "center",
    },
    iconOptSelected: { borderColor: colors.primary, backgroundColor: colors.accent },
    iconOptLabel: { fontSize: 8, color: colors.mutedForeground, marginTop: 2, textAlign: "center" },
    iconOptBox: { alignItems: "center", width: 60 },
    // Ketik manual
    manualRow: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 13, paddingBottom: 13,
    },
    manualInput: {
      flex: 1, height: 40, backgroundColor: colors.secondary,
      borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, fontSize: 13, fontFamily: "Inter_400Regular",
      color: colors.foreground,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0, outlineColor: 'transparent' } as object) : {}),
    },
    manualHint: { fontSize: 10, color: colors.mutedForeground, fontStyle: "italic", paddingHorizontal: 13, paddingBottom: 10 },
    colorSection: { 
      backgroundColor: colors.card, borderRadius: 14, 
      borderWidth: 0.5, borderColor: colors.border, 
      padding: 14, marginBottom: 10 
    },
    colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    colorOpt: { 
      width: 34, height: 34, borderRadius: 10, 
      alignItems: "center", justifyContent: "center", 
      borderWidth: 2, borderColor: "transparent" 
    },
    colorOptSelected: { borderColor: colors.foreground },
    checkMark: { fontSize: 14, fontWeight: "700", color: "rgba(0,0,0,0.4)" },
    bottomActions: { 
      position: "absolute", bottom: 0, left: 0, right: 0,
      padding: 12, backgroundColor: colors.background, 
      flexDirection: "row", gap: 8,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    btnCancel: { 
      flex: 1, height: 48, backgroundColor: colors.card, 
      borderRadius: 12, borderWidth: 0.5, borderColor: colors.border, 
      alignItems: "center", justifyContent: "center" 
    },
    btnCancelText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    btnAdd: { 
      flex: 1.6, height: 48, backgroundColor: colors.primary, 
      borderRadius: 12, alignItems: "center", justifyContent: "center", 
      flexDirection: "row", gap: 8 
    },
    btnAddText: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primaryForeground }
  });

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#444" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{existingBantuan ? "Edit Pusat Bantuan" : "Tambah Pusat Bantuan"}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* PREVIEW */}
        <View style={s.previewCard}>
          <View style={[s.prevIconWrap, { backgroundColor: currentBg }]}>
            <MaterialCommunityIcons 
              name={iconName as any || "help-circle-outline"} 
              size={22} 
              color={currentIc} 
            />
          </View>
          <View style={s.prevInfo}>
            <Text style={s.prevName} numberOfLines={1}>{nama || "Nama item..."}</Text>
            <Text style={s.prevLink} numberOfLines={1}>{link || "https://..."}</Text>
          </View>
          <ChevronRight size={16} color="#ccc" />
        </View>

        {/* FIELDS */}
        <View style={s.fieldGroup}>
          <View style={s.fieldRow}>
            <Tag size={17} color="#BBB" />
            <View style={s.fieldInner}>
              <Text style={s.fieldLabel}>Nama</Text>
              <TextInput 
                style={s.input} 
                value={nama} 
                onChangeText={setNama} 
                placeholder="cth. Hubungi Kami" 
                placeholderTextColor="#CCC"
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
          <View style={[s.fieldRow, { borderBottomWidth: 0 }]}>
            <LinkIcon size={17} color="#BBB" />
            <View style={s.fieldInner}>
              <Text style={s.fieldLabel}>Link / URL</Text>
              <TextInput 
                style={s.input} 
                value={link} 
                onChangeText={setLink} 
                placeholder="https://wa.me/628xxx" 
                placeholderTextColor="#CCC"
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
        </View>

        {/* ICON PICKER */}
        <View style={s.iconSection}>
          <View style={s.iconSecHead}>
            <Text style={s.secLabel}>Pilih Ikon</Text>
          </View>

          {/* Search ikon */}
          <View style={s.iconSearchRow}>
            <SearchIcon size={15} color="#BBB" />
            <TextInput 
              style={s.searchInput}
              value={iconSearch} 
              onChangeText={setIconSearch} 
              placeholder="Cari ikon... (whatsapp, email, dll)"
              placeholderTextColor="#BBB"
              autoCapitalize="none"
              underlineColorAndroid="transparent"
            />
          </View>

          {/* Grid ikon populer */}
          <View style={s.iconGridWrap}>
            <View style={s.iconGrid}>
              {filteredIcons.map((ic) => (
                <TouchableOpacity
                  key={ic.name}
                  style={s.iconOptBox}
                  onPress={() => setIconName(ic.name)}
                  activeOpacity={0.7}
                >
                  <View style={[s.iconOpt, iconName === ic.name && s.iconOptSelected]}>
                    <MaterialCommunityIcons 
                      name={ic.name as any} 
                      size={22} 
                      color={iconName === ic.name ? colors.primary : colors.mutedForeground} 
                    />
                  </View>
                  <Text style={[s.iconOptLabel, iconName === ic.name && { color: colors.primary, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                    {ic.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Input nama ikon manual */}
          <Text style={s.manualHint}>
            Atau ketik nama ikon MaterialCommunityIcons secara manual:
          </Text>
          <View style={s.manualRow}>
            <TextInput
              style={s.manualInput}
              value={iconName}
              onChangeText={setIconName}
              placeholder="cth. whatsapp, email-outline, phone"
              placeholderTextColor="#BBB"
              autoCapitalize="none"
              underlineColorAndroid="transparent"
            />
          </View>
        </View>

        {/* COLOR PICKER */}
        <View style={s.colorSection}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={s.secLabel}>Pilih Warna</Text>
            <TouchableOpacity onPress={() => setIsCustomColor(!isCustomColor)}>
              <Text style={{ fontSize: 11, color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                {isCustomColor ? "Gunakan Preset" : "Warna Custom (HEX)"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {!isCustomColor ? (
            <View style={s.colorGrid}>
              {COLOR_PAIRS.map((p, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[s.colorOpt, selectedColor.bg === p.bg && s.colorOptSelected, { backgroundColor: p.bg }]}
                  onPress={() => setSelectedColor(p)}
                  activeOpacity={0.8}
                >
                  {selectedColor.bg === p.bg && <Text style={s.checkMark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity 
                  style={{ flex: 1 }} 
                  onPress={() => { setPickingType("bg"); setShowColorPicker(true); }}
                >
                  <Text style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>BG Color</Text>
                  <View style={{ height: 40, backgroundColor: colors.secondary, borderRadius: 8, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 8 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: customBg, borderWidth: 0.5, borderColor: colors.border }} />
                    <Text style={{ flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "Inter_500Medium" }}>{customBg}</Text>
                    <ChevronDown size={14} color="#888" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1 }} 
                  onPress={() => { setPickingType("ic"); setShowColorPicker(true); }}
                >
                  <Text style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Icon Color</Text>
                  <View style={{ height: 40, backgroundColor: colors.secondary, borderRadius: 8, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 8 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: customIc, borderWidth: 0.5, borderColor: colors.border }} />
                    <Text style={{ flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "Inter_500Medium" }}>{customIc}</Text>
                    <ChevronDown size={14} color="#888" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* COLOR PICKER POPUP */}
      {showColorPicker && (
        <View style={{ 
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", zIndex: 2000,
          padding: 20 
        }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 20, width: "100%", maxWidth: 340, padding: 20 }}>
            <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 15 }}>
              Pilih Warna {pickingType === "bg" ? "Background" : "Ikon"}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {[
                "#000000", "#ffffff", "#ff4444", "#ffbb33", "#00C851", "#33b5e5", 
                "#2BBBAD", "#4285F4", "#aa66cc", "#2e2e2e", "#f0f0f0", "#d32f2f",
                "#C2185B", "#7B1FA2", "#512DA8", "#303F9F", "#1976D2", "#0288D1",
                "#0097A7", "#00796B", "#388E3C", "#689F38", "#AFB42B", "#FBC02D",
                "#FFA000", "#F57C00", "#E64A19", "#5D4037", "#616161", "#455A64"
              ].map(c => (
                <TouchableOpacity 
                  key={c} 
                  onPress={() => {
                    if (pickingType === "bg") setCustomBg(c);
                    else setCustomIc(c);
                    setShowColorPicker(false);
                  }}
                  style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: c, borderWidth: 1, borderColor: colors.border }} 
                />
              ))}
            </View>
            
            <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Input Kode HEX</Text>
            <View style={{ height: 45, backgroundColor: colors.secondary, borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 20 }}>
              <Text style={{ color: "#888", fontSize: 14 }}>#</Text>
              <TextInput 
                style={{ flex: 1, paddingLeft: 4, fontSize: 14, color: colors.foreground, fontFamily: "Inter_500Medium", ...(Platform.OS === "web" ? ({ outlineWidth: 0, outlineColor: 'transparent' } as object) : {}) }} 
                value={(pickingType === "bg" ? customBg : customIc).replace("#", "")}
                onChangeText={(v) => {
                  const hex = "#" + v.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                  if (pickingType === "bg") setCustomBg(hex);
                  else setCustomIc(hex);
                }}
                maxLength={6}
                underlineColorAndroid="transparent"
              />
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: colors.primary, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              onPress={() => setShowColorPicker(false)}
            >
              <Text style={{ color: "#FFF", fontFamily: "Inter_700Bold" }}>Oke</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* BOTTOM ACTIONS */}
      <View style={[s.bottomActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={s.btnCancel} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.btnCancelText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnAdd} onPress={handleAdd} activeOpacity={0.8}>
          {!existingBantuan && <Plus size={18} color="#fff" />}
          <Text style={s.btnAddText}>{existingBantuan ? "Simpan Perubahan" : "Tambah"}</Text>
        </TouchableOpacity>
      </View>
      <DialogOverlay context={dialogContext} onClose={() => setDialogContext(null)} />
    </View>
  );
}
// sync-trigger
