import type { AlertType } from '../types/alert.types';

import type {
  CargoTypeOption,
  UserProfile,
  VehicleTypeOption,
} from '../types/profile.types';

export type AlertRelevancePriority =
  | 'low'
  | 'medium'
  | 'high';

export type AlertRelevanceInput = {
  id: string;
  type: AlertType;
  title?: string;
};

export type AlertRelevanceProfile = Pick<
  UserProfile,
  'tipoVeiculo' | 'tipoCarga'
>;

export type AlertRelevanceResult = {
  score: number;
  reason: string;
  priority: AlertRelevancePriority;
};

const PRIORITY_SCORE: Record<
  AlertRelevancePriority,
  number
> = {
  high: 100,
  medium: 50,
  low: 20,
};

const PRIORITY_RANK: Record<
  AlertRelevancePriority,
  number
> = {
  low: 0,
  medium: 1,
  high: 2,
};

const CARGO_ALERT_PRIORITIES: Partial<
  Record<
    CargoTypeOption,
    Partial<
      Record<
        AlertType,
        AlertRelevancePriority
      >
    >
  >
> = {
  ADR: {
    fuel: 'high',
    cabin_attack: 'high',
    sos: 'high',
    full_attack: 'high',
    cargo_theft: 'medium',
  },
  Frigorífica: {
    cargo_theft: 'high',
    full_attack: 'high',
    cabin_attack: 'medium',
    obstacle: 'medium',
  },
  Combustível: {
    fuel: 'high',
    cabin_attack: 'high',
    sos: 'high',
    full_attack: 'high',
  },
  Automóveis: {
    cargo_theft: 'high',
    cabin_attack: 'medium',
    pallet: 'medium',
    full_attack: 'high',
  },
  Contentores: {
    cargo_theft: 'high',
    pallet: 'medium',
    obstacle: 'medium',
  },
  Geral: {
    cargo_theft: 'medium',
    obstacle: 'medium',
    mechanic: 'medium',
  },
  Outros: {
    obstacle: 'medium',
    mechanic: 'low',
  },
};

const VEHICLE_ALERT_PRIORITIES: Partial<
  Record<
    VehicleTypeOption,
    Partial<
      Record<
        AlertType,
        AlertRelevancePriority
      >
    >
  >
> = {
  'Porta-carros': {
    cargo_theft: 'high',
    pallet: 'low',
    full_attack: 'high',
    cabin_attack: 'medium',
  },
  'Articulado / TIR': {
    cargo_theft: 'high',
    fuel: 'medium',
    obstacle: 'medium',
    pallet: 'medium',
  },
  'Camião rígido': {
    cargo_theft: 'medium',
    fuel: 'medium',
    obstacle: 'medium',
  },
  Furgão: {
    cargo_theft: 'medium',
    cabin_attack: 'medium',
    mechanic: 'medium',
  },
  Ligeiro: {
    mechanic: 'medium',
    obstacle: 'medium',
    rest: 'low',
  },
  Máquinas: {
    obstacle: 'high',
    mechanic: 'high',
    cargo_theft: 'medium',
  },
  Especial: {
    obstacle: 'high',
    cargo_theft: 'medium',
    sos: 'high',
  },
};

const GLOBAL_ALERT_PRIORITIES: Partial<
  Record<AlertType, AlertRelevancePriority>
> = {
  sos: 'high',
};

function maxPriority(
  current: AlertRelevancePriority,
  candidate?: AlertRelevancePriority,
): AlertRelevancePriority {
  if (!candidate) {
    return current;
  }

  return PRIORITY_RANK[candidate] >
    PRIORITY_RANK[current]
    ? candidate
    : current;
}

function resolvePriority(
  alertType: AlertType,
  profile: AlertRelevanceProfile,
): {
  priority: AlertRelevancePriority;
  reason: string;
} {
  let priority: AlertRelevancePriority =
    'low';
  const reasons: string[] = [];

  const globalPriority =
    GLOBAL_ALERT_PRIORITIES[alertType];

  if (globalPriority) {
    priority = maxPriority(
      priority,
      globalPriority,
    );
    reasons.push(
      `prioridade global (${alertType})`,
    );
  }

  if (profile.tipoCarga) {
    const cargoPriority =
      CARGO_ALERT_PRIORITIES[
        profile.tipoCarga
      ]?.[alertType];

    if (cargoPriority) {
      priority = maxPriority(
        priority,
        cargoPriority,
      );
      reasons.push(
        `carga ${profile.tipoCarga}`,
      );
    }
  }

  if (profile.tipoVeiculo) {
    const vehiclePriority =
      VEHICLE_ALERT_PRIORITIES[
        profile.tipoVeiculo
      ]?.[alertType];

    if (vehiclePriority) {
      priority = maxPriority(
        priority,
        vehiclePriority,
      );
      reasons.push(
        `veículo ${profile.tipoVeiculo}`,
      );
    }
  }

  if (reasons.length === 0) {
    if (
      !profile.tipoCarga &&
      !profile.tipoVeiculo
    ) {
      return {
        priority: 'medium',
        reason:
          'perfil sem tipo de veículo/carga',
      };
    }

    return {
      priority: 'low',
      reason:
        'sem regra específica para o perfil',
    };
  }

  return {
    priority,
    reason: reasons.join(' + '),
  };
}

export function calculateAlertRelevance(
  alert: AlertRelevanceInput,
  profile: AlertRelevanceProfile,
): AlertRelevanceResult {
  const { priority, reason } =
    resolvePriority(
      alert.type,
      profile,
    );

  const score =
    PRIORITY_SCORE[priority];

  const result: AlertRelevanceResult = {
    score,
    reason,
    priority,
  };

  console.log(
    'ALERT_RELEVANCE_CALCULATED',
    {
      alertId: alert.id,
      alertType: alert.type,
      profile,
      result,
    },
  );

  console.log(
    'ALERT_RELEVANCE_SCORE',
    score,
  );

  return result;
}

export function shouldSendPushForRelevance(
  priority: AlertRelevancePriority,
): boolean {
  return (
    priority === 'high' ||
    priority === 'medium'
  );
}
