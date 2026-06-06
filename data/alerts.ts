export type AlertSeverity =
  | 'low'
  | 'medium'
  | 'high';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  distance: string;
  severity: AlertSeverity;

  latitude: number;
  longitude: number;
}

export const alerts: AlertItem[] = [
  {
    id: '1',
    title: 'Roubo reportado',
    description:
      'Motoristas relataram atividade suspeita na área.',
    distance: '2.4 km',
    severity: 'high',

    latitude: -23.5489,
    longitude: -46.6388,
  },

  {
    id: '2',
    title: 'Fiscalização',
    description:
      'Operação policial ativa na rodovia principal.',
    distance: '5.1 km',
    severity: 'medium',

    latitude: -23.552,
    longitude: -46.641,
  },

  {
    id: '3',
    title: 'Acidente leve',
    description:
      'Fluxo lento devido colisão entre veículos.',
    distance: '1.2 km',
    severity: 'low',

    latitude: -23.5511,
    longitude: -46.6365,
  },

  {
    id: '4',
    title: 'Bloqueio parcial',
    description:
      'Faixa interditada por manutenção emergencial.',
    distance: '7.8 km',
    severity: 'medium',

    latitude: -23.555,
    longitude: -46.644,
  },
];