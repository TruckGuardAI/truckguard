import i18n from '../i18n';

import type {
  VoiceCommandDefinition,
  VoiceCommandId,
} from '../types/voice.types';

const WAKE_WORD = 'truckguard';

export const VOICE_COMMANDS: VoiceCommandDefinition[] = [
  {
    id: 'sos',
    phrases: ['sos', 'pedido de ajuda', 'emergencia', 'emergência'],
    alertType: 'sos',
    title: 'sos',
  },
  {
    id: 'fuel',
    phrases: [
      'combustivel',
      'combustível',
      'furto combustivel',
      'furto de combustivel',
      'tanque',
    ],
    alertType: 'fuel',
    title: 'fuel',
  },
  {
    id: 'cargo',
    phrases: ['carga', 'furto carga', 'palete', 'paletes', 'caixa'],
    alertType: 'pallet',
    title: 'cargo',
  },
  {
    id: 'mechanic',
    phrases: [
      'mecanica',
      'mecânica',
      'avaria',
      'pane',
      'oficina',
      'assistencia mecanica',
    ],
    alertType: 'mechanic',
    title: 'mechanic',
  },
  {
    id: 'cancel',
    phrases: ['cancelar', 'parar', 'stop', 'sair'],
    title: 'cancel',
  },
];

function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsWakeWord(normalized: string): boolean {
  return normalized.includes(WAKE_WORD);
}

export function parseVoiceCommand(
  transcript: string,
): VoiceCommandId {
  const normalized = normalizeTranscript(transcript);

  if (!normalized) {
    return 'unknown';
  }

  if (!containsWakeWord(normalized)) {
    return 'unknown';
  }

  const afterWake = normalized
    .split(WAKE_WORD)
    .pop()
    ?.trim();

  const commandText = afterWake ?? normalized;

  if (
    VOICE_COMMANDS.find((c) => c.id === 'cancel')?.phrases.some(
      (phrase) => commandText.includes(phrase),
    )
  ) {
    return 'cancel';
  }

  for (const command of VOICE_COMMANDS) {
    if (command.id === 'cancel') {
      continue;
    }

    const matched = command.phrases.some((phrase) =>
      commandText.includes(phrase),
    );

    if (matched) {
      return command.id;
    }
  }

  return 'unknown';
}

export function getCommandDefinition(
  commandId: VoiceCommandId,
): VoiceCommandDefinition | undefined {
  return VOICE_COMMANDS.find((item) => item.id === commandId);
}

export function getCommandTitle(
  commandId: VoiceCommandId,
): string {
  if (commandId === 'unknown') {
    return '';
  }

  return i18n.t(`voice.commands.${commandId}`);
}
