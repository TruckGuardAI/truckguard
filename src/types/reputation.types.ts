export type UserTrustLevel =
  | 'novo'
  | 'confiavel'
  | 'experiente'
  | 'elite';

export type UserReputation = {
  userId: string;
  alertsCreated: number;
  alertsConfirmed: number;
  alertsRejected: number;
  reputationScore: number;
  trustLevel: UserTrustLevel;
  createdAt: string;
  updatedAt: string;
};

export function isUserTrustLevel(
  value: string,
): value is UserTrustLevel {
  return (
    value === 'novo' ||
    value === 'confiavel' ||
    value === 'experiente' ||
    value === 'elite'
  );
}

export function resolveTrustLevelFromScore(
  score: number,
): UserTrustLevel {
  if (score >= 700) {
    return 'elite';
  }

  if (score >= 300) {
    return 'experiente';
  }

  if (score >= 100) {
    return 'confiavel';
  }

  return 'novo';
}
