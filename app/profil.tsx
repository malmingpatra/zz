import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
  Modal
} from "react-native";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { auth, db } from "@/context/firebase-setup";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useDatabase } from "@/context/DatabaseContext";
import { useAutoCloseDialog, DialogOverlay } from "@/components/DialogOverlay";
import * as LucideIcons from "lucide-react-native";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ConfirmationModal from "@/components/ConfirmationModal";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Save, 
  LogOut, 
  ShoppingBag, 
  List, 
  CheckCircle, 
  Droplet, 
  MessageCircle, 
  BookOpen, 
  HelpCircle, 
  AlertCircle, 
  Shield, 
  ChevronRight,
  Search,
  Filter,
  X,
  XCircle,
  Printer,
  Truck
} from "lucide-react-native";

type Tab = "profil" | "pesanan" | "tema" | "bantuan";

const LIGHT_THEMES = [
  { id: "classic",  color: "#1A6B47", name: "Hijau Toko",   sub: "Default"     },
  { id: "modern",   color: "#185FA5", name: "Biru Laut",    sub: "Tenang"      },
  { id: "royal",    color: "#534AB7", name: "Ungu Royal",   sub: "Elegan"      },
  { id: "sunset",   color: "#BA7517", name: "Amber Hangat", sub: "Cerah"       },
  { id: "bold",     color: "#A32D2D", name: "Merah Bold",   sub: "Berani"      },
  { id: "neutral",  color: "#5F5E5A", name: "Abu Netral",   sub: "Minimalis"   },
  { id: "teal",     color: "#0E7C7B", name: "Teal Segar",   sub: "Sejuk"       },
  { id: "rose",     color: "#C2185B", name: "Mawar",        sub: "Feminin"     },
  { id: "indigo",   color: "#3949AB", name: "Indigo",       sub: "Profesional" },
  { id: "orange",   color: "#D84315", name: "Jeruk",        sub: "Energik"     },
];

