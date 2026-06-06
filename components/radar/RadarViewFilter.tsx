import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

import type { RadarViewMode } from '../../src/types/alert.types';

const VIEW_OPTIONS: {
  label: string;
  value: RadarViewMode;
}[] = [
  { label: 'Próximos', value: 'nearby' },
  { label: 'Na rota', value: 'route' },
  { label: 'Todos', value: 'all' },
];

type Props = {
  selected: RadarViewMode;
  onChange: (value: RadarViewMode) => void;
};

export default function RadarViewFilter({
  selected,
  onChange,
}: Props): React.ReactElement {
  return (
    <View style={styles.row}>
      {VIEW_OPTIONS.map((option) => {
        const isActive = selected === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isActive && styles.chipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },

  chip: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },

  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#60a5fa',
  },

  chipPressed: {
    opacity: 0.88,
  },

  chipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },

  chipTextActive: {
    color: '#fff',
  },
});
