import { Platform } from 'react-native';

type ImagePickerModule =
  typeof import('expo-image-picker');

export type PickedImageAsset = {
  uri: string;
  mimeType?: string | null;
};

export type PickImageOutcome =
  | { status: 'canceled' }
  | {
      status: 'picked';
      asset: PickedImageAsset;
    }
  | {
      status: 'unavailable';
      reason: string;
    }
  | {
      status: 'permission_denied';
    };

let moduleCache:
  | ImagePickerModule
  | null
  | undefined;

let availability:
  | boolean
  | null = null;

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isNativeModuleError(
  message: string,
): boolean {
  return (
    message.includes(
      'ExponentImagePicker',
    ) ||
    message.includes(
      'native module',
    ) ||
    message.includes(
      'NativeModule',
    )
  );
}

export function resetImagePickerAvailabilityCache(): void {
  availability = null;
  moduleCache = undefined;
}

export async function resolveImagePickerModule(): Promise<ImagePickerModule | null> {
  if (moduleCache !== undefined) {
    return moduleCache;
  }

  try {
    moduleCache = await import(
      'expo-image-picker'
    );

    console.log('LOG_PICKER_MODULE', {
      loaded: Boolean(moduleCache),
      platform: Platform.OS,
    });

    return moduleCache;
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error(
      'LOG_PHOTO_PICKER_ERROR',
      {
        stage: 'module_load',
        message,
      },
    );

    moduleCache = null;

    return null;
  }
}

export async function isImagePickerAvailable(): Promise<boolean> {
  if (availability !== null) {
    return availability;
  }

  const mod =
    await resolveImagePickerModule();

  if (!mod) {
    availability = false;

    console.log('LOG_PICKER_MODULE', {
      available: false,
      reason: 'module_null',
    });

    return false;
  }

  try {
    if (Platform.OS === 'web') {
      availability = true;

      return true;
    }

    await mod.getMediaLibraryPermissionsAsync();

    availability = true;

    console.log('LOG_PICKER_MODULE', {
      available: true,
      platform: Platform.OS,
    });

    return true;
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.log('LOG_PICKER_MODULE', {
      available: false,
      reason: message,
    });

    availability = false;

    return false;
  }
}

export async function pickImageFromLibrary(): Promise<PickImageOutcome> {
  console.log('LOG_PICKER_START', {
    platform: Platform.OS,
  });

  const mod =
    await resolveImagePickerModule();

  if (!mod) {
    const reason =
      'Módulo nativo ExponentImagePicker indisponível. Rebuild necessário (npx expo run:android).';

    console.log('LOG_PICKER_RESULT', {
      status: 'unavailable',
      reason,
    });

    return {
      status: 'unavailable',
      reason,
    };
  }

  try {
    if (Platform.OS !== 'web') {
      const permission =
        await mod.requestMediaLibraryPermissionsAsync();

      console.log('LOG_MEDIA_PERMISSION', {
        granted: permission.granted,
        status: permission.status,
        canAskAgain:
          permission.canAskAgain ?? null,
        platform: Platform.OS,
      });

      if (!permission.granted) {
        console.log('LOG_PICKER_RESULT', {
          status: 'permission_denied',
        });

        return {
          status: 'permission_denied',
        };
      }
    } else {
      console.log('LOG_MEDIA_PERMISSION', {
        granted: true,
        status: 'web',
        canAskAgain: null,
        platform: Platform.OS,
      });
    }

    const result =
      await mod.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

    console.log('LOG_PICKER_RESULT', {
      canceled: result.canceled,
      assetCount: result.assets?.length ?? 0,
      firstAssetUri:
        result.assets?.[0]?.uri ?? null,
    });

    if (
      result.canceled ||
      !result.assets?.[0]
    ) {
      return { status: 'canceled' };
    }

    const asset = result.assets[0];

    return {
      status: 'picked',
      asset: {
        uri: asset.uri,
        mimeType: asset.mimeType,
      },
    };
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error('LOG_PHOTO_PICKER_ERROR', {
      stage: 'launch_image_library',
      message,
      error,
    });

    if (isNativeModuleError(message)) {
      availability = false;

      return {
        status: 'unavailable',
        reason: message,
      };
    }

    throw error;
  }
}
