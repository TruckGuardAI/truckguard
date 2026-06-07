export const VEHICLE_TYPE_OPTIONS = [
  'Articulado / TIR',
  'Camião rígido',
  'Porta-carros',
  'Furgão',
  'Ligeiro',
  'Máquinas',
  'Especial',
] as const;

export const CARGO_TYPE_OPTIONS = [
  'Geral',
  'Automóveis',
  'Combustível',
  'Frigorífica',
  'ADR',
  'Contentores',
  'Outros',
] as const;

export type VehicleTypeOption =
  (typeof VEHICLE_TYPE_OPTIONS)[number];

export type CargoTypeOption =
  (typeof CARGO_TYPE_OPTIONS)[number];

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  tipoVeiculo?: VehicleTypeOption;
  tipoCarga?: CargoTypeOption;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileInput = {
  fullName: string;
  email: string;
  tipoVeiculo?: VehicleTypeOption;
  tipoCarga?: CargoTypeOption;
};
