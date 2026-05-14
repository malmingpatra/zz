import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  AlertCircle, 
  ArrowLeft, 
  Pencil, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Map,
  Save,
  X
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "./_hooks/useColors";
import { useDatabase } from "./_context/DatabaseContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./_context/firebase-setup";

export default function DetailMemberScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

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
    editBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center",
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: insets.bottom + 20 },
    hero: {
      backgroundColor: colors.card, margin: 12, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border,
      padding: 24, alignItems: "center",
    },
    avatarRing: {
      width: 76, height: 76, borderRadius: 22,
      alignItems: "center", justifyContent: "center",
      marginBottom: 12,
    },
    avatarInitials: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.primaryForeground, letterSpacing: -0.5 },
    heroName: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 8, textAlign: "center" },
    badgesRow: { flexDirection: "row", gap: 6 },
    badge: {
      fontSize: 11, fontFamily: "Inter_600SemiBold",
      paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, overflow: "hidden",
    },
    cards: { paddingHorizontal: 12, gap: 10 },
    card: {
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10,
    },
    cardLabel: {
      fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10,
    },
    infoRow: {
      flexDirection: "row", alignItems: "flex-start", gap: 10,
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.secondary,
    },
    infoRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    infoIcon: {
      width: 34, height: 34, borderRadius: 9,
      backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center",
    },
    infoKey: { fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginBottom: 2 },
    infoValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, lineHeight: 20 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 8, fontSize: 13,
      fontFamily: "Inter_500Medium", color: colors.foreground,
      backgroundColor: colors.secondary, marginTop: 4, width: "100%",
    },
    roleChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
    roleChip: { 
      paddingHorizontal: 12, paddingVertical: 6, 
      borderRadius: 16, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border 
    },
    roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    roleChipTextActive: { color: colors.primaryForeground },
  });

  const router = useRouter();
  const { member_id } = useLocalSearchParams<{ member_id: string }>();
  const { members } = useDatabase();

  const member = members.find(m => m.id === member_id);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    role: "user",
    area: "",
  });

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name || "",
        phone: member.phone || "",
        address: member.address || "",
        role: member.role || "user",
        area: member.area || "",
      });
    }
  }, [member]);

  const ROLES = ["user", "pelanggan", "staff", "admin"];

  const handleSave = async () => {
    if (!member) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", member.id);
      await updateDoc(userRef, {
        displayName: form.name,
        phoneNumber: form.phone,
        address: form.address,
        role: form.role,
        area: form.area,
      });
      setIsEditing(false);
      Alert.alert("Sukses", "Data member berhasil diperbarui");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error instanceof Error ? error.message : "Gagal memperbarui data member");
    } finally {
      setLoading(false);
    }
  };

// Styles defined inside component

  if (!member) {
    return (
      <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}>
        <AlertCircle size={36} color="#ccc" />
        <Text style={{ marginTop: 10, fontSize: 14, color: "#aaa", fontFamily: "Inter_400Regular" }}>
          Member tidak ditemukan
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7} disabled={loading}>
          <ArrowLeft size={18} color="#444" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? "Edit Member" : "Detail Member"}</Text>
        <TouchableOpacity 
          style={s.editBtn} 
          activeOpacity={0.7} 
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="#444" /> : isEditing ? <Save size={16} color="#444" /> : <Pencil size={16} color="#444" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={[s.avatarRing, { background: undefined, backgroundColor: undefined }]}>
            <View style={{
              width: 76, height: 76, borderRadius: 22,
              alignItems: "center", justifyContent: "center",
              backgroundColor: colors.primary,
            }}>
              <Text style={s.avatarInitials}>{member.initials}</Text>
            </View>
          </View>
          
          {isEditing ? (
            <TextInput
              style={[s.input, { textAlign: "center", fontSize: 16, marginBottom: 8 }]}
              value={form.name}
              onChangeText={(t) => setForm({...form, name: t})}
              placeholder="Nama Lengkap"
            />
          ) : (
            <Text style={s.heroName}>{member.name}</Text>
          )}

          <View style={s.badgesRow}>
            <Text style={[s.badge, { backgroundColor: "#E6F1FB", color: "#0C447C" }]}>
              {member.role || "user"}
            </Text>
            <Text style={[s.badge, { backgroundColor: member.status === "aktif" ? "#EAF3DE" : "#F5F5F5", color: member.status === "aktif" ? "#27500A" : "#888" }]}>
              {member.status === "aktif" ? "Aktif" : "Non-aktif"}
            </Text>
          </View>
        </View>

        <View style={s.cards}>
          {/* Kontak */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Kontak</Text>
            <View style={s.infoRow}>
              <View style={s.infoIcon}><Mail size={15} color="#888" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoKey}>Alamat Email</Text>
                <Text style={s.infoValue}>{member.email}</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <View style={s.infoIcon}><Phone size={15} color="#888" /></View>
              <View style={{ flex: 1, paddingRight: isEditing ? 0 : 10 }}>
                <Text style={s.infoKey}>No. HP</Text>
                {isEditing ? (
                  <TextInput
                    style={s.input}
                    value={form.phone}
                    onChangeText={(t) => setForm({...form, phone: t})}
                    placeholder="Contoh: 08123456789"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={s.infoValue}>{member.phone}</Text>
                )}
              </View>
            </View>
            <View style={[s.infoRow, s.infoRowLast]}>
              <View style={s.infoIcon}><MapPin size={15} color="#888" /></View>
              <View style={{ flex: 1, paddingRight: isEditing ? 0 : 10 }}>
                <Text style={s.infoKey}>Alamat</Text>
                {isEditing ? (
                  <TextInput
                    style={[s.input, { height: 60 }]}
                    value={form.address}
                    onChangeText={(t) => setForm({...form, address: t})}
                    placeholder="Alamat lengkap"
                    multiline
                  />
                ) : (
                  <Text style={s.infoValue}>{member.address}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Akun */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Informasi Akun</Text>
            <View style={s.infoRow}>
              <View style={s.infoIcon}><Shield size={15} color="#888" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoKey}>Role</Text>
                {isEditing ? (
                  <View style={s.roleChips}>
                    {ROLES.map(r => (
                      <TouchableOpacity 
                        key={r} 
                        style={[s.roleChip, form.role === r && s.roleChipActive]}
                        onPress={() => setForm({...form, role: r})}
                      >
                        <Text style={[s.roleChipText, form.role === r && s.roleChipTextActive]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={s.infoValue}>{member.role || "user"}</Text>
                )}
              </View>
            </View>
            <View style={[s.infoRow, s.infoRowLast]}>
              <View style={s.infoIcon}><Map size={15} color="#888" /></View>
              <View style={{ flex: 1, paddingRight: isEditing ? 0 : 10 }}>
                <Text style={s.infoKey}>Area</Text>
                {isEditing ? (
                  <TextInput
                    style={s.input}
                    value={form.area}
                    onChangeText={(t) => setForm({...form, area: t})}
                    placeholder="Area (opsional)"
                  />
                ) : (
                  <Text style={s.infoValue}>{member.area || "-"}</Text>
                )}
              </View>
            </View>
          </View>
          
          {isEditing && (
            <TouchableOpacity 
              style={{ padding: 12, alignItems: 'center' }}
              onPress={() => setIsEditing(false)}
            >
              <Text style={{ color: '#aaa', fontFamily: 'Inter_500Medium' }}>Batal Edit</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </View>
  );
}
// sync-trigger
