import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  AlertCircle, 
  ArrowLeft, 
  Hash, 
  UserCheck, 
  User, 
  Phone, 
  MapPin, 
  Printer, 
  Truck,
  XCircle,
  CheckCircle,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "../_hooks/useColors";
import { useDatabase } from "../_context/DatabaseContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../_context/firebase-setup";
import ConfirmationModal from "../_components/ConfirmationModal";

function fmt(n?: number) {
  if (typeof n !== "number") n = 0;
  return "Rp " + n.toLocaleString("id-ID");
}

// Status meta defined inside component

export default function DetailPesananScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
    menunggu:   { bg: colors.stokWarnBg, text: colors.stokWarnText, label: "Menunggu" },
    diproses:   { bg: colors.secondary, text: colors.foreground, label: "Diproses" },
    dikirim:    { bg: colors.secondary, text: colors.foreground, label: "Dikirim" }, // Using same for now
    selesai:    { bg: colors.stokOkBg, text: colors.stokOkText, label: "Selesai" },
    dibatalkan: { bg: colors.destructive + "15", text: colors.destructive, label: "Dibatalkan" },
  };

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
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground },
    headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 1, letterSpacing: 0.3 },
    statusBadge: {
      fontSize: 11, fontFamily: "Inter_600SemiBold",
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, overflow: "hidden",
    },
    scroll: { flex: 1 },
    scrollContent: { padding: 12, gap: 10, paddingBottom: insets.bottom + 180 },
    card: {
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, padding: 14,
    },
    cardLabel: {
      fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10,
    },
    infoRow: {
      flexDirection: "row", alignItems: "flex-start", gap: 10,
      paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.secondary,
    },
    infoRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    infoIcon: {
      width: 30, height: 30, borderRadius: 8,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center",
    },
    infoKey: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 2 },
    infoValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground },
    productItem: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.secondary,
    },
    productItemLast: { borderBottomWidth: 0 },
    productNum: {
      width: 24, height: 24, borderRadius: 6,
      backgroundColor: colors.primary + "15",
      alignItems: "center", justifyContent: "center",
    },
    productNumText: { fontSize: 11, fontFamily: "Inter_700Bold", color: colors.primary },
    productName: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground },
    productQty: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 1 },
    productPrice: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.primary },
    totalRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingTop: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: colors.border,
    },
    totalLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    totalValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.primary },
    bottom: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      flexDirection: "column", gap: 10,
      padding: 16, paddingBottom: insets.bottom + 16,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    outlineBtn: {
      height: 48, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
      width: "100%",
    },
    outlineBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    primaryBtn: {
      height: 48,
      backgroundColor: colors.primary, borderRadius: 12,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
      width: "100%",
    },
    primaryBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primaryForeground },
  });

  const router = useRouter();
  const { pesanan_id } = useLocalSearchParams<{ pesanan_id: string }>();
  const { orders, userProfile, updateOrderStatus } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUndoSendConfirm, setShowUndoSendConfirm] = useState(false);
  const currentUserName = userProfile?.displayName || "Staf";

  const order = orders.find((o) => o.id === pesanan_id);

  const updateStatus = async (newStatus: "menunggu" | "dikirim" | "selesai" | "dibatalkan") => {
    if (!order) return;
    setLoading(true);
    try {
      let staffUpdate: string | undefined = undefined;
      if (newStatus === "dikirim") {
        staffUpdate = currentUserName;
      } else if (newStatus === "menunggu" || newStatus === "dibatalkan") {
        staffUpdate = "";
      }
      
      await updateOrderStatus(order.id, newStatus, staffUpdate);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal memperbarui status");
    } finally {
      setLoading(false);
    }
  };

