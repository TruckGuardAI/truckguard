import https from 'node:https';
import { URL } from 'node:url';

export function getTlsEnvironmentDiagnostics() {
  const nodeOptions =
    process.env.NODE_OPTIONS ?? '';

  return {
    nodeVersion: process.version,
    platform: process.platform,
    nodeOptions: nodeOptions || null,
    useSystemCaEnabled:
      process.execArgv.includes(
        '--use-system-ca',
      ) ||
      nodeOptions.includes('--use-system-ca'),
    httpsProxy:
      process.env.HTTPS_PROXY ??
      process.env.https_proxy ??
      null,
    httpProxy:
      process.env.HTTP_PROXY ??
      process.env.http_proxy ??
      null,
    noProxy:
      process.env.NO_PROXY ??
      process.env.no_proxy ??
      null,
    corporateProxyDetected: Boolean(
      process.env.HTTPS_PROXY ??
        process.env.https_proxy ??
        process.env.HTTP_PROXY ??
        process.env.http_proxy,
    ),
    antivirusSslHint:
      'Se TLS falhar no Windows, verificar VPN, proxy corporativo ou inspeção SSL do antivirus.',
  };
}

export function isTlsCertificateError(error) {
  const parts = [
    error?.code,
    error?.message,
    error?.cause?.code,
    error?.cause?.message,
    error?.reason,
  ]
    .filter(Boolean)
    .join(' ');

  return /UNABLE_TO_VERIFY_LEAF_SIGNATURE|SELF_SIGNED_CERT|CERT_|certificate|TLS_CERTIFICATE/i.test(
    parts,
  );
}

export function formatTlsError(error) {
  return {
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    reason: error?.reason ?? null,
    causeCode: error?.cause?.code ?? null,
    causeMessage:
      error?.cause?.message ?? null,
    isTlsCertificateError:
      isTlsCertificateError(error),
    tlsCertificateErrorCode:
      'TLS_CERTIFICATE_ERROR',
  };
}

function collectTlsInfo(socket) {
  if (!socket || typeof socket.getPeerCertificate !== 'function') {
    return {
      protocol: null,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      authorized: null,
      authorizationError: null,
    };
  }

  const cert = socket.getPeerCertificate();

  return {
    protocol:
      typeof socket.getProtocol === 'function'
        ? socket.getProtocol()
        : null,
    issuer:
      cert?.issuer?.O ??
      cert?.issuer?.CN ??
      null,
    subject:
      cert?.subject?.CN ?? null,
    validFrom: cert?.valid_from ?? null,
    validTo: cert?.valid_to ?? null,
    authorized: socket.authorized ?? null,
    authorizationError:
      socket.authorizationError ?? null,
  };
}

export function httpsRequestRaw({
  url,
  method = 'GET',
  headers = {},
  body = null,
  timeoutMs = 30000,
}) {
  const parsedUrl = new URL(url);

  return new Promise((resolve, reject) => {
    let tlsInfo = {
      protocol: null,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      authorized: null,
      authorizationError: null,
    };

    const requestOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port:
        parsedUrl.port ||
        (parsedUrl.protocol === 'https:'
          ? 443
          : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method,
      headers,
      timeout: timeoutMs,
    };

    const req = https.request(
      requestOptions,
      (res) => {
        const chunks = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const responseBody = Buffer.concat(
            chunks,
          ).toString('utf8');

          const socketTls = collectTlsInfo(
            res.socket,
          );

          resolve({
            status: res.statusCode ?? 0,
            ok:
              (res.statusCode ?? 0) >= 200 &&
              (res.statusCode ?? 0) < 300,
            headers: res.headers,
            body: responseBody,
            tls: {
              ...tlsInfo,
              protocol:
                tlsInfo.protocol ??
                socketTls.protocol,
              issuer:
                tlsInfo.issuer ??
                socketTls.issuer,
              subject:
                tlsInfo.subject ??
                socketTls.subject,
              validFrom:
                tlsInfo.validFrom ??
                socketTls.validFrom,
              validTo:
                tlsInfo.validTo ??
                socketTls.validTo,
              authorized:
                tlsInfo.authorized ??
                socketTls.authorized,
              authorizationError:
                tlsInfo.authorizationError ??
                socketTls.authorizationError,
            },
          });
        });
      },
    );

    req.on('socket', (socket) => {
      socket.on('secureConnect', () => {
        tlsInfo = collectTlsInfo(socket);
      });
    });

    req.on('timeout', () => {
      req.destroy(
        new Error(
          `Request timeout after ${timeoutMs}ms`,
        ),
      );
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body !== null && body !== undefined) {
      req.write(body);
    }

    req.end();
  });
}

export async function httpsTlsProbe(url) {
  const startedAt = Date.now();

  try {
    const result = await httpsRequestRaw({
      url,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'TruckGuard-TLS-Diagnostic/1.0',
      },
    });

    return {
      url,
      success: true,
      status: result.status,
      tls: result.tls,
      durationMs: Date.now() - startedAt,
      bodyPreview: result.body.slice(0, 160),
    };
  } catch (error) {
    return {
      url,
      success: false,
      status: null,
      tls: null,
      durationMs: Date.now() - startedAt,
      error: formatTlsError(error),
      bodyPreview: null,
    };
  }
}

export async function httpsJsonPost(url, headers, payload) {
  try {
    const result = await httpsRequestRaw({
      url,
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return {
      ok: true,
      result,
    };
  } catch (error) {
    return {
      ok: false,
      error,
      tlsError: formatTlsError(error),
      isTlsCertificateError:
        isTlsCertificateError(error),
    };
  }
}
