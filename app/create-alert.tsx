import React, {
  useState,
} from 'react';

import { useTranslation } from 'react-i18next';

import {
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  useAuth,
} from '../src/context/AuthContext';

import { useTheme } from '../src/context/ThemeContext';
import { useThemedStyles } from '../src/hooks/useThemedStyles';

import {
  alertsApiService,
} from '../src/services/alertsApi.service';

import {
  locationService,
} from '../src/services/location.service';

import type { AppThemeTokens } from '../src/theme/palettes';

const ALERT_TYPE_KEYS = [
  'theft',
  'suspicious',
  'accident',
  'dangerousRoad',
  'safeArea',
  'mechanic',
  'help',
] as const;

type AlertTypeKey = typeof ALERT_TYPE_KEYS[number];

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

    input: {
      backgroundColor: colors.card,
      marginTop: 20,
      padding: 15,
      borderRadius: 20,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
    },

    textArea: {
      height: 120,
      textAlignVertical: 'top',
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

export default function CreateAlert():
React.ReactElement {
  const { t } = useTranslation();

  const {
    user,
  } = useAuth();

  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [
    selected,
    setSelected,
  ] = useState<AlertTypeKey | ''>('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);

  function getTypeLabel(key: AlertTypeKey): string {
    return t(`createAlert.types.${key}`);
  }

  async function saveAlert() {
    try {
      if (!user) {
        Alert.alert(
          t('common.error'),
          t('createAlert.loginFirst'),
        );

        return;
      }

      if (!selected) {
        Alert.alert(
          t('common.attention'),
          t('createAlert.chooseAlert'),
        );

        return;
      }

      setLoading(true);

      const location =
        await locationService
          .getCurrentLocation();

      if (!location) {
        Alert.alert(
          t('common.error'),
          t('createAlert.gpsUnavailable'),
        );

        return;
      }

      console.log(
        'LOCALIZAÇÃO ALERTA:',
        location,
      );

      const alert =
        await alertsApiService.createAlert({
          title: getTypeLabel(selected),
          latitude:
            location.latitude,
          longitude:
            location.longitude,
        });

      if (!alert) {
        throw new Error(
          t('createAlert.createFailed'),
        );
      }

      Alert.alert(
        t('common.success'),
        t('createAlert.created'),
      );

      setDescription('');
      setSelected('');
      router.back();
    } catch (error: unknown) {
      console.log(
        'Erro criar alerta:',
        error,
      );

      const fallback = t('createAlert.createFailed');
      let message = fallback;

      if (
        error &&
        typeof error === 'object' &&
        'message' in error
      ) {
        message = String(error.message);
      }

      Alert.alert(
        t('common.error'),
        message,
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
      <Text style={styles.title}>
        {t('createAlert.title')}
      </Text>

      <Text style={styles.subtitle}>
        {t('createAlert.selectType')}
      </Text>

      {ALERT_TYPE_KEYS.map((key) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.card,
            selected === key &&
            styles.selected,
          ]}
          onPress={() => {
            setSelected(key);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.text}>
            {getTypeLabel(key)}
          </Text>
        </TouchableOpacity>
      ))}

      <TextInput
        placeholder={t('createAlert.descriptionPlaceholder')}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          styles.textArea,
        ]}
        multiline
        value={description}
        onChangeText={
          setDescription
        }
      />

      <TouchableOpacity
        style={styles.button}
        onPress={saveAlert}
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
            {t('createAlert.save')}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
