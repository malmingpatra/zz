import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { AlertCircle, X } from "lucide-react-native";

import { useColors } from "../_hooks/useColors";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmationModalProps) {
  const colors = useColors();
  if (!visible) return null;

  const s = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    content: {
      backgroundColor: colors.card,
      borderRadius: 20,
      width: "100%",
      maxWidth: 340,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: 20,
      paddingBottom: 0,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    closeBtn: {
      padding: 4,
    },
    body: {
      padding: 20,
    },
    title: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      lineHeight: 20,
    },
    footer: {
      flexDirection: "row",
      gap: 12,
      padding: 20,
      paddingTop: 0,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondary,
    },
    cancelText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
    },
    confirmBtn: {
      flex: 1.5,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmText: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: colors.primaryForeground,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            <View style={[s.iconBox, { backgroundColor: isDanger ? "#FCEBEB" : colors.accent }]}>
              <AlertCircle size={24} color={isDanger ? colors.destructive : colors.primary} />
            </View>
            <TouchableOpacity onPress={onCancel} style={s.closeBtn}>
              <X size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={s.body}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.message}>{message}</Text>
          </View>

          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
              <Text style={s.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.confirmBtn, { backgroundColor: isDanger ? colors.destructive : colors.primary }]} 
              onPress={onConfirm}
            >
              <Text style={s.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Remove static style at the bottom
