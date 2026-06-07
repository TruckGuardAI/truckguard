import React, {
  useState,
} from 'react';

import { useTranslation } from 'react-i18next';

import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { useThemedStyles } from '../../hooks/useThemedStyles';

import type { AppThemeTokens } from '../../theme/palettes';

import type { AlertComment } from '../../types/alertComment.types';

import ProfileReputationBadge from '../profile/ProfileReputationBadge';

type Props = {
  comment: AlertComment;
  isOwn: boolean;
  onUpdate: (
    commentId: string,
    text: string,
  ) => Promise<void>;
  onDelete: (
    commentId: string,
  ) => Promise<void>;
};

function createStyles(theme: AppThemeTokens) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        colors.surfaceSecondary,
    },

    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarInitial: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 14,
    },

    headerContent: {
      flex: 1,
      gap: 4,
    },

    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },

    authorName: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      flexShrink: 1,
    },

    dateText: {
      color: colors.textMuted,
      fontSize: 11,
    },

    actions: {
      flexDirection: 'row',
      gap: 8,
    },

    actionText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },

    deleteText: {
      color: colors.danger,
    },

    commentText: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },

    editInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      color: colors.textPrimary,
      backgroundColor: colors.background,
      minHeight: 72,
      textAlignVertical: 'top',
      marginTop: 6,
    },

    saveRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 8,
    },
  });
}

function formatCommentDate(
  createdAt: string,
): string {
  try {
    return new Date(
      createdAt,
    ).toLocaleString();
  } catch {
    return createdAt;
  }
}

function getInitials(
  name: string,
): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 1)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function AlertCommentItem({
  comment,
  isOwn,
  onUpdate,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const [editing, setEditing] =
    useState(false);
  const [
    editText,
    setEditText,
  ] = useState(comment.comment);
  const [
    saving,
    setSaving,
  ] = useState(false);
  const [
    deleting,
    setDeleting,
  ] = useState(false);

  async function handleSave(): Promise<void> {
    setSaving(true);

    try {
      await onUpdate(
        comment.id,
        editText,
      );
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    setDeleting(true);

    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {comment.authorAvatarUrl ? (
          <Image
            source={{
              uri: comment.authorAvatarUrl,
            }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={
              styles.avatarPlaceholder
            }
          >
            <Text
              style={
                styles.avatarInitial
              }
            >
              {getInitials(
                comment.authorName,
              )}
            </Text>
          </View>
        )}

        <View style={styles.headerContent}>
          <View style={styles.nameRow}>
            <Text
              style={styles.authorName}
              numberOfLines={1}
            >
              {comment.authorName}
            </Text>

            {isOwn ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditText(
                      comment.comment,
                    );
                    setEditing(true);
                  }}
                  disabled={
                    saving || deleting
                  }
                >
                  <Text
                    style={
                      styles.actionText
                    }
                  >
                    {t(
                      'comments.edit',
                    )}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    void handleDelete();
                  }}
                  disabled={
                    saving || deleting
                  }
                >
                  {deleting ? (
                    <ActivityIndicator
                      size="small"
                    />
                  ) : (
                    <Text
                      style={[
                        styles.actionText,
                        styles.deleteText,
                      ]}
                    >
                      {t(
                        'comments.delete',
                      )}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {comment.authorTrustLevel !==
            undefined &&
          comment.authorReputationScore !==
            undefined ? (
            <ProfileReputationBadge
              reputationScore={
                comment.authorReputationScore
              }
              trustLevel={
                comment.authorTrustLevel
              }
              compact
              context="alert_comment"
            />
          ) : null}

          <Text style={styles.dateText}>
            {formatCommentDate(
              comment.createdAt,
            )}
          </Text>
        </View>
      </View>

      {editing ? (
        <>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            maxLength={500}
          />

          <View style={styles.saveRow}>
            <TouchableOpacity
              onPress={() =>
                setEditing(false)
              }
              disabled={saving}
            >
              <Text
                style={
                  styles.actionText
                }
              >
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                void handleSave();
              }}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                />
              ) : (
                <Text
                  style={
                    styles.actionText
                  }
                >
                  {t('comments.save')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.commentText}>
          {comment.comment}
        </Text>
      )}
    </View>
  );
}
