import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  children: React.ReactNode;
};

export default function GradientBackground({ children }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.orangeGlow} />
      <View style={styles.blueGlow} />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  orangeGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(255,122,0,0.10)',
    top: -120,
    left: -80,
  },

  blueGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.10)',
    bottom: -100,
    right: -60,
  },
});