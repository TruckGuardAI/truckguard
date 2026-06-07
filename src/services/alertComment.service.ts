import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import { reputationService } from './reputation.service';

import type { AlertComment } from '../types/alertComment.types';

import {
  isUserTrustLevel,
  type UserTrustLevel,
} from '../types/reputation.types';

export const COMMENT_AUTH_REQUIRED_CODE =
  'COMMENT_AUTH_REQUIRED';

const TABLE = 'alert_comments';
const MAX_COMMENT_LENGTH = 500;

type CommentRow = {
  id: string;
  alert_id: string;
  user_id: string;
  comment: string;
  created_at: string;
};

type ProfileSnippetRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type PublicProfileSnippetRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function normalizeCommentText(
  value: string,
): string {
  return value.trim();
}

function validateCommentText(
  value: string,
): string {
  const normalized = normalizeCommentText(
    value,
  );

  if (normalized.length === 0) {
    throw new Error(
      'COMMENT_EMPTY',
    );
  }

  if (
    normalized.length > MAX_COMMENT_LENGTH
  ) {
    throw new Error(
      'COMMENT_TOO_LONG',
    );
  }

  return normalized;
}

class AlertCommentService {
  private async resolveAuthenticatedUserId(): Promise<string> {
    if (!supabase) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const userId = session?.user?.id;

    if (!userId) {
      throw new Error(
        COMMENT_AUTH_REQUIRED_CODE,
      );
    }

    return userId;
  }

  private async enrichComments(
    rows: CommentRow[],
  ): Promise<AlertComment[]> {
    if (rows.length === 0) {
      return [];
    }

    const userIds = [
      ...new Set(
        rows.map((row) => row.user_id),
      ),
    ];

    const profileMap = new Map<
      string,
      ProfileSnippetRow
    >();

    if (
      supabase &&
      isSupabaseConfigured()
    ) {
      const { data: profiles, error } =
        await supabase.rpc(
          'get_public_profile_snippets',
          {
            p_user_ids: userIds,
          },
        );

      if (error) {
        console.log(
          'LOG_COMMENT_LOAD',
          {
            stage: 'public_profiles',
            error: error.message,
          },
        );
      }

      for (const profile of (
        (profiles ?? []) as PublicProfileSnippetRow[]
      )) {
        profileMap.set(
          profile.id,
          profile,
        );
      }
    }

    const reputationMap =
      await reputationService
        .getReputationsForUserIds(
          userIds,
        )
        .catch(() => new Map());

    return rows.map((row) => {
      const profile =
        profileMap.get(row.user_id);
      const reputation =
        reputationMap.get(
          row.user_id,
        );

      const trustLevel: UserTrustLevel | undefined =
        reputation &&
        isUserTrustLevel(
          reputation.trustLevel,
        )
          ? reputation.trustLevel
          : undefined;

      return {
        id: row.id,
        alertId: row.alert_id,
        userId: row.user_id,
        comment: row.comment,
        createdAt: row.created_at,
        authorName:
          profile?.full_name?.trim() ||
          'Utilizador',
        authorAvatarUrl:
          profile?.avatar_url?.trim() ||
          undefined,
        authorReputationScore:
          reputation?.reputationScore,
        authorTrustLevel: trustLevel,
      };
    });
  }

  async getCommentsByAlertId(
    alertId: string,
  ): Promise<AlertComment[]> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      console.log('LOG_COMMENT_LOAD', {
        alertId,
        count: 0,
        reason: 'supabase_not_configured',
      });

      return [];
    }

    try {
      const { data, error } =
        await supabase
          .from(TABLE)
          .select(
            'id, alert_id, user_id, comment, created_at',
          )
          .eq('alert_id', alertId)
          .order('created_at', {
            ascending: true,
          });

      if (error) {
        throw error;
      }

      const comments =
        await this.enrichComments(
          (data ?? []) as CommentRow[],
        );

      console.log('LOG_COMMENT_LOAD', {
        alertId,
        count: comments.length,
      });

      return comments;
    } catch (error) {
      console.log('LOG_COMMENT_LOAD', {
        alertId,
        count: 0,
        error,
      });

      throw error;
    }
  }

  async createComment(
    alertId: string,
    commentText: string,
  ): Promise<AlertComment> {
    const userId =
      await this.resolveAuthenticatedUserId();

    const comment =
      validateCommentText(commentText);

    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    console.log('LOG_COMMENT_CREATE', {
      alertId,
      userId,
    });

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        alert_id: alertId,
        user_id: userId,
        comment,
      })
      .select(
        'id, alert_id, user_id, comment, created_at',
      )
      .single();

    if (error) {
      console.log('LOG_COMMENT_CREATE', {
        alertId,
        userId,
        success: false,
        error,
      });

      throw error;
    }

    const [enriched] =
      await this.enrichComments([
        data as CommentRow,
      ]);

    console.log('LOG_COMMENT_CREATE', {
      alertId,
      userId,
      commentId: enriched.id,
      success: true,
    });

    return enriched;
  }

  async updateComment(
    commentId: string,
    commentText: string,
  ): Promise<AlertComment> {
    const userId =
      await this.resolveAuthenticatedUserId();

    const comment =
      validateCommentText(commentText);

    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    console.log('LOG_COMMENT_UPDATE', {
      commentId,
      userId,
    });

    const { data, error } = await supabase
      .from(TABLE)
      .update({ comment })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select(
        'id, alert_id, user_id, comment, created_at',
      )
      .single();

    if (error) {
      console.log('LOG_COMMENT_UPDATE', {
        commentId,
        userId,
        success: false,
        error,
      });

      throw error;
    }

    const [enriched] =
      await this.enrichComments([
        data as CommentRow,
      ]);

    console.log('LOG_COMMENT_UPDATE', {
      commentId,
      userId,
      alertId: enriched.alertId,
      success: true,
    });

    return enriched;
  }

  async deleteComment(
    commentId: string,
  ): Promise<void> {
    const userId =
      await this.resolveAuthenticatedUserId();

    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    console.log('LOG_COMMENT_DELETE', {
      commentId,
      userId,
    });

    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.log('LOG_COMMENT_DELETE', {
        commentId,
        userId,
        success: false,
        error,
      });

      throw error;
    }

    console.log('LOG_COMMENT_DELETE', {
      commentId,
      userId,
      success: true,
    });
  }
}

export const alertCommentService =
  new AlertCommentService();

export function isCommentAuthError(
  error: unknown,
): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message ===
    COMMENT_AUTH_REQUIRED_CODE
  );
}
