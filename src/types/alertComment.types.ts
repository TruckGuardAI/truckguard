import type { UserTrustLevel } from './reputation.types';

export type AlertComment = {
  id: string;
  alertId: string;
  userId: string;
  comment: string;
  createdAt: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorReputationScore?: number;
  authorTrustLevel?: UserTrustLevel;
};
