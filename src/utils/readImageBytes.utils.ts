import { Platform } from 'react-native';

import {
  readAsStringAsync,
} from 'expo-file-system/legacy';

function base64ToArrayBuffer(
  base64: string,
): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(
    binary.length,
  );

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function isLocalImageUri(
  uri: string,
): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  );
}

export async function readImageBytesFromUri(
  uri: string,
): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error(
        'Não foi possível ler a imagem selecionada',
      );
    }

    return response.arrayBuffer();
  }

  if (isLocalImageUri(uri)) {
    const base64 =
      await readAsStringAsync(uri, {
        encoding: 'base64',
      });

    return base64ToArrayBuffer(base64);
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(
      'Não foi possível ler a imagem selecionada',
    );
  }

  return response.arrayBuffer();
}
