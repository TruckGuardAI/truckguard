import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL =
  'https://exp.host/--/api/v2/push/send';

const RADIUS_BY_TYPE: Record<string, number> = {
  sos: 50,
  full_attack: 30,
  cargo_theft: 20,
  fuel: 15,
  obstacle: 10,
};

const CHANNEL_BY_PRIORITY: Record<string, string> = {
  CRITICAL: 'truckguard-critical',
  HIGH: 'truckguard-high',
  NORMAL: 'truckguard-normal',
};

type NearbyRow = {
  user_id: string;
  push_token: string;
  distance_km: number;
};

type ExpoTicket = {
  status?: string;
  message?: string;
};

function unauthorizedResponse(
  reason: string,
): Response {
  return new Response(
    JSON.stringify({
      error: 'unauthorized',
      reason,
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'method_not_allowed' }),
      { status: 405 },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return new Response(
      JSON.stringify({ error: 'missing_supabase_env' }),
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('Authorization');

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {
    return unauthorizedResponse(
      'missing_bearer_token',
    );
  }

  const supabaseAuth = createClient(
    supabaseUrl,
    anonKey,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return unauthorizedResponse(
      authError?.message ?? 'invalid_jwt',
    );
  }

  const body = await request.json().catch(() => null);
  const alertId = body?.alertId as string | undefined;

  if (!alertId) {
    return new Response(
      JSON.stringify({ error: 'alert_id_required' }),
      { status: 400 },
    );
  }

  const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data: alert, error: alertError } =
    await supabaseAdmin
      .from('alerts')
      .select(
        'id, title, type, latitude, longitude, notification_priority, notification_sound, user_id',
      )
      .eq('id', alertId)
      .maybeSingle();

  if (alertError || !alert) {
    return new Response(
      JSON.stringify({
        error: alertError?.message ?? 'alert_not_found',
      }),
      { status: 404 },
    );
  }

  const radiusKm =
    RADIUS_BY_TYPE[alert.type] ?? 10;

  const excludeUserId =
    (alert.user_id as string | null) ?? null;

  const { data: nearbyRows, error: nearbyError } =
    await supabaseAdmin.rpc(
      'get_nearby_users_with_tokens',
      {
        p_latitude: alert.latitude,
        p_longitude: alert.longitude,
        p_radius_km: radiusKm,
        p_exclude_user_id: excludeUserId,
      },
    );

  if (nearbyError) {
    return new Response(
      JSON.stringify({
        error: nearbyError.message,
        nearbyCount: 0,
        sentCount: 0,
        failedCount: 0,
      }),
      { status: 500 },
    );
  }

  const recipients = (
    (nearbyRows ?? []) as NearbyRow[]
  ).filter((row) =>
    Boolean(row.push_token),
  );

  if (recipients.length === 0) {
    return new Response(
      JSON.stringify({
        nearbyCount: 0,
        sentCount: 0,
        failedCount: 0,
      }),
      { status: 200 },
    );
  }

  const priority =
    alert.notification_priority ?? 'NORMAL';
  const sound =
    alert.notification_sound ?? 'default';
  const channelId =
    CHANNEL_BY_PRIORITY[priority] ??
    'truckguard-normal';

  const messages = recipients.map((recipient) => ({
    to: recipient.push_token,
    title:
      priority === 'CRITICAL'
        ? '🚨 Alerta CRÍTICO TruckGuard'
        : '🚨 Alerta TruckGuard',
    body: `${alert.title} — ${recipient.distance_km.toFixed(1)} km`,
    sound,
    priority: 'high',
    channelId,
    data: {
      alertId: alert.id,
      type: alert.type,
      priority,
    },
  }));

  const pushResponse = await fetch(
    EXPO_PUSH_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    },
  );

  const pushResult = await pushResponse.json().catch(() => null);
  const tickets = (
    pushResult?.data ?? []
  ) as ExpoTicket[];

  let sentCount = 0;
  let failedCount = 0;

  tickets.forEach((ticket) => {
    if (ticket.status === 'ok') {
      sentCount += 1;
      return;
    }

    failedCount += 1;
  });

  if (tickets.length === 0 && !pushResponse.ok) {
    failedCount = recipients.length;
  }

  return new Response(
    JSON.stringify({
      nearbyCount: recipients.length,
      sentCount,
      failedCount,
      requestedBy: user.id,
    }),
    { status: 200 },
  );
});
