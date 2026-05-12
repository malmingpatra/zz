import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../_hooks/useColors";
import { CartItem } from "../_context/CartContext";
import { useDatabase } from "../_context/DatabaseContext";

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discountType: "pct" | "rp";
  discountValue: number;
  discountAmount: number;
  total: number;
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function ReceiptModal({
  visible,
  onClose,
  cartItems,
  subtotal,
  discountType,
  discountValue,
  discountAmount,
  total,
}: ReceiptModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { storeSettings } = useDatabase();
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const noStruk = "INV-" + Date.now().toString().slice(-6);

  const s = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    paper: {
      backgroundColor: colors.card,
      borderRadius: 12,
      width: "100%",
      maxHeight: "80%",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: "center",
    },
    storeName: {
      color: colors.primaryForeground,
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      letterSpacing: 1,
      textAlign: "center",
    },
    storeTagline: {
      color: colors.primaryForeground,
      opacity: 0.8,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
      textAlign: "center",
    },
    scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    meta: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    metaText: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    divider: {
      borderStyle: "dashed",
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 10,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 7,
    },
    itemName: {
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      flex: 1,
    },
    itemQtyPrice: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "right",
      marginLeft: 8,
    },
    itemTotal: {
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginLeft: 8,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    summaryValue: {
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    discountLabel: {
      fontSize: 13,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
    },
    discountValue: {
      fontSize: 13,
      color: colors.destructive,
      fontFamily: "Inter_500Medium",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    totalLabel: {
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    totalValue: {
      fontSize: 15,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    thankyou: {
      textAlign: "center",
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 16,
      marginBottom: 4,
    },
    closeBtn: {
      margin: 16,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
    },
    closeBtnText: {
      color: colors.primaryForeground,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.paper}>
          <View style={s.header}>
            <Text style={s.storeName}>{storeSettings?.storeName || "NAMA TOKO"}</Text>
            <Text style={s.storeTagline}>{storeSettings?.storeAddress || "ALAMAT TOKO"}</Text>
          </View>

          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
            <View style={s.meta}>
              <Text style={s.metaText}>No: {noStruk}</Text>
              <Text style={s.metaText}>{dateStr}</Text>
              <Text style={s.metaText}>{timeStr}</Text>
            </View>

            <View style={s.divider} />

            {cartItems.map((item) => (
              <View key={item.product.id} style={s.itemRow}>
                <Text style={s.itemName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={s.itemQtyPrice}>
                  {item.qty}x {fmt(item.product.price)}
                </Text>
                <Text style={s.itemTotal}>
                  {fmt(item.product.price * item.qty)}
                </Text>
              </View>
            ))}

            <View style={s.divider} />

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>
                {cartItems.reduce((s, i) => s + i.qty, 0)} item · Subtotal
              </Text>
              <Text style={s.summaryValue}>{fmt(subtotal)}</Text>
            </View>

            {discountAmount > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.discountLabel}>
                  Diskon ({discountType === "pct" ? discountValue + "%" : fmt(discountValue)})
                </Text>
                <Text style={s.discountValue}>- {fmt(discountAmount)}</Text>
              </View>
            )}

            <View style={s.divider} />

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL BAYAR</Text>
              <Text style={s.totalValue}>{fmt(total)}</Text>
            </View>

            <Text style={s.thankyou}>— Terima Kasih Sudah Berbelanja —</Text>
          </ScrollView>

          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={s.closeBtnText}>Tutup Struk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
