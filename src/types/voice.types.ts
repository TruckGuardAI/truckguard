import type { Alert, AlertType } from './alert.types';

export type VoiceCommandId =
  | 'sos'
  | 'fuel'
  | 'cargo'
  | 'mechanic'
  | 'cancel'
  | 'unknown';

export type VoiceUiState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'success_sos'
  | 'success_alert'
  | 'unrecognized'
  | 'cooldown'
  | 'offline'
  | 'error';

export type VoiceUiStatus = {
  state: VoiceUiState;
  message: string;
};

export type ProcessCommandResult =
  | { kind: 'cancel' }
  | { kind: 'cooldown'; remainingMs: number }
  | { kind: 'unrecognized'; transcript: string }
  | {
      kind: 'success';
      commandId: VoiceCommandId;
      alertType: AlertType;
      alert: Alert | null;
      offline: boolean;
    }
  | { kind: 'error'; message: string };

export type VoiceCommandDefinition = {
  id: VoiceCommandId;
  phrases: string[];
  alertType?: AlertType;
  title: string;
};
