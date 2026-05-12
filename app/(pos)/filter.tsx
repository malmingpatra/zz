import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, X, Check, ArrowLeft } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCart } from "@/context/CartContext";

export default function FilterPage() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ categories?: string }>();
  const { products } = useCart();
  
  const categoriesFromProducts = React.useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ["Semua", ...Array.from(cats).sort()];
  }, [products]);

  const countsFromProducts = React.useMemo(() => {
    const counts: Record<string, number> = { Semua: products.length };
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);
  
  const initialCategories = params.categories ? params.categories.split(",") : ["Semua"];

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(initialCategories);

  function toggleCategory(cat: string) {
    if (cat === "Semua") {
      setSelected(["Semua"]);
      return;
    }
    setSelected((prev) => {
      const without = prev.filter((c) => c !== "Semua");
      if (without.includes(cat)) {
        const next = without.filter((c) => c !== cat);
        return next.length === 0 ? ["Semua"] : next;
      }
      return [...without, cat];
    });
  }

  function handleApply() {
    router.navigate({
      pathname: "/",
      params: { categories: selected.join(",") },
    });
  }

  function handleReset() {
    setSelected(["Semua"]);
  }

  const filteredCats = categoriesFromProducts.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const s = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: "#F5F5F0",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: insets.top + 10,
      paddingBottom: 16,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#E4E4DC",
      gap: 12,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: "#F5F5F5",
      alignItems: "center", justifyContent: "center",
    },
    title: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold", color: "#1A1A1A" },
    resetBtn: {
      paddingHorizontal: 12, paddingVertical: 5,
      borderRadius: 8, borderWidth: 1, borderColor: "#E2DFD8",
    },
    resetText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#7A7870" },
    
    content: { flex: 1 },
    
    searchSection: {
      padding: 16,
      backgroundColor: "#fff",
      marginBottom: 12,
    },
    searchBox: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: "#F5F5F0", borderRadius: 10,
      borderWidth: 1, borderColor: "#E4E4DC",
      paddingHorizontal: 10, height: 44, gap: 8,
    },
    searchInput: {
      flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#1A1A1A",
      padding: 0,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0 } as object) : {}),
    },
    
    secLabel: {
      fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#aaa",
      textTransform: "uppercase", letterSpacing: 0.8,
      marginHorizontal: 16, marginBottom: 10,
    },
    catList: { 
      backgroundColor: "#fff", 
      paddingHorizontal: 16,
      borderTopWidth: 1, borderTopColor: "#E4E4DC",
      borderBottomWidth: 1, borderBottomColor: "#E4E4DC",
    },
    catRow: {
      flexDirection: "row", alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: "#F0EDE6",
    },
    catRowLast: { borderBottomWidth: 0 },
    catCheck: {
      width: 22, height: 22, borderRadius: 6,
      borderWidth: 1.5, borderColor: "#DDDAD2",
      alignItems: "center", justifyContent: "center",
      marginRight: 12,
    },
    catCheckActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    catLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: "#1A1A1A" },
    catLabelActive: { color: colors.primary, fontFamily: "Inter_600SemiBold" },
    catCount: {
      fontSize: 12, fontFamily: "Inter_400Regular", color: "#aaa",
    },
    
    footer: {
      padding: 16,
      backgroundColor: "#fff",
      borderTopWidth: 1, borderTopColor: "#E4E4DC",
      paddingBottom: insets.bottom + 16,
    },
    applyBtn: {
      height: 48, backgroundColor: colors.primary,
      borderRadius: 14, alignItems: "center", justifyContent: "center",
      flexDirection: "row", gap: 8,
    },
    applyBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  });

  const COUNTS: Record<string, number> = {
    Semua: 10, Makanan: 3, Minuman: 4, Sembako: 3, Lainnya: 1,
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#444" />
        </TouchableOpacity>
        <Text style={s.title}>Filter Produk</Text>
        <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.7}>
          <Text style={s.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={s.content}>
        <View style={s.searchSection}>
          <View style={s.searchBox}>
            <Search size={14} color="#aaa" />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Cari kategori..."
              placeholderTextColor="#C0BDB5"
              underlineColorAndroid="transparent"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={14} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={s.secLabel}>Kategori</Text>

        <View style={s.catList}>
          {filteredCats.map((cat, i) => {
            const isActive = selected.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[s.catRow, i === filteredCats.length - 1 && s.catRowLast]}
                onPress={() => toggleCategory(cat)}
                activeOpacity={0.7}
              >
                <View style={[s.catCheck, isActive && s.catCheckActive]}>
                  {isActive && <Check size={13} color="#fff" />}
                </View>
                <Text style={[s.catLabel, isActive && s.catLabelActive]}>{cat}</Text>
                <Text style={s.catCount}>{countsFromProducts[cat] ?? 0}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.applyBtn} onPress={handleApply} activeOpacity={0.85}>
          <Check size={16} color="#fff" />
          <Text style={s.applyBtnText}>Terapkan Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
