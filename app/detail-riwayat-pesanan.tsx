import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  AlertCircle, 
  ArrowLeft, 
  Pencil, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Map,
  Save,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  X,
  SlidersHorizontal,
  ChevronDown,
  Printer
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "./_hooks/useColors";
import { useDatabase } from "./_context/DatabaseContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./_context/firebase-setup";
import ConfirmationModal from "./_components/ConfirmationModal";

export default function DetailMemberScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.card,
      paddingTop: insets.top + 10,
      paddingBottom: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground },
    editBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center",
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: insets.bottom + 20 },
    hero: {
      backgroundColor: colors.card, margin: 12, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border,
      padding: 24, alignItems: "center",
    },
    heroName: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 8, textAlign: "center" },
    badgesRow: { flexDirection: "row", gap: 6 },
    badge: {
      fontSize: 11, fontFamily: "Inter_600SemiBold",
      paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, overflow: "hidden",
    },
    cards: { paddingHorizontal: 12, gap: 10 },
    card: {
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10,
    },
    cardLabel: {
      fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10,
    },
    infoRow: {
      flexDirection: "row", alignItems: "flex-start", gap: 10,
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.secondary,
    },
    infoRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    infoIcon: {
      width: 34, height: 34, borderRadius: 9,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center",
    },
    infoKey: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 2 },
    infoValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, lineHeight: 20 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 8, fontSize: 13,
      fontFamily: "Inter_500Medium", color: colors.foreground,
      backgroundColor: colors.secondary, marginTop: 4, width: "100%",
    },
    roleChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
    roleChip: { 
      paddingHorizontal: 12, paddingVertical: 6, 
      borderRadius: 16, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border 
    },
    roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    roleChipTextActive: { color: colors.primaryForeground },
    searchInput: {
      flex: 1, height: 40, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 12, paddingLeft: 36,
      fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground,
      backgroundColor: colors.card,
    },
    searchIcon: { position: 'absolute', left: 10, top: 11, zIndex: 1, },
    orderItem: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.secondary, gap: 12,
    },
    orderItemLast: { borderBottomWidth: 0, paddingBottom: 0, },
    orderIcon: {
      width: 40, height: 40, borderRadius: 12, backgroundColor: colors.secondary,
      alignItems: 'center', justifyContent: 'center',
    },
    orderInfo: { flex: 1, },
    orderName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2, },
    orderDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, },
    orderRight: { alignItems: 'flex-end', gap: 4, },
    orderPrice: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground, },
    pageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 12, },
    pageBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', },
    pageText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground, }
  });

  const router = useRouter();
  const { member_id } = useLocalSearchParams<{ member_id: string }>();
  const { members, orders, updateOrderStatus } = useDatabase();

  const member = members.find(m => m.id === member_id);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    role: "user",
    area: "",
  });

  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [showOrderFilter, setShowOrderFilter] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<any | null>(null);
  const ORDERS_PER_PAGE = 10;

  const memberOrders = React.useMemo(() => {
    if (!member || !orders) return [];
    
    return orders.filter((o: any) => {
      const matchName = o.buyer === member.name;
      const matchEmail = member.email && o.buyer === member.email;
      const matchPhone = member.phone && member.phone !== "-" && o.phone === member.phone;
      const matchUserId = o.userId && o.userId === member.id;
      const matchStaff = o.staff && (o.staff === member.name || o.staff === member.email);
      
      if (!matchName && !matchEmail && !matchPhone && !matchUserId && !matchStaff) return false;
      
      if (orderStatus && o.status !== orderStatus) return false;
      const q = orderSearch.trim().toLowerCase();
      if (q) {
        const idMatch = (o.id || "").toLowerCase() === q || (o.id || "").toLowerCase().includes(q);
        const itemMatch = o.items && o.items.some((i: any) => (i.name || "").toLowerCase().includes(q));
        if (!idMatch && !itemMatch) return false;
      }
      return true;
    }).sort((a: any, b: any) => {
      const ta = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt?.toMillis?.() || 0);
      const tb = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt?.toMillis?.() || 0);
      return tb - ta;
    });
  }, [orders, member, orderSearch, orderStatus]);

  const totalPages = Math.ceil(memberOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = React.useMemo(() => {
    const start = (orderPage - 1) * ORDERS_PER_PAGE;
    return memberOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [memberOrders, orderPage]);

  function badgeStyle(status: string) {
    if (status === "selesai") return { backgroundColor: "#EAF3DE", color: "#27500A", borderColor: "#27500A" };
    if (status === "diproses") return { backgroundColor: "#FFF7D4", color: "#8B6508", borderColor: "#8B6508" };
    if (status === "menunggu") return { backgroundColor: "#E6F1FB", color: "#0C447C", borderColor: "#0C447C" };
    if (status === "dibatalkan") return { backgroundColor: "#FCE8E8", color: "#991B1B", borderColor: "#991B1B" };
    return { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border };
  }
  
  function badgeLabel(status: string) {
    return status?.charAt(0).toUpperCase() + status?.slice(1) || "-";
  }
  
  function fmt(n: number) {
    if (!n) return "Rp 0";
    return "Rp " + n.toLocaleString("id-ID");
  }

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name || "",
        phone: member.phone || "",
        address: member.address || "",
        role: member.role || "user",
        area: member.area || "",
      });
    }
  }, [member]);

  const ROLES = ["user", "pelanggan", "staff", "admin"];

  const handleSave = async () => {
    if (!member) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", member.id);
      await updateDoc(userRef, {
        displayName: form.name,
        phoneNumber: form.phone,
        address: form.address,
        role: form.role,
        area: form.area,
      });
      setIsEditing(false);
      Alert.alert("Sukses", "Data member berhasil diperbarui");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error instanceof Error ? error.message : "Gagal memperbarui data member");
    } finally {
      setLoading(false);
    }
  };

