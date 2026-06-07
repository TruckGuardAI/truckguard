import { Platform } from 'react-native';

import NetInfo from '@react-native-community/netinfo';

import type {
  ProcessCommandResult,
  VoiceUiState,
  VoiceUiStatus,
} from '../types/voice.types';

import i18n from '../i18n';

import {
  getCommandDefinition,
  getCommandTitle,
  parseVoiceCommand,
} from '../utils/voiceCommand.parser';

import { alertsApiService } from './alertsApi.service';


import { locationService } from './location.service';

import {
  createVoiceRecognitionAdapter,
  type IVoiceRecognitionAdapter,
} from './voiceRecognition.adapter';

const COOLDOWN_MS = 5000;
const TRANSCRIPT_DEBOUNCE_MS = 450;

type StateListener = (status: VoiceUiStatus) => void;

type CommandListener = (result: ProcessCommandResult) => void;

function buildUiStatus(
  state: VoiceUiState,
  message: string,
): VoiceUiStatus {
  return { state, message };
}

class VoiceAssistantService {
  private adapter: IVoiceRecognitionAdapter | null = null;

  private listening = false;

  private lastCommandAt = 0;

  private lastProcessedKey = '';

  private debounceTimer: ReturnType<typeof setTimeout> | null =
    null;

  private pendingTranscript = '';

  private readonly stateListeners = new Set<StateListener>();

  private readonly commandListeners = new Set<CommandListener>();

  subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(
      buildUiStatus(
        'idle',
        i18n.t('voice.tapToSpeak'),
      ),
    );

