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
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            <View style={[s.iconBox, { backgroundColor: isDanger ? "#FCEBEB" : "#EAF3DE" }]}>
              <AlertCircle size={24} color={isDanger ? "#E24B4A" : "#1A6B47"} />
            </View>
            <TouchableOpacity onPress={onCancel} style={s.closeBtn}>
              <X size={20} color="#9A9890" />
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
              style={[s.confirmBtn, { backgroundColor: isDanger ? "#E24B4A" : "#1A6B47" }]} 
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

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#fff",
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
    color: "#1A1A18",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6A6A66",
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
    backgroundColor: "#F5F4F0",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#4A4840",
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
    color: "#fff",
  },
});
