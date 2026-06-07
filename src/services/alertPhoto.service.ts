import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

import {
  readImageBytesFromUri,
} from '../utils/readImageBytes.utils';

const ALERT_PHOTOS_BUCKET = 'alert-photos';
const TABLE = 'alerts';

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

function buildAlertPhotoPath(
  userId: string,
  alertId: string,
  extension: string,
): string {
  return `${userId}/${alertId}.${extension}`;
}

class AlertPhotoService {
  async uploadAlertPhoto(
    userId: string,
    alertId: string,
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
        'Inicia sessão para enviar foto',
      );
    }

    const extension = getFileExtension(
      localUri,
      mimeType,
    );

    const filePath = buildAlertPhotoPath(
      userId,
      alertId,
      extension,
    );

    const fileBytes =
      await readImageBytesFromUri(localUri);

    const { error: uploadError } =
      await supabase.storage
        .from(ALERT_PHOTOS_BUCKET)
        .upload(filePath, fileBytes, {
          contentType:
            mimeType ??
            `image/${extension}`,
          upsert: true,
        });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(ALERT_PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async attachPhotoToAlert(
    alertId: string,
    photoUrl: string,
  ): Promise<void> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    const { error } = await supabase
      .from(TABLE)
      .update({ photo_url: photoUrl })
      .eq('id', alertId);

    if (error) {
      throw error;
    }
  }
}

export const alertPhotoService =
  new AlertPhotoService();
