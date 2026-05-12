import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  ArrowLeft, 
  Tag, 
  Folder, 
  Layers, 
  DollarSign, 
  FileText, 
  Plus 
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/_hooks/useColors";
import { useAutoCloseDialog, DialogOverlay } from "@/_components/DialogOverlay";

import { useDatabase } from "@/_context/DatabaseContext";

const CATEGORIES = ["Minuman", "Makanan", "Sembako", "Lainnya"];

export default function TambahProdukScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addProduct, updateProduct, deleteProduct, products } = useDatabase();
  const { dialogContext, setDialogContext } = useAutoCloseDialog();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = !!id;

  const tryGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: "/lanjutan/dashboard", params: { tab: "produk" } });
    }
  };

  React.useEffect(() => {
    if (isEdit) {
      const p = products.find(prod => prod.id === id);
      if (p) {
        setName(p.name);
        setCategory(p.category);
        setStock(p.stock.toString());
        setPrice(p.price.toString());
        setDesc(p.desc || "");
      }
    }
  }, [id, products]);

  async function handleSubmit() {
    if (!name.trim() || !category.trim() || !stock || !price) {
      setDialogContext({
        title: "Lengkapi Data",
        message: "Mohon lengkapi Nama, Kategori, Stok, dan Harga."
      });
      return;
    }

    try {
      if (isEdit) {
        const productId = Array.isArray(id) ? id[0] : id;
        await updateProduct({
          id: productId,
          name: name.trim(),
          category: category.trim(),
          price: parseInt(price, 10) || 0,
          stock: parseInt(stock, 10) || 0,
          stockStatus: parseInt(stock, 10) > 10 ? "ok" : "warn",
          desc: desc.trim(),
        });
        setDialogContext({
          title: "Berhasil",
          message: `Produk "${name}" berhasil diperbarui!`,
          onCancel: tryGoBack,
          onConfirm: tryGoBack
        });
      } else {
        await addProduct({
          id: "prod-" + Date.now().toString(),
          name: name.trim(),
          category: category.trim(),
          price: parseInt(price, 10) || 0,
          stock: parseInt(stock, 10) || 0,
          stockStatus: parseInt(stock, 10) > 10 ? "ok" : "warn",
          desc: desc.trim(),
        });
        setDialogContext({
          title: "Berhasil",
          message: `Produk "${name}" berhasil ditambahkan!`,
          onCancel: tryGoBack,
          onConfirm: tryGoBack
        });
      }
    } catch (e: any) {
      setDialogContext({
        title: "Error",
        message: `Gagal ${isEdit ? "memperbarui" : "menambahkan"}: ` + e.message
      });
    }
  }

  async function handleDelete() {
    const productId = Array.isArray(id) ? id[0] : id;
    try {
      await deleteProduct(productId);
      setDialogContext({
        title: "Berhasil",
        message: "Produk berhasil dihapus!",
        onCancel: () => router.replace({ pathname: "/lanjutan/dashboard", params: { tab: "produk" } }),
        onConfirm: () => router.replace({ pathname: "/lanjutan/dashboard", params: { tab: "produk" } })
      });
    } catch (e: any) {
      setDialogContext({
        title: "Error",
        message: "Gagal menghapus: " + e.message
      });
    }
  }

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
    scrollContent: { padding: 14, gap: 10, paddingBottom: insets.bottom + 80 },
    fieldGroup: {
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      overflow: "hidden",
    },
    fieldRow: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, minHeight: 52,
      borderBottomWidth: 1, borderBottomColor: colors.secondary,
    },
    fieldRowLast: { borderBottomWidth: 0 },
    fieldRowFocused: { backgroundColor: colors.secondary + "20" },
    fieldIcon: {
      width: 32, alignItems: "center", justifyContent: "center",
    },
    fieldInner: { flex: 1, paddingVertical: 8, paddingHorizontal: 10 },
    fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 2 },
    fieldInput: {
      fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground,
      padding: 0,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0 } as object) : {}),
    },
    halfRow: { flexDirection: "row", gap: 10 },
    prefixText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground, paddingRight: 3 },
    textArea: {
      fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground,
      padding: 0, minHeight: 72, lineHeight: 22,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0 } as object) : {}),
    },
    catChipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 6 },
    catChip: {
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.card,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    catChipTextActive: { color: colors.primaryForeground },
    optionalTag: {
      fontSize: 10, fontFamily: "Inter_500Medium", color: colors.mutedForeground,
      backgroundColor: colors.secondary, paddingHorizontal: 7, paddingVertical: 2,
      borderRadius: 20, marginLeft: 4, overflow: "hidden",
    },
    labelRow: { flexDirection: "row", alignItems: "center" },
    bottom: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      flexDirection: "column", gap: 8,
      padding: 12, paddingBottom: insets.bottom + 12,
      backgroundColor: colors.background,
    },
    cancelBtn: {
      height: 46, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      alignItems: "center", justifyContent: "center", flex: 1,
    },
    cancelBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    deleteBtn: {
      height: 46, backgroundColor: colors.destructive + "15",
      borderWidth: 1, borderColor: colors.destructive + "30", borderRadius: 12,
      alignItems: "center", justifyContent: "center", flex: 1,
    },
    deleteBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.destructive },
    addBtn: {
      height: 46,
      backgroundColor: colors.primary, borderRadius: 12,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, flex: 1,
    },
    addBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primaryForeground },
    addBtnBlock: {
      height: 46,
      backgroundColor: colors.primary, borderRadius: 12,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    },
  });

  function iconColor(field: string) {
    return focusedField === field ? colors.primary : colors.mutedForeground + "80";
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={tryGoBack} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#444" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEdit ? "Edit Produk" : "Tambah Produk"}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Nama Produk */}
        <View style={s.fieldGroup}>
          <View style={[s.fieldRow, s.fieldRowLast, focusedField === "name" && s.fieldRowFocused]}>
            <View style={s.fieldIcon}>
              <Tag size={16} color={iconColor("name")} />
            </View>
            <View style={s.fieldInner}>
              <Text style={s.fieldLabel}>Nama Produk</Text>
              <TextInput
                style={s.fieldInput}
                value={name}
                onChangeText={setName}
                placeholder="cth. Ayam Goreng"
                placeholderTextColor="#ccc"
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
        </View>

        {/* Kategori */}
        <View style={s.fieldGroup}>
          <View style={[s.fieldRow, s.fieldRowLast, focusedField === "category" && s.fieldRowFocused]}>
            <View style={s.fieldIcon}>
              <Folder size={16} color={iconColor("category")} />
            </View>
            <View style={s.fieldInner}>
              <Text style={s.fieldLabel}>Kategori</Text>
              <TextInput
                style={s.fieldInput}
                value={category}
                onChangeText={setCategory}
                placeholder="cth. Makanan, Minuman"
                placeholderTextColor="#ccc"
                onFocus={() => setFocusedField("category")}
                onBlur={() => setFocusedField(null)}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
        </View>

        {/* Stok & Harga */}
        <View style={s.halfRow}>
          <View style={[s.fieldGroup, { flex: 1 }]}>
            <View style={[s.fieldRow, s.fieldRowLast, focusedField === "stock" && s.fieldRowFocused]}>
              <View style={s.fieldIcon}>
                <Layers size={16} color={iconColor("stock")} />
              </View>
              <View style={s.fieldInner}>
                <Text style={s.fieldLabel}>Stok</Text>
                <TextInput
                  style={s.fieldInput}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="0"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  onFocus={() => setFocusedField("stock")}
                  onBlur={() => setFocusedField(null)}
                  underlineColorAndroid="transparent"
                />
              </View>
            </View>
          </View>
          <View style={[s.fieldGroup, { flex: 1 }]}>
            <View style={[s.fieldRow, s.fieldRowLast, focusedField === "price" && s.fieldRowFocused]}>
              <View style={s.fieldIcon}>
                <DollarSign size={16} color={iconColor("price")} />
              </View>
              <View style={s.fieldInner}>
                <Text style={s.fieldLabel}>Harga</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={s.prefixText}>Rp</Text>
                  <TextInput
                    style={[s.fieldInput, { flex: 1 }]}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0"
                    placeholderTextColor="#ccc"
                    keyboardType="number-pad"
                    onFocus={() => setFocusedField("price")}
                    onBlur={() => setFocusedField(null)}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Deskripsi */}
        <View style={s.fieldGroup}>
          <View style={[s.fieldRow, s.fieldRowLast, { alignItems: "flex-start", paddingTop: 12, paddingBottom: 12 }, focusedField === "desc" && s.fieldRowFocused]}>
            <View style={[s.fieldIcon, { marginTop: 2 }]}>
              <FileText size={16} color={iconColor("desc")} />
            </View>
            <View style={s.fieldInner}>
              <View style={s.labelRow}>
                <Text style={s.fieldLabel}>Deskripsi</Text>
                <Text style={s.optionalTag}>Opsional</Text>
              </View>
              <TextInput
                style={s.textArea}
                value={desc}
                onChangeText={setDesc}
                placeholder="Tambahkan deskripsi produk..."
                placeholderTextColor="#ccc"
                multiline
                numberOfLines={3}
                onFocus={() => setFocusedField("desc")}
                onBlur={() => setFocusedField(null)}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={s.bottom}>
        {isEdit ? (
          <View style={{ flexDirection: "column", gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {confirmDelete ? (
                <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                  <Text style={s.deleteBtnText}>Yakin Hapus?</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.deleteBtn} onPress={() => setConfirmDelete(true)} activeOpacity={0.8}>
                  <Text style={s.deleteBtnText}>Hapus</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.cancelBtn} onPress={tryGoBack} activeOpacity={0.8}>
                <Text style={s.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.addBtnBlock} onPress={handleSubmit} activeOpacity={0.85}>
              <Text style={s.addBtnText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={s.cancelBtn} onPress={tryGoBack} activeOpacity={0.8}>
              <Text style={s.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.addBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <Plus size={16} color="#fff" />
              <Text style={s.addBtnText}>Tambah Produk</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Dialog Overlay */}
      <DialogOverlay context={dialogContext} onClose={() => setDialogContext(null)} />
    </View>
  );
}
