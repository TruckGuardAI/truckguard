import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import type {
  ProfileSettings,
  ProfileSettingsPatch,
} from '../types/profileSettings.types';

const TABLE = 'profile_settings';

type ProfileSettingsRow = {
  user_id: string;
  notifications_enabled: boolean;
  community_alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(
  row: ProfileSettingsRow,
): ProfileSettings {
  return {
    userId: row.user_id,
    notificationsEnabled:
      row.notifications_enabled,
    communityAlertsEnabled:
      row.community_alerts_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class ProfileSettingsService {
  async getProfileSettings(
    userId: string,
  ): Promise<ProfileSettings | null> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return null;
    }

    const { data, error } =
      await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapRow(
      data as ProfileSettingsRow,
    );
  }

  async upsertProfileSettings(
    patch: ProfileSettingsPatch,
  ): Promise<ProfileSettings | null> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return null;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const existing =
      await this.getProfileSettings(
        user.id,
      );

    const payload = {
      user_id: user.id,
      notifications_enabled:
        patch.notificationsEnabled ??
        existing?.notificationsEnabled ??
        true,
      community_alerts_enabled:
        patch.communityAlertsEnabled ??
        existing?.communityAlertsEnabled ??
        true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } =
      await supabase
        .from(TABLE)
        .upsert(payload, {
          onConflict: 'user_id',
        })
        .select('*')
        .single();

    if (error || !data) {
      throw error;
    }

    return mapRow(
      data as ProfileSettingsRow,
    );
  }

  async saveNotificationsEnabled(
    enabled: boolean,
  ): Promise<ProfileSettings | null> {
    return this.upsertProfileSettings({
      notificationsEnabled: enabled,
    });
  }

  async saveCommunityAlertsEnabled(
    enabled: boolean,
  ): Promise<ProfileSettings | null> {
    return this.upsertProfileSettings({
      communityAlertsEnabled: enabled,
    });
  }
}

export const profileSettingsService =
  new ProfileSettingsService();
