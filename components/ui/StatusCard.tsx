import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

type StatusCardProps = {
  title: string;
  value: string;
  color?: string;
};

export default function StatusCard({
  title,
  value,
  color = '#2563eb',
}: StatusCardProps) {
  return (
    <View style={styles.card}>
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text style={styles.value}>
        {value}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  indicator: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginBottom: 18,
  },

  value: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },

  title: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
});