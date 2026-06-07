import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useTranslation } from 'react-i18next';

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useThemedStyles } from '../../src/hooks/useThemedStyles';

import {
  manualAlertService,
} from '../../src/services/manualAlert.service';

import type { AppThemeTokens } from '../../src/theme/palettes';

import {
  MANUAL_INCIDENT_TYPES,
  type ManualIncidentTypeId,
} from '../../src/types/manualAlert.types';

import {
  pickImageFromLibrary,
} from '../../src/utils/safeImagePicker';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },

    backdropPressable: {
      ...StyleSheet.absoluteFill,
    },

    sheet: {
      maxHeight: '90%',
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 28,
    },

    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },

    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 16,
    },

    typeGrid: {
      gap: 10,
      marginBottom: 18,
    },

    typeButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },

    typeButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
    },

    typeButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },

    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    photoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },

    photoButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },

    photoButtonText: {
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 14,
    },

    photoPreview: {
      width: 72,
      height: 72,
      borderRadius: 8,
    },

    descriptionInput: {
      minHeight: 88,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      color: colors.textPrimary,
      backgroundColor: colors.background,
      textAlignVertical: 'top',
      marginBottom: 18,
    },

    actions: {
      flexDirection: 'row',
      gap: 12,
    },

    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },

    cancelButtonText: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 15,
    },

    submitButton: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },

    submitButtonDisabled: {
      opacity: 0.6,
    },

    submitButtonText: {
      color: components.buttonPrimaryText,
      fontWeight: '700',
      fontSize: 15,
    },
  });
}

export default function ReportIncidentModal({
  visible,
  onClose,
  onCreated,
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const [
    selectedTypeId,
    setSelectedTypeId,
  ] = useState<ManualIncidentTypeId | null>(
    null,
  );

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    photoUri,
    setPhotoUri,
  ] = useState<string | null>(null);

  const [
    photoMimeType,
    setPhotoMimeType,
  ] = useState<string | null>(null);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const resetForm = useCallback((): void => {
    setSelectedTypeId(null);
    setDescription('');
    setPhotoUri(null);
    setPhotoMimeType(null);
    setSubmitting(false);
  }, []);

  const handleClose = useCallback((): void => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    console.log('LOG_MANUAL_ALERT_START');
  }, [visible]);

  async function handlePickPhoto(): Promise<void> {
    const outcome =
      await pickImageFromLibrary();

    if (outcome.status === 'picked') {
      setPhotoUri(outcome.asset.uri);
      setPhotoMimeType(
        outcome.asset.mimeType ?? null,
      );

      console.log(
        'LOG_MANUAL_ALERT_PHOTO',
        {
          action: 'picked',
          hasPhoto: true,
        },
      );

      return;
    }

    if (outcome.status === 'permission_denied') {
      Alert.alert(
        t('common.attention'),
        t('manualAlert.photoPermissionDenied'),
      );

      return;
    }

    if (outcome.status === 'unavailable') {
      Alert.alert(
        t('common.error'),
        outcome.reason,
      );
    }
  }

  function handleRemovePhoto(): void {
    setPhotoUri(null);
    setPhotoMimeType(null);

    console.log(
      'LOG_MANUAL_ALERT_PHOTO',
      {
        action: 'removed',
        hasPhoto: false,
      },
    );
  }

  async function handleSubmit(): Promise<void> {
    if (!selectedTypeId) {
      Alert.alert(
        t('common.attention'),
        t('manualAlert.chooseType'),
      );

      return;
    }

    const incidentType =
      MANUAL_INCIDENT_TYPES.find(
        (item) => item.id === selectedTypeId,
      );

    if (!incidentType) {
      return;
    }

    setSubmitting(true);

    try {
      const result =
        await manualAlertService.create({
          typeId: selectedTypeId,
          title: t(incidentType.labelKey),
          description,
          photoUri,
          photoMimeType,
        });

      if (!result.ok) {
        Alert.alert(
          t('common.error'),
          result.error ||
            t('manualAlert.failed'),
        );

        return;
      }

      Alert.alert(
        t('common.success'),
        t('manualAlert.success'),
      );

      onCreated?.();
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
        />

        <View style={styles.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>
              {t('manualAlert.title')}
            </Text>

            <Text style={styles.subtitle}>
              {t('manualAlert.selectType')}
            </Text>

            <View style={styles.typeGrid}>
              {MANUAL_INCIDENT_TYPES.map(
                (item) => {
                  const selected =
                    selectedTypeId === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      style={[
                        styles.typeButton,
                        selected &&
                          styles.typeButtonSelected,
                      ]}
                      onPress={() =>
                        setSelectedTypeId(
                          item.id,
                        )
                      }
                    >
                      <Text
                        style={
                          styles.typeButtonText
                        }
                      >
                        {t(item.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>

            {selectedTypeId ? (
              <>
                <Text
                  style={styles.sectionLabel}
                >
                  {t('manualAlert.photoOptional')}
                </Text>

                <View style={styles.photoRow}>
                  <TouchableOpacity
                    style={
                      styles.photoButton
                    }
                    onPress={() => {
                      void handlePickPhoto();
                    }}
                  >
                    <Text
                      style={
                        styles.photoButtonText
                      }
                    >
                      {photoUri
                        ? t(
                            'manualAlert.changePhoto',
                          )
                        : t(
                            'manualAlert.addPhoto',
                          )}
                    </Text>
                  </TouchableOpacity>

                  {photoUri ? (
                    <>
                      <Image
                        source={{
                          uri: photoUri,
                        }}
                        style={
                          styles.photoPreview
                        }
                      />

                      <TouchableOpacity
                        onPress={
                          handleRemovePhoto
                        }
                      >
                        <Text
                          style={
                            styles.photoButtonText
                          }
                        >
                          {t(
                            'manualAlert.removePhoto',
                          )}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>

                <Text
                  style={styles.sectionLabel}
                >
                  {t(
                    'manualAlert.descriptionOptional',
                  )}
                </Text>

                <TextInput
                  style={
                    styles.descriptionInput
                  }
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t(
                    'manualAlert.descriptionPlaceholder',
                  )}
                  placeholderTextColor="#888"
                  multiline
                  maxLength={500}
                />

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={
                      styles.cancelButton
                    }
                    onPress={handleClose}
                    disabled={submitting}
                  >
                    <Text
                      style={
                        styles.cancelButtonText
                      }
                    >
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      submitting &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={() => {
                      void handleSubmit();
                    }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator
                        color="#fff"
                      />
                    ) : (
                      <Text
                        style={
                          styles.submitButtonText
                        }
                      >
                        {t(
                          'manualAlert.submit',
                        )}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
