import React, {
  useState,
} from 'react';

import { useTranslation } from 'react-i18next';

import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  router,
} from 'expo-router';

import { useTheme } from '../src/context/ThemeContext';
import { useThemedStyles } from '../src/hooks/useThemedStyles';

import {
  alertsApiService,
} from '../src/services/alertsApi.service';

import {
  locationService,
} from '../src/services/location.service';

import type { AppThemeTokens } from '../src/theme/palettes';

import type {
  AlertType,
} from '../src/types/alert.types';

type ReportTypeKey =
  | 'fuelTheft'
  | 'theftAttempt'
  | 'palletOnRoad'
  | 'obstacle'
  | 'accident'
  | 'police';

type ReportAlertOption = {
  labelKey: ReportTypeKey;
  type: AlertType;
};

const REPORT_TYPES: ReportAlertOption[] = [
  {
    labelKey: 'fuelTheft',
    type: 'fuel',
  },
  {
    labelKey: 'theftAttempt',
    type: 'full_attack',
  },
  {
    labelKey: 'palletOnRoad',
    type: 'pallet',
  },
  {
    labelKey: 'obstacle',
    type: 'obstacle',
  },
  {
    labelKey: 'accident',
    type: 'sos',
  },
  {
    labelKey: 'police',
    type: 'rest',
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
      paddingTop: 70,
      paddingBottom: 120,
    },

    backButton: {
      marginBottom: 20,
    },

    backButtonText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
    },

    title: {
      fontSize: 30,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 10,
    },

    subtitle: {
      color: colors.textMuted,
      marginBottom: 20,
      fontSize: 15,
    },

    card: {
      backgroundColor: colors.card,
      padding: 18,
      borderRadius: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    selected: {
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.surfaceSecondary,
    },

    text: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },

    button: {
      backgroundColor: components.buttonPrimaryBg,
      padding: 18,
      borderRadius: 20,
      marginTop: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 58,
    },

    buttonText: {
      color: components.buttonPrimaryText,
      fontWeight: 'bold',
      textAlign: 'center',
      fontSize: 16,
    },
  });
}

export default function ReportAlertScreen():
React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [
    selected,
    setSelected,
  ] = useState<ReportAlertOption | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  function getTypeLabel(key: ReportTypeKey): string {
    return t(`reportAlert.types.${key}`);
  }

  async function saveAlert(): Promise<void> {
    if (!selected) {
      Alert.alert(
        t('common.attention'),
        t('reportAlert.chooseType'),
      );

      return;
    }

    setLoading(true);

    try {
      const location =
        await locationService.getCurrentLocation();

      const alert =
        await alertsApiService.createAlert({
          title: getTypeLabel(selected.labelKey),
          type: selected.type,
          latitude: location.latitude,
          longitude: location.longitude,
        });

      if (!alert) {
        throw new Error(
          t('createAlert.createFailed'),
        );
      }

      Alert.alert(
        t('common.success'),
        t('reportAlert.success'),
      );

      setSelected(null);
      router.back();
    } catch (error) {
      console.log(
        'Erro reportar alerta:',
        error,
      );

      Alert.alert(
        t('common.error'),
        t('reportAlert.failed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={
            styles.backButtonText
          }
        >
          {t('reportAlert.back')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {t('reportAlert.title')}
      </Text>

      <Text style={styles.subtitle}>
        {t('reportAlert.selectType')}
      </Text>

      {REPORT_TYPES.map((item) => (
        <TouchableOpacity
          key={item.labelKey}
          style={[
            styles.card,
            selected?.labelKey ===
              item.labelKey &&
              styles.selected,
          ]}
          onPress={() => {
            setSelected(item);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.text}>
            {getTypeLabel(item.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          void saveAlert();
        }}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator
            color={theme.components.buttonPrimaryText}
          />
        ) : (
          <Text
            style={
              styles.buttonText
            }
          >
            {t('reportAlert.submit')}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
