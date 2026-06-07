import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  useFocusEffect,
} from 'expo-router';

import { useTranslation } from 'react-i18next';

import {
  MaterialIcons,
} from '@expo/vector-icons';

import GradientBackground from '../../../components/ui/GradientBackground';

import ProfileBackHeader from '../../components/profile/ProfileBackHeader';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  useToast,
} from '../../context/ToastContext';

import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

import {
  getProfileErrorMessage,
  profileService,
} from '../../services/profile.service';

import type {
  UserProfile,
} from '../../types/profile.types';

import {
  isImagePickerAvailable,
  pickImageFromLibrary,
  resetImagePickerAvailabilityCache,
} from '../../utils/safeImagePicker';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showMessage } = useToast();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [
    profile,
    setProfile,
  ] = useState<UserProfile | null>(
    null,
  );

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState<string | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    removing,
    setRemoving,
  ] = useState(false);

  const [
    pickerAvailable,
    setPickerAvailable,
  ] = useState(true);

  const [
    checkingPicker,
    setCheckingPicker,
  ] = useState(true);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      setCheckingPicker(true);

      const available =
        await isImagePickerAvailable();

      if (mounted) {
        setPickerAvailable(available);
        setCheckingPicker(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const loadProfile = useCallback(
    async () => {
      if (!user?.id) {
        setProfile(null);
        setAvatarUrl(null);
        setLoading(false);

        return;
      }

      setLoading(true);

      try {
        const data =
          await profileService.loadAuthenticatedProfile();

        const googleAvatar =
          (user.user_metadata
            ?.avatar_url as
            | string
            | undefined) ?? null;

        const resolvedAvatar =
          data?.avatarUrl ??
          googleAvatar ??
          null;

        setProfile(data);
        setAvatarUrl(resolvedAvatar);
      } catch (error) {
        console.log(
          'Erro carregar conta:',
          error,
        );

        Alert.alert(
          t('common.error'),
          t('account.loadFailed'),
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

  async function handlePickPhoto(): Promise<void> {
    console.log('LOG_PROFILE_PHOTO_FLOW', {
      step: 'button_to_picker',
      userId: user?.id ?? null,
      pickerAvailable,
      checkingPicker,
      uploading,
      removing,
    });

    if (!user?.id) {
      Alert.alert(
        t('profile.session'),
        t('account.loginForPhoto'),
      );

      return;
    }

    if (uploading || removing) {
      console.log('LOG_PROFILE_PHOTO_FLOW', {
        step: 'blocked_busy',
      });

      return;
    }

    resetImagePickerAvailabilityCache();

    const availableNow =
      await isImagePickerAvailable();

    setPickerAvailable(availableNow);

    console.log('LOG_PROFILE_PHOTO_FLOW', {
      step: 'picker_availability_recheck',
      availableNow,
    });

    try {
      const outcome =
        await pickImageFromLibrary();

      if (outcome.status === 'unavailable') {
        setPickerAvailable(false);

        console.log('LOG_PROFILE_PHOTO_FLOW', {
          step: 'picker_unavailable',
          reason: outcome.reason,
        });

        Alert.alert(
          t('account.unavailable'),
          t('account.photoPickerUnavailable'),
        );

        return;
      }

      if (outcome.status === 'permission_denied') {
        console.log('LOG_PROFILE_PHOTO_FLOW', {
          step: 'permission_denied',
        });

        Alert.alert(
          t('account.permission'),
          t('account.galleryPermission'),
        );

        return;
      }

      if (outcome.status === 'canceled') {
        console.log('LOG_PROFILE_PHOTO_FLOW', {
          step: 'picker_canceled',
        });

        return;
      }

      console.log('LOG_PROFILE_PHOTO_SELECTED', {
        uri: outcome.asset.uri,
        mimeType: outcome.asset.mimeType ?? null,
      });

      setUploading(true);

      console.log('LOG_PROFILE_PHOTO_UPLOAD_START', {
        userId: user.id,
        uri: outcome.asset.uri,
      });

      const savedUrl =
        await profileService.uploadAvatar(
          user.id,
          outcome.asset.uri,
          outcome.asset.mimeType,
        );

      console.log('LOG_PROFILE_PHOTO_UPLOAD_SUCCESS', {
        userId: user.id,
        avatarUrl: savedUrl,
      });

      setAvatarUrl(savedUrl);

      setProfile((current) =>
        current
          ? {
              ...current,
              avatarUrl: savedUrl,
            }
          : current,
      );

      console.log('LOG_PROFILE_PHOTO_FLOW', {
        step: 'profile_avatar_refreshed',
        avatarUrl: savedUrl,
      });

      showMessage(
        t('account.photoChangeSuccess'),
      );
    } catch (error) {
      const message =
        getProfileErrorMessage(error);

      console.error('LOG_PROFILE_PHOTO_UPLOAD_ERROR', {
        userId: user.id,
        message,
        error,
      });

      console.error('LOG_PHOTO_PICKER_ERROR', {
        stage: 'account_handle_pick_photo',
        message,
        error,
      });

      Alert.alert(
        t('common.error'),
        message ||
          t('account.photoChangeFailed'),
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto(): Promise<void> {
    if (!user?.id) {
      return;
    }

    Alert.alert(
      t('account.removePhotoTitle'),
      t('account.removePhotoConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setRemoving(true);

                await profileService.removeAvatar(
                  user.id,
                );

                setAvatarUrl(null);

                setProfile((current) =>
                  current
                    ? {
                        ...current,
                        avatarUrl:
                          undefined,
                      }
                    : current,
                  );
              } catch (error) {
                console.log(
                  'Erro remover foto:',
                  error,
                );

                Alert.alert(
                  t('common.error'),
                  t('account.photoRemoveFailed'),
                );
              } finally {
                setRemoving(false);
              }
            })();
          },
        },
      ],
    );
  }

  const displayName =
    profile?.fullName ||
    user?.user_metadata?.full_name ||
    t('account.user');

  const displayEmail =
    profile?.email ||
    user?.email ||
    '—';

  const busy = uploading || removing;
  const changePhotoDisabled = busy;

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
      >
        <ProfileBackHeader title={t('account.title')} />

        {loading ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={styles.loader}
          />
        ) : (
          <>
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image
                  key={avatarUrl}
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
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

              {busy ? (
                <View
                  style={
                    styles.avatarOverlay
                  }
                >
                  <ActivityIndicator
                    color={theme.components.buttonPrimaryText}
                  />
                </View>
              ) : null}
            </View>

            <View
              style={
                styles.photoActions
              }
            >
              <TouchableOpacity
                style={[
                  styles.primaryAction,
                  changePhotoDisabled &&
                    styles.primaryActionDisabled,
                ]}
                onPress={() => {
                  console.log(
                    'LOG_PROFILE_PHOTO_BUTTON_PRESS',
                    {
                      disabled:
                        changePhotoDisabled,
                      pickerAvailable,
                      checkingPicker,
                      uploading,
                      removing,
                      userId:
                        user?.id ?? null,
                    },
                  );

                  void handlePickPhoto();
                }}
                disabled={
                  changePhotoDisabled
                }
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.primaryActionText,
                    changePhotoDisabled &&
                      styles.primaryActionTextDisabled,
                  ]}
                >
                  {t('account.changePhoto')}
                </Text>
              </TouchableOpacity>

              {!pickerAvailable &&
              !checkingPicker ? (
                <Text
                  style={
                    styles.unavailableHint
                  }
                >
                  {t('account.galleryUnavailable')}
                </Text>
              ) : null}

              {avatarUrl ? (
                <TouchableOpacity
                  style={
                    styles.secondaryAction
                  }
                  onPress={() => {
                    void handleRemovePhoto();
                  }}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  <Text
                    style={
                      styles.secondaryActionText
                    }
                  >
                    {t('account.removePhoto')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>
                {t('profile.name')}
              </Text>
              <Text style={styles.value}>
                {displayName}
              </Text>

              <Text style={styles.label}>
                {t('profile.email')}
              </Text>
              <Text style={styles.value}>
                {displayEmail}
              </Text>

              <Text style={styles.label}>
                {t('account.plan')}
              </Text>
              <Text style={styles.value}>
                {t('account.free')}
              </Text>

              <Text style={styles.label}>
                {t('account.security')}
              </Text>
              <Text style={styles.value}>
                {t('account.active')}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </GradientBackground>
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
      alignSelf: 'center',
    },

    avatarWrap: {
      alignSelf: 'center',
      marginBottom: 20,
      position: 'relative',
    },

    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 3,
      borderColor: colors.primary,
    },

    avatarFallback: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 3,
      borderColor: colors.primary,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarOverlay: {
      ...StyleSheet.absoluteFill,
      borderRadius: 48,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },

    photoActions: {
      alignItems: 'center',
      gap: 10,
      marginBottom: 24,
    },

    primaryAction: {
      backgroundColor: components.buttonPrimaryBg,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 14,
      minWidth: 180,
      alignItems: 'center',
    },

    primaryActionDisabled: {
      backgroundColor: colors.textMuted,
      opacity: 0.7,
    },

    primaryActionText: {
      color: components.buttonPrimaryText,
      fontWeight: '800',
      fontSize: 15,
    },

    primaryActionTextDisabled: {
      color: colors.textSecondary,
    },

    unavailableHint: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 12,
    },

    secondaryAction: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },

    secondaryActionText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 14,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
    },

    label: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 6,
      marginTop: 14,
    },

    value: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
