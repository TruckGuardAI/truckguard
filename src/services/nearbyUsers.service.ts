import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import type { NearbyUser } from '../types/alertNotification.types';

type NearbyUserRow = {
  user_id: string;
  distance_km: number;
};

class NearbyUsersService {
  async getNearbyUsers(
    latitude: number,
    longitude: number,
    radiusKm: number,
    excludeUserId?: string | null,
  ): Promise<NearbyUser[]> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return [];
    }

    const { data, error } =
      await supabase.rpc(
        'get_nearby_users',
        {
          p_latitude: latitude,
          p_longitude: longitude,
          p_radius_km: radiusKm,
          p_exclude_user_id:
            excludeUserId ?? null,
        },
      );

    if (error) {
      console.log(
        'LOG_NEARBY_USERS_FOUND',
        {
          count: 0,
          radiusKm,
          error: error.message,
        },
      );

      throw error;
    }

    const users = (
      (data ?? []) as NearbyUserRow[]
    ).map((row) => ({
      userId: row.user_id,
      distanceKm: Number(
        row.distance_km,
      ),
    }));

    console.log(
      'LOG_NEARBY_USERS_FOUND',
      {
        count: users.length,
        radiusKm,
        userIds: users.map(
          (user) => user.userId,
        ),
      },
    );

    return users;
  }
}

export const nearbyUsersService =
  new NearbyUsersService();
