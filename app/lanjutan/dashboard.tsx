import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LucideIcons from "lucide-react-native";
import { 
  User, 
  ArrowRightLeft, 
  Clipboard, 
  Package, 
  BarChart2, 
  Settings, 
  Search, 
  Inbox, 
  Circle, 
  Plus, 
  DollarSign, 
  FileText, 
  ChevronLeft,
  ChevronRight, 
  ChevronDown,
  ArrowRight,
  MessageCircle, 
  BookOpen, 
  HelpCircle, 
  AlertCircle,
  SlidersHorizontal,
  Calendar,
  Printer,
  X,
  Download,
  Upload,
  SquarePen,
  Trash2,
} from "lucide-react-native";
import NetInfo from "@react-native-community/netinfo";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "../../hooks/useColors";
import { useDatabase } from "../../context/DatabaseContext";
import { auth, db } from "../../context/firebase-setup";
import { writeBatch, doc, serverTimestamp } from "firebase/firestore";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Tab = "pesanan" | "produk" | "statistik" | "admin";

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function KasirScreen() {
  const colors = useColors();

  const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    menunggu:   { bg: colors.stokWarnBg, text: colors.stokWarnText, label: "Menunggu" },
    diproses:   { bg: colors.secondary, text: colors.foreground, label: "Diproses" },
    dikirim:    { bg: colors.secondary, text: colors.foreground, label: "Dikirim" },
    selesai:    { bg: colors.stokOkBg, text: colors.stokOkText, label: "Selesai" },
    dibatalkan: { bg: colors.destructive + "15", text: colors.destructive, label: "Dibatalkan" },
  };

  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { products, orders, members, bantuan, userProfile, storeSettings, updateStoreSettings, updateProduct, deleteProduct } = useDatabase();
  
  const [namaToko, setNamaToko] = useState("");
  const [alamatToko, setAlamatToko] = useState("");
  const [savingStore, setSavingStore] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (storeSettings) {
      setNamaToko(storeSettings.storeName || "");
      setAlamatToko(storeSettings.storeAddress || "");
    }
  }, [storeSettings]);

  const handleSaveStore = async () => {
    setSavingStore(true);
    try {
      if (updateStoreSettings) {
        await updateStoreSettings({
          storeName: namaToko,
          storeAddress: alamatToko,
        });
      }
      setDialogContext({ title: "Sukses", message: "Pengaturan Toko berhasil diperbarui!" });
    } catch (e) {
      console.error("Error updating store settings:", e);
      setDialogContext({ title: "Error", message: "Gagal memperbarui pengaturan toko." });
    } finally {
      setTimeout(() => setSavingStore(false), 500);
    }
  };
  
  const productCategoriesRaw = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [products]);

  const { tab: tabParam } = useLocalSearchParams<{ tab: Tab }>();
  const [tab, setTab] = useState<Tab>(tabParam || "pesanan");

  React.useEffect(() => {
    if (tabParam) {
      setTab(tabParam);
    }
  }, [tabParam]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [showOrderAdvancedFilter, setShowOrderAdvancedFilter] = useState(false);
  const [orderArea, setOrderArea] = useState("");
  const [orderAreaSearch, setOrderAreaSearch] = useState("");
  const [orderAreaPage, setOrderAreaPage] = useState(1);
  const [orderDate, setOrderDate] = useState("");
  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productCat, setProductCat] = useState("Semua");
  const [productCatSearch, setProductCatSearch] = useState("");
  const [showProductAdvancedFilter, setShowProductAdvancedFilter] = useState(false);
  const [productStockLow, setProductStockLow] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productCatFilterPage, setProductCatFilterPage] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSelectionMode, setProductSelectionMode] = useState(false);
  const [batchCategoryModal, setBatchCategoryModal] = useState(false);
  const [tempBatchCategory, setTempBatchCategory] = useState("");
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [dialogContext, setDialogContext] = useState<{ title: string; message: string; isConfirm?: boolean; onConfirm?: () => void } | null>(null);
  const fileInputRef = React.useRef<any>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (dialogContext && !dialogContext.isConfirm) {
      timer = setTimeout(() => {
        setDialogContext(null);
      }, 20000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [dialogContext]);
  
  const filteredCategories = useMemo(() => {
    const filtered = productCategoriesRaw.filter(c => c.toLowerCase().includes(productCatSearch.toLowerCase()));
    const start = (productCatFilterPage - 1) * 5;
    return filtered.slice(start, start + 5);
  }, [productCategoriesRaw, productCatSearch, productCatFilterPage]);

  const totalCatFilterPages = useMemo(() => {
    const filtered = productCategoriesRaw.filter(c => c.toLowerCase().includes(productCatSearch.toLowerCase()));
    return Math.ceil(filtered.length / 5);
  }, [productCategoriesRaw, productCatSearch]);

  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("semua");
  const [memberPage, setMemberPage] = useState(1);
  const [statPeriod, setStatPeriod] = useState("7hari");
  const [customDates, setCustomDates] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStart, setTempStart] = useState(customDates.start);
  const [tempEnd, setTempEnd] = useState(customDates.end);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "selesai")
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const uniqueAreasAll = useMemo(() => {
    const areas = Array.from(new Set(members.map(m => m.area).filter(a => typeof a === 'string' && a.trim() !== "")));
    return areas.sort();
  }, [members]);

  const filteredAreas = useMemo(() => {
    const filtered = uniqueAreasAll.filter(a => a.toLowerCase().includes(orderAreaSearch.toLowerCase()));
    const start = (orderAreaPage - 1) * 5;
    return filtered.slice(start, start + 5);
  }, [uniqueAreasAll, orderAreaSearch, orderAreaPage]);

  const totalAreaPages = useMemo(() => {
    const filtered = uniqueAreasAll.filter(a => a.toLowerCase().includes(orderAreaSearch.toLowerCase()));
    return Math.ceil(filtered.length / 5);
  }, [uniqueAreasAll, orderAreaSearch]);

  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    const matchQ = !q || o.id.toLowerCase().includes(q) || o.buyer.toLowerCase().includes(q);
    const matchStatus = orderStatus === "" || o.status === orderStatus;
    const matchDate = orderDate === "" || o.date === orderDate;
    
    let matchArea = true;
    if (orderArea !== "") {
      const memberObj = members.find(m => m.name === o.buyer);
      const buyArea = memberObj?.area || "";
      matchArea = buyArea === orderArea;
    }

    return matchQ && matchStatus && matchDate && matchArea;
  }).sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    if (timeA !== timeB) return timeB - timeA;
    return b.date.localeCompare(a.date);
  });

  const ORDERS_PER_PAGE = 10;
  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, orderPage]);

  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQ = !productSearch || p?.name?.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = productCat === "Semua" || p.category === productCat;
      const matchStock = !productStockLow || (p.stock <= 10);
      return matchQ && matchCat && matchStock;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, productSearch, productCat, productStockLow]);

  const PRODUCTS_PER_PAGE = 10;
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, productPage]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.status !== "selesai" || !o.items) return;
      o.items.forEach((i: any) => {
        const name = i.product?.name || i.name || "Unknown Product";
        counts[name] = (counts[name] || 0) + i.qty;
      });
    });

    const sorted = Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const maxQty = Math.max(...sorted.map(p => p.qty), 1);
    return sorted.map(p => ({
      ...p,
      pct: (p.qty / maxQty) * 100
    }));
  }, [orders]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = memberSearch.toLowerCase();
      const matchQ = !q || m.name.toLowerCase().includes(q);
      const matchF = memberFilter === "semua" || m.status === memberFilter;
      return matchQ && matchF;
    });
  }, [members, memberSearch, memberFilter]);

  const MEMBERS_PER_PAGE = 10;
  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * MEMBERS_PER_PAGE;
    return filteredMembers.slice(start, start + MEMBERS_PER_PAGE);
  }, [filteredMembers, memberPage]);

  const totalMemberPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE);

  const currentStatData = useMemo(() => {
    let startStr: string;
    let endStr: string = new Date().toISOString().split("T")[0];
    let days: number;

    if (statPeriod === "30hari") {
      days = 30;
      const d = new Date();
      d.setDate(d.getDate() - 29);
      startStr = d.toISOString().split("T")[0];
    } else if (statPeriod === "7hari") {
      days = 7;
      const d = new Date();
      d.setDate(d.getDate() - 6);
      startStr = d.toISOString().split("T")[0];
    } else if (statPeriod === "custom") {
      startStr = customDates.start;
      endStr = customDates.end;
      const s = new Date(startStr);
      const e = new Date(endStr);
      const diff = Math.abs(e.getTime() - s.getTime());
      days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      // Cap at 31 days for chart performance in this demo
      days = Math.min(days, 31);
    } else {
      // hari
      const today = new Date().toISOString().split("T")[0];
      const todayTotal = orders
        .filter((o) => o.date === today && o.status === "selesai")
        .reduce((sum, o) => sum + o.total, 0);
      return [{ date: today.split("-").slice(1).reverse().join("/"), total: todayTotal }];
    }

    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date(startStr);
      d.setDate(d.getDate() + i);
      const str = d.toISOString().split("T")[0];
      return str;
    });

    return dates.map((date) => {
      const dayTotal = orders
        .filter((o) => (o.date === date || o.date?.includes(date)) && o.status === "selesai")
        .reduce((sum, o) => sum + o.total, 0);
      const parts = date.split("-");
      return { 
        date: `${parts[2]}/${parts[1]}`, 
        total: dayTotal 
      };
    });
  }, [orders, statPeriod, customDates]);

  const statTotal = useMemo(() => currentStatData.reduce((s, d) => s + d.total, 0), [currentStatData]);
  const statMax = useMemo(() => Math.max(...currentStatData.map((d) => d.total), 1), [currentStatData]);

  const statRangeText = useMemo(() => {
    if (currentStatData.length === 0) return "";
    if (currentStatData.length === 1) return `Periode: ${currentStatData[0].date}`;
    return `Periode: ${currentStatData[0].date} s/d ${currentStatData[currentStatData.length - 1].date}`;
  }, [currentStatData]);

  const ICON_MAP = {
    user: User,
    repeat: ArrowRightLeft,
    clipboard: Clipboard,
    package: Package,
    "bar-chart-2": BarChart2,
    settings: Settings,
    search: Search,
    inbox: Inbox,
    circle: Circle,
    plus: Plus,
    "dollar-sign": DollarSign,
    "file-text": FileText,
    "chevron-right": ChevronRight,
    "message-circle": MessageCircle,
    "book-open": BookOpen,
    "help-circle": HelpCircle,
    "alert-circle": AlertCircle,
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    overlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: 16,
    },
    dialogBox: {
      backgroundColor: colors.card,
      padding: 24,
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
    },
    dialogTitle: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginBottom: 12,
    },
    dialogMessage: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginBottom: 24,
      lineHeight: 20,
    },
    dialogActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    dialogBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    dialogBtnText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      textAlign: 'center',
    },
    header: {
      backgroundColor: colors.topbar,
      paddingTop: insets.top + 12,
      paddingBottom: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.topbarBorder,
    },
    avatar: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: colors.secondary,
      borderWidth: 1, borderColor: colors.border,
      alignItems: "center", justifyContent: "center",
    },
    headerName: { flex: 1 },
    headerSub: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    headerTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    switchBtn: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.card, 
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12, 
      height: 38,
    },
    switchBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    tabsRow: {
      backgroundColor: colors.card,
      flexDirection: "row",
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tabBtn: {
      flex: 1, paddingVertical: 10, alignItems: "center", gap: 3,
      borderBottomWidth: 2, borderBottomColor: "transparent",
    },
    tabBtnActive: { borderBottomColor: colors.primary },
    tabBtnText: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    tabBtnTextActive: { color: colors.primary },
    searchBar: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 8, paddingHorizontal: 12, height: 40,
    },
    searchInput: {
      flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: colors.foreground,
      padding: 0,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0 } as object) : {}),
    },
    catsRow: { flexDirection: "row", gap: 7, paddingBottom: 10, paddingTop: 2 },
    catChip: {
      paddingHorizontal: 13, paddingVertical: 5,
      borderRadius: 20, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.card,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    catChipTextActive: { color: colors.primaryForeground },
    sectionPad: { padding: 12 },
    orderCard: {
      backgroundColor: colors.card, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      padding: 13, marginBottom: 8,
    },
    orderTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    orderId: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    orderTotal: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.primary },
    orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    orderMeta: { flexDirection: "row", gap: 10 },
    orderMetaText: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, flexDirection: "row", alignItems: "center" },
    statusBadge: {
      fontSize: 11, fontFamily: "Inter_600SemiBold",
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: "hidden",
    },
    productCard: {
      backgroundColor: colors.card, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      padding: 13, marginBottom: 8,
    },
    productName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 4 },
    productBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    productPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.primary },
    stockBadge: {
      fontSize: 11, fontFamily: "Inter_500Medium",
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: "hidden",
    },
    actionRow: { flexDirection: "row", gap: 7, marginBottom: 12 },
    actionBtn: {
      flex: 1, height: 36, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, borderRadius: 8,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    },
    actionBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground },
    statCard: {
      flex: 1, backgroundColor: colors.card, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      padding: 13, flexDirection: "row", alignItems: "center", gap: 10,
    },
    statIconBox: {
      width: 38, height: 38, borderRadius: 10,
      alignItems: "center", justifyContent: "center",
    },
    statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    statValue: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground },
    chartSection: {
      backgroundColor: colors.card, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      padding: 13, marginBottom: 10,
    },
    chartTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 12 },
    chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 90 },
    chartBar: { width: "80%", borderRadius: 4, backgroundColor: colors.primary, minHeight: 4, opacity: 0.85 },
    chartLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", marginTop: 4 },
    topItem: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    topRank: { fontSize: 13, fontFamily: "Inter_700Bold", width: 20, textAlign: "center" },
    topName: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: colors.foreground },
    topBarWrap: { width: 80, height: 6, backgroundColor: colors.background, borderRadius: 3 },
    topBar: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
    topQty: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, width: 40, textAlign: "right" },
    memberCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: colors.card, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      padding: 12, marginBottom: 8,
    },
    memberAvatar: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center",
    },
    memberInitials: { fontSize: 14, fontFamily: "Inter_700Bold", color: colors.primary },
    memberName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2 },
    memberSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    memberStatus: {
      fontSize: 11, fontFamily: "Inter_600SemiBold",
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: "hidden",
    },
    bantHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    bantTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    addBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      backgroundColor: colors.primary, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 7,
    },
    addBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.primaryForeground },
    bantCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: colors.card, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      padding: 12, marginBottom: 8,
    },
    bantIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    bantName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground },
    filterRow: { flexDirection: "row", gap: 7 },
    filterChip: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 12, paddingVertical: 5,
      borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    filterChipTextActive: { color: colors.primaryForeground },
    periodBar: { 
      flexDirection: "row", 
      gap: 6, 
      marginBottom: 10,
    },
    periodBtn: {
      flex: 1,
      height: 38,
      borderRadius: 10, 
      borderWidth: 1, 
      borderColor: colors.border, 
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    periodBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    periodBtnTextActive: { color: colors.primaryForeground },
    printReportBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      marginTop: 6,
      marginBottom: 20,
    },
    printReportBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primaryForeground },
    emptyBox: { alignItems: "center", padding: 40, gap: 8 },
    emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
  });

  const TABS: { key: Tab; icon: keyof typeof ICON_MAP; label: string }[] = [
    { key: "pesanan",    icon: "clipboard",  label: "Pesanan" },
    { key: "produk",     icon: "package",    label: "Produk" },
    { key: "statistik",  icon: "bar-chart-2", label: "Statistik" },
    { key: "admin",      icon: "settings",   label: "Admin" },
  ];

  function stockLabel(s: number) { return s === 0 ? "Habis" : `Stok ${s}`; }
  function stockStyle(s: number) {
    if (s === 0) return { backgroundColor: colors.destructive + "15", color: colors.destructive };
    if (s <= 8)  return { backgroundColor: colors.stokWarnBg, color: colors.stokWarnText };
    return { backgroundColor: colors.stokOkBg, color: colors.stokOkText };
  }

  // ── Backup: download CSV produk ──
  async function handleBackup() {
    if (products.length === 0) {
      setDialogContext({ title: "Backup", message: "Belum ada produk untuk dibackup." });
      return;
    }
    setBackupLoading(true);
    try {
      // Format: nama,kategori,stok,harga,deskripsi
      const headers = ["Nama", "Kategori", "Stok", "Harga", "Deskripsi"];
      const rows = products.map(p => {
        const row = [
          (p.name || "").replace(/,/g, ' '),
          (p.category || "Umum").replace(/,/g, ' '),
          p.stock,
          p.price,
          (p.desc || "").replace(/,/g, ' ').replace(/\n/g, ' ')
        ];
        return row.join(",");
      });
      
      const csvContent = [headers.join(","), ...rows].join("\n");
      const filename = `backup-produk-${new Date().toISOString().slice(0, 10)}.csv`;
      
      if (Platform.OS === "web") {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setDialogContext({ title: "Backup Berhasil", message: `${products.length} produk disimpan ke ${filename}` });
      } else {
        setDialogContext({ title: "Backup", message: `${products.length} produk siap dibackup.\n\nFitur simpan CSV memerlukan expo-file-system pada build native.` });
      }
    } catch (e: any) {
      setDialogContext({ title: "Gagal Backup", message: e?.message || "Terjadi kesalahan." });
    } finally {
      setBackupLoading(false);
    }
  }

  // ── Restore: handling file selection ──
  async function onFileSelected(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreLoading(true);
    try {
      const text = await file.text();
      // Hapus BOM jika ada
      const cleanText = text.replace(/^\uFEFF/, "");
      const lines = cleanText.split(/\r?\n/).filter(line => line.trim() !== "");
      
      if (lines.length < 1) {
        setDialogContext({ title: "Eror", message: "File CSV kosong." });
        setRestoreLoading(false);
        return;
      }

      // Deteksi Header
      let startIndex = 0;
      if (lines[0].toLowerCase().includes("nama") || lines[0].toLowerCase().includes("harga")) {
        startIndex = 1;
      }

      const dataLines = lines.slice(startIndex);
      const parsedProducts: any[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const delimiter = line.includes(";") && !line.includes(",") ? ";" : ",";
        const values = line.split(delimiter);
        
        if (values.length < 2) continue; 

        const nama = (values[0] || "").trim();
        const kategori = (values[1] || "Umum").trim();
        const stokVal = parseInt(values[2]?.replace(/[^0-9-]/g, "")) || 0;
        const hargaVal = parseInt(values[3]?.replace(/[^0-9-]/g, "")) || 0;
        const deskripsi = (values[4] || "").trim();

        if (!nama) continue;

        parsedProducts.push({
          name: nama,
          category: kategori,
          stock: stokVal,
          price: hargaVal,
          desc: deskripsi,
        });
      }

      if (parsedProducts.length === 0) {
        setDialogContext({ title: "Eror", message: "Tidak ada data produk valid ditemukan di CSV." });
        setRestoreLoading(false);
        return;
      }

      setDialogContext({
        title: "Konfirmasi Restore",
        message: `Ditemukan ${parsedProducts.length} produk. Lanjutkan proses restore ke database?`,
        isConfirm: true,
        onConfirm: async () => {
          setDialogContext(null);
          setRestoreLoading(true);
          try {
            const CHUNK_SIZE = 450;
            let processedCount = 0;

            for (let i = 0; i < parsedProducts.length; i += CHUNK_SIZE) {
              const batch = writeBatch(db);
              const chunk = parsedProducts.slice(i, i + CHUNK_SIZE);
              
              for (const pData of chunk) {
                // Cari produk yang sudah ada berdasarkan nama (case-insensitive)
                const existing = products.find(ep => ep.name && ep.name.toLowerCase() === pData.name.toLowerCase());
                
                // Jika ada gunakan ID lama, jika tidak buat ID baru
                const targetId = existing ? existing.id : "p-" + Math.random().toString(36).substring(2, 9);
                const productRef = doc(db, "products", targetId);
                
                const finalProduct = {
                  ...(existing || {}), // Pertahankan data lama jika ada
                  ...pData,            // Timpa dengan data baru dari CSV
                  id: targetId,
                  stockStatus: (pData.stock ?? 0) <= 10 ? "warn" : "ok",
                  updatedAt: serverTimestamp()
                };
                
                batch.set(productRef, finalProduct, { merge: true });
                processedCount++;
              }
              
              await batch.commit();
            }
            
            setDialogContext({ title: "Berhasil", message: `${processedCount} produk telah diproses.` });
          } catch (err: any) {
            console.error("Restore Commit Error:", err);
            setDialogContext({ title: "Gagal Restore", message: err?.message || "Terjadi kesalahan saat menyimpan data." });
          } finally {
            setRestoreLoading(false);
          }
        }
      });
    } catch (err: any) {
      console.error("Restore Error:", err);
      setDialogContext({ title: "Eror", message: `Gagal membaca file: ${err?.message}` });
      setRestoreLoading(false);
    } finally {
      if (e.target) e.target.value = "";
    }
  }

  function handleRestore() {
    if (Platform.OS === "web") {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setDialogContext({ title: "Eror", message: "Sistem restore belum siap." });
      }
    } else {
      Alert.alert("Restore", "Fitur restore CSV memerlukan build khusus pada perangkat mobile.");
    }
  }

  const rankColors = ["#C9A227", "#999", "#B87333", "#ccc", "#ccc"];

  return (
    <View style={s.container}>
      {/* Hidden file input for Restore (Web) */}
      {Platform.OS === "web" && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".csv"
          onChange={onFileSelected}
        />
      )}
      {/* Header */}
      <View style={s.header}>
        <View style={[s.avatar, { borderColor: isConnected ? "#4CAF50" : "#F44336" }]}>
          <User size={20} color={isConnected ? "#4CAF50" : "#F44336"} />
          <View style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: isConnected ? "#4CAF50" : "#F44336",
            borderWidth: 2,
            borderColor: "#fff"
          }} />
        </View>
        <View style={s.headerName}>
          <Text style={s.headerSub}>{userProfile?.role === "admin" ? "Administrator" : "Kasir Toko"}</Text>
          <Text style={s.headerTitle}>{userProfile?.displayName || auth.currentUser?.displayName || "Admin User"}</Text>
        </View>
        <TouchableOpacity style={s.switchBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowRightLeft size={16} color={colors.foreground} />
          <Text style={s.switchBtnText}>Switch</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
          >
          {(() => {
            const Icon = ICON_MAP[t.icon];
            return <Icon size={18} color={tab === t.key ? colors.primary : "#888"} />;
          })()}
            <Text style={[s.tabBtnText, tab === t.key && s.tabBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── PESANAN ── */}
      {tab === "pesanan" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.sectionPad}>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <View style={[s.searchBar, { flex: 1 }]}>
                <Search size={15} color="#aaa" />
                <TextInput
                  style={s.searchInput}
                  value={orderSearch}
                  onChangeText={(t) => { setOrderSearch(t); setOrderPage(1); }}
                  placeholder="Cari pesanan..."
                  placeholderTextColor="#bbb"
                  underlineColorAndroid="transparent"
                />
              </View>
              <TouchableOpacity 
                style={[s.searchBar, { width: 44, paddingHorizontal: 0, justifyContent: "center" }, showOrderAdvancedFilter && { backgroundColor: "black" }]} 
                activeOpacity={0.7}
                onPress={() => setShowOrderAdvancedFilter(!showOrderAdvancedFilter)}
              >
                <SlidersHorizontal size={18} color={showOrderAdvancedFilter ? colors.primaryForeground : colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {showOrderAdvancedFilter && (
              <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 8 }}>Tanggal Transaksi</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, height: 48, backgroundColor: colors.secondary, borderRadius: 8, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        setShowOrderDatePicker(true);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {Platform.OS === 'web' ? (
                       <input 
                         type="date"
                         value={orderDate}
                         onChange={(e: any) => { setOrderDate(e.target.value); setOrderPage(1); }}
                         style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', top: 0, left: 0 }}
                       />
                    ) : null}
                    <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: orderDate ? colors.foreground : colors.mutedForeground }}>
                      {orderDate || "Pilih Tanggal"}
                    </Text>
                  </TouchableOpacity>
                  {orderDate !== "" && (
                    <TouchableOpacity 
                      style={{ width: 48, height: 48, backgroundColor: 'rgba(252, 235, 235, 0.2)', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FCEBEB' }}
                      onPress={() => setOrderDate("")}
                      activeOpacity={0.7}
                    >
                      <X size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 8 }}>Status Pesanan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {["menunggu", "dikirim", "selesai", "dibatalkan"].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
                        backgroundColor: orderStatus === st ? colors.primary : colors.secondary,
                        marginRight: 8
                      }}
                      onPress={() => { setOrderStatus(orderStatus === st ? "" : st); setOrderPage(1); }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: orderStatus === st ? colors.primaryForeground : colors.mutedForeground, textTransform: 'capitalize' }}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 8 }}>Area Customer</Text>
                <View style={[s.searchBar, { height: 36, marginBottom: 10, backgroundColor: colors.secondary, borderColor: "transparent" }]}>
                  <Search size={14} color={colors.mutedForeground} />
                  <TextInput 
                    style={[s.searchInput, { fontSize: 12 }]} 
                    placeholder="Cari area..." 
                    placeholderTextColor={colors.mutedForeground}
                    value={orderAreaSearch} 
                    onChangeText={(t) => { setOrderAreaSearch(t); setOrderAreaPage(1); }} 
                  />
                </View>
                  <View style={{ marginBottom: 16 }}>
                    {filteredAreas.map((ar) => (
                      <TouchableOpacity
                        key={ar}
                        style={{
                          paddingVertical: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottomWidth: 1,
                          borderBottomColor: '#F0F2EE'
                        }}
                        onPress={() => { setOrderArea(orderArea === ar ? "" : ar); setOrderPage(1); }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: orderArea === ar ? colors.primary : "#4A4840" }}>
                          {ar}
                        </Text>
                        {orderArea === ar && <LucideIcons.Check size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                    {filteredAreas.length === 0 && (
                      <Text style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic' }}>Tidak ada area ditemukan</Text>
                    )}
                    
                    {totalAreaPages > 1 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 8 }}>
                        <TouchableOpacity onPress={() => setOrderAreaPage(p => Math.max(1, p - 1))} disabled={orderAreaPage === 1}>
                          <ChevronLeft size={18} color={orderAreaPage === 1 ? "#ccc" : colors.primary} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 11, color: "#666" }}>{orderAreaPage}/{totalAreaPages}</Text>
                        <TouchableOpacity onPress={() => setOrderAreaPage(p => Math.min(totalAreaPages, p + 1))} disabled={orderAreaPage === totalAreaPages}>
                          <ChevronRight size={18} color={orderAreaPage === totalAreaPages ? "#ccc" : colors.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
            )}

            {Platform.OS !== 'web' && showOrderDatePicker && (
              <DateTimePicker
                value={orderDate ? new Date(orderDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant={colors.isDark ? 'dark' : 'light'}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (Platform.OS !== 'ios') setShowOrderDatePicker(false);
                  if (date) {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${y}-${m}-${d}`;
                    setOrderDate(dateStr);
                  }
                }}
              />
            )}

            {filteredOrders.length === 0 ? (
              <View style={s.emptyBox}>
                <Inbox size={32} color="#ccc" />
                <Text style={s.emptyText}>Tidak ada pesanan</Text>
              </View>
            ) : (
              paginatedOrders.map((o) => {
                const sc = STATUS_COLORS[o.status];
                return (
                  <TouchableOpacity
                    key={o.id}
                    style={s.orderCard}
                    onPress={() => router.push({ pathname: "/pesanan/[pesanan_id]", params: { pesanan_id: o.id } })}
                    activeOpacity={0.75}
                  >
                    <View style={s.orderTop}>
                      <Text style={s.orderId}>#{o.id}</Text>
                      <Text style={s.orderTotal}>{fmt(o.total)}</Text>
                    </View>
                    <View style={s.orderBottom}>
                      <View style={s.orderMeta}>
                        <Text style={s.orderMetaText}>{o.buyer}</Text>
                        {o.staff ? <Text style={[s.orderMetaText, { color: "#aaa" }]}>· {o.staff}</Text> : null}
                      </View>
                      <Text style={[s.statusBadge, { backgroundColor: sc.bg, color: sc.text }]}>
                        {sc.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Order Pagination Controls */}
            {totalOrderPages > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 10, marginBottom: 20 }}>
                <TouchableOpacity 
                  onPress={() => setOrderPage(v => Math.max(1, v - 1))}
                  disabled={orderPage === 1}
                  style={{ opacity: orderPage === 1 ? 0.3 : 1 }}
                >
                  <ChevronLeft size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>
                  Halaman {orderPage} dari {totalOrderPages}
                </Text>
                <TouchableOpacity 
                  onPress={() => setOrderPage(v => Math.min(totalOrderPages, v + 1))}
                  disabled={orderPage === totalOrderPages}
                  style={{ opacity: orderPage === totalOrderPages ? 0.3 : 1 }}
                >
                  <ChevronRight size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ── PRODUK ── */}
      {tab === "produk" && (
        <View style={{ flex: 1 }}>
          {productSelectionMode && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: colors.primary, 
              paddingHorizontal: 16, 
              paddingVertical: 10,
              paddingTop: 10,
              justifyContent: 'space-between'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => { setProductSelectionMode(false); setSelectedProductIds([]); }}
                >
                  <X size={20} color={colors.primaryForeground} />
                </TouchableOpacity>
                <Text style={{ color: colors.primaryForeground, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
                  {selectedProductIds.length} Terpilih
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 7, borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.4)',
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  onPress={() => setSelectedProductIds(filteredProducts.map(p => p.id))}
                >
                  <Text style={{ color: colors.primaryForeground, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>Semua</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 7, borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.4)',
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  onPress={() => setBatchCategoryModal(true)}
                  disabled={selectedProductIds.length === 0}
                >
                  <Text style={{ color: colors.primaryForeground, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>Kategori</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7,
                    borderRadius: 7,
                    backgroundColor: 'rgba(220,50,50,0.85)',
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  disabled={selectedProductIds.length === 0}
                  onPress={() => {
                    if (selectedProductIds.length === 0) return;
                    setDialogContext({
                      title: "Hapus Produk",
                      message: `Hapus ${selectedProductIds.length} produk terpilih? Tindakan ini tidak dapat dibatalkan.`,
                      isConfirm: true,
                      onConfirm: async () => {
                        setDialogContext(null);
                        const ids = [...selectedProductIds];
                        setProductSelectionMode(false);
                        setSelectedProductIds([]);
                        for (const id of ids) {
                          if (deleteProduct) await deleteProduct(id);
                        }
                        setDialogContext({ title: "Berhasil", message: `${ids.length} produk telah dihapus.` });
                      }
                    });
                  }}
                >
                  <Trash2 size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.sectionPad}>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <View style={[s.searchBar, { flex: 1 }]}>
                  <Search size={15} color="#aaa" />
                  <TextInput
                    style={s.searchInput}
                    value={productSearch}
                    onChangeText={(t) => { setProductSearch(t); setProductPage(1); }}
                    placeholder="Cari produk..."
                    placeholderTextColor="#bbb"
                    underlineColorAndroid="transparent"
                  />
                </View>
                <TouchableOpacity 
                  style={[s.searchBar, { width: 44, paddingHorizontal: 0, justifyContent: "center" }, showProductAdvancedFilter && { backgroundColor: "black" }]} 
                  activeOpacity={0.7}
                  onPress={() => setShowProductAdvancedFilter(!showProductAdvancedFilter)}
                >
                  <SlidersHorizontal size={18} color={showProductAdvancedFilter ? colors.primaryForeground : colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {showProductAdvancedFilter && (
                <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 8 }}>Stok</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
                        backgroundColor: productStockLow ? colors.primary : colors.secondary,
                      }}
                      onPress={() => { setProductStockLow(!productStockLow); setProductPage(1); }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: productStockLow ? colors.primaryForeground : colors.foreground }}>
                        Stok 0-10
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 8 }}>Kategori Produk</Text>
                  <View style={[s.searchBar, { height: 36, marginBottom: 10, backgroundColor: colors.secondary, borderColor: "transparent" }]}>
                    <Search size={14} color={colors.mutedForeground} />
                    <TextInput 
                      style={[s.searchInput, { fontSize: 12 }]} 
                      placeholder="Cari kategori..." 
                      placeholderTextColor={colors.mutedForeground}
                      value={productCatSearch} 
                      onChangeText={(t) => { setProductCatSearch(t); setProductCatFilterPage(1); }} 
                    />
                  </View>
                  <View style={{ marginBottom: 8 }}>
                    {filteredCategories.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={{
                          paddingVertical: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottomWidth: 1,
                          borderBottomColor: colors.secondary
                        }}
                        onPress={() => { setProductCat(productCat === c ? "Semua" : c); setProductPage(1); }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: productCat === c ? colors.primary : colors.foreground }}>
                          {c}
                        </Text>
                        {productCat === c && <LucideIcons.Check size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                    {filteredCategories.length === 0 && (
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, fontStyle: 'italic' }}>Tidak ada kategori ditemukan</Text>
                    )}

                    {totalCatFilterPages > 1 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 8 }}>
                        <TouchableOpacity onPress={() => setProductCatFilterPage(p => Math.max(1, p - 1))} disabled={productCatFilterPage === 1}>
                          <ChevronLeft size={18} color={productCatFilterPage === 1 ? colors.border : colors.primary} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{productCatFilterPage}/{totalCatFilterPages}</Text>
                        <TouchableOpacity onPress={() => setProductCatFilterPage(p => Math.min(totalCatFilterPages, p + 1))} disabled={productCatFilterPage === totalCatFilterPages}>
                          <ChevronRight size={18} color={productCatFilterPage === totalCatFilterPages ? colors.border : colors.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[s.actionBtn, backupLoading && { opacity: 0.6 }]}
                  activeOpacity={0.7}
                  onPress={handleBackup}
                  disabled={backupLoading}
                >
                  <Download size={14} color={colors.primary} />
                  <Text style={[s.actionBtnText, { color: colors.primary }]}>Backup</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, restoreLoading && { opacity: 0.6 }]}
                  activeOpacity={0.7}
                  onPress={handleRestore}
                  disabled={restoreLoading}
                >
                  <Upload size={14} color="#555" />
                  <Text style={s.actionBtnText}>Restore</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.actionBtn}
                  activeOpacity={0.7}
                  onPress={() => router.push("/lanjutan/edit-massal")}
                >
                  <SquarePen size={14} color="#555" />
                  <Text style={s.actionBtnText}>Edit Massal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  activeOpacity={0.8}
                  onPress={() => router.push("/lanjutan/tambah-produk")}
                >
                  <Plus size={14} color="#fff" />
                  <Text style={[s.actionBtnText, { color: "#fff" }]}>Tambah</Text>
                </TouchableOpacity>
              </View>

              {paginatedProducts.length === 0 ? (
                <View style={s.emptyBox}>
                  <Inbox size={32} color="#ccc" />
                  <Text style={s.emptyText}>Tidak ada produk</Text>
                </View>
              ) : (
                paginatedProducts.map((p, idx) => {
                  if (!p) return null;
                  const ss = stockStyle(p.stock);
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <TouchableOpacity 
                      key={p.id || idx} 
                      style={[s.productCard, isSelected && { borderColor: colors.primary, borderWidth: 2 }]}
                      activeOpacity={0.7}
                      onLongPress={() => {
                        setProductSelectionMode(true);
                        setSelectedProductIds([p.id]);
                      }}
                      onPress={() => {
                        if (productSelectionMode) {
                          if (isSelected) {
                            setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                          } else {
                            setSelectedProductIds([...selectedProductIds, p.id]);
                          }
                        } else {
                          router.push({ pathname: "/lanjutan/tambah-produk", params: { id: p.id } });
                        }
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Text style={s.productName}>{p.name}</Text>
                         {productSelectionMode && (
                           <View style={{
                             width: 20, height: 20, borderRadius: 10,
                             borderWidth: 2,
                             borderColor: isSelected ? colors.primary : colors.border,
                             backgroundColor: isSelected ? colors.primary : 'transparent',
                             alignItems: 'center', justifyContent: 'center',
                           }}>
                             {isSelected && <LucideIcons.Check size={12} color={colors.primaryForeground} strokeWidth={3} />}
                           </View>
                         )}
                      </View>
                      <View style={s.productBottom}>
                        <Text style={s.productPrice}>{fmt(p.price || 0)}</Text>
                        <Text style={[s.stockBadge, { backgroundColor: ss.backgroundColor, color: ss.color }]}>
                          {stockLabel(p.stock)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 10, marginBottom: 20 }}>
                  <TouchableOpacity 
                    onPress={() => setProductPage(v => Math.max(1, v - 1))}
                    disabled={productPage === 1}
                    style={{ opacity: productPage === 1 ? 0.3 : 1 }}
                  >
                    <ChevronLeft size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>
                    Halaman {productPage} dari {totalPages}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setProductPage(v => Math.min(totalPages, v + 1))}
                    disabled={productPage === totalPages}
                    style={{ opacity: productPage === totalPages ? 0.3 : 1 }}
                  >
                    <ChevronRight size={24} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Batch Category Modal */}
          {batchCategoryModal && (
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20
            }}>
              <View style={{ backgroundColor: colors.card, borderRadius: 16, width: '100%', padding: 20 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 4 }}>
                  Ubah Kategori Massal
                </Text>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginBottom: 15 }}>
                  {selectedProductIds.length} produk terpilih
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.secondary, padding: 12, borderRadius: 8, marginBottom: 15,
                    borderWidth: 1, borderColor: colors.border,
                    color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 14,
                  }}
                  placeholder="Ketik kategori baru"
                  placeholderTextColor={colors.mutedForeground}
                  value={tempBatchCategory}
                  onChangeText={setTempBatchCategory}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                    onPress={() => setBatchCategoryModal(false)}
                  >
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: colors.primary }}
                    onPress={async () => {
                      if (!tempBatchCategory.trim()) return;
                      let count = 0;
                      for (const id of selectedProductIds) {
                        const p = products.find(x => x.id === id);
                        if (p && updateProduct) {
                          await updateProduct({ ...p, category: tempBatchCategory.trim() });
                          count++;
                        }
                      }
                      setBatchCategoryModal(false);
                      setProductSelectionMode(false);
                      setSelectedProductIds([]);
                      setTempBatchCategory("");
                      setDialogContext({ title: "Sukses", message: `${count} produk berhasil diperbarui kategorinya!` });
                    }}
                  >
                    <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Simpan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── STATISTIK ── */}
      {tab === "statistik" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.sectionPad}>
            <View style={s.periodBar}>
              {[
                ["hari", "Hari Ini"], 
                ["7hari", "7 Hari"], 
                ["30hari", "30 Hari"], 
                ["custom", "Pilih Tgl"]
              ].map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[s.periodBtn, statPeriod === key && s.periodBtnActive]}
                  onPress={() => {
                    setStatPeriod(key);
                    if (key === "custom") {
                      setTempStart(customDates.start);
                      setTempEnd(customDates.end);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={[s.periodBtnText, statPeriod === key && s.periodBtnTextActive]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Inline Custom Date Selector (Dropdown) */}
            {statPeriod === "custom" && (
              <View style={{ 
                backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                padding: 16, marginBottom: 15
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 6, fontFamily: "Inter_600SemiBold" }}>Dari</Text>
                    <TouchableOpacity 
                      style={{ 
                        height: 44, backgroundColor: colors.secondary, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
                        flexDirection: "row", alignItems: "center", paddingHorizontal: 12, justifyContent: "space-between"
                      }}
                      onPress={() => {
                        if (Platform.OS !== 'web') setShowStartPicker(true);
                      }}
                    >
                      {Platform.OS === 'web' ? (
                        <input 
                          type="date"
                          value={tempStart}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            if (val) {
                              setTempStart(val);
                              setCustomDates(prev => ({ ...prev, start: val }));
                            }
                          }}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            outline: 'none',
                            fontSize: '13px',
                            fontFamily: 'Inter_500Medium',
                            width: '100%',
                            color: colors.foreground
                          }}
                        />
                      ) : (
                        <>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground }}>{tempStart}</Text>
                          <ChevronDown size={16} color={colors.mutedForeground} />
                        </>
                      )}
                    </TouchableOpacity>
                    {Platform.OS !== 'web' && showStartPicker && (
                      <DateTimePicker
                        value={new Date(tempStart)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        themeVariant={colors.isDark ? 'dark' : 'light'}
                        onChange={(event: DateTimePickerEvent, date?: Date) => {
                          if (Platform.OS !== 'ios') setShowStartPicker(false);
                          if (date) {
                            // Use local year, month, date to avoid UTC offset issues
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            const dateStr = `${y}-${m}-${d}`;
                            setTempStart(dateStr);
                            setCustomDates(prev => ({ ...prev, start: dateStr }));
                          }
                        }}
                      />
                    )}
                  </View>

                  <ArrowRight size={18} color="#CCC" style={{ marginTop: 22 }} />

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 6, fontFamily: "Inter_600SemiBold" }}>Sampai</Text>
                    <TouchableOpacity 
                      style={{ 
                        height: 44, backgroundColor: colors.secondary, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
                        flexDirection: "row", alignItems: "center", paddingHorizontal: 12, justifyContent: "space-between"
                      }}
                      onPress={() => {
                        if (Platform.OS !== 'web') setShowEndPicker(true);
                      }}
                    >
                      {Platform.OS === 'web' ? (
                        <input 
                          type="date"
                          value={tempEnd}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            if (val) {
                              setTempEnd(val);
                              setCustomDates(prev => ({ ...prev, end: val }));
                            }
                          }}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            outline: 'none',
                            fontSize: '13px',
                            fontFamily: 'Inter_500Medium',
                            width: '100%',
                            color: colors.foreground
                          }}
                        />
                      ) : (
                        <>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground }}>{tempEnd}</Text>
                          <ChevronDown size={16} color={colors.mutedForeground} />
                        </>
                      )}
                    </TouchableOpacity>
                    {Platform.OS !== 'web' && showEndPicker && (
                      <DateTimePicker
                        value={new Date(tempEnd)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        themeVariant={colors.isDark ? 'dark' : 'light'}
                        onChange={(event: DateTimePickerEvent, date?: Date) => {
                          if (Platform.OS !== 'ios') setShowEndPicker(false);
                          if (date) {
                            // Use local year, month, date to avoid UTC offset issues
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            const dateStr = `${y}-${m}-${d}`;
                            setTempEnd(dateStr);
                            setCustomDates(prev => ({ ...prev, end: dateStr }));
                          }
                        }}
                      />
                    )}
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[s.printReportBtn, { marginBottom: 15 }]} 
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: "/lanjutan/cetak-laporan",
                  params: { 
                    period: statPeriod,
                    ...(statPeriod === "custom" ? { start: customDates.start, end: customDates.end } : {})
                  }
                });
              }}
            >
              <Printer size={18} color="#fff" />
              <Text style={s.printReportBtnText}>Cetak Laporan Omset</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <View style={[s.statCard, { flex: 1.6 }]}>
                    <View style={[s.statIconBox, { backgroundColor: colors.stokOkBg }]}>
                      <DollarSign size={18} color={colors.stokOkText} />
                    </View>
                    <View>
                      <Text style={s.statLabel}>Omset</Text>
                      <Text style={s.statValue}>{fmt(statTotal)}</Text>
                    </View>
                  </View>
                  <View style={[s.statCard, { flex: 1 }]}>
                    <View style={[s.statIconBox, { backgroundColor: colors.accent }]}>
                      <FileText size={18} color={colors.primary} />
                    </View>
                <View>
                  <Text style={s.statLabel}>Transaksi</Text>
                  <Text style={s.statValue}>{orders.length}</Text>
                </View>
              </View>
            </View>

            {/* Bar Chart */}
            <View style={s.chartSection}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={[s.chartTitle, { marginBottom: 0 }]}>Grafik Omset</Text>
                <Text style={{ fontSize: 11, color: "#888", fontFamily: "Inter_500Medium" }}>{statRangeText}</Text>
              </View>
              <View style={s.chartRow}>
                {currentStatData.map((d, i) => (
                  <View key={d.date + i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
                    {d.total > 0 && currentStatData.length <= 12 && (
                      <Text style={{ fontSize: 8, color: colors.primary, marginBottom: 2, fontFamily: "Inter_600SemiBold" }}>
                        {d.total >= 1000000 ? `${(d.total/1000000).toFixed(1)}jt` : d.total >= 1000 ? `${(d.total/1000).toFixed(0)}rb` : d.total}
                      </Text>
                    )}
                    <View
                      style={[
                        s.chartBar,
                        { height: Math.max(6, (d.total / statMax) * 90) },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", marginTop: 4 }}>
                {currentStatData.map((d, i) => {
                  // Show labels for 1 day, 7 days, or every 5th label for 30 days
                  const showLabel = currentStatData.length <= 7 || i === 0 || i === currentStatData.length - 1 || i % 5 === 0;
                  return (
                    <View key={d.date + i} style={{ flex: 1 }}>
                      {showLabel ? (
                        <Text style={s.chartLabel}>{d.date}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Top 10 Products */}
            <View style={s.chartSection}>
              <Text style={s.chartTitle}>Top 10 Produk Terlaris</Text>
              {topProducts.length === 0 ? (
                <Text style={{ textAlign: "center", color: "#999", padding: 20 }}>Belum ada data penjualan</Text>
              ) : (
                topProducts.map((p, i) => (
                  <View key={p.name} style={[s.topItem, i === topProducts.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[s.topRank, { color: rankColors[i % rankColors.length] }]}>{i + 1}</Text>
                    <Text style={s.topName}>{p.name}</Text>
                    <View style={s.topBarWrap}>
                      <View style={[s.topBar, { width: `${p.pct}%` }]} />
                    </View>
                    <Text style={s.topQty}>{p.qty} item</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── ADMIN ── */}
      {tab === "admin" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.sectionPad}>
            {/* Informasi Toko */}
            <View style={[s.bantHdr, { marginBottom: 12 }]}>
              <Text style={s.bantTitle}>Informasi Toko</Text>
            </View>
            <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 6 }}>Nama Toko</Text>
                <TextInput
                  style={{ backgroundColor: colors.secondary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground }}
                  value={namaToko}
                  onChangeText={setNamaToko}
                  placeholder="Ketik nama toko Anda"
                  placeholderTextColor={colors.mutedForeground}
                  underlineColorAndroid="transparent"
                />
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 6 }}>Alamat Toko</Text>
                <TextInput
                  style={{ backgroundColor: colors.secondary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontSize: 14, fontFamily: "Inter_400Regular", color: colors.foreground }}
                  value={alamatToko}
                  onChangeText={setAlamatToko}
                  placeholder="Ketik alamat toko Anda"
                  placeholderTextColor={colors.mutedForeground}
                  underlineColorAndroid="transparent"
                />
              </View>
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: "center", opacity: savingStore ? 0.7 : 1 }}
                activeOpacity={0.8}
                onPress={handleSaveStore}
                disabled={savingStore}
              >
                <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.primaryForeground }}>
                  {savingStore ? "Menyimpan..." : "Simpan Pengaturan"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Members */}
            <View style={[s.bantHdr, { marginBottom: 12 }]}>
              <Text style={s.bantTitle}>Daftar Member</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <View style={[s.searchBar, { flex: 1 }]}>
                <Search size={15} color="#aaa" />
                <TextInput
                  style={s.searchInput}
                  value={memberSearch}
                  onChangeText={(t) => { setMemberSearch(t); setMemberPage(1); }}
                  placeholder="Cari member..."
                  placeholderTextColor="#bbb"
                  underlineColorAndroid="transparent"
                />
              </View>
              <TouchableOpacity 
                style={[s.searchBar, { width: 44, paddingHorizontal: 0, justifyContent: "center" }]} 
                activeOpacity={0.7}
              >
                <SlidersHorizontal size={18} color="#555" />
              </TouchableOpacity>
            </View>
            {filteredMembers.length === 0 ? (
              <View style={s.emptyBox}>
                <User size={32} color="#ccc" />
                <Text style={s.emptyText}>Belum ada member</Text>
              </View>
            ) : (
              <>
                {paginatedMembers.map((m) => (
                  <TouchableOpacity
                    key={m.id || m.name}
                    style={s.memberCard}
                    onPress={() => router.push({ pathname: "/member/[member_id]", params: { member_id: m.id } })}
                    activeOpacity={0.75}
                  >
                    <View style={s.memberAvatar}>
                      <Text style={s.memberInitials}>{m.initials || m.name?.charAt(0) || "?"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.memberName}>{m.name || "Unknown Member"}</Text>
                      <Text style={s.memberSub}>{m.sub || "Member"}</Text>
                    </View>
                    <Text style={[
                      s.memberStatus,
                      m.status === "aktif"
                        ? { backgroundColor: colors.stokOkBg, color: colors.stokOkText }
                        : { backgroundColor: colors.secondary, color: colors.mutedForeground },
                    ]}>
                      {m.status === "aktif" ? "Aktif" : "Non-aktif"}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Member Pagination Controls */}
                {totalMemberPages > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 10, marginBottom: 10 }}>
                    <TouchableOpacity 
                      onPress={() => setMemberPage(v => Math.max(1, v - 1))}
                      disabled={memberPage === 1}
                      style={{ opacity: memberPage === 1 ? 0.3 : 1 }}
                    >
                      <ChevronLeft size={24} color={colors.primary} />
                    </TouchableOpacity>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>
                  Halaman {memberPage} dari {totalMemberPages}
                </Text>
                    <TouchableOpacity 
                      onPress={() => setMemberPage(v => Math.min(totalMemberPages, v + 1))}
                      disabled={memberPage === totalMemberPages}
                      style={{ opacity: memberPage === totalMemberPages ? 0.3 : 1 }}
                    >
                      <ChevronRight size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* Bantuan */}
            <View style={[s.bantHdr, { marginTop: 16 }]}>
              <Text style={s.bantTitle}>Pusat Bantuan</Text>
              <TouchableOpacity 
                style={s.addBtn} 
                activeOpacity={0.8}
                onPress={() => router.push("/lanjutan/tambah-bantuan")}
              >
                <Plus size={13} color="#fff" />
                <Text style={s.addBtnText}>Tambah</Text>
              </TouchableOpacity>
            </View>
            {bantuan.map((b) => (
              <TouchableOpacity key={b.name} style={s.bantCard} activeOpacity={0.7}>
                <View style={[s.bantIconBox, { backgroundColor: b.bg }]}>
                  {(() => {
                    // Try dynamic Lucide icon first
                    // @ts-ignore
                    const IconComp = LucideIcons[b.icon] || ICON_MAP[b.icon as keyof typeof ICON_MAP] || HelpCircle;
                    return <IconComp size={18} color={b.color} />;
                  })()}
                </View>
                <Text style={s.bantName}>{b.name}</Text>
                <ChevronRight size={16} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Global Dialog Overlay */}
      {dialogContext && (
        <View style={s.overlay}>
          <View style={s.dialogBox}>
            <Text style={s.dialogTitle}>{dialogContext.title}</Text>
            <Text style={s.dialogMessage}>{dialogContext.message}</Text>
            <View style={s.dialogActions}>
              <TouchableOpacity
                style={[s.dialogBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setDialogContext(null)}
              >
                <Text style={[s.dialogBtnText, { color: colors.foreground }]}>
                  {dialogContext.isConfirm ? "Batal" : "Ok"}
                </Text>
              </TouchableOpacity>
              {dialogContext.isConfirm && (
                <TouchableOpacity
                  style={[s.dialogBtn, { backgroundColor: colors.destructive, marginLeft: 12 }]}
                  onPress={dialogContext.onConfirm}
                >
                  <Text style={[s.dialogBtnText, { color: colors.destructiveForeground }]}>Lanjutkan</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

