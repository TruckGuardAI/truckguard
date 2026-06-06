export type RadarMapAlert = {
  id: string | number;
  latitude: number;
  longitude: number;
  title?: string;
};

export type RadarMapProps = {
  latitude: number;
  longitude: number;
  alerts: RadarMapAlert[];
};
