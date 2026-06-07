import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';

type Props = {
  children: React.ReactNode;
};

export default function GradientBackground({ children }: Props) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },

        orangeGlow: {
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: 999,
          backgroundColor: theme.isDark
            ? 'rgba(255,122,0,0.10)'
            : 'rgba(184,107,58,0.12)',
          top: -120,
          left: -80,
        },

        blueGlow: {
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: 999,
          backgroundColor: theme.isDark
            ? 'rgba(37,99,235,0.10)'
            : 'rgba(59,130,246,0.08)',
          bottom: -100,
          right: -60,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <View style={styles.orangeGlow} />
      <View style={styles.blueGlow} />

      {children}
    </View>
  );
}