    return () => {
      this.stateListeners.delete(listener);
    };
  }

  subscribeCommands(listener: CommandListener): () => void {
    this.commandListeners.add(listener);

    return () => {
      this.commandListeners.delete(listener);
    };
  }

  private notifyState(status: VoiceUiStatus): void {
    this.stateListeners.forEach((listener) => {
      listener(status);
    });
  }

  private notifyCommand(result: ProcessCommandResult): void {
    this.commandListeners.forEach((listener) => {
      listener(result);
    });
  }

  private async ensureAdapter(): Promise<IVoiceRecognitionAdapter> {
    if (!this.adapter) {
      this.adapter = await createVoiceRecognitionAdapter();
    }

    return this.adapter;
  }

  private isOnCooldown(): boolean {
    const elapsed = Date.now() - this.lastCommandAt;
    return elapsed < COOLDOWN_MS;
  }

  private scheduleTranscriptProcessing(
    transcript: string,
    isFinal: boolean,
  ): void {
    this.pendingTranscript = transcript;

    if (!isFinal) {
      this.notifyState(
        buildUiStatus(
          'listening',
          i18n.t('voice.listeningPartial', {
            text: transcript.slice(0, 40),
          }),
        ),
      );
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      void this.flushTranscript(isFinal);
    }, TRANSCRIPT_DEBOUNCE_MS);
  }

  private async flushTranscript(
    isFinal: boolean,
  ): Promise<void> {
    const transcript = this.pendingTranscript.trim();

    if (!transcript) {
      return;
    }

    if (!isFinal && transcript.length < 12) {
      return;
    }

    const key = transcript.toLowerCase();

    if (key === this.lastProcessedKey) {
      return;
    }

    this.lastProcessedKey = key;

    const result = await this.processCommand(transcript);
    this.notifyCommand(result);

    if (result.kind === 'cancel') {
      await this.stopListening();
      return;
    }

    if (
      result.kind === 'success' ||
      result.kind === 'unrecognized'
    ) {
      await this.stopListening();
    }
  }

  async startListening(): Promise<void> {
    if (this.listening) {
      return;
    }

    if (this.isOnCooldown()) {
      const remaining =
        COOLDOWN_MS - (Date.now() - this.lastCommandAt);

      this.notifyState(
        buildUiStatus(
          'cooldown',
          i18n.t('voice.cooldown', {
            seconds: Math.ceil(remaining / 1000),
          }),
        ),
      );

      this.notifyCommand({
        kind: 'cooldown',
        remainingMs: remaining,
      });

      return;
    }

    try {
      const adapter = await this.ensureAdapter();
      const available = await adapter.isAvailable();

      if (!available) {
        this.notifyState(
          buildUiStatus(
            'error',
            i18n.t('voice.micUnavailable'),
          ),
        );
        return;
      }

      if (Platform.OS !== 'web') {
        try {
          const mod = await import('expo-speech-recognition');
          await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
        } catch {
          // Expo Go sem módulo nativo — web speech ou dev build
        }
      }

      this.listening = true;
      this.lastProcessedKey = '';
      this.pendingTranscript = '';

      this.notifyState(
        buildUiStatus(
          'listening',
          i18n.t('voice.listening'),
        ),
      );

      await adapter.start(
        (transcript, isFinal) => {
          this.scheduleTranscriptProcessing(
            transcript,
            isFinal,
          );
        },
        (message) => {
          if (message === 'aborted' || message === 'no-speech') {
            return;
          }

          this.notifyState(
            buildUiStatus('error', message),
          );
        },
      );
    } catch (error) {
      this.listening = false;
      this.notifyState(
        buildUiStatus(
          'error',
          error instanceof Error
            ? error.message
            : i18n.t('voice.startError'),
        ),
      );
    }
  }

  async stopListening(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.listening = false;
    this.pendingTranscript = '';

    if (this.adapter) {
      await this.adapter.stop();
    }

    if (this.isOnCooldown()) {
      const remaining =
        COOLDOWN_MS - (Date.now() - this.lastCommandAt);

      this.notifyState(
        buildUiStatus(
          'cooldown',
          i18n.t('voice.cooldown', {
            seconds: Math.ceil(remaining / 1000),
          }),
        ),
      );

      return;
    }

    this.notifyState(
      buildUiStatus(
        'idle',
        i18n.t('voice.tapToSpeak'),
      ),
    );
  }

  async processCommand(
    transcript: string,
  ): Promise<ProcessCommandResult> {
    if (this.isOnCooldown()) {
      const remaining =
        COOLDOWN_MS - (Date.now() - this.lastCommandAt);

      return {
        kind: 'cooldown',
        remainingMs: remaining,
      };
    }

    this.notifyState(
      buildUiStatus(
        'processing',
        i18n.t('voice.processing'),
      ),
    );

    const commandId = parseVoiceCommand(transcript);

    if (commandId === 'unknown') {
      this.notifyState(
        buildUiStatus(
          'unrecognized',
          i18n.t('voice.unrecognized'),
        ),
      );

      return {
        kind: 'unrecognized',
        transcript,
      };
    }

    if (commandId === 'cancel') {
      this.notifyState(
        buildUiStatus(
          'idle',
          i18n.t('voice.cancelled'),
        ),
      );

      return { kind: 'cancel' };
    }

    const definition = getCommandDefinition(commandId);

    if (!definition?.alertType) {
      return {
        kind: 'unrecognized',
        transcript,
      };
    }

    try {
      const netState = await NetInfo.fetch();
      const online =
        netState.isConnected === true &&
        netState.isInternetReachable !== false;

      const location =
        await locationService.getCurrentLocation();

      const alert = await alertsApiService.createAlert({
        title: getCommandTitle(commandId),
        type: definition.alertType,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      this.lastCommandAt = Date.now();

      const uiState: VoiceUiState =
        commandId === 'sos' ? 'success_sos' : 'success_alert';

      const uiMessage =
        commandId === 'sos'
          ? i18n.t('voice.sosSentStatus')
          : i18n.t('voice.alertCreated', {
              type: definition.alertType,
            });

      this.notifyState(buildUiStatus(uiState, uiMessage));

      return {
        kind: 'success',
        commandId,
        alertType: definition.alertType,
        alert,
        offline: !online,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n.t('voice.createAlertError');

      this.notifyState(
        buildUiStatus('error', message),
      );

      return { kind: 'error', message };
    }
  }

  isListening(): boolean {
    return this.listening;
  }
}

export const voiceAssistantService = new VoiceAssistantService();
