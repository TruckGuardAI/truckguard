import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

type RadarCardProps = {
  title: string;
  description: string;
  distance: string;
  severity?: 'low' | 'medium' | 'high';
};

export default function RadarCard({
  title,
  description,
  distance,
  severity = 'low',
}: RadarCardProps) {
  function getSeverityColor() {
    try {
      switch (severity) {
        case 'high':
          return '#ef4444';

        case 'medium':
          return '#f59e0b';

        case 'low':
        default:
          return '#22c55e';
      }
    } catch (error) {
      console.error('Erro severity:', error);
      return '#22c55e';
    }
  }

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: getSeverityColor(),
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.distance}>
            {distance}
          </Text>
        </View>

        <Text style={styles.description}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  indicator: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginTop: 6,
    marginRight: 14,
  },

  content: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },

  distance: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },

  description: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
});