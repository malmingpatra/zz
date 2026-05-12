import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Mail, 
  Send, 
  Check, 
  Shield 
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColors } from "./_hooks/useColors";
import { signInWithPopup, GoogleAuthProvider, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "./_context/firebase-setup";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [view, setView] = useState<"main" | "sent">("main");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  React.useEffect(() => {
    if (Platform.OS === "web" && isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      if (!emailForSignIn) {
        emailForSignIn = window.prompt("Mohon masukkan email Anda untuk konfirmasi");
      }
      if (emailForSignIn) {
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            router.replace("/");
          })
          .catch((error) => {
            alert("Error sign in with magic link: " + error.message);
          });
      }
    }
  }, []);

  async function handleGoogleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace("/");
    } catch (error) {
      console.error("Login failed", error);
    }
  }

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError(true);
      setTimeout(() => setEmailError(false), 1800);
      return;
    }
    setLoading(true);
    
    try {
      if (Platform.OS === "web") {
        const { sendSignInLinkToEmail } = require("firebase/auth");
        window.localStorage.setItem('emailForSignIn', trimmed);
        await sendSignInLinkToEmail(auth, trimmed, {
          url: window.location.origin + "/login",
          handleCodeInApp: true
        });
      }
      setSentEmail(trimmed);
      setView("sent");
    } catch (e) {
      console.error(e);
      alert("Error ngirim magic link: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setView("main");
    setEmail("");
  }

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: insets.top + 16,
      paddingBottom: insets.bottom + 24,
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginBottom: 24,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    brandIcon: {
      width: 50,
      height: 50,
      backgroundColor: colors.primary,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    sub: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginBottom: 28,
    },
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      width: "100%",
      paddingVertical: 13,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      marginBottom: 16,
    },
    googleBtnText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    fieldLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    fieldWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      marginBottom: 16,
      height: 44,
      gap: 8,
    },
    fieldWrapError: {
      borderColor: colors.destructive,
    },
    fieldInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      padding: 0,
      ...(Platform.OS === "web" ? ({ outlineWidth: 0 } as object) : {}),
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      width: "100%",
      paddingVertical: 13,
      backgroundColor: colors.primary,
      borderRadius: 12,
    },
    primaryBtnDisabled: {
      backgroundColor: colors.mutedForeground,
    },
    primaryBtnText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.primaryForeground,
    },
    footerNote: {
      marginTop: 16,
      textAlign: "center",
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      lineHeight: 20,
    },
    successBox: {
      backgroundColor: colors.stokOkBg,
      borderRadius: 14,
      padding: 20,
      alignItems: "center",
    },
    successIcon: {
      width: 52,
      height: 52,
      backgroundColor: colors.primary,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    successTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 6,
    },
    emailPill: {
      backgroundColor: colors.stokOkBorder,
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 12,
    },
    emailPillText: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      color: colors.stokOkText,
    },
    successDesc: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.stokOkText,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 16,
    },
    ghostBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      width: "100%",
      paddingVertical: 11,
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      marginTop: 8,
    },
    ghostBtnText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    hint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.stokOkBg,
      borderRadius: 12,
      padding: 12,
      marginTop: 16,
      width: "100%",
      maxWidth: 400,
    },
    hintText: {
      flex: 1,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.stokOkText,
    },
  });

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={s.backRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <View style={s.brandIcon}>
            <ShoppingCart size={22} color={colors.primaryForeground} />
          </View>
          <Text style={s.title}>Selamat Datang</Text>
          <Text style={s.sub}>Pilih cara masuk ke akun toko Anda</Text>

          {view === "main" ? (
            <>
              <TouchableOpacity style={s.googleBtn} activeOpacity={0.8} onPress={handleGoogleLogin}>
                <GoogleIcon colors={colors} />
                <Text style={s.googleBtnText}>Lanjutkan dengan Google</Text>
              </TouchableOpacity>

              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>atau gunakan email</Text>
                <View style={s.dividerLine} />
              </View>

              <Text style={s.fieldLabel}>Alamat Email</Text>
              <View style={[s.fieldWrap, emailError && s.fieldWrapError]}>
                <Mail size={16} color={colors.mutedForeground} />
                <TextInput
                  style={s.fieldInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nama@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  underlineColorAndroid="transparent"
                />
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
                onPress={handleSend}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <>
                    <Send size={15} color={colors.primaryForeground} />
                    <Text style={s.primaryBtnText}>Kirim Magic Link</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={s.footerNote}>
                Link masuk akan dikirim ke email Anda.{"\n"}Tidak perlu password.
              </Text>
            </>
          ) : (
            <View style={s.successBox}>
              <View style={s.successIcon}>
                <Mail size={24} color={colors.primaryForeground} />
              </View>
              <Text style={s.successTitle}>Cek Email Anda!</Text>
              <View style={s.emailPill}>
                <Text style={s.emailPillText}>{sentEmail}</Text>
              </View>
              <Text style={s.successDesc}>
                Kami sudah mengirim magic link ke email di atas. Klik link tersebut untuk langsung masuk tanpa password.
              </Text>
              <TouchableOpacity
                style={s.primaryBtn}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                  <Check size={15} color={colors.primaryForeground} />
                  <Text style={s.primaryBtnText}>Saya sudah klik linknya</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={handleBack} activeOpacity={0.8}>
                <ArrowLeft size={14} color={colors.mutedForeground} />
                <Text style={s.ghostBtnText}>Ganti email / coba lagi</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={s.hint}>
          <Shield size={16} color={colors.primary} />
          <Text style={s.hintText}>Login aman tanpa password — tidak ada data yang disimpan di perangkat</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function GoogleIcon({ colors }: { colors: any }) {
  return (
    <View style={{ width: 19, height: 19 }}>
      <Text style={{ fontSize: 16, lineHeight: 19, color: colors.foreground }}>G</Text>
    </View>
  );
}
