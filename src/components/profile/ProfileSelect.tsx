import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';

import {
  MaterialIcons,
} from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

type Props = {
  label: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (value: string) => void;
};

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    field: {
      marginBottom: 16,
      width: '100%',
    },

    label: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 8,
    },

    trigger: {
      backgroundColor: components.inputBackground,
      borderWidth: 1,
      borderColor: components.inputBorder,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    triggerText: {
      color: components.inputText,
      fontSize: 15,
      flex: 1,
    },

    placeholder: {
      color: colors.textMuted,
    },

    overlay: {
      flex: 1,
      backgroundColor: components.modalOverlay,
      justifyContent: 'flex-end',
    },

    sheet: {
      backgroundColor: components.modalBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 32,
      maxHeight: '70%',
    },

    sheetTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
    },

    option: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },

    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceSecondary,
    },

    optionText: {
      color: colors.textSecondary,
      fontSize: 15,
    },

    optionTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
  });
}

export default function ProfileSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: Props) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] =
    useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.triggerText,
            !value && styles.placeholder,
          ]}
        >
          {value || placeholder}
        </Text>

        <MaterialIcons
          name="arrow-drop-down"
          size={24}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setOpen(false)
        }
      >
        <Pressable
          style={styles.overlay}
          onPress={() =>
            setOpen(false)
          }
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {label}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option,
                    value === option &&
                      styles.optionSelected,
                  ]}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === option &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
