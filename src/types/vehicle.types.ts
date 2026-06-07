export type Vehicle = {
  id: string;
  userId: string;
  marca: string;
  modelo: string;
  matricula: string;
  tipoVeiculo: string;
  tipoCarga?: string;
  comprimento?: number;
  altura?: number;
  pesoMaximo?: number;
  createdAt: string;
};

export type VehicleInput = {
  marca: string;
  modelo: string;
  matricula: string;
  tipoVeiculo: string;
  tipoCarga?: string;
  comprimento?: number;
  altura?: number;
  pesoMaximo?: number;
};
