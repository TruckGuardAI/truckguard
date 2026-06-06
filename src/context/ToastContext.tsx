import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ToastKind } from '../services/alertsApi.service';

type ToastMessage = {
  id: string;
  text: string;
};

type ToastContextValue = {
  showToast: (kind: ToastKind) => void;
  showMessage: (text: string) => void;
};

const TOAST_LABELS: Record<ToastKind, string> = {
  created: '✓ Alerta criado',
  confirmed: '✓ Alerta confirmado',
  resolved: '✓ Alerta resolvido',
};

const ToastContext = createContext<ToastContextValue | null>(
  null,
);

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(
    null,
  );
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const hideToast = useCallback((): void => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -24,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [opacity, translateY]);

  const showMessage = useCallback(
    (text: string): void => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      setToast({
        id: Date.now().toString(),
        text,
      });

      opacity.setValue(0);
      translateY.setValue(-24);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimer.current = setTimeout(() => {
        hideToast();
      }, 2800);
    },
    [hideToast, opacity, translateY],
  );

  const showToast = useCallback(
    (kind: ToastKind): void => {
      showMessage(TOAST_LABELS[kind]);
    },
    [showMessage],
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{ showToast, showMessage }}
    >
      {children}

      {toast !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              top: insets.top + 12,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.toastInner}>
            <Text style={styles.toastText}>{toast.text}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast deve ser usado dentro de ToastProvider',
    );
  }

  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },

  toastInner: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#22c55e',
    minWidth: 220,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      },
      default: {
        elevation: 12,
      },
    }),
  },

  toastText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
