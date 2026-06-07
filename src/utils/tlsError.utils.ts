export function isTlsCertificateError(
  error: unknown,
): boolean {
  if (!error) {
    return false;
  }

  const parts: string[] = [];

  if (error instanceof Error) {
    parts.push(error.message);
    parts.push(error.name);

    const cause = (
      error as Error & {
        cause?: unknown;
      }
    ).cause;

    if (cause instanceof Error) {
      parts.push(cause.message);
      parts.push(cause.name);
    }

    const causeCode = (
      cause as { code?: string } | undefined
    )?.code;

    if (causeCode) {
      parts.push(causeCode);
    }
  } else {
    parts.push(String(error));
  }

  const text = parts.join(' ');

  return /UNABLE_TO_VERIFY_LEAF_SIGNATURE|SELF_SIGNED_CERT|CERT_|certificate|TLS_CERTIFICATE|fetch failed/i.test(
    text,
  );
}

export const TLS_CERTIFICATE_ERROR_CODE =
  'TLS_CERTIFICATE_ERROR';
