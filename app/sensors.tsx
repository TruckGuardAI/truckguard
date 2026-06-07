import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../src/context/ThemeContext';

import { useThemedStyles } from '../src/hooks/useThemedStyles';

import type { AppThemeTokens } from '../src/theme/palettes';

const DEVICES = [
  {
    id: 1,
    nameKey: 'tankSensor' as const,
    active: true,
    battery: '92%',
    icon: 'water-outline',
  },
  {
    id: 2,
    nameKey: 'cabinMotion' as const,
    active: true,
    battery: '81%',
    icon: 'shield-outline',
  },
  {
    id: 3,
    nameKey: 'cargoVibration' as const,
    active: false,
    battery: '--',
    icon: 'cube-outline',
  },
];

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      padding: 20,
      paddingBottom: 120,
      gap: 22,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: '700',
      marginTop: 40,
      letterSpacing: 2,
    },

    heroCard: {
      backgroundColor: colors.card,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 26,
    },

    heroLabel: {
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 12,
    },

    heroNumber: {
      color: colors.primary,
      fontSize: 52,
      fontWeight: '800',
      marginTop: 10,
    },

    heroSub: {
      color: colors.textPrimary,
      marginTop: 10,
      lineHeight: 22,
    },

    listContainer: {
      gap: 16,
    },

    sensorCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },

    sensorPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },

    iconBox: {
      width: 56,
      height: 56,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },

    sensorContent: {
      flex: 1,
    },

    sensorName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },

    sensorStatus: {
      color: colors.textMuted,
      marginTop: 4,
    },

    rightBlock: {
      alignItems: 'center',
      gap: 8,
    },

    batteryText: {
      color: colors.textPrimary,
      fontWeight: '700',
    },

    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    shopCard: {
      backgroundColor: colors.card,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      marginTop: 10,
    },

    shopTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    shopTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },

    shopText: {
      color: colors.textMuted,
      marginTop: 14,
      lineHeight: 22,
    },

    shopButton: {
      marginTop: 20,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 18,
      alignItems: 'center',
    },

    shopButtonText: {
      color: components.buttonPrimaryText,
      fontWeight: '700',
      fontSize: 15,
      letterSpacing: 0.5,
    },
  });
}

export default function SensorsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { colors } = theme;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {t('sensors.title')}
        </Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            {t('sensors.bluetoothMonitoring')}
          </Text>

          <Text style={styles.heroNumber}>
            {t('sensors.activeCount')}
          </Text>

          <Text style={styles.heroSub}>
            {t('sensors.heroSub')}
          </Text>
        </View>

        <View style={styles.listContainer}>
          {DEVICES.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.sensorCard,
                pressed && styles.sensorPressed,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: item.active
                      ? `${colors.success}24`
                      : colors.glass.highlight,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={
                    item.active
                      ? colors.success
                      : colors.textMuted
                  }
                />
              </View>

              <View style={styles.sensorContent}>
                <Text style={styles.sensorName}>
                  {t(`sensors.${item.nameKey}`)}
                </Text>

                <Text style={styles.sensorStatus}>
                  {item.active
                    ? t('sensors.connected')
                    : t('sensors.disconnected')}
                </Text>
              </View>

              <View style={styles.rightBlock}>
                <Text style={styles.batteryText}>
                  {item.battery}
                </Text>

                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: item.active
                        ? colors.success
                        : colors.danger,
                    },
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.shopCard}>
          <View style={styles.shopTop}>
            <Ionicons
              name="hardware-chip-outline"
              size={24}
              color={colors.primary}
            />

            <Text style={styles.shopTitle}>
              {t('sensors.securityKit')}
            </Text>
          </View>

          <Text style={styles.shopText}>
            {t('sensors.kitDesc')}
          </Text>

          <Pressable style={styles.shopButton}>
            <Text style={styles.shopButtonText}>
              {t('sensors.exploreHardware')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
