import { isSupabaseConfigured, supabase } from '../lib/supabase';

import type {
  Vehicle,
  VehicleInput,
} from '../types/vehicle.types';

const TABLE = 'vehicles';

type VehicleRow = {
  id: string;
  user_id: string;
  marca: string;
  modelo: string;
  matricula: string;
  tipo_veiculo: string;
  tipo_carga: string | null;
  comprimento: number | null;
  altura: number | null;
  peso_maximo: number | null;
  created_at: string;
};

function parseOptionalNumber(
  value?: number,
): number | null {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value;
}

function mapRowToVehicle(
  row: VehicleRow,
): Vehicle {
  return {
    id: row.id,
    userId: row.user_id,
    marca: row.marca,
    modelo: row.modelo,
    matricula: row.matricula,
    tipoVeiculo: row.tipo_veiculo,
    tipoCarga: row.tipo_carga ?? undefined,
    comprimento:
      row.comprimento ?? undefined,
    altura: row.altura ?? undefined,
    pesoMaximo:
      row.peso_maximo ?? undefined,
    createdAt: row.created_at,
  };
}

function mapInputToPayload(
  userId: string,
  input: VehicleInput,
) {
  return {
    user_id: userId,
    marca: input.marca.trim(),
    modelo: input.modelo.trim(),
    matricula: input.matricula.trim(),
    tipo_veiculo:
      input.tipoVeiculo.trim(),
    tipo_carga:
      input.tipoCarga?.trim() ||
      null,
    comprimento: parseOptionalNumber(
      input.comprimento,
    ),
    altura: parseOptionalNumber(
      input.altura,
    ),
    peso_maximo: parseOptionalNumber(
      input.pesoMaximo,
    ),
  };
}

class VehicleService {
  async getVehicleByUserId(
    userId: string,
  ): Promise<Vehicle | null> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      return null;
    }

    try {
      const { data, error } =
        await supabase
          .from(TABLE)
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        console.log(
          'VEHICLE_LOAD',
          null,
        );

        return null;
      }

      const vehicle = mapRowToVehicle(
        data as VehicleRow,
      );

      console.log(
        'VEHICLE_LOAD',
        vehicle,
      );

      return vehicle;
    } catch (error) {
      console.log(
        'Erro VEHICLE_LOAD:',
        error,
      );

      throw error;
    }
  }

  async createVehicle(
    userId: string,
    input: VehicleInput,
  ): Promise<Vehicle> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    const { data, error } =
      await supabase
        .from(TABLE)
        .insert(
          mapInputToPayload(
            userId,
            input,
          ),
        )
        .select('*')
        .single();

    if (error || !data) {
      throw error;
    }

    const vehicle = mapRowToVehicle(
      data as VehicleRow,
    );

    console.log(
      'VEHICLE_CREATED',
      vehicle,
    );

    return vehicle;
  }

  async updateVehicle(
    vehicleId: string,
    userId: string,
    input: VehicleInput,
  ): Promise<Vehicle> {
    if (
      !supabase ||
      !isSupabaseConfigured()
    ) {
      throw new Error(
        'Supabase não configurado',
      );
    }

    const { data, error } =
      await supabase
        .from(TABLE)
        .update(
          mapInputToPayload(
            userId,
            input,
          ),
        )
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .select('*')
        .single();

    if (error || !data) {
      throw error;
    }

    const vehicle = mapRowToVehicle(
      data as VehicleRow,
    );

    console.log(
      'VEHICLE_UPDATED',
      vehicle,
    );

    return vehicle;
  }

  async saveVehicle(
    userId: string,
    input: VehicleInput,
    existingId?: string,
  ): Promise<Vehicle> {
    if (existingId) {
      return this.updateVehicle(
        existingId,
        userId,
        input,
      );
    }

    return this.createVehicle(
      userId,
      input,
    );
  }
}

export const vehicleService =
  new VehicleService();
