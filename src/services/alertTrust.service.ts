import i18n from '../i18n';

export type AlertTrustLevel =
  | 'low'
  | 'medium'
  | 'high';

export type AlertTrustInput = {
  id?: string;
  confirmations: number;
  rejections: number;
};

export type AlertTrustResult = {
  trustScore: number;
  trustLevel: AlertTrustLevel;
};

export type AlertRankingSortable = {
  relevanceScore: number;
  trustScore: number;
  distance: number;
};

function resolveTrustLevel(
  trustScore: number,
): AlertTrustLevel {
  if (trustScore >= 80) {
    return 'high';
  }

  if (trustScore >= 50) {
    return 'medium';
  }

  return 'low';
}

export function calculateAlertTrust(
  alert: AlertTrustInput,
): AlertTrustResult {
  const confirmations = Math.max(
    0,
    Number(alert.confirmations) || 0,
  );

  const rejections = Math.max(
    0,
    Number(alert.rejections) || 0,
  );

  const total =
    confirmations + rejections;

  let trustScore = 50;

  if (total > 0) {
    trustScore = Math.round(
      (confirmations / total) * 100,
    );
  }

  const trustLevel =
    resolveTrustLevel(trustScore);

  console.log(
    'ALERT_TRUST_SCORE',
    trustScore,
  );

  console.log(
    'ALERT_TRUST_LEVEL',
    trustLevel,
  );

  return {
    trustScore,
    trustLevel,
  };
}

export function formatTrustLabel(
  trustLevel: AlertTrustLevel,
): string {
  return i18n.t(`trust.${trustLevel}`);
}

export function shouldSendPushForTrust(
  trustLevel: AlertTrustLevel,
): boolean {
  return (
    trustLevel === 'high' ||
    trustLevel === 'medium'
  );
}

export function sortByAlertRanking<
  T extends AlertRankingSortable,
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (
      b.relevanceScore !==
      a.relevanceScore
    ) {
      return (
        b.relevanceScore -
        a.relevanceScore
      );
    }

    if (
      b.trustScore !== a.trustScore
    ) {
      return (
        b.trustScore - a.trustScore
      );
    }

    return a.distance - b.distance;
  });
}

export function trustFromVoteCounts(
  confirmations: number,
  rejections: number,
): AlertTrustResult {
  return calculateAlertTrust({
    confirmations,
    rejections,
  });
}
