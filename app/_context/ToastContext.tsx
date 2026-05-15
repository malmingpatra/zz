import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';

interface Toast {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Animasi masuk
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Animasi progress bar (cooldown)
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: toast.duration || 15000,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      closeToast();
    }, toast.duration || 15000);

    return () => clearTimeout(timer);
  }, []);

  const closeToast = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onRemove(toast.id));
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'error': return '#333';
      case 'success': return '#333'; // Desain gelap minimalis
      default: return '#333';
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'error': return '#ef4444'; // red-500
      case 'success': return '#10b981'; // emerald-500
      default: return '#3b82f6'; // blue-500
    }
  };

  return (
    <Animated.View style={[s.toastItem, { 
      transform: [{ translateY: slideAnim }],
      opacity: opacityAnim,
      backgroundColor: getBackgroundColor()
    }]}>
      <View style={s.toastContent}>
        {toast.title && <Text style={s.toastTitle}>{toast.title}</Text>}
        <Text style={s.toastMessage}>{toast.message}</Text>
      </View>
      <TouchableOpacity style={s.toastCloseBtn} onPress={closeToast}>
        <Text style={s.toastCloseText}>×</Text>
      </TouchableOpacity>
      
      {/* Progress Bar (Cooldown) */}
      <View style={s.progressContainer}>
        <Animated.View style={[s.progressBar, {
          backgroundColor: getProgressColor(),
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
          })
        }]} />
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: Toast = {
      id: Math.random().toString(36).substring(7),
      title,
      message,
      type,
      duration: 15000 // default duration 15s
    };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Root Toast Container */}
      <View style={styles.toastRoot} pointerEvents="box-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

const styles = StyleSheet.create({
  toastRoot: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
    gap: 10,
  }
});

const s = StyleSheet.create({
  toastItem: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 20, // space for progress bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  toastContent: {
    flex: 1,
    marginRight: 10,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 15,
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
    padding: 2,
  },
  toastCloseText: {
    color: '#aaa',
    fontSize: 22,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
  }
});
