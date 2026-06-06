import React from 'react';

import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

type FilterButtonProps = {
  title: string;
  active?: boolean;
  onPress: () => void;
};

export default function FilterButton({
  title,
  active = false,
  onPress,
}: FilterButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        active && styles.activeButton,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.text,
          active && styles.activeText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  activeButton: {
    backgroundColor: '#2563eb',
  },

  text: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },

  activeText: {
    color: '#ffffff',
  },
});