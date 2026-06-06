import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

import {
  RADIUS_FILTER_OPTIONS,
  type RadiusFilterKm,
} from '../../src/utils/alertRadar.utils';

type Props = {
  selected: RadiusFilterKm;
  onChange: (value: RadiusFilterKm) => void;
};

export default function RadiusFilter({
  selected,
  onChange,
}: Props): React.ReactElement {
  return (
    <View style={styles.row}>
      {RADIUS_FILTER_OPTIONS.map((option) => {
        const isActive = selected === option.value;

        return (
          <Pressable
            key={option.label}
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
    marginBottom: 12,
  },

  chip: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  chipActive: {
    backgroundColor: '#f97316',
    borderColor: '#fb923c',
  },

  chipPressed: {
    opacity: 0.85,
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
