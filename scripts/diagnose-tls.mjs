/**
 * Diagnóstico TLS para endpoints usados pela app.
 *
 * Uso:
 *   node scripts/diagnose-tls.mjs
 *
 * Windows / Node 24 (recomendado):
 *   $env:NODE_OPTIONS="--use-system-ca"; node scripts/diagnose-tls.mjs
 */

import {
  getTlsEnvironmentDiagnostics,
  httpsTlsProbe,
} from './lib/nodeTls.mjs';

const TARGETS = [
  'https://api.openrouteservice.org',
  'https://nominatim.openstreetmap.org',
  'https://jpoqpzqtcidyheprezsx.supabase.co',
];

console.log('=== DIAGNÓSTICO TLS ===\n');

console.log('LOG_TLS_ENV', getTlsEnvironmentDiagnostics());

for (const url of TARGETS) {
  const result = await httpsTlsProbe(url);

  console.log('LOG_TLS_PROBE', {
    url: result.url,
    success: result.success,
    status: result.status,
    durationMs: result.durationMs,
    tlsVersion: result.tls?.protocol ?? null,
    certIssuer: result.tls?.issuer ?? null,
    certSubject: result.tls?.subject ?? null,
    authorized: result.tls?.authorized ?? null,
    authorizationError:
      result.tls?.authorizationError ?? null,
    error: result.error ?? null,
    bodyPreview: result.bodyPreview,
  });
}

console.log('\n=== INTERPRETAÇÃO ===');
console.log(
  '- Se success=false e error.isTlsCertificateError=true → TLS_CERTIFICATE_ERROR',
);
console.log(
  '- Se corporateProxyDetected=true → possível proxy corporativo a interceptar SSL',
);
console.log(
  '- Se useSystemCaEnabled=false no Windows → executar com NODE_OPTIONS=--use-system-ca',
);
console.log(
  '- Antivirus/VPN com inspeção HTTPS pode causar UNABLE_TO_VERIFY_LEAF_SIGNATURE',
);
