import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  reputationService,
} from '../services/reputation.service';

import type { UserTrustLevel } from '../types/reputation.types';

export type CreatorReputationSnippet = {
  userId: string;
  reputationScore: number;
  trustLevel: UserTrustLevel;
};

type UseCreatorReputationsResult = {
  reputations: Map<
    string,
    CreatorReputationSnippet
  >;
};

export function useCreatorReputations(
  userIds: (
    | string
    | null
    | undefined
  )[],
): UseCreatorReputationsResult {
  const uniqueIds = useMemo(
    () =>
      [
        ...new Set(
          userIds.filter(
            (id): id is string =>
              typeof id === 'string' &&
              id.length > 0,
          ),
        ),
      ],
    [userIds],
  );

  const idsKey = uniqueIds.join(',');

  const [
    reputations,
    setReputations,
  ] = useState<
    Map<string, CreatorReputationSnippet>
  >(new Map());

  useEffect(() => {
    if (uniqueIds.length === 0) {
      return;
    }

    let mounted = true;

    void reputationService
      .getReputationsForUserIds(
        uniqueIds,
      )
      .then((map) => {
        if (mounted) {
          setReputations(map);
        }
      })
      .catch(() => {
        if (mounted) {
          setReputations(new Map());
        }
      });

    return () => {
      mounted = false;
    };
  }, [idsKey, uniqueIds]);

  return {
    reputations:
      uniqueIds.length === 0
        ? new Map()
        : reputations,
  };
}
