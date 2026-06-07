import React, {
  useEffect,
  useState,
} from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import {
  alertCommentService,
  isCommentAuthError,
} from '../../services/alertComment.service';

import type { AppThemeTokens } from '../../theme/palettes';

import type { AlertComment } from '../../types/alertComment.types';

import AlertCommentItem from './AlertCommentItem';

type Props = {
  alertId: string;
  context?: string;
};

function createStyles(theme: AppThemeTokens) {
  const { colors, components } = theme;

  return StyleSheet.create({
    container: {
      marginTop: 12,
    },

    title: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    list: {
      maxHeight: 220,
      marginBottom: 10,
    },

    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
      fontStyle: 'italic',
      paddingVertical: 8,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      color: colors.textPrimary,
      backgroundColor: colors.background,
      minHeight: 72,
      textAlignVertical: 'top',
    },

    submitButton: {
      marginTop: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },

    submitButtonDisabled: {
      opacity: 0.6,
    },

    submitText: {
      color: components.buttonPrimaryText,
      fontWeight: '700',
      fontSize: 14,
    },

    loader: {
      paddingVertical: 12,
    },
  });
}

export default function AlertCommentsSection({
  alertId,
  context = 'unknown',
}: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();

  const [
    comments,
    setComments,
  ] = useState<AlertComment[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    draft,
    setDraft,
  ] = useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const data =
          await alertCommentService.getCommentsByAlertId(
            alertId,
          );

        if (mounted) {
          setComments(data);
        }
      } catch {
        if (mounted) {
          setComments([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [alertId, context]);

  async function handleCreate(): Promise<void> {
    const text = draft.trim();

    if (!text) {
      Alert.alert(
        t('common.attention'),
        t('comments.empty'),
      );

      return;
    }

    setSubmitting(true);

    try {
      const created =
        await alertCommentService.createComment(
          alertId,
          text,
        );

      setComments((current) => [
        ...current,
        created,
      ]);
      setDraft('');
    } catch (error) {
      if (isCommentAuthError(error)) {
        Alert.alert(
          t('common.attention'),
          t('comments.loginRequired'),
        );

        return;
      }

      Alert.alert(
        t('common.error'),
        t('comments.createFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(
    commentId: string,
    text: string,
  ): Promise<void> {
    try {
      const updated =
        await alertCommentService.updateComment(
          commentId,
          text,
        );

      setComments((current) =>
        current.map((item) =>
          item.id === commentId
            ? updated
            : item,
        ),
      );
    } catch (error) {
      if (isCommentAuthError(error)) {
        Alert.alert(
          t('common.attention'),
          t('comments.loginRequired'),
        );

        return;
      }

      Alert.alert(
        t('common.error'),
        t('comments.updateFailed'),
      );

      throw error;
    }
  }

  async function handleDelete(
    commentId: string,
  ): Promise<void> {
    try {
      await alertCommentService.deleteComment(
        commentId,
      );

      setComments((current) =>
        current.filter(
          (item) =>
            item.id !== commentId,
        ),
      );
    } catch (error) {
      if (isCommentAuthError(error)) {
        Alert.alert(
          t('common.attention'),
          t('comments.loginRequired'),
        );

        return;
      }

      Alert.alert(
        t('common.error'),
        t('comments.deleteFailed'),
      );

      throw error;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t('comments.title')}
      </Text>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
        />
      ) : comments.length === 0 ? (
        <Text style={styles.emptyText}>
          {t('comments.emptyList')}
        </Text>
      ) : (
        <ScrollView
          style={styles.list}
          nestedScrollEnabled
          showsVerticalScrollIndicator={
            false
          }
        >
          {comments.map((item) => (
            <AlertCommentItem
              key={item.id}
              comment={item}
              isOwn={
                user?.id === item.userId
              }
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </ScrollView>
      )}

      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder={t(
          'comments.placeholder',
        )}
        placeholderTextColor="#888"
        multiline
        maxLength={500}
      />

      <TouchableOpacity
        style={[
          styles.submitButton,
          submitting &&
            styles.submitButtonDisabled,
        ]}
        onPress={() => {
          void handleCreate();
        }}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator
            color="#fff"
          />
        ) : (
          <Text style={styles.submitText}>
            {t('comments.submit')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
