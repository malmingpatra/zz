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
import { useColors } from "./_hooks/useColors";
import { useCart } from "./_context/CartContext";
import { useDatabase } from "./_context/DatabaseContext";

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
  const params = useLocalSearchParams<{ orderId: string }>();

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.card,
      paddingTop: insets.top + 8,
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
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: insets.bottom + 80 },
    previewLabel: {
      fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.6,
      marginBottom: 10, paddingHorizontal: 2,
    },
    notaCard: {
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      overflow: "hidden",
    },
    notaInner: { padding: 20 },
    notaHeaderBlock: { alignItems: "center", marginBottom: 14 },
    notaStoreName: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: 0.5, marginBottom: 2 },
    notaStoreSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 1 },
    dashes: {
      borderTopWidth: 1, borderTopColor: colors.border,
      borderStyle: "dashed", marginVertical: 10,
    },
    solidLine: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
    metaKey: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    metaVal: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.foreground, textAlign: "right", flex: 1, marginLeft: 8 },
    itemName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2 },
    itemDetail: { flexDirection: "row", justifyContent: "space-between" },
    itemDetailText: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    itemWrap: { marginBottom: 6 },
    sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    sumText: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.foreground },
    sumValue: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.foreground },
    sumTotal: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground, paddingTop: 6 },
    sumTotalVal: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground },
    diskonText: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.destructive },
    diskonVal: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.destructive },
    notaFooter: {
      textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground, marginTop: 4, lineHeight: 18,
    },
    bottomActions: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      flexDirection: "row", gap: 8,
      padding: 12, paddingBottom: insets.bottom + 12,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelBtn: {
      flex: 1, height: 46, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      alignItems: "center", justifyContent: "center",
    },
    cancelBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    printBtn: {
      flex: 1.6, height: 46,
      backgroundColor: colors.primary, borderRadius: 12,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    },
    printBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primaryForeground },
  });

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
    if (Platform.OS === "web") {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: monospace; padding: 20px; font-size: 12px; max-width: 300px; margin: 0 auto; color: #1a1a1a; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .dashed { border-top: 1px dashed #000; margin: 8px 0; }
            .solid { border-top: 1px solid #000; margin: 8px 0; }
            .red { color: red; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:14px">${storeSettings?.storeName || "NAMA TOKO"}</div>
          <div class="center" style="font-size:11px;color:#666">${storeSettings?.storeAddress || "ALAMAT TOKO"}</div>
          <div class="dashed"></div>
          <div class="row"><span>No. Nota</span><span>${invoiceId}</span></div>
          <div class="row"><span>Tanggal</span><span>${dateStr}</span></div>
          <div class="row"><span>Kasir</span><span>${order?.staff || "Kasir"}</span></div>
          <div class="dashed"></div>
          ${items.map((item: any) => `
            <div class="bold">${item.name}</div>
            <div class="row">
              <span>${item.qty} x ${fmt(item.price)}</span>
              <span>${fmt(item.qty * item.price)}</span>
            </div>
          `).join("")}
          <div class="solid"></div>
          <div class="row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          ${discountAmount > 0 ? `
            <div class="row red">
              <span>Diskon ${discountType === "pct" ? discountValue + "%" : ""}</span>
              <span>-${fmt(discountAmount)}</span>
            </div>
          ` : ""}
          <div class="row bold" style="font-size:13px;margin-top:4px">
            <span>TOTAL</span>
            <span>${fmt(total)}</span>
          </div>
          <div class="dashed"></div>
          <div class="center" style="margin-top:4px">Terima kasih atas kunjungan Anda!</div>
          <div class="center">Barang yang sudah dibeli tidak dapat dikembalikan.</div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    } else {
      Alert.alert("Cetak Nota", "Struk berhasil dicetak!", [
        { text: "OK", onPress: handleClose },
      ]);
    }
  }

  return (
    <View style={s.container}>
      <View nativeID="nota-header" style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={handleClose} activeOpacity={0.7}>
          <ArrowLeft size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cetak Nota</Text>
      </View>

      <ScrollView nativeID="nota-scroll" style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.previewLabel}>Preview Nota</Text>

        <View style={s.notaCard}>
          <View style={s.notaInner}>
            <View style={s.notaHeaderBlock}>
              <Text style={s.notaStoreName}>{storeSettings?.storeName || "NAMA TOKO BELUM DIATUR"}</Text>
              <Text style={s.notaStoreSub}>{storeSettings?.storeAddress || "ALAMAT TOKO BELUM DIATUR"}</Text>
            </View>

            <View style={s.dashes} />

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

            <View style={{ marginBottom: 4 }}>
              {items.map((item: any, idx: number) => (
                <View key={item.id + "-" + idx} style={s.itemWrap}>
                  <Text style={s.itemName}>{item.name}</Text>
                  <View style={s.itemDetail}>
                    <Text style={s.itemDetailText}>{item.qty} x {fmt(item.price)}</Text>
                    <Text style={s.itemDetailText}>{fmt(item.qty * item.price)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.solidLine} />

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

      <View nativeID="nota-actions" style={s.bottomActions}>
        <TouchableOpacity style={s.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
          <Text style={s.cancelBtnText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.printBtn} onPress={handlePrint} activeOpacity={0.85}>
          <Printer size={16} color={colors.primaryForeground} />
          <Text style={s.printBtnText}>Cetak Nota</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
