import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  useFocusEffect,
} from 'expo-router';

import { useTranslation } from 'react-i18next';

import GradientBackground from '../../../components/ui/GradientBackground';

import ProfileBackHeader from '../../components/profile/ProfileBackHeader';

import {
  useAuth,
} from '../../context/AuthContext';

import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

import {
  vehicleService,
} from '../../services/vehicle.service';

import type {
  Vehicle,
  VehicleInput,
} from '../../types/vehicle.types';

type FormState = {
  marca: string;
  modelo: string;
  matricula: string;
  tipoVeiculo: string;
  tipoCarga: string;
  comprimento: string;
  altura: string;
  pesoMaximo: string;
};

const EMPTY_FORM: FormState = {
  marca: '',
  modelo: '',
  matricula: '',
  tipoVeiculo: '',
  tipoCarga: '',
  comprimento: '',
  altura: '',
  pesoMaximo: '',
};

function vehicleToForm(
  vehicle: Vehicle,
): FormState {
  return {
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    matricula: vehicle.matricula,
    tipoVeiculo: vehicle.tipoVeiculo,
    tipoCarga: vehicle.tipoCarga ?? '',
    comprimento:
      vehicle.comprimento !==
      undefined
        ? String(vehicle.comprimento)
        : '',
    altura:
      vehicle.altura !== undefined
        ? String(vehicle.altura)
        : '',
    pesoMaximo:
      vehicle.pesoMaximo !== undefined
        ? String(vehicle.pesoMaximo)
        : '',
  };
}

function parseFormNumber(
  value: string,
): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(
    trimmed.replace(',', '.'),
  );

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

function formToInput(
  form: FormState,
): VehicleInput | null {
  if (
    !form.marca.trim() ||
    !form.modelo.trim() ||
    !form.matricula.trim() ||
    !form.tipoVeiculo.trim()
  ) {
    return null;
  }

  return {
    marca: form.marca,
    modelo: form.modelo,
    matricula: form.matricula,
    tipoVeiculo: form.tipoVeiculo,
    tipoCarga: form.tipoCarga,
    comprimento: parseFormNumber(
      form.comprimento,
    ),
    altura: parseFormNumber(
      form.altura,
    ),
    pesoMaximo: parseFormNumber(
      form.pesoMaximo,
    ),
  };
}

export default function VehicleScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [
    vehicle,
    setVehicle,
  ] = useState<Vehicle | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<FormState>(
    EMPTY_FORM,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const loadVehicle = useCallback(
    async () => {
      if (!user?.id) {
        setVehicle(null);
        setForm(EMPTY_FORM);
        setLoading(false);

        return;
      }

      setLoading(true);

      try {
        const data =
          await vehicleService.getVehicleByUserId(
            user.id,
          );

        setVehicle(data);
        setForm(
          data
            ? vehicleToForm(data)
            : EMPTY_FORM,
        );
      } catch (error) {
        console.log(
          'Erro carregar veículo:',
          error,
        );

        Alert.alert(
          t('common.error'),
          t('vehicle.loadFailed'),
        );
      } finally {
        setLoading(false);
      }
    },
    [user, t],
  );

  useFocusEffect(
    useCallback(() => {
      void loadVehicle();
    }, [loadVehicle]),
  );

  function updateField(
    field: keyof FormState,
    value: string,
  ): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave(): Promise<void> {
    if (!user?.id) {
      Alert.alert(
        t('profile.session'),
        t('vehicle.loginRequired'),
      );

      return;
    }

    const input = formToInput(form);

    if (!input) {
      Alert.alert(
        t('common.attention'),
        t('vehicle.requiredFields'),
      );

      return;
    }

    setSaving(true);

    try {
      const saved =
        await vehicleService.saveVehicle(
          user.id,
          input,
          vehicle?.id,
        );

      setVehicle(saved);
      setForm(vehicleToForm(saved));

      Alert.alert(
        t('common.success'),
        vehicle
          ? t('vehicle.updated')
          : t('vehicle.created'),
      );
    } catch (error) {
      console.log(
        'Erro guardar veículo:',
        error,
      );

      Alert.alert(
        t('common.error'),
        t('vehicle.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        <ProfileBackHeader title={t('vehicle.title')} />

        {!user ? (
          <View style={styles.card}>
            <Text style={styles.infoText}>
              {t('vehicle.loginPrompt')}
            </Text>
          </View>
        ) : loading ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={styles.loader}
          />
        ) : (
          <>
            <Text style={styles.sectionHint}>
              {vehicle
                ? t('vehicle.edit')
                : t('vehicle.register')}
            </Text>

            <View style={styles.card}>
              <Field
                label={t('vehicle.brand')}
                value={form.marca}
                onChangeText={(value) =>
                  updateField(
                    'marca',
                    value,
                  )
                }
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />

              <Field
                label={t('vehicle.model')}
                value={form.modelo}
                onChangeText={(value) =>
                  updateField(
                    'modelo',
                    value,
                  )
                }
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />

              <Field
                label={t('vehicle.plate')}
                value={form.matricula}
                onChangeText={(value) =>
                  updateField(
                    'matricula',
                    value,
                  )
                }
                autoCapitalize="characters"
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />

              <Field
                label={t('vehicle.vehicleType')}
                value={form.tipoVeiculo}
                onChangeText={(value) =>
                  updateField(
                    'tipoVeiculo',
                    value,
                  )
                }
                placeholder={t('vehicle.vehiclePlaceholder')}
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />

              <Field
                label={t('vehicle.cargoType')}
                value={form.tipoCarga}
                onChangeText={(value) =>
                  updateField(
                    'tipoCarga',
                    value,
                  )
                }
                placeholder={t('vehicle.cargoPlaceholder')}
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />

              <Field
                label={t('vehicle.length')}
                value={form.comprimento}
                onChangeText={(value) =>
                  updateField(
                    'comprimento',
                    value,
                  )
                }
                keyboardType="decimal-pad"
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />

              <Field
                label={t('vehicle.height')}
                value={form.altura}
                onChangeText={(value) =>
                  updateField(
                    'altura',
                    value,
                  )
                }
                keyboardType="decimal-pad"
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />

              <Field
                label={t('vehicle.maxWeight')}
                value={form.pesoMaximo}
                onChangeText={(value) =>
                  updateField(
                    'pesoMaximo',
                    value,
                  )
                }
                keyboardType="decimal-pad"
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                void handleSave();
              }}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator
                  color={theme.components.buttonPrimaryText}
                />
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {vehicle
                    ? t('vehicle.saveChanges')
                    : t('vehicle.create')}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'decimal-pad';
  styles: ReturnType<typeof createStyles>;
  placeholderColor: string;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  styles,
  placeholderColor,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 120,
    },

    loader: {
      marginTop: 40,
    },

    sectionHint: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: 16,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      marginBottom: 20,
    },

    infoText: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },

    field: {
      marginBottom: 16,
    },

    label: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 8,
    },

    input: {
      backgroundColor: components.inputBackground,
      borderWidth: 1,
      borderColor: components.inputBorder,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: components.inputText,
      fontSize: 15,
    },

    saveButton: {
      backgroundColor: components.buttonPrimaryBg,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },

    saveButtonText: {
      color: components.buttonPrimaryText,
      fontSize: 16,
      fontWeight: '800',
    },
  });
}
