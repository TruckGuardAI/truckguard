import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { Image } from 'expo-image';

import {
  MaterialIcons,
} from '@expo/vector-icons';

import {
  useRouter,
  useFocusEffect,
} from 'expo-router';

import { useTranslation } from 'react-i18next';

import GradientBackground from '../../components/ui/GradientBackground';

import TruxafeHeader from '../components/branding/TruxafeHeader';

import ProfileReputationCard from '../components/profile/ProfileReputationCard';

import ProfileSelect from '../components/profile/ProfileSelect';

import {
  useAuth,
} from '../context/AuthContext';

import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

import type { AppThemeTokens } from '../theme/palettes';

import { supabase } from '../lib/supabase';

import {
  getProfileErrorMessage,
  profileService,
} from '../services/profile.service';

import {
  reputationService,
} from '../services/reputation.service';

import type { UserReputation } from '../types/reputation.types';

import {
  CARGO_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type CargoTypeOption,
  type VehicleTypeOption,
} from '../types/profile.types';

const VEHICLE_TYPE_I18N_KEYS = [
  'articulated',
  'rigid',
  'carCarrier',
  'van',
  'light',
  'machinery',
  'special',
] as const;

const CARGO_TYPE_I18N_KEYS = [
  'general',
  'vehicles',
  'fuel',
  'refrigerated',
  'adr',
  'containers',
  'other',
] as const;