const DARK_THEMES = [
  { id: "dark",         color: "#2DB77B", name: "Gelap Hijau",  sub: "Natural"    },
  { id: "dark-blue",    color: "#4D9FD6", name: "Gelap Biru",   sub: "Oceanic"    },
  { id: "dark-royal",   color: "#8B81E8", name: "Gelap Ungu",   sub: "Mystik"     },
  { id: "dark-sunset",  color: "#F0A530", name: "Gelap Amber",  sub: "Hangat"     },
  { id: "dark-bold",    color: "#E05C5C", name: "Gelap Merah",  sub: "Intens"     },
  { id: "dark-neutral", color: "#B0AEA8", name: "Gelap Abu",    sub: "Netral"     },
  { id: "abyss",        color: "#5E9BF0", name: "Abyss",        sub: "Ultra Gelap"},
  { id: "dark-teal",    color: "#29BBBA", name: "Gelap Teal",   sub: "Dalam"      },
];

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function ProfilScreen() {
  const colors = useColors();

  const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
    menunggu:   { bg: colors.stokWarnBg, text: colors.stokWarnText, label: "Menunggu" },
    diproses:   { bg: colors.secondary, text: colors.foreground, label: "Diproses" },
    dikirim:    { bg: colors.secondary, text: colors.foreground, label: "Dikirim" },
    selesai:    { bg: colors.stokOkBg, text: colors.stokOkText, label: "Selesai" },
    dibatalkan: { bg: colors.destructive + "15", text: colors.destructive, label: "Dibatalkan" },
  };

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { dialogContext, setDialogContext } = useAutoCloseDialog();
  const { orders, members, bantuan, userProfile, updateOrderStatus } = useDatabase();

  const [tab, setTab] = useState<Tab>("profil");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [alamat, setAlamat] = useState("");
  
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [loading, setLoading] = useState(false);

  // Pesanan state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const ITEMS_PER_PAGE = 10;

  React.useEffect(() => {
    if (userProfile) {
      setNama(userProfile.displayName || "");
      setEmail(userProfile.email || "");
      setHp(userProfile.phoneNumber || "");
      setAlamat(userProfile.address || "");
      setSelectedTheme(userProfile.theme || "classic");
    } else if (auth.currentUser) {
      setNama(auth.currentUser.displayName || "");
      setEmail(auth.currentUser.email || "");
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // Update Firebase Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: nama,
      });

      // Update Firestore User Document
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: nama,
        phoneNumber: hp,
        address: alamat,
      });

      setDialogContext({ title: "Sukses", message: "Profil berhasil diperbarui!" });
    } catch (e: any) {
      console.error("Error updating profile:", e);
      setDialogContext({ title: "Error", message: "Gagal memperbarui profil: " + e.message });
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handleSaveTheme = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        theme: selectedTheme,
      });
      setDialogContext({ title: "Sukses", message: "Tema berhasil diterapkan!" });
    } catch (e) {
      console.error("Error updating theme:", e);
      setDialogContext({ title: "Error", message: "Gagal menerapkan tema" });
    } finally {
      setLoading(false);
    }
  };

  const initials = nama
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const ICON_MAP = {
    user: User,
    mail: Mail,
    phone: Phone,
    "map-pin": MapPin,
    "message-circle": MessageCircle,
    "book-open": BookOpen,
    "help-circle": HelpCircle,
    "alert-circle": AlertCircle,
    shield: Shield,
  };

  const totals = {
    profil: 1,
    pesanan: 1,
    tema: 1,
    bantuan: 1,
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topbar: {
      backgroundColor: colors.primary,
      paddingTop: insets.top + 10,
      paddingBottom: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    topbarTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold", color: colors.primaryForeground },
    topbarBadge: {
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
    },
    topbarBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.primaryForeground },
    avatarArea: {
      backgroundColor: colors.primary,
      paddingBottom: 24,
      alignItems: "center",
      gap: 6,
    },
    avatarCircle: {
      width: 72, height: 72,
      backgroundColor: colors.secondary,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.3)",
    },
    avatarInitials: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.primary },
    avatarName: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.primaryForeground },
    avatarRole: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
    tabsRow: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 11,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabBtnActive: { borderBottomColor: colors.primary },
    tabBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    tabBtnTextActive: { color: colors.primary },
    pane: { flex: 1 },
    paneContent: { padding: 16 },
    secLabel: {
      fontSize: 11, fontFamily: "Inter_700Bold", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10,
    },
    card: {
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border,
      overflow: "hidden", marginBottom: 14,
    },
    fieldRow: {
      padding: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    fieldRowLast: { borderBottomWidth: 0 },
    fieldLabel: {
      fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6,
    },
    fieldWrap: {
      flexDirection: "row", alignItems: "center",
      borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 10, backgroundColor: colors.background,
      paddingHorizontal: 10, height: 40, gap: 8,
    },
    fieldInput: {
      flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground,
      padding: 0,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0 } as object) : {}),
    },
    primaryBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
      backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12,
      marginBottom: 8,
    },
    primaryBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.primaryForeground },
    dangerBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
      backgroundColor: colors.card, borderRadius: 12, paddingVertical: 12,
      borderWidth: 1.5, borderColor: colors.destructive + "40", marginBottom: 8,
    },
    dangerBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.destructive },
    outlineBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
      backgroundColor: "#fff", borderRadius: 12, paddingVertical: 12,
      borderWidth: 1.5, borderColor: colors.primary,
    },
    outlineBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.primary },
    orderItem: {
      flexDirection: "row", alignItems: "center", gap: 10,
      padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    orderItemLast: { borderBottomWidth: 0 },
    orderIcon: {
      width: 36, height: 36, backgroundColor: colors.secondary,
      borderRadius: 10, alignItems: "center", justifyContent: "center",
    },
    orderInfo: { flex: 1, minWidth: 0 },
    orderName: {
      fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground,
    },
    orderDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    orderRight: { alignItems: "flex-end" },
    orderPrice: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primary },
    badgeSelesai: { backgroundColor: "#EEF7F2", color: "#1A6B47" },
    badgeProses:  { backgroundColor: "#FAEEDA", color: "#854F0B" },
    badgeBatal:   { backgroundColor: "#FCEBEB", color: "#A32D2D" },
    badge: {
      fontSize: 10, fontFamily: "Inter_600SemiBold",
      paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 3,
      overflow: "hidden",
    },
    themeGrid: {
      flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8,
    },
    themeSectionLabel: {
      fontSize: 12, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, marginBottom: 8, marginTop: 4,
      textTransform: "uppercase", letterSpacing: 0.5,
    },
    themeCard: {
      width: "47%", flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: colors.card, borderRadius: 12,
      borderWidth: 2, borderColor: colors.border, padding: 12,
    },
    themeCardDark: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    themeCardActive: { borderColor: colors.primary },
    themeDot: { width: 28, height: 28, borderRadius: 14 },
    themeName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    themeSub: { fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    helpItem: {
      flexDirection: "row", alignItems: "center", gap: 12,
      padding: 13, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    helpItemLast: { borderBottomWidth: 0 },
    helpDot: {
      width: 38, height: 38, backgroundColor: colors.secondary,
      borderRadius: 10, alignItems: "center", justifyContent: "center",
    },
    helpInfo: { flex: 1 },
    helpTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    helpDesc: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 1 },
    searchRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    searchWrap: { 
      flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      height: 48, paddingHorizontal: 12
    },
    searchInput: { 
      flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground,
      ...(Platform.OS === "web" ? { outlineWidth: 0 } as any : {})
    },
    filterBtn: {
      width: 48, height: 48, backgroundColor: colors.primary, borderRadius: 12,
      alignItems: "center", justifyContent: "center"
    },
    paginationRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14
    },
    pageBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.secondary },
    pageBtnDisabled: { opacity: 0.5 },
    pageBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    pageText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    modalOverlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center", alignItems: "center", padding: 20
    },
    modalContent: {
      backgroundColor: colors.card, borderRadius: 16, width: "100%", maxWidth: 400,
      maxHeight: "80%", overflow: "hidden"
    },
    modalHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border
    },
    modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground },
    modalBody: { padding: 16 },
    modalScroll: { flexGrow: 0 },
    detailLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginTop: 12, marginBottom: 4 },
    detailValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground },
    detailItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    detailItemName: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, flex: 1 },
    detailItemQty: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, width: 40, textAlign: "center" },
    detailItemPrice: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, width: 80, textAlign: "right" },
    modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border }
  });

  const HELP_ITEMS = [
    { icon: "message-circle" as const, title: "Chat WhatsApp", desc: "Hubungi admin via WhatsApp" },
    { icon: "book-open" as const, title: "Panduan Penggunaan", desc: "Cara pakai fitur aplikasi toko" },
    { icon: "help-circle" as const, title: "FAQ", desc: "Pertanyaan yang sering diajukan" },
    { icon: "alert-circle" as const, title: "Laporkan Masalah", desc: "Temukan bug? Beritahu kami" },
    { icon: "shield" as const, title: "Kebijakan Privasi", desc: "Perlindungan data pengguna" },
  ];

  function badgeStyle(status: string) {
    const meta = STATUS_META[status] || STATUS_META.menunggu;
    return { backgroundColor: meta.bg, color: meta.text };
  }
  function badgeLabel(status: string) {
    const meta = STATUS_META[status] || STATUS_META.menunggu;
    return meta.label;
  }

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const idMatch = o.id.toLowerCase().includes(q);
    const itemMatch = o.items && o.items.some((it: any) => it.name && it.name.toLowerCase().includes(q));
    const dateMatch = filterDate === "" || o.date === filterDate;
    return (idMatch || itemMatch) && dateMatch;
  }).sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    if (timeA !== timeB) return timeB - timeA;
    return b.date.localeCompare(a.date);
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <View style={s.container}>
      {/* Topbar */}
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topbarTitle}>Profil Saya</Text>
        <View style={s.topbarBadge}>
          <Text style={s.topbarBadgeText}>
            {userProfile?.role === "admin" ? "Administrator" : userProfile?.role === "staff" ? "Kasir" : "User"}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {(["profil", "pesanan", "tema", "bantuan"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, tab === t && s.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pane */}
      <ScrollView style={s.pane} contentContainerStyle={s.paneContent} showsVerticalScrollIndicator={false}>
        {tab === "profil" && (
          <>
            <Text style={s.secLabel}>Informasi Pribadi</Text>
            <View style={s.card}>
              {[
                { label: "Nama Lengkap", icon: "user" as const, value: nama, onChange: setNama, kb: "default" as const, locked: false },
                { label: "Email", icon: "mail" as const, value: email, onChange: setEmail, kb: "email-address" as const, locked: true },
                { label: "Nomor HP", icon: "phone" as const, value: hp, onChange: setHp, kb: "phone-pad" as const, locked: false },
                { label: "Alamat", icon: "map-pin" as const, value: alamat, onChange: setAlamat, kb: "default" as const, locked: false },
              ].map((f, i, arr) => (
                <View key={f.label} style={[s.fieldRow, i === arr.length - 1 && s.fieldRowLast]}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <View style={[s.fieldWrap, f.locked && { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    {(() => {
                      const Icon = ICON_MAP[f.icon as keyof typeof ICON_MAP];
                      return <Icon size={14} color={colors.mutedForeground} />;
                    })()}
                    <TextInput
                      style={[s.fieldInput, f.locked && { color: colors.mutedForeground }]}
                      value={f.value}
                      onChangeText={f.onChange}
                      keyboardType={f.kb}
                      autoCapitalize="none"
                      underlineColorAndroid="transparent"
                      editable={!f.locked}
                    />
                    {!f.locked && <Edit2 size={13} color={colors.primary} />}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[s.primaryBtn, loading && { opacity: 0.7 }]} 
              activeOpacity={0.85} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Save size={15} color="#fff" />
                  <Text style={s.primaryBtnText}>Simpan Perubahan</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.dangerBtn} activeOpacity={0.85} onPress={async () => {
              try {
                await signOut(auth);
                router.replace("/login");
              } catch (e) {
                console.error("Logout failed", e);
              }
            }}>
              <LogOut size={15} color="#E24B4A" />
              <Text style={s.dangerBtnText}>Keluar dari Akun</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === "pesanan" && (
          <>
            <Text style={s.secLabel}>Riwayat Transaksi</Text>
            <View style={s.searchRow}>
              <View style={s.searchWrap}>
                <Search size={18} color={colors.mutedForeground} />
                <TextInput 
                  style={s.searchInput}
                  placeholder="Cari ID transaksi atau nama item..."
                  placeholderTextColor={colors.mutedForeground}
                  value={searchQuery}
                  onChangeText={(val) => {
                    setSearchQuery(val);
                    setCurrentPage(1);
                  }}
                />
              </View>
              <TouchableOpacity 
                style={[s.filterBtn, filterDate !== "" && { backgroundColor: "black" }]} 
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    setShowDatePicker(true);
                  } else {
                    if (filterDate) {
                      setFilterDate("");
                      setCurrentPage(1);
                    }
                  }
                }}
              >
                {Platform.OS === 'web' ? (
                  <input 
                    type="date"
                    value={filterDate}
                    onChange={(e: any) => {
                      const val = e.target.value;
                      setFilterDate(val);
                      setCurrentPage(1);
                    }}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      top: 0, left: 0
                    }}
                  />
                ) : null}
                <Filter size={20} color={filterDate ? "#FFF" : "#fff"} />
              </TouchableOpacity>
              {Platform.OS !== 'web' && filterDate !== "" && (
                <TouchableOpacity 
                   style={[s.filterBtn, { backgroundColor: colors.secondary, marginLeft: 8 }]}
                  activeOpacity={0.8}
                  onPress={() => { setFilterDate(""); setCurrentPage(1); }}
                >
                  <X size={20} color={colors.foreground} />
                </TouchableOpacity>
              )}
            </View>
            
            {Platform.OS !== 'web' && showDatePicker && (
              <DateTimePicker
                value={filterDate ? new Date(filterDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant={colors.isDark ? 'dark' : 'light'}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (Platform.OS !== 'ios') setShowDatePicker(false);
                  if (date) {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${y}-${m}-${d}`;
                    setFilterDate(dateStr);
                    setCurrentPage(1);
                  }
                }}
              />
            )}

            <View style={s.card}>
              {paginatedOrders.map((o, i, arr) => (
                <TouchableOpacity 
                  key={o.id} 
                  style={[s.orderItem, i === arr.length - 1 && s.orderItemLast]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedOrder(o)}
                >
                  <View style={s.orderIcon}>
                    <ShoppingBag size={16} color={colors.primary} />
                  </View>
                  <View style={s.orderInfo}>
                    <Text style={s.orderName} numberOfLines={1}>
                      {"Pesanan #" + o.id.toUpperCase()}
                    </Text>
                    <Text style={s.orderDate}>{o.date}</Text>
                  </View>
                  <View style={s.orderRight}>
                    <Text style={[s.badge, badgeStyle(o.status)]}>{badgeLabel(o.status)}</Text>
                    <Text style={s.orderPrice}>{fmt(o.total)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {paginatedOrders.length === 0 && (
                <Text style={{ padding: 16, textAlign: "center", color: colors.mutedForeground }}>
                  Tida ada pesanan yang sesuai.
                </Text>
              )}
            </View>

            {totalPages > 1 && (
              <View style={s.paginationRow}>
                <TouchableOpacity
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={[s.pageBtn, currentPage === 1 && s.pageBtnDisabled]}
                >
                  <Text style={s.pageBtnText}>Sebelumnya</Text>
                </TouchableOpacity>
                <Text style={s.pageText}>
                  Hal {currentPage} dari {totalPages}
                </Text>
                <TouchableOpacity
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={[s.pageBtn, currentPage === totalPages && s.pageBtnDisabled]}
                >
                  <Text style={s.pageBtnText}>Selanjutnya</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {tab === "tema" && (
          <>
            {/* ── LIGHT THEMES ── */}
            <Text style={s.themeSectionLabel}>☀️  Terang</Text>
            <View style={s.themeGrid}>
              {LIGHT_THEMES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.themeCard, selectedTheme === t.id && s.themeCardActive]}
                  onPress={() => setSelectedTheme(t.id)}
                  activeOpacity={0.8}
                >
                  <View style={[s.themeDot, { backgroundColor: t.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.themeName}>{t.name}</Text>
                    <Text style={s.themeSub}>{t.sub}</Text>
                  </View>
                  {selectedTheme === t.id && (
                    <CheckCircle size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* ── DARK THEMES ── */}
            <Text style={[s.themeSectionLabel, { marginTop: 6 }]}>🌙  Gelap</Text>
            <View style={s.themeGrid}>
              {DARK_THEMES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.themeCard, s.themeCardDark, selectedTheme === t.id && { borderColor: t.color }]}
                  onPress={() => setSelectedTheme(t.id)}
                  activeOpacity={0.8}
                >
                  <View style={[s.themeDot, { backgroundColor: t.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.themeName, { color: "#E8E6E0" }]}>{t.name}</Text>
                    <Text style={s.themeSub}>{t.sub}</Text>
                  </View>
                  {selectedTheme === t.id && (
                    <CheckCircle size={16} color={t.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.primaryBtn, loading && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleSaveTheme}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Droplet size={15} color="#fff" />
                  <Text style={s.primaryBtnText}>Terapkan Tema</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {tab === "bantuan" && (
          <>
            <Text style={s.secLabel}>Pusat Bantuan</Text>
            <View style={s.card}>
              {bantuan.map((h, i) => (
                <TouchableOpacity
                  key={h.id}
                  style={[s.helpItem, i === bantuan.length - 1 && s.helpItemLast]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (h.link) {
                      Linking.openURL(h.link).catch(e => {
                        Alert.alert("Error", "Gagal membuka tautan");
                      });
                    }
                  }}
                >
                  <View style={[s.helpDot, { backgroundColor: h.bg }]}>
                    {(() => {
                      // @ts-ignore
                      const IconComp = LucideIcons[h.icon] || ICON_MAP[h.icon as keyof typeof ICON_MAP] || HelpCircle;
                      return <IconComp size={18} color={h.color || colors.primary} />;
                    })()}
                  </View>
                  <View style={s.helpInfo}>
                    <Text style={s.helpTitle}>{h.name}</Text>
                    {h.link && <Text style={s.helpDesc}>{h.link}</Text>}
                  </View>
                  <ChevronRight size={16} color="#C0BDB5" />
                </TouchableOpacity>
              ))}
              {bantuan.length === 0 && (
                <Text style={{ padding: 16, textAlign: "center", color: "#666" }}>Pusat bantuan belum ditambahkan.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Detail Pesanan</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <X size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalScroll} contentContainerStyle={s.modalBody}>
              {selectedOrder && (
                <>
                  <Text style={s.detailLabel}>ID Transaksi</Text>
                  <Text style={s.detailValue}>{selectedOrder.id}</Text>
                  
                  <Text style={s.detailLabel}>Tanggal</Text>
                  <Text style={s.detailValue}>{selectedOrder.date}</Text>

                  <Text style={s.detailLabel}>Status</Text>
                  <Text style={[s.badge, badgeStyle(selectedOrder.status), { alignSelf: 'flex-start' }]}>
                    {badgeLabel(selectedOrder.status)}
                  </Text>

                  <Text style={s.detailLabel}>Item Pembelian:</Text>
                  {selectedOrder.items?.map((it: any, idx: number) => (
                    <View key={idx} style={s.detailItem}>
                      <Text style={s.detailItemName}>{it.name}</Text>
                      <Text style={s.detailItemQty}>x{it.qty}</Text>
                      <Text style={s.detailItemPrice}>{fmt(it.price * it.qty)}</Text>
                    </View>
                  ))}

                  <Text style={[s.detailLabel, { marginTop: 16 }]}>Total Bayar</Text>
                  <Text style={[s.detailValue, { fontSize: 16, color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                    {fmt(selectedOrder.total)}
                  </Text>
                </>
              )}
            </ScrollView>
            <View style={s.modalFooter}>
              {selectedOrder && (
                <View style={{ gap: 10 }}>
                  {selectedOrder.status === "menunggu" && (
                    <TouchableOpacity 
                      style={s.dangerBtn} 
                      onPress={() => setShowCancelConfirm(true)}
                    >
                      <XCircle size={18} color="#E24B4A" />
                      <Text style={s.dangerBtnText}>Batalkan Pesanan</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={[s.primaryBtn, { backgroundColor: "#888", marginTop: 5 }]} 
                    onPress={() => setSelectedOrder(null)}
                  >
                    <Text style={s.primaryBtnText}>Tutup</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal 
        visible={showCancelConfirm}
        title="Batalkan Pesanan"
        message="Apakah Anda yakin ingin membatalkan pesanan ini? Stok akan dikembalikan secara otomatis."
        confirmLabel="Ya, Batalkan"
        isDanger={true}
        onConfirm={async () => {
          if (!selectedOrder) return;
          try {
            await updateOrderStatus(selectedOrder.id, "dibatalkan", "");
            setShowCancelConfirm(false);
            setSelectedOrder(null);
          } catch (e) {
            setDialogContext({ title: "Error", message: "Gagal membatalkan pesanan" });
          }
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <DialogOverlay context={dialogContext} onClose={() => setDialogContext(null)} />
    </View>
  );
}
