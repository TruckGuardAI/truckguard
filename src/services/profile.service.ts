import type { Session, User } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

import {
  readImageBytesFromUri,
} from '../utils/readImageBytes.utils';

import type {
  UserProfile,
  UserProfileInput,
} from '../types/profile.types';

const SESSION_WAIT_ATTEMPTS = 10;
const SESSION_WAIT_MS = 300;

const TABLE = 'profiles';
const AVATAR_BUCKET = 'avatars';

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  tipo_veiculo: string | null;
  tipo_carga: string | null;
  created_at: string;
  updated_at: string;
};

function getGoogleAvatarUrl(
  user: User,
): string | undefined {
  const avatarUrl =
    user.user_metadata?.avatar_url;

  if (
    typeof avatarUrl === 'string' &&
    avatarUrl.trim().length > 0
  ) {
    return avatarUrl.trim();
  }

  return undefined;
}

function normalizeAvatarUrl(
  value: string | null | undefined,
): string | undefined {
  if (
    value === null ||
    value === undefined
  ) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : undefined;
}

function mapRowToProfile(
  row: ProfileRow,
): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? '',
    email: row.email ?? '',
    avatarUrl: normalizeAvatarUrl(
      row.avatar_url,
    ),
    tipoVeiculo:
      (row.tipo_veiculo as UserProfile['tipoVeiculo']) ??
      undefined,
    tipoCarga:
      (row.tipo_carga as UserProfile['tipoCarga']) ??
      undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getFileExtension(
  uri: string,
  mimeType?: string | null,
): string {
  const fromUri = uri
    .split('.')
    .pop()
    ?.split('?')[0]
    ?.toLowerCase();

  if (
    fromUri &&
    ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(
      fromUri,
    )
  ) {
    return fromUri === 'jpeg'
      ? 'jpg'
      : fromUri;
  }

  if (mimeType?.includes('png')) {
    return 'png';
  }

  if (mimeType?.includes('webp')) {
    return 'webp';
  }

  return 'jpg';
}

function buildAvatarPath(
  userId: string,
  extension: string,
): string {
  return `${userId}/avatar.${extension}`;
}

export function getProfileErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown })
      .message === 'string'
  ) {
    return (error as { message: string })
      .message;
  }

  return String(error);
}

type ProfileInsertPayload = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  tipo_veiculo: null;
  tipo_carga: null;
};

function buildProfileSeed(
  user: User,
): ProfileInsertPayload {
  return {
    id: user.id,
    full_name:
      (user.user_metadata
        ?.name as string | undefined) ??
      (user.user_metadata
        ?.full_name as
        | string
        | undefined) ??
      '',
    email: user.email ?? '',
    avatar_url:
      getGoogleAvatarUrl(user) ?? null,
    tipo_veiculo: null,
    tipo_carga: null,
  };
}

class ProfileService {
  private async syncGoogleAvatarIfNeeded(
    user: User,
    profile: UserProfile,
  ): Promise<UserProfile> {
    const googleAvatar =
      getGoogleAvatarUrl(user);

    if (profile.avatarUrl) {
      console.log(
        'PROFILE_AVATAR_LOAD',
        profile.avatarUrl,
      );

      return profile;
    }

    if (!googleAvatar) {
      console.log(
        'PROFILE_AVATAR_LOAD',
        null,
      );

      return profile;
    }

    const { data, error } =
      await supabase
        .from(TABLE)
        .update({
          avatar_url: googleAvatar,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .single();

    if (error || !data) {
      console.log(
        'PROFILE_AVATAR_LOAD',
        googleAvatar,
      );

      return {
        ...profile,
        avatarUrl: googleAvatar,
      };
    }

    const updated = mapRowToProfile(
      data as ProfileRow,
    );

    console.log(
      'PROFILE_AVATAR_LOAD',
      updated.avatarUrl,
    );

    return updated;
  }

  private async waitForValidSession(): Promise<Session | null> {
    for (
      let attempt = 0;
      attempt < SESSION_WAIT_ATTEMPTS;
      attempt += 1
    ) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        return session;
      }

      await new Promise((resolve) => {
        setTimeout(
          resolve,
          SESSION_WAIT_MS,
        );
      });
    }

    return null;
  }

