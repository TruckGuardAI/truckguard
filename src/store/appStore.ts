import { create } from 'zustand';

export interface CommunityAlert {
  id: number;
  title: string;
  location: string;
  level: 'SAFE' | 'MEDIUM' | 'HIGH';
  active: boolean;
  createdAt: string;
}

export interface SensorDevice {
  id: number;
  name: string;
  connected: boolean;
  battery: string;
}

interface AppState {
  nearbyDrivers: number;

  sosActive: boolean;

  alerts: CommunityAlert[];

  sensors: SensorDevice[];

  activateSOS: () => void;

  deactivateSOS: () => void;

  addAlert: (alert: CommunityAlert) => void;
}

export const useAppStore = create<AppState>(
  (set) => ({
    nearbyDrivers: 24,

    sosActive: false,

    alerts: [
      {
        id: 1,
        title: 'Fuel Theft Attempt',
        location: 'Hamburg A7',
        level: 'HIGH',
        active: true,
        createdAt: '2 min ago',
      },

      {
        id: 2,
        title: 'Safe Community Patrol',
        location: 'Berlin South',
        level: 'SAFE',
        active: false,
        createdAt: '12 min ago',
      },
    ],

    sensors: [
      {
        id: 1,
        name: 'Tank Sensor',
        connected: true,
        battery: '92%',
      },

      {
        id: 2,
        name: 'Cabin Motion',
        connected: true,
        battery: '81%',
      },
    ],

    activateSOS: () =>
      set(() => ({
        sosActive: true,
      })),

    deactivateSOS: () =>
      set(() => ({
        sosActive: false,
      })),

    addAlert: (alert) =>
      set((state) => ({
        alerts: [alert, ...state.alerts],
      })),
  }),
);