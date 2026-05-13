import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Plus, 
  User, 
  Search, 
  SlidersHorizontal, 
  ShoppingCart, 
  Package, 
  Settings, 
  LogIn,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react-native";
import NetInfo from "@react-native-community/netinfo";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "./_hooks/useColors";
import { useCart, Product } from "./_context/CartContext";
import { useDatabase } from "./_context/DatabaseContext";
import KeranjangKasir from "./_components/KeranjangKasir";
import { auth } from "./_context/firebase-setup";
import { onAuthStateChanged, signOut, User as FirebaseAuthUser } from "firebase/auth";

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const colors = useColors();
  const { addToCart } = useCart();
  const isWarn = product.stockStatus === "warn";

  const s = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 14,
      marginBottom: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    info: { flex: 1, minWidth: 0 },
    name: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      letterSpacing: -0.3,
      marginBottom: 4,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    stokTag: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 3,
      letterSpacing: 0.8,
      overflow: "hidden",
      borderWidth: 1,
    },
    categoryLabel: {
      fontSize: 10,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    price: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
    },
    addBtn: {
      width: 38,
      height: 38,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
      backgroundColor: colors.card,
    },
  });

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.75}>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={s.meta}>
          <Text
            style={[
              s.stokTag,
              {
                backgroundColor: isWarn ? colors.stokWarnBg : colors.stokOkBg,
                color: isWarn ? colors.stokWarnText : colors.stokOkText,
                borderColor: isWarn ? colors.stokWarnBorder : colors.stokOkBorder,
              },
            ]}
          >
            Stok {product.stock}
          </Text>
          <Text style={s.categoryLabel}>{product.category}</Text>
        </View>
        <Text style={s.price}>{fmt(product.price)}</Text>
      </View>
      <TouchableOpacity
        style={s.addBtn}
        onPress={(e) => { e.stopPropagation?.(); addToCart(product.id); }}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Plus size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function POSScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ categories?: string }>();
  const { products, totalItems } = useCart();
  const { loading } = useDatabase();

  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>(["Semua"]);
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [page, setPage] = useState(1);
  const PRODUCTS_PER_PAGE = 10;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (params.categories) {
      setActiveCategories(params.categories.split(","));
      setPage(1);
    }
  }, [params.categories]);

  const profileBtnRef = useRef<View>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch =
      (p?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p?.category || "").toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCategories.includes("Semua") ||
      activeCategories.includes(p.category);
    return matchSearch && matchCat;
  }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const paginated = filtered.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);

  const hasActiveFilter =
    !activeCategories.includes("Semua") || activeCategories.length > 1;

  function openDropdown() {
    if (profileBtnRef.current) {
      profileBtnRef.current.measureInWindow((x, y, _w, h) => {
        setDropdownPos({ top: y + h + 6, left: x });
        setDropdownOpen(true);
      });
    } else {
      setDropdownOpen(true);
    }
  }

  const networkColor = isOnline ? "#22C55E" : "#EF4444";

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topbar: {
      backgroundColor: colors.topbar,
      borderBottomWidth: 1,
      borderBottomColor: colors.topbarBorder,
      paddingTop: insets.top + 12,
      paddingBottom: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    profileBtn: {
      width: 38, height: 38, borderRadius: 9,
      backgroundColor: colors.secondary,
      borderWidth: 1, borderColor: colors.border,
      alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    },
    networkDot: {
      position: "absolute", bottom: 4, right: 4,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: networkColor,
      borderWidth: 1.5, borderColor: colors.topbar,
    },
    searchBox: {
      flex: 1, flexDirection: "row", alignItems: "center",
      backgroundColor: colors.secondary,
      borderWidth: 1, borderColor: colors.input,
      borderRadius: 8, paddingHorizontal: 10,
      height: 38, gap: 6,
    },
    searchInput: {
      flex: 1, fontSize: 13, color: colors.foreground,
      fontFamily: "Inter_400Regular", padding: 0, margin: 0, height: 38,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0 } as object) : {}),
    },
    filterBtn: {
      width: 38, height: 38, borderRadius: 9,
      backgroundColor: hasActiveFilter ? colors.primary : colors.secondary,
      borderWidth: 1, borderColor: hasActiveFilter ? colors.primary : colors.input,
      alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    },
    cartBtn: {
      width: 38, height: 38, borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    },
    cartBadge: {
      position: "absolute", top: -5, right: -5,
      backgroundColor: colors.destructive,
      borderRadius: 10, minWidth: 18, height: 18,
      alignItems: "center", justifyContent: "center",
      paddingHorizontal: 3,
    },
    cartBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
    switchBtn: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.primary, 
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 12, 
      paddingVertical: 10,
      marginHorizontal: 14,
      marginTop: 10,
      marginBottom: 5,
      justifyContent: "center",
    },
    switchBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.primaryForeground },
    list: { flex: 1 },
    listContent: { padding: 12, paddingBottom: insets.bottom + 12 },
    dropdownBackdrop: { flex: 1 },
    dropdown: {
      position: "absolute",
      backgroundColor: colors.card,
      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      minWidth: 200,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
      overflow: "hidden",
    },
    dropdownHeader: {
      paddingHorizontal: 14, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    dropdownHeaderTitle: {
      fontSize: 12, fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, letterSpacing: 0.5, textTransform: "uppercase",
    },
    dropdownStatusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
    dropdownStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: networkColor },
    dropdownStatusText: {
      fontSize: 11, fontFamily: "Inter_400Regular",
      color: isOnline ? "#22C55E" : "#EF4444",
    },
    dropdownSwitchRow: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    dropdownSwitchLabel: {
      flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground,
    },
    dropdownItem: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingHorizontal: 14, paddingVertical: 12,
    },
    dropdownItemText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
    dropdownDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
    dropdownLogout: { color: colors.destructive },
  });

  return (
    <View style={s.container}>
      <View style={s.topbar}>
        <TouchableOpacity activeOpacity={0.7} onPress={openDropdown}>
          <View ref={profileBtnRef} style={s.profileBtn}>
            <User size={18} color={networkColor} />
            <View style={s.networkDot} />
          </View>
        </TouchableOpacity>

        <View style={s.searchBox}>
          <Search size={14} color={colors.mutedForeground} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari produk..."
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            clearButtonMode="while-editing"
            underlineColorAndroid="transparent"
          />
        </View>

        <TouchableOpacity
          style={s.filterBtn}
          onPress={() => router.push({
            pathname: "/filter",
            params: { categories: activeCategories.join(",") }
          })}
          activeOpacity={0.8}
        >
          <SlidersHorizontal
            size={16}
            color={hasActiveFilter ? "#fff" : colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.cartBtn}
          onPress={() => setCartOpen(true)}
          activeOpacity={0.8}
        >
          <ShoppingCart size={18} color="#fff" />
          {totalItems > 0 && (
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{totalItems > 99 ? "99+" : totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        style={s.list}
        contentContainerStyle={s.listContent}
        data={paginated.filter(Boolean)}
        keyExtractor={(item, index) => item?.id || String(index)}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            onPress={() => router.push(`/produk/${item.id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={totalPages > 1 ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 20 }}>
            <TouchableOpacity 
              onPress={() => setPage(v => Math.max(1, v - 1))}
              disabled={page === 1}
              style={{ opacity: page === 1 ? 0.3 : 1 }}
            >
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>
              Halaman {page} dari {totalPages}
            </Text>
            <TouchableOpacity 
              onPress={() => setPage(v => Math.min(totalPages, v + 1))}
              disabled={page === totalPages}
              style={{ opacity: page === totalPages ? 0.3 : 1 }}
            >
              <ChevronRight size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}
        ListEmptyComponent={
          loading ? (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, color: colors.mutedForeground }}>Memuat data...</Text>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 48, gap: 8 }}>
              <Package size={36} color={colors.border} />
              <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                Produk tidak ditemukan
              </Text>
            </View>
          )
        }
      />

      <KeranjangKasir visible={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Profile Dropdown */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable style={s.dropdownBackdrop} onPress={() => setDropdownOpen(false)}>
          <View style={[s.dropdown, { top: dropdownPos.top, left: dropdownPos.left }]}>
            {/* Header */}
            <View style={s.dropdownHeader}>
              <Text style={s.dropdownHeaderTitle}>Akun</Text>
              <View style={s.dropdownStatusRow}>
                <View style={s.dropdownStatusDot} />
                <Text style={s.dropdownStatusText}>
                  {isOnline ? "Terhubung" : "Tidak ada jaringan"}
                </Text>
              </View>
            </View>

            {/* Mode Switch Button */}
            <TouchableOpacity 
              style={s.switchBtn} 
              onPress={() => { setDropdownOpen(false); router.push("/lanjutan/dashboard"); }} 
              activeOpacity={0.7}
            >
              <ArrowRightLeft size={16} color={colors.primaryForeground} />
              <Text style={s.switchBtnText}>Switch Mode</Text>
            </TouchableOpacity>

            <View style={s.dropdownDivider} />

            {/* Pengaturan */}
            <TouchableOpacity
              style={s.dropdownItem}
              activeOpacity={0.7}
              onPress={() => { setDropdownOpen(false); router.push("/profil"); }}
            >
              <Settings size={16} color={colors.foreground} />
              <Text style={s.dropdownItemText}>Pengaturan</Text>
            </TouchableOpacity>

            <View style={s.dropdownDivider} />

            {/* Login/Logout */}
            <TouchableOpacity
              style={s.dropdownItem}
              activeOpacity={0.7}
              onPress={async () => { 
                setDropdownOpen(false); 
                if (user) {
                  await signOut(auth);
                } else {
                  router.push("/login");
                }
              }}
            >
              <LogIn size={16} color={colors.destructive} />
              <Text style={[s.dropdownItemText, s.dropdownLogout]}>{user ? "Logout" : "Login"}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
// sync-trigger
