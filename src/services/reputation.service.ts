import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import {
  isUserTrustLevel,
  type UserReputation,
} from '../types/reputation.types';

const TABLE = 'user_reputation';

const REPUTATION_COLUMNS =
  'user_id, alerts_created, alerts_confirmed, alerts_rejected, reputation_score, trust_level, created_at, updated_at';

type ReputationRow = {
  user_id: string;
  alerts_created: number;
  alerts_confirmed: number;
  alerts_rejected: number;
  reputation_score: number;
  trust_level: string;
  created_at: string;
  updated_at: string;
};

function mapRow(
  row: ReputationRow,
): UserReputation {
  const trustLevel = isUserTrustLevel(
    row.trust_level,
  )
    ? row.trust_level
    : 'novo';

  return {
    userId: row.user_id,
    alertsCreated: row.alerts_created,
    alertsConfirmed: row.alerts_confirmed,
    alertsRejected: row.alerts_rejected,
    reputationScore: row.reputation_score,
    trustLevel,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class ReputationService {
  async getUserReputation(
    userId: string,
  ): Promise<UserReputation | null> {
    console.log('REPUTATION_FETCH', {
      userId,
      table: TABLE,
    });

    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      console.log('REPUTATION_ERROR', {
        userId,
        reason: 'supabase_not_configured',
      });

      return null;
    }

    try {
      const { data, error } =
        await supabase
          .from(TABLE)
          .select(REPUTATION_COLUMNS)
          .eq('user_id', userId)
          .maybeSingle();

      if (error) {
        console.log('REPUTATION_ERROR', {
          userId,
          error,
        });

        throw error;
      }

      if (!data) {
        console.log('LOG_REPUTATION_LOADED', {
          userId,
          found: false,
        });

        console.log('REPUTATION_RESULT', {
          userId,
          found: false,
        });

        return null;
      }

      const reputation = mapRow(
        data as ReputationRow,
      );

      console.log('LOG_REPUTATION_LOADED', {
        userId,
        found: true,
        reputationScore:
          reputation.reputationScore,
        trustLevel: reputation.trustLevel,
        alertsCreated:
          reputation.alertsCreated,
        alertsConfirmed:
          reputation.alertsConfirmed,
        alertsRejected:
          reputation.alertsRejected,
      });

      console.log('REPUTATION_RESULT', {
        userId,
        found: true,
        reputationScore:
          reputation.reputationScore,
        trustLevel: reputation.trustLevel,
      });

      return reputation;
    } catch (error) {
      console.log('REPUTATION_ERROR', {
        userId,
        error,
      });

      throw error;
    }
  }

  async getMyReputation(): Promise<UserReputation | null> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      console.log('REPUTATION_ERROR', {
        reason: 'supabase_not_configured',
      });

      return null;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('REPUTATION_ERROR', {
        reason: 'auth_user_missing',
        authError,
      });

      return null;
    }

    return this.getUserReputation(user.id);
  }

  async getReputationsForUserIds(
    userIds: string[],
  ): Promise<
    Map<string, UserReputation>
  > {
    const uniqueIds = [
      ...new Set(
        userIds.filter(
          (id) => id.length > 0,
        ),
      ),
    ];

    if (uniqueIds.length === 0) {
      return new Map();
    }

    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      console.log('LOG_REPUTATION_LOADED', {
        userIds: uniqueIds,
        found: 0,
        reason: 'supabase_not_configured',
      });

      return new Map();
    }

    try {
      const { data, error } =
        await supabase
          .from(TABLE)
          .select(REPUTATION_COLUMNS)
          .in('user_id', uniqueIds);

      if (error) {
        console.log('LOG_REPUTATION_LOADED', {
          userIds: uniqueIds,
          found: 0,
          error: error.message,
        });

        throw error;
      }

      const rows =
        (data ?? []) as ReputationRow[];

      const map = new Map<
        string,
        UserReputation
      >();

      for (const row of rows) {
        const reputation = mapRow(row);
        map.set(
          reputation.userId,
          reputation,
        );
      }

      console.log('LOG_REPUTATION_LOADED', {
        userIds: uniqueIds,
        found: map.size,
        reputations: rows.map(
          (row) => ({
            userId: row.user_id,
            reputationScore:
              row.reputation_score,
            trustLevel: row.trust_level,
          }),
        ),
      });

      return map;
    } catch (error) {
      console.log('LOG_REPUTATION_LOADED', {
        userIds: uniqueIds,
        found: 0,
        error,
      });

      throw error;
    }
  }
}

export const reputationService =
  new ReputationService();
