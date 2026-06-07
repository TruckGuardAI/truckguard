export const VOTE_AUTH_REQUIRED_CODE =
  'VOTE_AUTH_REQUIRED';

export function isVoteAuthError(
  error: unknown,
): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message ===
      VOTE_AUTH_REQUIRED_CODE ||
    error.message.includes(
      'Inicia sessão para votar',
    ) ||
    error.message.includes(
      'Sessão inválida para votar',
    )
  );
}
