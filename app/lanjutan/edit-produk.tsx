import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  AlertCircle, 
  ArrowLeft, 
  Layers, 
  Tag, 
  ShoppingCart 
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "../_hooks/useColors";
import { useCart } from "../_context/CartContext";

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const DESCRIPTIONS: Record<string, string> = {
  "1": "Es teh manis segar dengan gula asli, diseduh dari teh pilihan. Cocok diminum dingin sebagai teman makan siang.",
  "2": "Ayam goreng crispy bumbu rempah khas dengan kulit garing dan dagingnya tetap juicy. Cocok disajikan dengan nasi putih hangat dan sambal.",
  "3": "Air mineral murni dalam kemasan higienis. Sumber hidrasi terpercaya untuk aktivitas sehari-hari.",
  "4": "Mie instan dengan bumbu khas, siap saji dalam hitungan menit. Tersedia berbagai varian rasa.",
  "5": "Beras premium pilihan, pulen dan harum. Kemasan 5 kg cukup untuk kebutuhan keluarga selama seminggu.",
  "6": "Minyak goreng refinery berkualitas tinggi, jernih dan sehat untuk menggoreng berbagai masakan.",
  "7": "Kopi sachet praktis dengan rasa nikmat. Tersedia rasa original, susu, dan gula aren.",
  "8": "Indomie goreng legendaris dengan bumbu rempah khas. Favorit semua kalangan, enak disajikan panas maupun dingin.",
  "9": "Susu UHT full cream dalam kemasan siap minum. Kaya protein dan kalsium untuk pertumbuhan optimal.",
  "10": "Rokok kretek filter dengan campuran tembakau dan cengkeh pilihan. Untuk konsumen dewasa.",
};

export default function ProductDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { produk_id } = useLocalSearchParams<{ produk_id: string }>();
  const { products, addToCart } = useCart();

  const product = products.find((p) => p.id === produk_id);
  const [qty, setQty] = useState(1);
  const [qtyText, setQtyText] = useState("1");

  if (!product) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <AlertCircle size={36} color={colors.mutedForeground} />
        <Text style={{ marginTop: 10, fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          Produk tidak ditemukan
        </Text>
      </View>
    );
  }

  const isOut = product.stock === 0;
  const maxQty = product.stock;

  function changeQty(delta: number) {
    const next = Math.max(1, Math.min(maxQty, qty + delta));
    setQty(next);
    setQtyText(String(next));
  }

  function handleQtyChange(text: string) {
    setQtyText(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      setQty(Math.min(parsed, maxQty));
    }
  }

  function handleQtyBlur() {
    const parsed = parseInt(qtyText, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQty(1);
      setQtyText("1");
    } else {
      const clamped = Math.min(parsed, maxQty);
      setQty(clamped);
      setQtyText(String(clamped));
    }
  }

  function handleAdd() {
    for (let i = 0; i < qty; i++) {
      addToCart(product.id);
    }
    router.back();
  }

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
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: insets.bottom + 80 },
    hero: {
      backgroundColor: colors.card,
      margin: 12, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    heroInfo: { padding: 16 },
    heroName: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 8 },
    catBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.secondary,
      paddingHorizontal: 10, paddingVertical: 3,
      borderRadius: 20,
    },
    catBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    section: {
      marginHorizontal: 12, marginBottom: 10,
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      padding: 14,
    },
    secLabel: {
      fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12,
    },
    statRow: { flexDirection: "row", gap: 10 },
    statBox: {
      flex: 1, backgroundColor: colors.secondary, borderRadius: 10, padding: 12,
      alignItems: "center",
    },
    statBoxLabel: {
      flexDirection: "row", alignItems: "center", gap: 4,
      marginBottom: 6,
    },
    statBoxLabelText: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    statBoxValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
    descText: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 22 },
    qtySection: {
      marginHorizontal: 12, marginBottom: 10,
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      padding: 14, flexDirection: "row", alignItems: "center",
    },
    qtyLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    qtyCtrl: { flexDirection: "row", alignItems: "center", gap: 10 },
    qtyBtn: {
      width: 34, height: 34, borderRadius: 9,
      borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center",
    },
    qtyBtnText: { fontSize: 20, fontFamily: "Inter_600SemiBold", color: colors.foreground, lineHeight: 24 },
    qtyInput: {
      width: 52, height: 36,
      borderWidth: 1.5, borderColor: colors.primary,
      borderRadius: 8, backgroundColor: colors.accent,
      fontSize: 16, fontFamily: "Inter_700Bold", color: colors.primary,
      textAlign: "center", padding: 0,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0 } as object) : {}),
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
    addBtn: {
      flex: 1.6, height: 46,
      backgroundColor: isOut ? colors.border : colors.primary,
      borderRadius: 12,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    },
    addBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primaryForeground },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detail Produk</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroInfo}>
            <Text style={s.heroName}>{product.name}</Text>
            <View style={s.catBadge}>
              <Text style={s.catBadgeText}>{product.category}</Text>
            </View>
          </View>
        </View>

        {/* Stok & Harga */}
        <View style={s.section}>
          <Text style={s.secLabel}>Stok & Harga</Text>
          <View style={s.statRow}>
            <View style={s.statBox}>
              <View style={s.statBoxLabel}>
                <Layers size={12} color={colors.mutedForeground} />
                <Text style={s.statBoxLabelText}>Stok</Text>
              </View>
              <Text style={s.statBoxValue}>{product.stock}</Text>
            </View>
            <View style={s.statBox}>
              <View style={s.statBoxLabel}>
                <Tag size={12} color={colors.mutedForeground} />
                <Text style={s.statBoxLabelText}>Harga Satuan</Text>
              </View>
              <Text style={[s.statBoxValue, { color: colors.primary, fontSize: 15 }]}>{fmt(product.price)}</Text>
            </View>
          </View>
        </View>

        {/* Deskripsi */}
        <View style={s.section}>
          <Text style={s.secLabel}>Deskripsi</Text>
          <Text style={s.descText}>{DESCRIPTIONS[product.id] ?? "Belum ada deskripsi untuk produk ini."}</Text>
        </View>

        {/* Qty */}
        <View style={s.qtySection}>
          <Text style={s.qtyLabel}>Jumlah</Text>
          <View style={s.qtyCtrl}>
            <TouchableOpacity style={s.qtyBtn} onPress={() => changeQty(-1)} activeOpacity={0.7}>
              <Text style={s.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={s.qtyInput}
              value={qtyText}
              onChangeText={handleQtyChange}
              onBlur={handleQtyBlur}
              keyboardType="number-pad"
              selectTextOnFocus
              returnKeyType="done"
              maxLength={4}
            />
            <TouchableOpacity style={s.qtyBtn} onPress={() => changeQty(1)} activeOpacity={0.7}>
              <Text style={s.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={s.bottomActions}>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={s.cancelBtnText}>Tutup</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.85} disabled={isOut}>
          <ShoppingCart size={16} color={colors.primaryForeground} />
          <Text style={s.addBtnText}>{isOut ? "Stok Habis" : "Tambah Keranjang"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
// sync-trigger