type MenuItem = {
  id: string;
  labelKey: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'account',
    labelKey: 'profile.myAccount',
    icon: 'person-outline',
    route: '/(tabs)/profile/account',
  },
  {
    id: 'devices',
    labelKey: 'profile.devices',
    icon: 'bluetooth',
    route: '/(tabs)/profile/devices',
  },
  {
    id: 'settings',
    labelKey: 'profile.settings',
    icon: 'settings',
    route: '/(tabs)/profile/settings',
  },
  {
    id: 'support',
    labelKey: 'profile.support',
    icon: 'support-agent',
    route: '/(tabs)/profile/support',
  },
];

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingBottom: 120,
    },

    container: {
      paddingTop: 8,
      paddingHorizontal: 20,
    },

    loader: {
      marginTop: 40,
      alignSelf: 'center',
    },

    card: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      marginBottom: 24,
    },

    avatarSection: {
      alignItems: 'center',
      marginBottom: 16,
    },

    avatarName: {
      marginTop: 12,
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },

    avatarRole: {
      marginTop: 4,
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
    },

    avatarImage: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: colors.border,
    },

    avatarFallback: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
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
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      marginTop: 8,
    },

    saveButtonText: {
      color: components.buttonPrimaryText,
      fontSize: 16,
      fontWeight: '800',
    },

    menu: {
      width: '100%',
      marginBottom: 24,
    },

    menuItem: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 20,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },

    menuItemText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },

    logoutButton: {
      backgroundColor: colors.danger,
      width: '100%',
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
    },

    logoutText: {
      color: components.buttonPrimaryText,
      fontWeight: '800',
      fontSize: 16,
    },
  });
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const vehicleTypeOptions = useMemo(
    () =>
      VEHICLE_TYPE_I18N_KEYS.map((key) =>
        t(`profile.vehicleTypes.${key}`),
      ),
    [t],
  );

  const cargoTypeOptions = useMemo(
    () =>
      CARGO_TYPE_I18N_KEYS.map((key) =>
        t(`profile.cargoTypes.${key}`),
      ),
    [t],
  );

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState<string | null>(
    null,
  );

  const [
    fullName,
    setFullName,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    tipoVeiculo,
    setTipoVeiculo,
  ] = useState('');

  const [
    tipoCarga,
    setTipoCarga,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    reputation,
    setReputation,
  ] = useState<UserReputation | null>(
    null,
  );

  const vehicleDisplayValue = useMemo(() => {
    const idx = VEHICLE_TYPE_OPTIONS.indexOf(
      tipoVeiculo as VehicleTypeOption,
    );

    return idx >= 0 ? vehicleTypeOptions[idx] : tipoVeiculo;
  }, [tipoVeiculo, vehicleTypeOptions]);

  const cargoDisplayValue = useMemo(() => {
    const idx = CARGO_TYPE_OPTIONS.indexOf(
      tipoCarga as CargoTypeOption,
    );

    return idx >= 0 ? cargoTypeOptions[idx] : tipoCarga;
  }, [tipoCarga, cargoTypeOptions]);

  const loadProfile = useCallback(
    async () => {
      setLoading(true);

      try {
        const profile =
          await profileService.loadAuthenticatedProfile();

        if (!profile) {
          setAvatarUrl(null);
          setFullName('');
          setEmail('');
          setTipoVeiculo('');
          setTipoCarga('');
          setReputation(null);

          return;
        }

        try {
          const reputationData =
            await reputationService.getUserReputation(
              profile.id,
            );

          setReputation(reputationData);
        } catch (reputationError) {
          console.log(
            'REPUTATION_ERROR',
            reputationError,
          );

          setReputation(null);
        }

        const googleAvatar =
          (user?.user_metadata
            ?.avatar_url as
            | string
            | undefined) ?? null;

        const resolvedAvatar =
          profile.avatarUrl ??
          googleAvatar;

        console.log(
          'PROFILE_AVATAR_LOAD',
          resolvedAvatar,
        );

        setAvatarUrl(resolvedAvatar);
        setFullName(profile.fullName);
        setEmail(profile.email);
        setTipoVeiculo(
          profile.tipoVeiculo || '',
        );
        setTipoCarga(
          profile.tipoCarga || '',
        );
      } catch (error) {
        const message =
          getProfileErrorMessage(error);

        console.log(
          'PROFILE_LOAD_ERROR',
          message,
          error,
        );

        Alert.alert(
          t('common.error'),
          `${t('profile.loadFailed')}\n\n${message}`,
        );
      } finally {
        setLoading(false);
      }
    },
    [user, t],
  );

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  async function handleSave(): Promise<void> {
    if (!user?.id) {
      Alert.alert(
        t('profile.session'),
        t('profile.loginRequired'),
      );

      return;
    }

    if (!fullName.trim()) {
      Alert.alert(
        t('profile.name'),
        t('profile.nameRequired'),
      );

      return;
    }

    if (!email.trim()) {
      Alert.alert(
        t('profile.email'),
        t('profile.emailRequired'),
      );

      return;
    }

    setSaving(true);

    try {
      const saved =
        await profileService.saveProfile(
          user.id,
          {
            fullName,
            email,
            tipoVeiculo:
              tipoVeiculo
                ? (tipoVeiculo as VehicleTypeOption)
                : undefined,
            tipoCarga:
              tipoCarga
                ? (tipoCarga as CargoTypeOption)
                : undefined,
          },
        );

      setAvatarUrl(
        saved.avatarUrl ??
          avatarUrl,
      );

      Alert.alert(
        t('common.success'),
        t('profile.saved'),
      );
    } catch (error) {
      console.log(
        'PROFILE_UPDATE_ERROR',
        getProfileErrorMessage(error),
        error,
      );

      Alert.alert(
        t('common.error'),
        t('profile.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout(): Promise<void> {
    console.log('AUTH_LOGOUT_START');

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      console.log('AUTH_LOGOUT_SUCCESS');

      router.replace('/login');
    } catch (error) {
      console.log(
        'AUTH_LOGOUT_ERROR',
        error,
      );

      Alert.alert(
        t('common.error'),
        t('profile.logoutFailed'),
      );
    }
  }

  return (
    <GradientBackground>
      <TruxafeHeader
        title={t('profile.title')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {!user ? (
            <View style={styles.card}>
              <Text style={styles.infoText}>
                {t('profile.loginPrompt')}
              </Text>
            </View>
          ) : loading ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.loader}
            />
          ) : (
            <>
            {reputation ? (
              <ProfileReputationCard
                reputation={reputation}
              />
            ) : null}

            <View style={styles.card}>
              <View
                style={
                  styles.avatarSection
                }
              >
                {avatarUrl ? (
                  <Image
                    source={{
                      uri: avatarUrl,
                    }}
                    style={
                      styles.avatarImage
                    }
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={
                      styles.avatarFallback
                    }
                  >
                    <MaterialIcons
                      name="person"
                      size={48}
                      color={theme.colors.textMuted}
                    />
                  </View>
                )}

                <Text style={styles.avatarName}>
                  {fullName.trim() ||
                    t('profile.defaultName')}
                </Text>

                <Text style={styles.avatarRole}>
                  {vehicleDisplayValue ||
                    t('profile.professionalDriver')}
                </Text>
              </View>

              <Field
                label={t('profile.name')}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('profile.namePlaceholder')}
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />

              <Field
                label={t('profile.email')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('profile.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                styles={styles}
                placeholderColor={theme.colors.textMuted}
              />

              <ProfileSelect
                label={t('profile.vehicleType')}
                value={vehicleDisplayValue}
                options={vehicleTypeOptions}
                placeholder={t('profile.selectVehicleType')}
                onChange={(label) => {
                  const idx = vehicleTypeOptions.indexOf(label);

                  if (idx >= 0) {
                    setTipoVeiculo(VEHICLE_TYPE_OPTIONS[idx]);
                  }
                }}
              />

              <ProfileSelect
                label={t('profile.cargoType')}
                value={cargoDisplayValue}
                options={cargoTypeOptions}
                placeholder={t('profile.selectCargoType')}
                onChange={(label) => {
                  const idx = cargoTypeOptions.indexOf(label);

                  if (idx >= 0) {
                    setTipoCarga(CARGO_TYPE_OPTIONS[idx]);
                  }
                }}
              />

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
                    {t('profile.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            </>
          )}

          <View style={styles.menu}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() =>
                  router.push(
                    item.route as never,
                  )
                }
                activeOpacity={0.8}
              >
                <View
                  style={
                    styles.menuItemLeft
                  }
                >
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={theme.colors.primary}
                  />

                  <Text
                    style={
                      styles.menuItemText
                    }
                  >
                    {t(item.labelKey)}
                  </Text>
                </View>

                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={
              styles.logoutButton
            }
            onPress={() => {
              void handleLogout();
            }}
          >
            <Text
              style={
                styles.logoutText
              }
            >
              {t('profile.logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  styles: ReturnType<typeof createStyles>;
  placeholderColor: string;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
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
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}
