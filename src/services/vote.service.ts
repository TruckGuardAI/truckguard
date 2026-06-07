import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import { getProfileErrorMessage } from './profile.service';

import {
  VOTE_AUTH_REQUIRED_CODE,
} from '../utils/voteError.utils';

const VOTES_TABLE = 'alert_votes';
const ALERTS_TABLE = 'alerts';

export type VoteType = 'confirm' | 'reject';

export type AlertVoteRecord = {
  id: string;
  alertId: string;
  userId: string;
  voteType: VoteType;
  createdAt: string;
};

export type AlertVotesSummary = {
  alertId: string;
  totalConfirmations: number;
  totalRejections: number;
  userVote: VoteType | null;
  votes: AlertVoteRecord[];
};

type VoteRow = {
  id: string;
  alert_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
};

type AlertCountsRow = {
  total_confirmations: number;
  total_rejections: number;
  confirmations: number;
};

function mapVoteRow(
  row: VoteRow,
): AlertVoteRecord {
  return {
    id: row.id,
    alertId: row.alert_id,
    userId: row.user_id,
    voteType: row.vote_type,
    createdAt: row.created_at,
  };
}

class VoteService {
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
        VOTE_AUTH_REQUIRED_CODE,
      );
    }

    const accessToken =
      session?.access_token ?? null;

    console.log(
      'ALERT_VOTE_USER_ID',
      userId,
    );

    console.log(
      'ALERT_VOTE_AUTH_UID',
      userId,
    );

    console.log(
      'ALERT_VOTE_POLICY_CHECK',
      {
        userId,
        authUid: userId,
        hasAccessToken:
          Boolean(accessToken),
        match: true,
      },
    );

    if (!accessToken) {
      throw new Error(
        VOTE_AUTH_REQUIRED_CODE,
      );
    }

    return userId;
  }

  private async persistVote(
    alertId: string,
    userId: string,
    voteType: VoteType,
  ): Promise<void> {
    if (!supabase) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    const payload = {
      alert_id: alertId,
      user_id: userId,
      vote_type: voteType,
    };

    console.log(
      'ALERT_VOTE_POLICY_CHECK',
      {
        userId,
        authUid: userId,
        payloadUserId:
          payload.user_id,
        match:
          userId ===
          payload.user_id,
        operation: 'pending',
      },
    );

    const {
      data: existing,
      error: selectError,
    } = await supabase
      .from(VOTES_TABLE)
      .select('id, user_id, vote_type')
      .eq('alert_id', alertId)
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (existing) {
      console.log(
        'ALERT_VOTE_POLICY_CHECK',
        {
          userId,
          authUid: userId,
          payloadUserId:
            payload.user_id,
          match:
            userId ===
            payload.user_id,
          operation: 'update',
        },
      );

      const { error: updateError } =
        await supabase
          .from(VOTES_TABLE)
          .update({
            vote_type: voteType,
          })
          .eq('id', existing.id)
          .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      return;
    }

    console.log(
      'ALERT_VOTE_POLICY_CHECK',
      {
        userId,
        authUid: userId,
        payloadUserId:
          payload.user_id,
        match:
          userId ===
          payload.user_id,
        operation: 'insert',
      },
    );

    const { error: insertError } =
      await supabase
        .from(VOTES_TABLE)
        .insert(payload);

    if (insertError) {
      throw insertError;
    }
  }

  async voteAlert(
    alertId: string,
    voteType: VoteType,
  ): Promise<AlertVotesSummary> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    console.log('ALERT_VOTE_START', {
      alertId,
      voteType,
    });

    try {
      const userId =
        await this.resolveAuthenticatedUserId();

      await this.persistVote(
        alertId,
        userId,
        voteType,
      );

      const summary =
        await this.getAlertVotes(
          alertId,
        );

      console.log(
        'ALERT_COUNTS_UPDATED',
        {
          alertId: summary.alertId,
          confirmations:
            summary.totalConfirmations,
          rejections:
            summary.totalRejections,
        },
      );

      console.log(
        'ALERT_VOTE_SUCCESS',
        summary,
      );

      return summary;
    } catch (error) {
      console.log(
        'ALERT_VOTE_ERROR',
        getProfileErrorMessage(error),
        error,
      );

      throw error;
    }
  }

  async getAlertVotes(
    alertId: string,
  ): Promise<AlertVotesSummary> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;

    const { data: votes, error } =
      await supabase
        .from(VOTES_TABLE)
        .select(
          'id, alert_id, user_id, vote_type, created_at',
        )
        .eq('alert_id', alertId)
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      throw error;
    }

    const { data: counts, error: countsError } =
      await supabase
        .from(ALERTS_TABLE)
        .select(
          'total_confirmations, total_rejections, confirmations',
        )
        .eq('id', alertId)
        .maybeSingle();

    if (countsError) {
      throw countsError;
    }

    const row =
      counts as AlertCountsRow | null;

    const mappedVotes = (
      (votes ?? []) as VoteRow[]
    ).map(mapVoteRow);

    const userVote =
      user
        ? mappedVotes.find(
            (vote) =>
              vote.userId === user.id,
          )?.voteType ?? null
        : null;

    return {
      alertId,
      totalConfirmations:
        row?.total_confirmations ??
        row?.confirmations ??
        0,
      totalRejections:
        row?.total_rejections ?? 0,
      userVote,
      votes: mappedVotes,
    };
  }
}

export const voteService = new VoteService();
