import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useToast } from '../_context/ToastContext';

export interface DialogContextType {
  title: string;
  message: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useAutoCloseDialog() {
  const [dialogContext, setInnerDialogContext] = React.useState<DialogContextType | null>(null);
  const { showToast } = useToast();

  const setDialogContext = React.useCallback((ctx: DialogContextType | null) => {
    if (ctx && !ctx.isConfirm) {
      let type: 'success' | 'error' | 'info' = 'info';
      const tLower = ctx.title.toLowerCase();
      if (tLower.includes('sukses') || tLower.includes('berhasil')) type = 'success';
      if (tLower.includes('error') || tLower.includes('gagal') || tLower.includes('eror')) type = 'error';
      showToast(ctx.title, ctx.message, type);
    } else {
      setInnerDialogContext(ctx);
    }
  }, [showToast]);

  return { dialogContext, setDialogContext };
}

export function DialogOverlay({
  context,
  onClose
}: {
  context: DialogContextType | null;
  onClose: () => void;
}) {
  if (!context || !context.isConfirm) return null;

  // Confirmation Overlay (Modal)
  return (
    <View style={s.overlay}>
      <View style={s.dialogBox}>
        <Text style={s.dialogTitle}>{context.title}</Text>
        <Text style={s.dialogMessage}>{context.message}</Text>
        <View style={s.dialogActions}>
          <TouchableOpacity
            style={[s.dialogBtn, { backgroundColor: '#f5f5f5' }]}
            onPress={() => {
              if (context.onCancel) context.onCancel();
              onClose();
            }}
          >
            <Text style={[s.dialogBtnText, { color: '#333' }]}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.dialogBtn, { backgroundColor: '#D32F2F', marginLeft: 12 }]}
            onPress={() => {
              if (context.onConfirm) context.onConfirm();
              onClose();
            }}
          >
            <Text style={[s.dialogBtnText, { color: '#fff' }]}>Lanjutkan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
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
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  dialogMessage: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#555',
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
  }
});
// sync-trigger
