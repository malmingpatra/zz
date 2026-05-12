import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Platform,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDatabase } from "@/context/DatabaseContext";
import * as LucideIcons from "lucide-react-native";
import { ArrowLeft, ChevronRight, Tag, Link as LinkIcon, Plus, Search as SearchIcon, Smartphone } from "lucide-react-native";
import { FontAwesome5 } from "@expo/vector-icons";

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

export default function TambahBantuan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addBantuan } = useDatabase();
  
  const [nama, setNama] = useState("");
  const [link, setLink] = useState("");
  const [activeLib, setActiveLib] = useState<"lucide" | "fa">("lucide");
  const [iconName, setIconName] = useState("HelpCircle");
  const [selectedColor, setSelectedColor] = useState(COLOR_PAIRS[0]);

  const IconPreview = useMemo(() => {
    if (activeLib === "lucide") {
      // @ts-ignore
      const LucideIcon = LucideIcons[iconName] || LucideIcons.HelpCircle;
      return <LucideIcon size={22} color={selectedColor.ic} />;
    } else {
      return <FontAwesome5 name={iconName.toLowerCase()} size={20} color={selectedColor.ic} />;
    }
  }, [activeLib, iconName, selectedColor.ic]);

  const handleAdd = async () => {
    if (!nama.trim()) return Alert.alert("Error", "Nama harus diisi");
    if (!link.trim()) return Alert.alert("Error", "Link harus diisi");
    if (!iconName.trim()) return Alert.alert("Error", "Nama ikon harus diisi");
    
    await addBantuan({
      id: "bant-" + Date.now().toString(),
      icon: iconName,
      name: nama.trim(),
      bg: selectedColor.bg,
      color: selectedColor.ic,
      link: link.trim(),
    });
    
    Alert.alert("Berhasil", `"${nama}" telah ditambahkan ke pusat bantuan`);
    router.back();
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#444" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tambah Pusat Bantuan</Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PREVIEW */}
        <View style={s.previewCard}>
          <View style={[s.prevIconWrap, { backgroundColor: selectedColor.bg }]}>
            {IconPreview}
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
              />
            </View>
          </View>
          <View style={s.fieldRow}>
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
              />
            </View>
          </View>
        </View>

        {/* ICON INPUT */}
        <View style={s.iconSection}>
          <View style={s.iconSecHead}>
            <Text style={s.secLabel}>Ikon Custom</Text>
            <View style={s.libTabs}>
              <TouchableOpacity 
                style={[s.libTab, activeLib === "lucide" && s.libTabActive]} 
                onPress={() => setActiveLib("lucide")}
              >
                <Smartphone size={13} color={activeLib === "lucide" ? "#FFF" : "#666"} />
                <Text style={[s.libTabText, activeLib === "lucide" && s.libTabTextActive]}>Lucide Icons</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.libTab, activeLib === "fa" && s.libTabActive]} 
                onPress={() => setActiveLib("fa")}
              >
                <FontAwesome5 name="font-awesome" size={12} color={activeLib === "fa" ? "#FFF" : "#666"} />
                <Text style={[s.libTabText, activeLib === "fa" && s.libTabTextActive]}>Font Awesome</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ padding: 14 }}>
            <View style={s.iconSearchRow}>
              <SearchIcon size={15} color="#BBB" />
              <TextInput 
                style={s.searchInput} 
                value={iconName} 
                onChangeText={setIconName} 
                placeholder={activeLib === "lucide" ? "cth. Phone, HelpCircle" : "cth. whatsapp, facebook"} 
                placeholderTextColor="#BBB"
                autoCapitalize="none"
              />
            </View>
            <Text style={{ fontSize: 11, color: "#888", marginTop: 8, fontStyle: "italic" }}>
              {activeLib === "lucide" 
                ? "Ketik nama ikon Lucide (Case Sensitive, cth: HelpCircle)" 
                : "Ketik nama ikon FontAwesome (Lowercase, cth: whatsapp)"}
            </Text>
          </View>
        </View>

        {/* COLOR PICKER */}
        <View style={s.colorSection}>
          <Text style={[s.secLabel, { marginBottom: 10 }]}>Warna Latar Ikon</Text>
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
        </View>
      </ScrollView>

      {/* BOTTOM ACTIONS */}
      <View style={[s.bottomActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={s.btnCancel} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.btnCancelText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnAdd} onPress={handleAdd} activeOpacity={0.8}>
          <Plus size={18} color="#fff" />
          <Text style={s.btnAddText}>Tambah</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2EE" },
  header: { 
    height: 56, 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  backBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: "#f5f5f5", 
    alignItems: "center", 
    justifyContent: "center", 
    marginRight: 12 
  },
  headerTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1a1a1a" },
  scrollContent: { padding: 12 },
  previewCard: { 
    backgroundColor: "#fff", 
    borderRadius: 14, 
    borderWidth: 0.5, 
    borderColor: "#ddd", 
    padding: 14, 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 10 
  },
  prevIconWrap: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  prevInfo: { flex: 1, paddingHorizontal: 12 },
  prevName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1a1a1a", marginBottom: 2 },
  prevLink: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#aaa" },
  fieldGroup: { 
    backgroundColor: "#fff", 
    borderRadius: 14, 
    borderWidth: 0.5, 
    borderColor: "#ddd", 
    overflow: "hidden", 
    marginBottom: 10 
  },
  fieldRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: "#f5f5f5", minHeight: 52 },
  fieldInner: { flex: 1, paddingVertical: 8, paddingHorizontal: 10 },
  fieldLabel: { fontSize: 11, color: "#aaa", fontFamily: "Inter_500Medium", marginBottom: 2 },
  input: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#1a1a1a", padding: 0 },
  iconSection: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 0.5, borderColor: "#ddd", overflow: "hidden", marginBottom: 10 },
  iconSecHead: { padding: 13, paddingBottom: 0 },
  secLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8 },
  libTabs: { flexDirection: "row", gap: 6, marginVertical: 10 },
  libTab: { flex: 1, height: 34, borderRadius: 8, borderWidth: 0.5, borderColor: "#ddd", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  libTabActive: { backgroundColor: "#1A6640", borderColor: "#1A6640" },
  libTabText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#666" },
  libTabTextActive: { color: "#fff" },
  iconSearchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f5f5f5", borderRadius: 9, paddingHorizontal: 10, height: 38 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#1a1a1a" },
  iconGridWrap: { padding: 14 },
  iconCount: { fontSize: 10, color: "#ccc", marginBottom: 6 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  iconOpt: { width: 44, height: 44, borderRadius: 9, borderWidth: 0.5, borderColor: "#eee", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  iconOptSelected: { borderColor: "#1A6640", backgroundColor: "#EAF3DE" },
  colorSection: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 0.5, borderColor: "#ddd", padding: 14, marginBottom: 10 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  colorOpt: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  colorOptSelected: { borderColor: "#1a1a1a" },
  checkMark: { fontSize: 14, fontWeight: "700", color: "rgba(0,0,0,0.4)" },
  bottomActions: { padding: 12, backgroundColor: "#F0F2EE", flexDirection: "row", gap: 8 },
  btnCancel: { flex: 1, height: 48, backgroundColor: "#fff", borderRadius: 12, borderWidth: 0.5, borderColor: "#ddd", alignItems: "center", justifyContent: "center" },
  btnCancelText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#888" },
  btnAdd: { flex: 1.6, height: 48, backgroundColor: "#1a6640", borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  btnAddText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" }
});