  private async createProfileIfMissing(
    user: User,
  ): Promise<UserProfile | null> {
    let {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      session =
        await this.waitForValidSession();
    }

    if (!session) {
      console.log(
        'PROFILE_ABORT_NO_SESSION',
      );

      return null;
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    console.log(
      'PROFILE_INSERT_AUTH_UID',
      authUser?.id,
    );

    const profile = buildProfileSeed(user);

    console.log(
      'PROFILE_INSERT_PAYLOAD',
      profile,
    );

    console.log(
      'PROFILE_ID_MATCH',
      authUser?.id === profile.id,
    );

    if (
      !authUser ||
      authUser.id !== profile.id
    ) {
      console.log(
        'PROFILE_ABORT_UID_MISMATCH',
      );

      return null;
    }

    const { data, error } =
      await supabase
        .from(TABLE)
        .upsert(profile, {
          onConflict: 'id',
        })
        .select('*')
        .single();

    if (error || !data) {
      throw error;
    }

    const created = mapRowToProfile(
      data as ProfileRow,
    );

    console.log(
      'PROFILE_AVATAR_LOAD',
      created.avatarUrl ?? null,
    );

    console.log(
      'PROFILE_LOAD_SUCCESS',
      created,
    );

    return created;
  }

  async loadAuthenticatedProfile(): Promise<UserProfile | null> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log(
        'PROFILE_AUTH_USER',
        user,
      );

      if (authError) {
        throw authError;
      }

      if (!user) {
        return null;
      }

      const existing =
        await this.getProfile(
          user.id,
        );

      if (!existing) {
        console.log(
          'PROFILE_CREATE_IF_MISSING',
          user.id,
        );

        const created =
          await this.createProfileIfMissing(
            user,
          );

        if (!created) {
          return null;
        }

        return this.syncGoogleAvatarIfNeeded(
          user,
          created,
        );
      }

      const synced =
        await this.syncGoogleAvatarIfNeeded(
          user,
          existing,
        );

      console.log(
        'PROFILE_LOAD_SUCCESS',
        synced,
      );

      return synced;
    } catch (error) {
      const message =
        getProfileErrorMessage(error);

      console.log(
        'PROFILE_LOAD_ERROR',
        message,
        error,
      );

      throw error;
    }
  }

  async getProfile(
    userId: string,
  ): Promise<UserProfile | null> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return null;
    }

    try {
      const { data, error } =
        await supabase
          .from(TABLE)
          .select('*')
          .eq('id', userId)
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return mapRowToProfile(
        data as ProfileRow,
      );
    } catch (error) {
      throw error;
    }
  }

  async updateUserLocation(
    latitude: number,
    longitude: number,
  ): Promise<void> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return;
    }

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    const { error } = await supabase
      .from(TABLE)
      .update({
        last_latitude: latitude,
        last_longitude: longitude,
        last_location_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }
  }

  async savePushToken(
    pushToken: string,
  ): Promise<void> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return;
    }

    const { error } = await supabase
      .from(TABLE)
      .update({
        push_token: pushToken,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }
  }

  async saveProfile(
    userId: string,
    input: UserProfileInput,
  ): Promise<UserProfile> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    const existing =
      await this.getProfile(userId);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const payload = {
      id: userId,
      full_name: input.fullName.trim(),
      email: input.email.trim(),
      avatar_url:
        normalizeAvatarUrl(
          existing?.avatarUrl,
        ) ??
        (authUser
          ? getGoogleAvatarUrl(authUser)
          : undefined) ??
        null,
      tipo_veiculo:
        input.tipoVeiculo ?? null,
      tipo_carga:
        input.tipoCarga ?? null,
      updated_at: new Date().toISOString(),
    };

    console.log(
      'PROFILE_UPDATE_START',
      payload,
    );

    try {
      const { data, error } =
        await supabase
          .from(TABLE)
          .upsert(payload, {
            onConflict: 'id',
          })
          .select('*')
          .single();

      if (error || !data) {
        throw error;
      }

      const profile = mapRowToProfile(
        data as ProfileRow,
      );

      console.log(
        'PROFILE_UPDATE_SUCCESS',
        profile,
      );

      return profile;
    } catch (error) {
      console.log(
        'PROFILE_UPDATE_ERROR',
        getProfileErrorMessage(error),
        error,
      );

      throw error;
    }
  }

  async uploadAvatar(
    userId: string,
    localUri: string,
    mimeType?: string | null,
  ): Promise<string> {
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
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (
      !session?.user?.id ||
      session.user.id !== userId
    ) {
      throw new Error(
        'Inicia sessão para alterar a foto',
      );
    }

    const extension = getFileExtension(
      localUri,
      mimeType,
    );

    const filePath = buildAvatarPath(
      userId,
      extension,
    );

    const fileBytes =
      await readImageBytesFromUri(localUri);

    console.log(
      'LOG_PROFILE_PHOTO_UPLOAD_START',
      {
        userId,
        filePath,
        bytes: fileBytes.byteLength,
        bucket: AVATAR_BUCKET,
      },
    );

    const { error: uploadError } =
      await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, fileBytes, {
          contentType:
            mimeType ??
            `image/${extension}`,
          upsert: true,
        });

    if (uploadError) {
      console.error(
        'LOG_PROFILE_PHOTO_UPLOAD_ERROR',
        {
          userId,
          filePath,
          message: uploadError.message,
        },
      );

      throw uploadError;
    }

    const { data: publicData } =
      supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

    const avatarUrl = `${publicData.publicUrl}?t=${Date.now()}`;

    const existing =
      await this.getProfile(userId);

    const avatarPayload = {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from(TABLE)
        .update(avatarPayload)
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } else {
      const metadata =
        session.user.user_metadata ?? {};

      const { error } = await supabase
        .from(TABLE)
        .insert({
          id: userId,
          email:
            session.user.email ?? null,
          full_name:
            typeof metadata.full_name ===
            'string'
              ? metadata.full_name
              : null,
          ...avatarPayload,
        });

      if (error) {
        throw error;
      }
    }

    console.log(
      'LOG_PROFILE_PHOTO_UPLOAD_SUCCESS',
      {
        userId,
        avatarUrl,
      },
    );

    return avatarUrl;
  }

  async removeAvatar(
    userId: string,
  ): Promise<void> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    const extensions = [
      'jpg',
      'jpeg',
      'png',
      'webp',
      'heic',
    ];

    const paths = extensions.map(
      (ext) =>
        buildAvatarPath(userId, ext),
    );

    await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(paths);

    const { error } = await supabase
      .from(TABLE)
      .update({
        avatar_url: null,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    console.log(
      'PROFILE_PHOTO_REMOVE',
      { userId },
    );
  }
}

export const profileService =
  new ProfileService();
