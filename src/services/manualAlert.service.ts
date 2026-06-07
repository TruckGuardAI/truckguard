import { alertsApiService } from './alertsApi.service';
import { alertPhotoService } from './alertPhoto.service';
import { locationService } from './location.service';
import { locationSyncService } from './locationSync.service';

import type { Alert } from '../types/alert.types';

import {
  MANUAL_INCIDENT_TYPES,
  type ManualIncidentTypeId,
} from '../types/manualAlert.types';

import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type CreateManualAlertParams = {
  typeId: ManualIncidentTypeId;
  title: string;
  description?: string;
  photoUri?: string | null;
  photoMimeType?: string | null;
};

export type CreateManualAlertResult =
  | {
      ok: true;
      alert: Alert;
    }
  | {
      ok: false;
      error: string;
    };

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

class ManualAlertService {
  async create(
    params: CreateManualAlertParams,
  ): Promise<CreateManualAlertResult> {
    const incidentType =
      MANUAL_INCIDENT_TYPES.find(
        (item) => item.id === params.typeId,
      );

    if (!incidentType) {
      const message =
        'Tipo de incidente inválido';

      console.log(
        'LOG_MANUAL_ALERT_ERROR',
        { message, typeId: params.typeId },
      );

      return { ok: false, error: message };
    }

    try {
      const location =
        await locationService.getCurrentLocation();

      console.log(
        'LOG_MANUAL_ALERT_LOCATION',
        {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
        },
      );

      await locationSyncService.syncCoordinates(
        location,
        'alert_create',
        true,
      );

      console.log(
        'LOG_MANUAL_ALERT_PHOTO',
        {
          hasPhoto: Boolean(params.photoUri),
          mimeType:
            params.photoMimeType ?? null,
        },
      );

      console.log(
        'LOG_MANUAL_ALERT_CREATE',
        {
          typeId: params.typeId,
          alertType: incidentType.alertType,
          title: params.title,
          hasDescription: Boolean(
            params.description?.trim(),
          ),
        },
      );

      const alert =
        await alertsApiService.createAlert({
          title: params.title,
          type: incidentType.alertType,
          latitude: location.latitude,
          longitude: location.longitude,
          description:
            params.description?.trim() ||
            undefined,
          skipPush: true,
        });

      if (!alert) {
        throw new Error(
          'Não foi possível criar o alerta',
        );
      }

      if (
        params.photoUri &&
        isSupabaseConfigured() &&
        supabase &&
        !alert.id.startsWith('local-')
      ) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const userId = session?.user?.id;

        if (userId) {
          try {
            const photoUrl =
              await alertPhotoService.uploadAlertPhoto(
                userId,
                alert.id,
                params.photoUri,
                params.photoMimeType,
              );

            await alertPhotoService.attachPhotoToAlert(
              alert.id,
              photoUrl,
            );
          } catch (photoError) {
            console.log(
              'LOG_MANUAL_ALERT_ERROR',
              {
                stage: 'photo_upload',
                message:
                  getErrorMessage(photoError),
              },
            );
          }
        }
      }

      console.log(
        'LOG_MANUAL_ALERT_SUCCESS',
        { alertId: alert.id },
      );

      return { ok: true, alert };
    } catch (error) {
      const message = getErrorMessage(error);

      console.log(
        'LOG_MANUAL_ALERT_ERROR',
        { message, error },
      );

      return { ok: false, error: message };
    }
  }
}

export const manualAlertService =
  new ManualAlertService();
