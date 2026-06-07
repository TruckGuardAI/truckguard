import { supabase } from '../lib/supabase';

export const ALERT_SELECT_COLUMNS =
  'id, title, description, location_text, city, region, country, type, severity, notification_priority, notification_sound, latitude, longitude, created_at, expires_at, resolved, confirmations, total_confirmations, total_rejections, user_id';

export function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return String(
      (error as { message: unknown })
        .message,
    );
  }

  return String(error);
}

function countRows(
  data: unknown,
): number {
  if (Array.isArray(data)) {
    return data.length;
  }

  return data ? 1 : 0;
}

export function logQueryBeforeExecute(
  sql?: string,
): void {
  if (sql) {
    console.log('QUERY_BEFORE_EXECUTE', { sql });
    return;
  }

  console.log('QUERY_BEFORE_EXECUTE');
}

export async function logRlsHintIfEmpty(
  data: unknown,
  error: unknown,
): Promise<void> {
  if (error || countRows(data) > 0) {
    return;
  }

  console.warn(
    'RLS_HINT: RAW_ALERTS vazio sem erro — verificar políticas RLS em `alerts` e sessão do utilizador',
  );

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const { data: sessionData } =
      await supabase.auth.getSession();

    console.log('RLS_AUTH_CONTEXT', {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      role: user?.role ?? null,
      hasSession: Boolean(
        sessionData.session,
      ),
      authError:
        authError?.message ?? null,
    });
  } catch (authCheckError) {
    console.error(
      'RLS_AUTH_CONTEXT_ERROR',
      getErrorMessage(authCheckError),
    );
  }
}

export function logQueryAfterExecute(
  data: unknown,
  error: unknown,
  sql?: string,
): void {
  console.log('RAW_ALERTS', data);
  console.log('QUERY_AFTER_EXECUTE', {
    rows: countRows(data),
    error,
    ...(sql ? { sql } : {}),
  });

  if (error) {
    console.error(
      'QUERY_ERROR',
      getErrorMessage(error),
    );
  }

  void logRlsHintIfEmpty(data, error);
}
