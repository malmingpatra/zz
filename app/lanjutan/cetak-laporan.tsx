import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Alert
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../_hooks/useColors";
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle2 
} from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useDatabase } from "../_context/DatabaseContext";
import { auth } from "../_context/firebase-setup";
import { useAutoCloseDialog, DialogOverlay } from "../_components/DialogOverlay";

export default function CetakLaporan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { dialogContext, setDialogContext } = useAutoCloseDialog();

  const styles = StyleSheet.create({
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
      width: 36, 
      height: 36, 
      borderRadius: 10, 
      backgroundColor: colors.secondary, 
      alignItems: "center", 
      justifyContent: "center", 
      marginRight: 12 
    },
    headerTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground },
    scrollContent: { padding: 16, paddingBottom: insets.bottom + 100 },
    previewLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, paddingHorizontal: 2 },
    card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 20 },
    reportHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: colors.primary },
    storeName: { fontSize: 16, fontFamily: "Inter_800ExtraBold", color: colors.foreground, marginBottom: 2 },
    storeSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    titleBlock: { alignItems: "flex-end" },
    reportTitle: { fontSize: 12, fontFamily: "Inter_700Bold", color: colors.primary, textTransform: "uppercase" },
    periodLabelText: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    sectionDivider: { borderBottomWidth: 0.5, borderBottomColor: colors.secondary, paddingBottom: 4, marginTop: 16, marginBottom: 10 },
    sectionTitle: { fontSize: 10, fontFamily: "Inter_700Bold", color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },
    productRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.secondary },
    productName: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground },
    productQty: { width: 60, textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", color: colors.foreground },
    productSub: { width: 100, textAlign: "right", fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    totalsContainer: { flexDirection: "row", gap: 8, marginTop: 15 },
    totalBox: { flex: 1, padding: 10, borderRadius: 8 },
    totalLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", marginBottom: 4 },
    totalValue: { fontSize: 13, fontFamily: "Inter_800ExtraBold" },
    discountRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.secondary },
    discountId: { fontSize: 9, fontFamily: "monospace", color: colors.mutedForeground },
    discountBadgeRow: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 6 },
    badge: { backgroundColor: colors.stokWarnBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
    badgeText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: colors.stokWarnText },
    discountText: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.foreground },
    footer: { marginTop: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    footerNote: { fontSize: 9, fontFamily: "Inter_400Regular", color: colors.mutedForeground, flex: 1, marginRight: 20 },
    signature: { alignItems: "center" },
    signatureLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 35 },
    signatureLine: { width: 100, height: 1, backgroundColor: colors.border },
    signatureName: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginTop: 5 },
    bottomActions: { padding: 12, backgroundColor: colors.background, flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: colors.border },
    btnCancel: { flex: 1, height: 48, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    btnCancelText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    btnPrint: { flex: 1.6, height: 48, backgroundColor: colors.primary, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
    btnPrintText: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primaryForeground }
  });

  const { period, start, end } = useLocalSearchParams<{ period: string, start: string, end: string }>();
  
  const getDynamicPeriodLabel = (p: string) => {
    const now = new Date();
    const fmtStr = (s: string) => {
      const d = new Date(s);
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    };
    const fmt = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    
    if (p === "7hari") {
      const s = new Date();
      s.setDate(now.getDate() - 6);
      return `7 Hari Terakhir (${fmt(s)} - ${fmt(now)})`;
    }
    if (p === "30hari") {
      const s = new Date();
      s.setDate(now.getDate() - 29);
      return `30 Hari Terakhir (${fmt(s)} - ${fmt(now)})`;
    }
    if (p === "custom" && start && end) {
      return `Periode Khusus (${fmtStr(start)} - ${fmtStr(end)})`;
    }
    if (p === "custom" && start) {
      return `Periode Khusus (${fmtStr(start)})`;
    }
    return `Hari Ini (${fmt(now)})`;
  };

  const periodLabel = getDynamicPeriodLabel(period || "hari");

  const { orders, userProfile, storeSettings } = useDatabase();

  const filteredOrders = React.useMemo(() => {
    let startD: Date;
    let endD: Date = new Date();
    endD.setHours(23, 59, 59, 999);

    if (period === "7hari") {
      startD = new Date();
      startD.setDate(startD.getDate() - 6);
      startD.setHours(0, 0, 0, 0);
    } else if (period === "30hari") {
      startD = new Date();
      startD.setDate(startD.getDate() - 29);
      startD.setHours(0, 0, 0, 0);
    } else if (period === "custom" && start) {
      startD = new Date(start);
      startD.setHours(0, 0, 0, 0);
      if (end) {
        endD = new Date(end);
        endD.setHours(23, 59, 59, 999);
      }
    } else {
      // hari
      startD = new Date();
      startD.setHours(0, 0, 0, 0);
    }

    return orders.filter(o => {
      const oDate = new Date(o.date);
      return o.status === "selesai" && oDate >= startD && oDate <= endD;
    });
  }, [orders, period, start, end]);

  const reportData = React.useMemo(() => {
    const productStats: Record<string, { name: string, qty: number, price: number }> = {};
    const discounts: any[] = [];

    filteredOrders.forEach(o => {
      if (o.items) {
        o.items.forEach(i => {
          const key = i.product?.id || i.id || i.name;
          if (!productStats[key]) {
            productStats[key] = { name: i.product?.name || i.name, qty: 0, price: i.product?.price || i.price };
          }
          productStats[key].qty += i.qty;
        });
      }
      if (o.discountAmount && o.discountAmount > 0) {
        discounts.push({
          id: o.id,
          label: `Diskon Pesanan #${o.id}`,
          amount: o.discountAmount,
          type: o.discountType || 'rp',
          persen: o.discountValue || null
        });
      }
    });

    return {
      storeName: storeSettings?.storeName || "NAMA TOKO BELUM DIATUR",
      storeAddress: storeSettings?.storeAddress || "ALAMAT TOKO BELUM DIATUR",
      printedAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
      periodLabel,
      products: Object.values(productStats),
      discounts,
      userName: userProfile?.displayName || auth.currentUser?.displayName || "Admin"
    };
  }, [filteredOrders, userProfile, periodLabel, storeSettings]);

  const grossTotal = reportData.products.reduce((s, p) => s + p.qty * p.price, 0);
  const totalDiskon = reportData.discounts.reduce((s, d) => s + d.amount, 0);
  const pendapatan = grossTotal - totalDiskon;

  const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; color: #1a1a1a; padding: 20px; }
        .lap-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 16px; border-bottom: 2px solid #1a6640; }
        .lap-store-name { font-size: 18px; font-weight: 800; color: #1a1a1a; margin-bottom: 3px; }
        .lap-store-sub { font-size: 12px; color: #888; }
        .lap-title-block { text-align: right; }
        .lap-title { font-size: 14px; font-weight: 700; color: #1a6640; text-transform: uppercase; }
        .lap-period { font-size: 12px; color: #888; margin-top: 3px; }
        .lap-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1a6640; margin: 15px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e8f5ee; }
        .lap-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .lap-table th { text-align: left; font-weight: 700; color: #888; padding: 8px; border-bottom: 1px solid #eee; font-size: 11px; text-transform: uppercase; }
        .lap-table td { padding: 8px; border-bottom: 1px solid #f5f5f5; color: #333; }
        .lap-totals { display: flex; gap: 10px; margin-top: 15px; }
        .lap-total-box { flex: 1; padding: 12px; border-radius: 8px; }
        .lap-total-box.gross { background: #eaf3de; }
        .lap-total-box.disc { background: #faeeda; }
        .lap-total-box.net { background: #1a6640; color: #fff; }
        .lap-total-label { font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 5px; }
        .lap-total-value { font-size: 15px; font-weight: 800; }
        .disc-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; background: #faeeda; color: #854f0b; }
        .lap-footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .lap-footer-note { font-size: 11px; color: #aaa; max-width: 50%; }
        .lap-signature { text-align: right; }
        .lap-signature-label { font-size: 11px; color: #888; margin-bottom: 40px; }
        .lap-signature-name { font-size: 12px; font-weight: 600; border-top: 1px solid #bbb; padding-top: 5px; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="lap-header">
        <div>
          <div class="lap-store-name">${reportData.storeName}</div>
          <div class="lap-store-sub">${reportData.storeAddress}</div>
          <div class="lap-store-sub">Dicetak: ${reportData.printedAt}</div>
        </div>
        <div class="lap-title-block">
          <div class="lap-title">Laporan Penjualan</div>
          <div class="lap-period">${reportData.periodLabel}</div>
        </div>
      </div>

      <div class="lap-section-title">Rincian Produk Terjual</div>
      <table class="lap-table">
        <thead>
          <tr><th>Nama Produk</th><th style="text-align:center">Jumlah</th><th style="text-align:right">Subtotal</th></tr>
        </thead>
        <tbody>
          ${reportData.products.map(p => `
            <tr>
              <td>${p.name}</td>
              <td style="text-align:center">${p.qty}</td>
              <td style="text-align:right; font-weight:600;">${fmt(p.qty * p.price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; margin-top:10px; font-weight:700; font-size:13px; color:#1a6640; border-top:1px solid #eee; padding-top:10px;">
        <span>Total Pendapatan Kotor</span>
        <span>${fmt(grossTotal)}</span>
      </div>

      <div class="lap-section-title">Rincian Diskon</div>
      <table class="lap-table">
        <thead>
          <tr><th>ID Pesanan</th><th style="text-align:right">Potongan</th></tr>
        </thead>
        <tbody>
          ${reportData.discounts.map(d => `
            <tr>
              <td style="font-family:monospace;font-size:11px">${d.id}</td>
              <td style="text-align:right; color:#854f0b; font-weight:600;">
                ${d.type === 'persen' ? `(${d.persen}%) ` : ''}${fmt(d.amount)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top:15px; border-top:2px solid #eee; padding-top:10px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:12px; font-weight:600; color:#854f0b;">
            <span>Total Diskon</span>
            <span>-${fmt(totalDiskon)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:800; color:#1a6640; margin-top:5px; border-top:1px dashed #ccc; padding-top:8px;">
            <span>Total Pendapatan</span>
            <span>${fmt(pendapatan)}</span>
        </div>
      </div>

      <div class="lap-footer">
        <div class="lap-footer-note"></div>
        <div class="lap-signature">
          <div class="lap-signature-label">Mengetahui,</div>
          <div class="lap-signature-name">${reportData.userName}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const handlePrint = async () => {
    try {
      if (Platform.OS === "web") {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
      }
    } catch (error) {
      console.error(error);
      setDialogContext({ title: "Error", message: "Gagal mencetak laporan" });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#444" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cetak Laporan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.previewLabel}>Preview Laporan</Text>
        
        <View style={styles.card}>
          <View style={styles.reportHeader}>
            <View>
              <Text style={styles.storeName}>{reportData.storeName}</Text>
              <Text style={styles.storeSub}>{reportData.storeAddress}</Text>
              <Text style={styles.storeSub}>Dicetak: {reportData.printedAt}</Text>
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.reportTitle}>Laporan Penjualan</Text>
              <Text style={styles.periodLabelText}>{reportData.periodLabel}</Text>
            </View>
          </View>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Rincian Produk Terjual</Text>
          </View>

          {reportData.products.map((p, idx) => (
            <View key={idx} style={styles.productRow}>
              <Text style={styles.productName}>{p.name}</Text>
              <Text style={styles.productQty}>{p.qty}</Text>
              <Text style={styles.productSub}>{fmt(p.qty * p.price)}</Text>
            </View>
          ))}

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 10 }}>
            <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primary }}>Total Pendapatan Kotor</Text>
            <Text style={{ fontSize: 13, fontFamily: "Inter_800ExtraBold", color: colors.primary }}>{fmt(grossTotal)}</Text>
          </View>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Rincian Diskon</Text>
          </View>

          {reportData.discounts.map((d, idx) => (
            <View key={idx} style={styles.discountRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.discountId}>{d.id}</Text>
              </View>
              <Text style={[styles.productSub, { color: colors.stokWarnText }]}>
                {d.type === 'persen' ? `(${d.persen}%) ` : ''}{fmt(d.amount)}
              </Text>
            </View>
          ))}

          <View style={{ marginTop: 15, borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.stokWarnText }}>Total Diskon</Text>
              <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: colors.stokWarnText }}>-{fmt(totalDiskon)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6, borderTopWidth: 1, borderTopColor: colors.border, borderStyle: "dashed", paddingTop: 8 }}>
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.primary }}>Total Pendapatan</Text>
              <Text style={{ fontSize: 15, fontFamily: "Inter_800ExtraBold", color: colors.primary }}>{fmt(pendapatan)}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerNote}></Text>
            <View style={styles.signature}>
              <Text style={styles.signatureLabel}>Mengetahui,</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{reportData.userName}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.btnCancelText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrint} onPress={handlePrint} activeOpacity={0.8}>
          <Printer size={18} color="#fff" />
          <Text style={styles.btnPrintText}>Cetak Laporan</Text>
        </TouchableOpacity>
      </View>
      <DialogOverlay context={dialogContext} onClose={() => setDialogContext(null)} />
    </View>
  );
}
// sync-trigger


