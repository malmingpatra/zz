import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Printer } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/context/CartContext";
import { useDatabase } from "@/context/DatabaseContext";

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function nowStr() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mn}`;
}

function notaId() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${dd}${mm}${yy}${rand}`;
}

export default function NotaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clearCart } = useCart();
  const { orders, storeSettings } = useDatabase();
  const params = useLocalSearchParams<{
    orderId: string;
  }>();

  const order = orders.find(o => o.id === (params.orderId || ""));

  const discountAmount = order?.discountAmount || 0;
  const discountValue = order?.discountValue || 0;
  const discountType = order?.discountType || "pct";
  const subtotal = order?.subtotal || order?.total || 0;
  const total = order?.total || 0;
  const invoiceId = order?.id || notaId();
  const dateStr = order?.date || nowStr();
  const items = order?.items || [];

  function handleClose() {
    clearCart();
    router.back();
  }

  function handlePrint() {
    Alert.alert("Cetak Nota", "Struk berhasil dicetak!", [
      { text: "OK", onPress: handleClose },
    ]);
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F0F2EE" },
    header: {
      backgroundColor: "#fff",
      paddingTop: insets.top + 8,
      paddingBottom: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: "#F5F5F5",
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_700Bold", color: "#1A1A1A" },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: insets.bottom + 80 },
    previewLabel: {
      fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#aaa",
      textTransform: "uppercase", letterSpacing: 0.6,
      marginBottom: 10, paddingHorizontal: 2,
    },
    notaCard: {
      backgroundColor: "#fff", borderRadius: 14,
      borderWidth: 1, borderColor: "#ddd",
      overflow: "hidden",
    },
    notaInner: { padding: 20 },
    notaHeaderBlock: { alignItems: "center", marginBottom: 14 },
    notaStoreName: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1A1A1A", letterSpacing: 0.5, marginBottom: 2 },
    notaStoreSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#888", marginBottom: 1 },
    dashes: {
      borderTopWidth: 1, borderTopColor: "#ccc",
      borderStyle: "dashed", marginVertical: 10,
    },
    solidLine: {
      height: 1, backgroundColor: "#bbb", marginVertical: 10,
    },
    metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
    metaKey: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#888" },
    metaVal: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#1A1A1A", textAlign: "right", flex: 1, marginLeft: 8 },
    itemName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#1A1A1A", marginBottom: 2 },
    itemDetail: { flexDirection: "row", justifyContent: "space-between" },
    itemDetailText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
    itemWrap: { marginBottom: 6 },
    sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    sumText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#1A1A1A" },
    sumValue: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#1A1A1A" },
    sumTotal: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1A1A1A", paddingTop: 6 },
    sumTotalVal: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1A1A1A" },
    diskonText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#C0392B" },
    diskonVal: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#C0392B" },
    notaFooter: {
      textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular",
      color: "#aaa", marginTop: 4, lineHeight: 18,
    },
    bottomActions: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      flexDirection: "row", gap: 8,
      padding: 12, paddingBottom: insets.bottom + 12,
      backgroundColor: "#F0F2EE",
    },
    cancelBtn: {
      flex: 1, height: 46, backgroundColor: "#fff",
      borderWidth: 1, borderColor: "#ddd", borderRadius: 12,
      alignItems: "center", justifyContent: "center",
    },
    cancelBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#888" },
    printBtn: {
      flex: 1.6, height: 46,
      backgroundColor: colors.primary, borderRadius: 12,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    },
    printBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={handleClose} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#444" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cetak Nota</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.previewLabel}>Preview Nota</Text>

        <View style={s.notaCard}>
          <View style={s.notaInner}>
            {/* Store header */}
            <View style={s.notaHeaderBlock}>
              <Text style={s.notaStoreName}>{storeSettings?.storeName || "NAMA TOKO BELUM DIATUR"}</Text>
              <Text style={s.notaStoreSub}>{storeSettings?.storeAddress || "ALAMAT TOKO BELUM DIATUR"}</Text>
            </View>

            <View style={s.dashes} />

            {/* Meta */}
            <View style={{ marginBottom: 4 }}>
              <View style={s.metaRow}>
                <Text style={s.metaKey}>No. Nota</Text>
                <Text style={s.metaVal}>{invoiceId}</Text>
              </View>
              <View style={s.metaRow}>
                <Text style={s.metaKey}>Tanggal</Text>
                <Text style={s.metaVal}>{dateStr}</Text>
              </View>
              <View style={s.metaRow}>
                <Text style={s.metaKey}>Kasir</Text>
                <Text style={s.metaVal}>{order?.staff || "Kasir"}</Text>
              </View>
            </View>

            <View style={s.dashes} />

            {/* Items */}
            <View style={{ marginBottom: 4 }}>
              {items.map((item, idx) => (
                <View key={item.id + "-" + idx} style={s.itemWrap}>
                  <Text style={s.itemName}>{item.name}</Text>
                  <View style={s.itemDetail}>
                    <Text style={s.itemDetailText}>
                      {item.qty} x {fmt(item.price)}
                    </Text>
                    <Text style={s.itemDetailText}>
                      {fmt(item.qty * item.price)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.solidLine} />

            {/* Summary */}
            <View>
              <View style={s.sumRow}>
                <Text style={s.sumText}>Subtotal</Text>
                <Text style={s.sumValue}>{fmt(subtotal)}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={s.sumRow}>
                  <Text style={s.diskonText}>
                    Diskon {discountType === "pct" ? `${discountValue}%` : ""}
                  </Text>
                  <Text style={s.diskonVal}>-{fmt(discountAmount)}</Text>
                </View>
              )}
              <View style={s.sumRow}>
                <Text style={s.sumTotal}>TOTAL</Text>
                <Text style={s.sumTotalVal}>{fmt(total)}</Text>
              </View>
            </View>

            <View style={s.dashes} />

            <Text style={s.notaFooter}>
              Terima kasih atas kunjungan Anda!{"\n"}
              Barang yang sudah dibeli tidak dapat dikembalikan.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.bottomActions}>
        <TouchableOpacity style={s.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
          <Text style={s.cancelBtnText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.printBtn} onPress={handlePrint} activeOpacity={0.85}>
          <Printer size={16} color="#fff" />
          <Text style={s.printBtnText}>Cetak Nota</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