// Styles defined inside component

  if (!member) {
    return (
      <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}>
        <AlertCircle size={36} color="#ccc" />
        <Text style={{ marginTop: 10, fontSize: 14, color: "#aaa", fontFamily: "Inter_400Regular" }}>
          Member tidak ditemukan
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7} disabled={loading}>
          <ArrowLeft size={18} color="#444" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? "Edit Member" : "Detail Member"}</Text>
        <TouchableOpacity 
          style={s.editBtn} 
          activeOpacity={0.7} 
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="#444" /> : isEditing ? <Save size={16} color="#444" /> : <Pencil size={16} color="#444" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          {isEditing ? (
            <TextInput
              style={[s.input, { textAlign: "center", fontSize: 16, marginBottom: 8 }]}
              value={form.name}
              onChangeText={(t) => setForm({...form, name: t})}
              placeholder="Nama Lengkap"
            />
          ) : (
            <Text style={s.heroName}>{member.name}</Text>
          )}
        </View>

        <View style={s.cards}>
          {/* Kontak */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Kontak</Text>
            <View style={s.infoRow}>
              <View style={s.infoIcon}><Mail size={15} color="#888" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoKey}>Alamat Email</Text>
                <Text style={s.infoValue}>{member.email}</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <View style={s.infoIcon}><Phone size={15} color="#888" /></View>
              <View style={{ flex: 1, paddingRight: isEditing ? 0 : 10 }}>
                <Text style={s.infoKey}>No. HP</Text>
                {isEditing ? (
                  <TextInput
                    style={s.input}
                    value={form.phone}
                    onChangeText={(t) => setForm({...form, phone: t})}
                    placeholder="Contoh: 08123456789"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={s.infoValue}>{member.phone}</Text>
                )}
              </View>
            </View>
            <View style={[s.infoRow, s.infoRowLast]}>
              <View style={s.infoIcon}><MapPin size={15} color="#888" /></View>
              <View style={{ flex: 1, paddingRight: isEditing ? 0 : 10 }}>
                <Text style={s.infoKey}>Alamat</Text>
                {isEditing ? (
                  <TextInput
                    style={[s.input, { height: 60 }]}
                    value={form.address}
                    onChangeText={(t) => setForm({...form, address: t})}
                    placeholder="Alamat lengkap"
                    multiline
                  />
                ) : (
                  <Text style={s.infoValue}>{member.address}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Akun */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Informasi Akun</Text>
            <View style={s.infoRow}>
              <View style={s.infoIcon}><Shield size={15} color="#888" /></View>
              <View style={{ flex: 1, paddingRight: isEditing ? 0 : 10 }}>
                <Text style={s.infoKey}>Role</Text>
                {isEditing ? (
                  <View style={s.roleChips}>
                    {ROLES.map(r => (
                      <TouchableOpacity 
                        key={r} 
                        style={[s.roleChip, form.role === r && s.roleChipActive]}
                        onPress={() => setForm({...form, role: r})}
                      >
                        <Text style={[s.roleChipText, form.role === r && s.roleChipTextActive]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={s.infoValue}>{member.role || "user"}</Text>
                )}
              </View>
            </View>
            <View style={[s.infoRow, s.infoRowLast]}>
              <View style={s.infoIcon}><Map size={15} color="#888" /></View>
              <View style={{ flex: 1, paddingRight: isEditing ? 0 : 10 }}>
                <Text style={s.infoKey}>Area</Text>
                {isEditing ? (
                  <TextInput
                    style={s.input}
                    value={form.area}
                    onChangeText={(t) => setForm({...form, area: t})}
                    placeholder="Area (opsional)"
                  />
                ) : (
                  <Text style={s.infoValue}>{member.area || "-"}</Text>
                )}
              </View>
            </View>
          </View>
          
          {/* Riwayat Pesanan */}
          {!isEditing && (
            <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: colors.card }}
                activeOpacity={0.7}
                onPress={() => setIsOrderHistoryOpen(!isOrderHistoryOpen)}
              >
                <Text style={[s.cardLabel, { marginBottom: 0 }]}>Riwayat Pesanan</Text>
                <ChevronDown size={20} color={colors.mutedForeground} style={{ transform: [{ rotate: isOrderHistoryOpen ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              
              {isOrderHistoryOpen && (
                <View style={{ padding: 14, paddingTop: 0 }}>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <View style={{ position: 'relative', flex: 1 }}>
                      <View style={s.searchIcon}>
                        <Search size={16} color={colors.mutedForeground} />
                      </View>
                      <TextInput
                        style={s.searchInput}
                        placeholder="Cari pesanan..."
                        placeholderTextColor={colors.mutedForeground}
                        value={orderSearch}
                        onChangeText={(val) => {
                          setOrderSearch(val);
                          setOrderPage(1);
                        }}
                      />
                    </View>
                    <TouchableOpacity 
                      style={{ 
                        width: 40, height: 40, borderRadius: 10, borderWidth: 1, 
                        borderColor: showOrderFilter ? colors.primary : colors.border, 
                        backgroundColor: showOrderFilter ? colors.primary : colors.card,
                        alignItems: 'center', justifyContent: 'center'
                      }}
                      onPress={() => setShowOrderFilter(!showOrderFilter)}
                    >
                      <SlidersHorizontal size={18} color={showOrderFilter ? colors.primaryForeground : colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  {showOrderFilter && (
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {["menunggu", "diproses", "selesai", "dibatalkan"].map(st => (
                        <TouchableOpacity
                          key={st}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                            backgroundColor: orderStatus === st ? colors.primary : colors.secondary,
                            borderWidth: 1, borderColor: orderStatus === st ? colors.primary : colors.border
                          }}
                          onPress={() => { setOrderStatus(orderStatus === st ? "" : st); setOrderPage(1); }}
                        >
                          <Text style={{ 
                            fontSize: 11, fontFamily: "Inter_500Medium", 
                            color: orderStatus === st ? colors.primaryForeground : colors.mutedForeground,
                            textTransform: 'capitalize' 
                          }}>
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  
                  {paginatedOrders.length > 0 ? (
                    <>
                      {paginatedOrders.map((o: any, i: number, arr: any[]) => (
                        <View key={o.id} style={[i !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.secondary }]}>
                          <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 }}
                            activeOpacity={0.7}
                            onPress={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                          >
                            <View style={s.orderIcon}>
                              <ShoppingBag size={18} color={colors.primary} />
                            </View>
                            <View style={s.orderInfo}>
                              <Text style={s.orderName} numberOfLines={1}>{"Pesanan #" + o.id.toUpperCase()}</Text>
                              <Text style={s.orderDate}>{o.date || "-"}</Text>
                            </View>
                            <View style={[s.orderRight, { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }]}>
                              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                <Text style={[s.badge, badgeStyle(o.status)]}>{badgeLabel(o.status)}</Text>
                                <Text style={s.orderPrice}>{fmt(o.total)}</Text>
                              </View>
                              <ChevronDown size={18} color={colors.mutedForeground} style={{ transform: [{ rotate: expandedOrderId === o.id ? '180deg' : '0deg' }] }} />
                            </View>
                          </TouchableOpacity>

                          {expandedOrderId === o.id && (
                            <View style={{ paddingBottom: 16, paddingTop: 4 }}>
                              <View style={{ flexDirection: 'column', gap: 10 }}>
                                <TouchableOpacity 
                                  style={{ width: '100%', flexDirection: 'row', gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
                                  onPress={() => router.push({ pathname: "/cetak-nota", params: { orderId: o.id } })}
                                  activeOpacity={0.7}
                                >
                                  <Printer size={16} color={colors.foreground} />
                                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Cetak Nota</Text>
                                </TouchableOpacity>

                                {o.status !== "selesai" && o.status !== "dibatalkan" && updateOrderStatus && (
                                  <TouchableOpacity 
                                    style={{ width: '100%', paddingVertical: 10, borderRadius: 8, backgroundColor: "#FCE8E8", alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: "#F8B4B4" }}
                                    onPress={() => {
                                      setSelectedOrderToCancel(o);
                                      setShowCancelConfirm(true);
                                    }}
                                  >
                                    <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#991B1B" }}>Batalkan Pesanan</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                      ))}
                      
                      {totalPages > 1 && (
                        <View style={s.pageRow}>
                          <TouchableOpacity 
                            style={[s.pageBtn, orderPage === 1 && { opacity: 0.3 }]}
                            disabled={orderPage === 1}
                            onPress={() => setOrderPage(p => Math.max(1, p - 1))}
                          >
                            <ChevronLeft size={18} color={colors.foreground} />
                          </TouchableOpacity>
                          <Text style={s.pageText}>{orderPage} / {totalPages}</Text>
                          <TouchableOpacity 
                            style={[s.pageBtn, orderPage === totalPages && { opacity: 0.3 }]}
                            disabled={orderPage === totalPages}
                            onPress={() => setOrderPage(p => Math.min(totalPages, p + 1))}
                          >
                            <ChevronRight size={18} color={colors.foreground} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={{ textAlign: 'center', paddingVertical: 12, fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                      {orderSearch.trim() || orderStatus ? "Tidak ada pesanan yang sesuai." : "Belum ada pesanan."}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {isEditing && (
            <TouchableOpacity 
              style={{ padding: 12, alignItems: 'center' }}
              onPress={() => setIsEditing(false)}
            >
              <Text style={{ color: '#aaa', fontFamily: 'Inter_500Medium' }}>Batal Edit</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>

      <ConfirmationModal
        visible={showCancelConfirm}
        title="Batalkan Pesanan"
        message="Apakah Anda yakin ingin membatalkan pesanan ini? Stok akan dikembalikan secara otomatis."
        confirmLabel="Ya, Batalkan"
        isDanger={true}
        onConfirm={async () => {
          if (!selectedOrderToCancel || !updateOrderStatus) return;
          try {
            await updateOrderStatus(selectedOrderToCancel.id, "dibatalkan", "");
            setShowCancelConfirm(false);
            setSelectedOrderToCancel(null);
          } catch (e) {
            Alert.alert("Error", "Gagal membatalkan pesanan");
          }
        }}
        onCancel={() => {
          setShowCancelConfirm(false);
          setSelectedOrderToCancel(null);
        }}
      />
    </View>
  );
}
// sync-trigger
