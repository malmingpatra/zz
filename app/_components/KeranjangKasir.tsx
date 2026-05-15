import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  LayoutAnimation,
  UIManager,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  CheckCircle 
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColors } from "../_hooks/useColors";
import { useCart, CartItem } from "../_context/CartContext";
import { useDatabase } from "../_context/DatabaseContext";
import { auth } from "../_context/firebase-setup";
import { serverTimestamp } from "firebase/firestore";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

interface KeranjangKasirProps {
  visible: boolean;
  onClose: () => void;
}

export default function KeranjangKasir({ visible, onClose }: KeranjangKasirProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartItems, updateQty, removeFromCart, clearCart, subtotal, totalItems } = useCart();
  const { members, addOrder, userProfile } = useDatabase();

  const [discountType, setDiscountType] = useState<"pct" | "rp">("pct");
  const [discountInput, setDiscountInput] = useState("");
  const [kasirVisible, setKasirVisible] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  
  const discountValue = parseFloat(discountInput) || 0;
  const discountAmount =
    discountType === "pct"
      ? Math.round((subtotal * discountValue) / 100)
      : Math.min(discountValue, subtotal);
  const total = Math.max(0, subtotal - discountAmount);
  const Icon = kasirVisible ? ChevronDown : ChevronUp;

  const topInset = Platform.OS === "web" ? 0 : insets.top;
  // consistent bottom padding across all sections
  const sectionBottom = (Platform.OS === "web" ? 0 : insets.bottom) + 12;

  const toggleKasir = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setKasirVisible((v) => !v);
  };

  const startEditQty = (item: CartItem) => {
    setEditingId(item.product.id);
    setEditQty(String(item.qty));
  };

  const commitEditQty = (item: CartItem) => {
    const parsed = parseInt(editQty, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(parsed, item.product.stock);
      if (parsed > item.product.stock) {
        Alert.alert("Stok tidak cukup", `Stok tersedia hanya ${item.product.stock} item.`);
      }
      updateQty(item.product.id, clamped);
    } else if (parsed === 0) {
      removeFromCart(item.product.id);
    }
    setEditingId(null);
    setEditQty("");
  };

  const handleIncrease = (item: CartItem) => {
    if (item.qty >= item.product.stock) {
      Alert.alert("Stok tidak cukup", `Stok tersedia hanya ${item.product.stock} item.`);
      return;
    }
    updateQty(item.product.id, item.qty + 1);
  };

  const handleCheckout = async (shouldPrint: boolean) => {
    if (cartItems.length === 0) return;
    
    // Save order
    const orderTotal = Math.max(0, subtotal - discountAmount);
    const now = new Date();
    const orderId = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}X${Math.floor(Math.random() * 900) + 100}`;
    
    const currentUser = auth.currentUser;

    await addOrder({
      id: orderId,
      userId: currentUser?.uid || "",
      buyer: shouldPrint ? "Pelanggan Umum" : (userProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : "Pembeli")), 
      staff: shouldPrint ? (userProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : "Staf")) : "",
      total: orderTotal,
      cat: cartItems[0]?.product?.category || "lainnya",
      date: now.toISOString().split("T")[0],
      createdAt: serverTimestamp(),
      status: shouldPrint ? "selesai" : "menunggu",
      items: cartItems.map(val => ({
        id: val.product.id,
        name: val.product.name,
        price: val.product.price,
        qty: val.qty
      })),
      phone: shouldPrint ? "-" : (userProfile?.phoneNumber || "-"),
      address: shouldPrint ? "-" : (userProfile?.address || "-"),
      subtotal: subtotal,
      discountType: discountType as any,
      discountValue: discountValue,
      discountAmount: discountAmount
    });

    setDiscountInput("");

    if (shouldPrint) {
      onClose();
      router.push({
        pathname: "/cetak-nota",
        params: {
          orderId: orderId,
        },
      });
    } else {
      clearCart();
      onClose();
      Alert.alert("Sukses", "Pesanan berhasil disimpan!");
    }
  };

  const s = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    /* Header */
    header: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingTop: topInset + 8,
      paddingBottom: 14,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
    },
    headerLeft: { flex: 1 },
    headerTitle: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      letterSpacing: -0.4,
    },
    headerSubtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 2,
    },
    kosongkanBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: "#FFF0EE",
      borderWidth: 1,
      borderColor: "#F5C4BE",
    },
    kosongkanText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.destructive,
    },

    /* Items */
    itemsScroll: { flex: 1 },
    itemsContent: { padding: 12, gap: 3 },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingVertical: 11,
      paddingHorizontal: 13,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemInfo: { flex: 1, minWidth: 0 },
    itemName: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    itemUnitPrice: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    qtyControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginHorizontal: 10,
    },
    qtyBtn: {
      width: 30,
      height: 30,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    qtyBtnPlus: {
      backgroundColor: colors.accent,
      borderColor: colors.primary,
    },
    qtyTouchable: {
      width: 48,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      textAlign: "center",
    },
    qtyInput: {
      width: 48,
      height: 32,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.accent,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
      textAlign: "center",
      padding: 0,
    },
    deleteBtn: {
      width: 30,
      height: 30,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },

    /* Empty */
    emptyCart: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 64,
      gap: 10,
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    emptyHint: {
      fontSize: 12,
      color: colors.border,
      fontFamily: "Inter_400Regular",
    },

    /* Divider */
    divider: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 11,
      gap: 8,
      backgroundColor: colors.background,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
    dividerText: {
      fontSize: 10,
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 1.2,
    },

    /* Kasir ON section */
    kasirSection: {
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: sectionBottom,
      gap: 10,
      overflow: "hidden",
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
    discountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
    hairline: { height: 1, backgroundColor: colors.border },
    totalPayRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalPayLabel: {
      fontSize: 16,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    totalPayValue: {
      fontSize: 22,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.5,
    },

    /* Discount block — two rows */
    discountBlock: { gap: 6 },
    discountTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    discountInputLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    typeToggle: { flexDirection: "row", gap: 4 },
    typeBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondary,
    },
    typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeBtnText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
    },
    typeBtnTextActive: { color: "#fff" },
    discountInputField: {
      width: "100%",
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      textAlign: "right",
    },

    /* Shared button base — IDENTICAL across all sections */
    actionBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },

    /* Kasir ON — cetak button */
    cetakBtn: { backgroundColor: colors.primary },
    cetakBtnDisabled: { opacity: 0.4 },
    cetakText: { fontSize: 15, color: "#fff", fontFamily: "Inter_700Bold" },

    /* Kasir OFF section — SAME paddingBottom as kasirSection */
    pesanSection: {
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: sectionBottom,
      gap: 10,
      overflow: "hidden",
    },
    pesanTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    pesanCount: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    pesanTotal: {
      fontSize: 22,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.5,
    },
    pesanBtnRow: { flexDirection: "row", gap: 10 },

    tutupBtn: {
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tutupText: { fontSize: 15, color: colors.foreground, fontFamily: "Inter_700Bold" },

    pesanBtn: { flex: 1.6, backgroundColor: colors.primary },
    pesanBtnDisabled: { opacity: 0.4 },
    pesanText: { fontSize: 15, color: "#fff", fontFamily: "Inter_700Bold" },
  });

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={s.screen}>

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={s.headerTitle}>Keranjang</Text>
            </View>
            <TouchableOpacity
              style={[s.kosongkanBtn, cartItems.length === 0 && { opacity: 0 }]}
              onPress={clearCart}
              activeOpacity={0.8}
              disabled={cartItems.length === 0}
            >
              <Text style={s.kosongkanText}>Kosongkan</Text>
            </TouchableOpacity>
          </View>

          {/* Items */}
          <ScrollView
            style={s.itemsScroll}
            contentContainerStyle={s.itemsContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {cartItems.length === 0 ? (
              <View style={s.emptyCart}>
                <ShoppingCart size={40} color={colors.border} />
                <Text style={s.emptyText}>Keranjang masih kosong</Text>
                <Text style={s.emptyHint}>Tekan + pada produk untuk menambahkan</Text>
              </View>
            ) : (
              cartItems.map((item) => {
                const isEditing = editingId === item.product.id;
                const atMax = item.qty >= item.product.stock;
                return (
                  <View key={item.product.id} style={s.itemRow}>
                    <View style={s.itemInfo}>
                      <Text style={s.itemName} numberOfLines={1}>{item.product.name}</Text>
                      <Text style={s.itemUnitPrice}>{fmt(item.product.price)}</Text>
                    </View>

                    <View style={s.qtyControls}>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() => updateQty(item.product.id, item.qty - 1)}
                        activeOpacity={0.7}
                      >
                        <Minus size={13} color={colors.foreground} />
                      </TouchableOpacity>

                      {isEditing ? (
                        <TextInput
                          style={s.qtyInput}
                          value={editQty}
                          onChangeText={setEditQty}
                          keyboardType="number-pad"
                          autoFocus
                          selectTextOnFocus
                          onBlur={() => commitEditQty(item)}
                          onSubmitEditing={() => commitEditQty(item)}
                          returnKeyType="done"
                          maxLength={4}
                        />
                      ) : (
                        <TouchableOpacity
                          style={s.qtyTouchable}
                          onPress={() => startEditQty(item)}
                          activeOpacity={0.6}
                        >
                          <Text style={s.qtyText}>{item.qty}</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[s.qtyBtn, s.qtyBtnPlus, atMax && { opacity: 0.35 }]}
                        onPress={() => handleIncrease(item)}
                        activeOpacity={0.7}
                      >
                        <Plus size={13} color={colors.primary} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => removeFromCart(item.product.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={15} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity style={s.divider} onPress={toggleKasir} activeOpacity={0.7}>
            <View style={s.dividerLine} />
            <View style={s.dividerLabel}>
              <Text style={s.dividerText}>
                {kasirVisible ? "TUTUP" : "BUKA"} FITUR KASIR
              </Text>
              <Icon
                size={11}
                color={colors.mutedForeground}
              />
            </View>
            <View style={s.dividerLine} />
          </TouchableOpacity>

          {/* Kasir ON */}
          {kasirVisible && (
            <View style={s.kasirSection}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>{totalItems} item · Subtotal</Text>
                <Text style={s.summaryValue}>{fmt(subtotal)}</Text>
              </View>

              {discountAmount > 0 && (
                <View style={s.discountRow}>
                  <Text style={s.discountLabel}>
                    Diskon ({discountType === "pct" ? discountValue + "%" : fmt(discountValue)})
                  </Text>
                  <Text style={s.discountValue}>- {fmt(discountAmount)}</Text>
                </View>
              )}

              <View style={s.hairline} />

              <View style={s.totalPayRow}>
                <Text style={s.totalPayLabel}>Total Bayar</Text>
                <Text style={s.totalPayValue}>{fmt(total)}</Text>
              </View>

              <View style={s.discountBlock}>
                <View style={s.discountTopRow}>
                  <Text style={s.discountInputLabel}>Diskon</Text>
                  <View style={s.typeToggle}>
                    <TouchableOpacity
                      style={[s.typeBtn, discountType === "pct" && s.typeBtnActive]}
                      onPress={() => { setDiscountType("pct"); setDiscountInput(""); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.typeBtnText, discountType === "pct" && s.typeBtnTextActive]}>%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.typeBtn, discountType === "rp" && s.typeBtnActive]}
                      onPress={() => { setDiscountType("rp"); setDiscountInput(""); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.typeBtnText, discountType === "rp" && s.typeBtnTextActive]}>Rp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TextInput
                  style={s.discountInputField}
                  value={discountInput}
                  onChangeText={setDiscountInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  returnKeyType="done"
                />
              </View>

              <TouchableOpacity
                style={[s.actionBtn, s.cetakBtn, cartItems.length === 0 && s.cetakBtnDisabled]}
                onPress={() => handleCheckout(true)}
                activeOpacity={0.85}
                disabled={cartItems.length === 0}
              >
                <Printer size={17} color="#fff" />
                <Text style={s.cetakText}>Beli + Cetak Struk</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Kasir OFF */}
          {!kasirVisible && (
            <View style={s.pesanSection}>
              <View style={s.pesanTopRow}>
                <Text style={s.pesanCount}>{totalItems} item</Text>
                <Text style={s.pesanTotal}>{fmt(subtotal)}</Text>
              </View>
              <View style={s.pesanBtnRow}>
                <TouchableOpacity
                  style={[s.actionBtn, s.tutupBtn]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={s.tutupText}>Tutup</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, s.pesanBtn, cartItems.length === 0 && s.pesanBtnDisabled]}
                  onPress={() => handleCheckout(false)}
                  activeOpacity={0.85}
                  disabled={cartItems.length === 0}
                >
                  <CheckCircle size={17} color="#fff" />
                  <Text style={s.pesanText}>Pesan</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </Modal>

    </>
  );
}
// sync-trigger
