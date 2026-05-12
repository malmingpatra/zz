import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useDatabase, Product } from "@/context/DatabaseContext";
import { useAutoCloseDialog, DialogOverlay } from "@/app/universal/components/DialogOverlay";

type EditField = "stok-harga" | "stok" | "harga";

interface DraftEdit {
  stock: string;
  price: string;
}

export default function EditMassalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products, updateProduct } = useDatabase();
  const { dialogContext, setDialogContext } = useAutoCloseDialog();

  // ── filter state ──
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("Semua");
  const [catOpen, setCatOpen] = useState(false);
  const [editField, setEditField] = useState<EditField>("stok-harga");

  // ── edits: productId → {stock, price} ──
  const [drafts, setDrafts] = useState<Record<string, DraftEdit>>({});

  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => { if (p.category) cats.add(p.category); });
    return ["Semua", ...Array.from(cats).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const matchQ = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = selectedCat === "Semua" || p.category === selectedCat;
        return matchQ && matchCat;
      })
      .sort((a, b) => {
        const catCmp = a.category.localeCompare(b.category);
        if (catCmp !== 0) return catCmp;
        return a.name.localeCompare(b.name);
      });
  }, [products, search, selectedCat]);

  // Count dirty items
  const dirtyCount = useMemo(() => {
    return Object.keys(drafts).filter((id) => {
      const d = drafts[id];
      const p = products.find((x) => x.id === id);
      if (!p) return false;
      if (editField === "stok") return d.stock !== "" && parseInt(d.stock) !== p.stock;
      if (editField === "harga") return d.price !== "" && parseInt(d.price) !== p.price;
      return (d.stock !== "" && parseInt(d.stock) !== p.stock) ||
             (d.price !== "" && parseInt(d.price) !== p.price);
    }).length;
  }, [drafts, products, editField]);

  function getDraft(id: string): DraftEdit {
    return drafts[id] ?? { stock: "", price: "" };
  }

  function setDraftField(id: string, field: "stock" | "price", val: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...getDraft(id), [field]: val },
    }));
    // mark as unsaved
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleSaveAll() {
    if (dirtyCount === 0) {
      setDialogContext({ title: "Tidak ada perubahan", message: "Belum ada nilai yang diubah." });
      return;
    }
    setSaving(true);
    try {
      const newSaved = new Set(savedIds);
      for (const id of Object.keys(drafts)) {
        const d = drafts[id];
        const p = products.find((x) => x.id === id);
        if (!p) continue;

        const newStock = d.stock !== "" ? parseInt(d.stock, 10) : p.stock;
        const newPrice = d.price !== "" ? parseInt(d.price, 10) : p.price;

        const stockChanged = editField !== "harga" && d.stock !== "" && newStock !== p.stock;
        const priceChanged = editField !== "stok" && d.price !== "" && newPrice !== p.price;

        if (!stockChanged && !priceChanged) continue;

        await updateProduct({
          ...p,
          stock: stockChanged ? newStock : p.stock,
          price: priceChanged ? newPrice : p.price,
          stockStatus: (stockChanged ? newStock : p.stock) <= 10 ? "warn" : "ok",
        });
        newSaved.add(id);
      }
      setSavedIds(newSaved);
      // Clear saved drafts
      setDrafts((prev) => {
        const next = { ...prev };
        newSaved.forEach((id) => delete next[id]);
        return next;
      });
      setDialogContext({ title: "Berhasil", message: `${newSaved.size - savedIds.size + newSaved.size} produk berhasil diperbarui.` });
    } catch (e: any) {
      setDialogContext({ title: "Gagal", message: e?.message || "Terjadi kesalahan saat menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: insets.top + 12,
      paddingBottom: 12,
      backgroundColor: colors.topbar,
      borderBottomWidth: 1,
      borderBottomColor: colors.topbarBorder,
      gap: 12,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 8,
      alignItems: "center", justifyContent: "center",
      backgroundColor: colors.secondary,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground,
    },
    saveBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 14, paddingVertical: 8,
      backgroundColor: colors.primary, borderRadius: 8,
    },
    saveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.primaryForeground },
    toolbar: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
    },
    searchBar: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.secondary, borderRadius: 8,
      paddingHorizontal: 10, height: 38, gap: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    searchInput: {
      flex: 1, fontSize: 13, fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    filterRow: { flexDirection: "row", gap: 8 },
    catDropBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 12, height: 34,
      backgroundColor: colors.secondary,
      borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    },
    catDropBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground },
    fieldChip: {
      paddingHorizontal: 12, height: 34,
      alignItems: "center", justifyContent: "center",
      borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    },
    fieldChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
    catDropdown: {
      position: "absolute", top: 42, left: 12, right: 12, zIndex: 99,
      backgroundColor: colors.card,
      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    },
    catItem: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: 14, paddingVertical: 11,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    catItemText: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground },
    listContainer: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24 },
    catHeader: {
      paddingHorizontal: 4, paddingVertical: 8,
      fontSize: 11, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    row: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 10,
      marginBottom: 6, gap: 10,
    },
    rowSaved: { borderColor: colors.stokOkBorder },
    rowDirty: { borderColor: colors.primary },
    productName: {
      flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    productCat: {
      fontSize: 11, fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    inputGroup: { alignItems: "flex-end", gap: 5 },
    inputLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    inputBox: {
      width: 90, height: 34, borderRadius: 7,
      borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 8,
      fontSize: 13, fontFamily: "Inter_400Regular",
      color: colors.foreground,
      backgroundColor: colors.secondary,
      textAlign: "right",
    },
    inputBoxDirty: { borderColor: colors.primary, backgroundColor: colors.card },
    dualInputs: { flexDirection: "row", gap: 8 },
    emptyBox: {
      alignItems: "center", justifyContent: "center",
      paddingVertical: 60,
    },
    emptyText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8 },
    dirtyBadge: {
      position: "absolute", right: 0,
      backgroundColor: colors.primary,
      borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
      minWidth: 20, alignItems: "center",
    },
    dirtyBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.primaryForeground },
  });

  // Group filtered by category
  type ListItem = { type: "header"; title: string } | { type: "product"; product: Product };
  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    let lastCat = "";
    for (const p of filtered) {
      if (p.category !== lastCat) {
        items.push({ type: "header", title: p.category });
        lastCat = p.category;
      }
      items.push({ type: "product", product: p });
    }
    return items;
  }, [filtered]);

  function renderItem({ item }: { item: ListItem }) {
    if (item.type === "header") {
      return <Text style={s.catHeader}>{item.title}</Text>;
    }
    const p = item.product;
    const d = getDraft(p.id);
    const stockDirty = editField !== "harga" && d.stock !== "" && parseInt(d.stock) !== p.stock;
    const priceDirty = editField !== "stok" && d.price !== "" && parseInt(d.price) !== p.price;
    const isDirty = stockDirty || priceDirty;
    const isSaved = savedIds.has(p.id);

    return (
      <View style={[s.row, isDirty && s.rowDirty, isSaved && !isDirty && s.rowSaved]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.productName} numberOfLines={2}>{p.name}</Text>
          <Text style={s.productCat}>{p.category}</Text>
        </View>

        {editField === "stok-harga" && (
          <View style={s.dualInputs}>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>STOK</Text>
              <TextInput
                style={[s.inputBox, stockDirty && s.inputBoxDirty]}
                keyboardType="numeric"
                value={d.stock}
                placeholder={String(p.stock)}
                placeholderTextColor={colors.mutedForeground}
                onChangeText={(v) => setDraftField(p.id, "stock", v.replace(/[^0-9]/g, ""))}
              />
            </View>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>HARGA</Text>
              <TextInput
                style={[s.inputBox, priceDirty && s.inputBoxDirty]}
                keyboardType="numeric"
                value={d.price}
                placeholder={String(p.price)}
                placeholderTextColor={colors.mutedForeground}
                onChangeText={(v) => setDraftField(p.id, "price", v.replace(/[^0-9]/g, ""))}
              />
            </View>
          </View>
        )}

        {editField === "stok" && (
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>STOK</Text>
            <TextInput
              style={[s.inputBox, { width: 80 }, stockDirty && s.inputBoxDirty]}
              keyboardType="numeric"
              value={d.stock}
              placeholder={String(p.stock)}
              placeholderTextColor={colors.mutedForeground}
              onChangeText={(v) => setDraftField(p.id, "stock", v.replace(/[^0-9]/g, ""))}
            />
          </View>
        )}

        {editField === "harga" && (
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>HARGA</Text>
            <TextInput
              style={[s.inputBox, { width: 100 }, priceDirty && s.inputBoxDirty]}
              keyboardType="numeric"
              value={d.price}
              placeholder={String(p.price)}
              placeholderTextColor={colors.mutedForeground}
              onChangeText={(v) => setDraftField(p.id, "price", v.replace(/[^0-9]/g, ""))}
            />
          </View>
        )}

        {isSaved && !isDirty && (
          <Check size={16} color={colors.stokOkText} />
        )}
      </View>
    );
  }

  const FIELD_OPTIONS: { key: EditField; label: string }[] = [
    { key: "stok-harga", label: "Stok & Harga" },
    { key: "stok", label: "Stok" },
    { key: "harga", label: "Harga" },
  ];

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Massal</Text>

        {/* Dirty badge */}
        {dirtyCount > 0 && (
          <View style={{ marginRight: 4 }}>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              {dirtyCount} diubah
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSaveAll}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.primaryForeground} />
            : <Save size={14} color={colors.primaryForeground} />
          }
          <Text style={s.saveBtnText}>Simpan</Text>
        </TouchableOpacity>
      </View>

      {/* Toolbar */}
      <View style={s.toolbar}>
        {/* Search */}
        <View style={s.searchBar}>
          <Search size={14} color={colors.mutedForeground} />
          <TextInput
            style={s.searchInput}
            placeholder="Cari nama produk..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter row */}
        <View style={s.filterRow}>
          {/* Category dropdown */}
          <View style={{ position: "relative" }}>
            <TouchableOpacity
              style={s.catDropBtn}
              activeOpacity={0.7}
              onPress={() => setCatOpen((v) => !v)}
            >
              <Text style={s.catDropBtnText} numberOfLines={1}>
                {selectedCat === "Semua" ? "Semua Kategori" : selectedCat}
              </Text>
              {catOpen ? <ChevronUp size={14} color={colors.mutedForeground} /> : <ChevronDown size={14} color={colors.mutedForeground} />}
            </TouchableOpacity>
          </View>

          {/* Field chips */}
          <View style={{ flexDirection: "row", gap: 6, flex: 1 }}>
            {FIELD_OPTIONS.map((opt) => {
              const active = editField === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    s.fieldChip,
                    active
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.secondary },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setEditField(opt.key)}
                >
                  <Text style={[s.fieldChipText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Category dropdown overlay */}
      {catOpen && (
        <View style={s.catDropdown}>
          {categories.map((c, i) => (
            <TouchableOpacity
              key={c}
              style={[s.catItem, i === categories.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => { setSelectedCat(c); setCatOpen(false); }}
              activeOpacity={0.7}
            >
              <Text style={[s.catItemText, selectedCat === c && { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                {c === "Semua" ? "Semua Kategori" : c}
              </Text>
              {selectedCat === c && <Check size={15} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List */}
      <FlatList
        data={listData}
        keyExtractor={(item, idx) =>
          item.type === "header" ? `hdr-${item.title}` : item.product.id
        }
        renderItem={renderItem}
        contentContainerStyle={s.listContainer}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Tidak ada produk ditemukan</Text>
          </View>
        }
      />
      
      <DialogOverlay context={dialogContext} onClose={() => setDialogContext(null)} />
    </View>
  );
}
