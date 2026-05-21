export type TempUnit = 'c' | 'f';
export type WindUnit = 'kmh' | 'mph' | 'kn';

export interface AppSettings {
  tempUnit: TempUnit;
  windUnit: WindUnit;
  radarOpacity: number;
  autoRefresh: boolean;
  showAiInsights: boolean;
  showLightning: boolean;
  showAlerts: boolean;
}
