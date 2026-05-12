import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Printer } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useDatabase } from "@/context/DatabaseContext";

function fmt(n?: number) {
  if (typeof n !== "number") n = 0;
  return "Rp " + n.toLocaleString("id-ID");
}

// Decorative Barcode Component
const Barcode = ({ id }: { id: string }) => {
  const widths = [3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2];
  return (
    <View style={s_resi.barcodeContainer}>
      <View style={s_resi.barcodeLines}>
        {widths.map((w, i) => (
          <View
            key={i}
            style={[
              s_resi.barcodeLine,
              { width: w, height: 20 + (i % 3) * 5 }
            ]}
          />
        ))}
      </View>
      <Text style={s_resi.barcodeNum}>{id}</Text>
    </View>
  );
};

export default function ResiScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resi_id } = useLocalSearchParams<{ resi_id: string }>();
  const { orders, storeSettings } = useDatabase();

  const order = orders.find((o) => o.id === resi_id);

  if (!order) {
    return (
      <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text>Pesanan tidak ditemukan.</Text>
      </View>
    );
  }

  const subtotal = order.subtotal || order.total || 0;
  const discountAmount = order.discountAmount || 0;
  const discountType = order.discountType || "pct";
  const discountValue = order.discountValue || 0;
  const total = order.total || 0;

  const diskon = discountAmount > 0 ? {
    label: `Diskon ${discountType === "pct" ? `${discountValue}%` : ""}`,
    amount: discountAmount
  } : null;

  function handlePrint() {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      Alert.alert("Cetak Resi", "Resi/Label pengiriman sedang dicetak...");
    }
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#444" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cetak Resi</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.previewLabel}>Preview Resi</Text>

        <View style={s.resiCard}>
          <View style={s.resiInner}>
            {/* Top Section */}
            <View style={s_resi.topRow}>
              <View style={s_resi.storeInfo}>
                <Text style={s_resi.storeName}>{storeSettings?.storeName || "NAMA TOKO BELUM DIATUR"}</Text>
                <Text style={s_resi.storeSub}>{storeSettings?.storeAddress || "ALAMAT TOKO BELUM DIATUR"}</Text>
              </View>
              <View style={s_resi.labelBox}>
                <Text style={s_resi.labelText}>No. Resi</Text>
                <Text style={s_resi.idBig}>{order.id}</Text>
                <Text style={s_resi.storeSub}>{order.date}</Text>
              </View>
            </View>

            <View style={s_resi.dividerSolid} />

            {/* Parties Section */}
            <View style={s_resi.partiesRow}>
              <View style={s_resi.partyCol}>
                <Text style={s_resi.partyLabel}>Staf / Pengirim</Text>
                <Text style={s_resi.partyName}>{order.staff}</Text>
                <Text style={s_resi.partyPhone}>{storeSettings?.storeName || "Toko Anda"}</Text>
              </View>
              <View style={s_resi.sep} />
              <View style={s_resi.partyCol}>
                <Text style={s_resi.partyLabel}>Penerima</Text>
                <Text style={s_resi.partyName}>{order.buyer}</Text>
                <Text style={s_resi.partyPhone}>{order.phone}</Text>
                <Text style={s_resi.partyAddr}>{order.address}</Text>
              </View>
            </View>

            <View style={s_resi.dividerDashed} />

            {/* Items */}
            <View style={s_resi.itemsList}>
              {(order.items || []).map((item: any, idx: number) => (
                <View key={idx} style={s_resi.itemRow}>
                  <Text style={s_resi.itemName}>{item.name}</Text>
                  <View style={s_resi.itemDetail}>
                    <Text style={s_resi.itemDetailText}>{item.qty} x {fmt(item.price)}</Text>
                    <Text style={s_resi.itemDetailText}>{fmt(item.qty * item.price)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[s_resi.dividerDashed, { borderTopColor: "#bbb" }]} />

            {/* Summary */}
            <View style={s_resi.summary}>
              <View style={s_resi.sumRow}>
                <Text style={s_resi.sumLabel}>Subtotal</Text>
                <Text style={s_resi.sumValue}>{fmt(subtotal)}</Text>
              </View>
              {diskon && (
                <View style={s_resi.sumRow}>
                  <Text style={[s_resi.sumLabel, { color: "#c0392b" }]}>{diskon.label}</Text>
                  <Text style={[s_resi.sumValue, { color: "#c0392b" }]}>-{fmt(diskon.amount)}</Text>
                </View>
              )}
              <View style={[s_resi.sumRow, { marginTop: 6 }]}>
                <Text style={s_resi.totalLabel}>TOTAL</Text>
                <Text style={s_resi.totalValue}>{fmt(total)}</Text>
              </View>
            </View>

            {/* Barcode */}
            <Barcode id={order.id} />

            <Text style={s_resi.footerText}>
              Simpan resi ini sebagai bukti pengiriman.{"\n"}
              Hubungi kami jika ada pertanyaan.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={s.bottomActions}>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.cancelBtnText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.printBtn} onPress={handlePrint} activeOpacity={0.85}>
          <Printer size={17} color="#fff" />
          <Text style={s.printBtnText}>Cetak Resi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2EE" },
  header: {
    backgroundColor: "#fff",
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
  headerTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1A1A1A", flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 100 },
  previewLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#aaa",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingHorizontal: 2,
  },
  resiCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  resiInner: { padding: 20 },
  bottomActions: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#F0F2EE",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  cancelBtn: {
    flex: 1, height: 46, backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#ddd", borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  cancelBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#888" },
  printBtn: {
    flex: 1.6, height: 46, backgroundColor: "#1A6640",
    borderRadius: 12, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 7,
  },
  printBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
});

const s_resi = StyleSheet.create({
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1A1A1A", marginBottom: 2 },
  storeSub: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#888" },
  labelBox: { alignItems: "flex-end" },
  labelText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#888", textTransform: "uppercase", letterSpacing: 0.8 },
  idBig: { fontSize: 13, fontFamily: "monospace", fontWeight: "700", color: "#1A6640" },
  dividerSolid: { height: 2, backgroundColor: "#1A1A1A", marginVertical: 10 },
  partiesRow: { flexDirection: "row", marginVertical: 8 },
  partyCol: { flex: 1 },
  partyLabel: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  partyName: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#1A1A1A" },
  partyPhone: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  partyAddr: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#666", marginTop: 2, lineHeight: 14 },
  sep: { width: 1, backgroundColor: "#EEE", marginHorizontal: 12 },
  dividerDashed: { borderTopWidth: 1, borderTopColor: "#CCC", borderStyle: "dashed", marginVertical: 10 },
  itemsList: { marginVertical: 2 },
  itemRow: { marginBottom: 6 },
  itemName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#1A1A1A" },
  itemDetail: { flexDirection: "row", justifyContent: "space-between" },
  itemDetailText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  summary: { paddingVertical: 2 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1 },
  sumLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#1A1A1A" },
  sumValue: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#1A1A1A" },
  totalLabel: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1A1A1A" },
  totalValue: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1A1A1A" },
  barcodeContainer: { alignItems: "center", marginTop: 10 },
  barcodeLines: { flexDirection: "row", justifyContent: "center", gap: 1.5, height: 36, alignItems: "flex-end", marginBottom: 4 },
  barcodeLine: { backgroundColor: "#1A1A1A", borderRadius: 0.5 },
  barcodeNum: { fontSize: 10, fontFamily: "monospace", letterSpacing: 1.2, color: "#555" },
  footerText: { textAlign: "center", fontSize: 10, fontFamily: "Inter_400Regular", color: "#aaa", marginTop: 12, lineHeight: 15 },
});
