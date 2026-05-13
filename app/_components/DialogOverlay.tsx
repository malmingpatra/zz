import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

export interface DialogContextType {
  title: string;
  message: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useAutoCloseDialog() {
  const [dialogContext, setDialogContext] = React.useState<DialogContextType | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (dialogContext && !dialogContext.isConfirm) {
      timer = setTimeout(() => {
        if (dialogContext.onCancel) dialogContext.onCancel();
        setDialogContext(null);
      }, 20000); // Auto close after 20 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [dialogContext]);

  return { dialogContext, setDialogContext };
}

export function DialogOverlay({
  context,
  onClose
}: {
  context: DialogContextType | null;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (context && !context.isConfirm) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 40, // Slide down around 40px from top
          useNativeDriver: true,
          tension: 50,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
    }
  }, [context, slideAnim, opacityAnim]);

  if (!context) return null;

  if (!context.isConfirm) {
    // Floating Notification (Toast)
    return (
      <Animated.View style={[s.toastContainer, { 
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim 
      }]}>
        <View style={s.toastContent}>
          <Text style={s.toastTitle}>{context.title}</Text>
          <Text style={s.toastMessage}>{context.message}</Text>
        </View>
        <TouchableOpacity style={s.toastCloseBtn} onPress={() => {
           if (context.onCancel) context.onCancel();
           onClose();
        }}>
          <Text style={s.toastCloseText}>X</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

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
  },

  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  toastContent: {
    flex: 1,
    marginRight: 10,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  toastMessage: {
    color: '#eee',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  toastCloseBtn: {
    padding: 8,
  },
  toastCloseText: {
    color: '#ccc',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  }
});
// sync-trigger