// Styles defined inside component

  if (!order) {
    return (
      <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}>
        <AlertCircle size={36} color="#ccc" />
        <Text style={{ marginTop: 10, fontSize: 14, color: "#aaa", fontFamily: "Inter_400Regular" }}>
          Pesanan tidak ditemukan
        </Text>
      </View>
    );
  }

  const sm = STATUS_META[order.status];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#444" />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>Detail Pesanan</Text>
          <Text style={s.headerSub}>#{order.id}</Text>
        </View>
        <Text style={[s.statusBadge, { backgroundColor: sm.bg, color: sm.text }]}>{sm.label}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Pesanan */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Informasi Pesanan</Text>
          <View style={s.infoRow}>
            <View style={s.infoIcon}><Hash size={14} color="#888" /></View>
            <View>
              <Text style={s.infoKey}>ID Pesanan</Text>
              <Text style={s.infoValue}>{order.id}</Text>
            </View>
          </View>
          <View style={[s.infoRow, s.infoRowLast]}>
            <View style={s.infoIcon}><UserCheck size={14} color="#888" /></View>
            <View>
              <Text style={s.infoKey}>Staf</Text>
              <Text style={s.infoValue}>{order.staff}</Text>
            </View>
          </View>
        </View>

        {/* Info Pembeli */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Informasi Pembeli</Text>
          <View style={s.infoRow}>
            <View style={s.infoIcon}><User size={14} color="#888" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoKey}>Nama</Text>
              <Text style={s.infoValue}>{order.buyer}</Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <View style={s.infoIcon}><Phone size={14} color="#888" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoKey}>No. HP</Text>
              <Text style={s.infoValue}>{order.phone}</Text>
            </View>
          </View>
          <View style={[s.infoRow, s.infoRowLast]}>
            <View style={s.infoIcon}><MapPin size={14} color="#888" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoKey}>Alamat</Text>
              <Text style={s.infoValue}>{order.address}</Text>
            </View>
          </View>
        </View>

        {/* Produk */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Produk Pesanan</Text>
          {(order.items || []).map((item: any, i: number) => (
            <View key={i} style={[s.productItem, i === (order.items || []).length - 1 && s.productItemLast]}>
              <View style={s.productNum}>
                <Text style={s.productNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.productName}>{item.name}</Text>
                <Text style={s.productQty}>
                  {item.qty} pcs × {fmt(item.price)}
                </Text>
              </View>
              <Text style={s.productPrice}>{fmt(item.qty * item.price)}</Text>
            </View>
          ))}

          <View style={{ marginTop: 10, gap: 6 }}>
            {order.subtotal !== undefined && order.subtotal !== order.total && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#888', fontFamily: 'Inter_400Regular' }}>Subtotal</Text>
                <Text style={{ fontSize: 12, color: '#888', fontFamily: 'Inter_500Medium' }}>{fmt(order.subtotal)}</Text>
              </View>
            )}
            {order.discountAmount !== undefined && order.discountAmount > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#E44E4E', fontFamily: 'Inter_400Regular' }}>
                  Diskon {order.discountType === 'pct' ? `(${order.discountValue}%)` : ''}
                </Text>
                <Text style={{ fontSize: 12, color: '#E44E4E', fontFamily: 'Inter_500Medium' }}>- {fmt(order.discountAmount)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{fmt(order.total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={s.bottom}>
        {order.status === "menunggu" && (
          <>
            <TouchableOpacity
              style={s.primaryBtn}
              activeOpacity={0.85}
              onPress={() => updateStatus("dikirim")}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Truck size={18} color="#fff" />
                  <Text style={s.primaryBtnText}>Kirim Pesanan</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.outlineBtn}
              activeOpacity={0.8}
              onPress={() => router.push(`/resi/${order.id}`)}
              disabled={loading}
            >
              <Printer size={18} color="#888" />
              <Text style={s.outlineBtnText}>Cetak Resi</Text>
            </TouchableOpacity>
          </>
        )}

        {order.status === "dikirim" && (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[s.outlineBtn, { flex: 1, borderColor: "#FCEBEB", backgroundColor: "#FCEBEB" }]}
                activeOpacity={0.8}
                onPress={() => setShowUndoSendConfirm(true)}
                disabled={loading}
              >
                <XCircle size={18} color="#791F1F" />
                <Text style={[s.outlineBtnText, { color: "#791F1F" }]}>Batal Kirim</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.primaryBtn, { flex: 1.2 }]}
                activeOpacity={0.85}
                onPress={() => updateStatus("selesai")}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <CheckCircle size={18} color="#fff" />
                    <Text style={s.primaryBtnText}>Terkirim</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.outlineBtn}
              activeOpacity={0.8}
              onPress={() => router.push(`/resi/${order.id}`)}
              disabled={loading}
            >
              <Printer size={18} color="#888" />
              <Text style={s.outlineBtnText}>Cetak Resi</Text>
            </TouchableOpacity>
          </>
        )}

        {(order.status === "selesai" || order.status === "dibatalkan") && (
          <TouchableOpacity
            style={s.outlineBtn}
            activeOpacity={0.8}
            onPress={() => router.push(`/resi/${order.id}`)}
            disabled={loading}
          >
            <Printer size={18} color="#888" />
            <Text style={s.outlineBtnText}>Cetak Resi</Text>
          </TouchableOpacity>
        )}
      </View>

      <ConfirmationModal
        visible={showCancelConfirm}
        title="Batalkan Pesanan"
        message="Apakah Anda yakin ingin membatalkan pesanan ini? Stok akan dikembalikan."
        confirmLabel="Ya, Batalkan"
        isDanger={true}
        onConfirm={() => {
          updateStatus("dibatalkan");
          setShowCancelConfirm(false);
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <ConfirmationModal
        visible={showUndoSendConfirm}
        title="Batal Kirim"
        message="Kembalikan pesanan ke status menunggu?"
        confirmLabel="Ya, Batal Kirim"
        onConfirm={() => {
          updateStatus("menunggu");
          setShowUndoSendConfirm(false);
        }}
        onCancel={() => setShowUndoSendConfirm(false)}
      />
    </View>
  );
}
