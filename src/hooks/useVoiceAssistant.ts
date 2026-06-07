import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { voiceAssistantService } from '../services/voiceAssistant.service';

import type {
  ProcessCommandResult,
  VoiceUiStatus,
} from '../types/voice.types';

type UseVoiceAssistantOptions = {
  onCommandResult?: (result: ProcessCommandResult) => void;
};

type UseVoiceAssistantResult = {
  status: VoiceUiStatus;
  isListening: boolean;
  toggleListening: () => Promise<void>;
  stopListening: () => Promise<void>;
};

export function useVoiceAssistant(
  options: UseVoiceAssistantOptions = {},
): UseVoiceAssistantResult {
  const { onCommandResult } = options;
  const { t } = useTranslation();

  const [status, setStatus] = useState<VoiceUiStatus>({
    state: 'idle',
    message: t('voice.tapToSpeak'),
  });

  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const unsubscribeState =
      voiceAssistantService.subscribeState((next) => {
        setStatus(next);
        setIsListening(
          voiceAssistantService.isListening(),
        );
      });

    const unsubscribeCommands =
      voiceAssistantService.subscribeCommands((result) => {
        onCommandResult?.(result);
      });

    return () => {
      unsubscribeState();
      unsubscribeCommands();
      void voiceAssistantService.stopListening();
    };
  }, [onCommandResult]);

  const toggleListening = useCallback(async () => {
    if (voiceAssistantService.isListening()) {
      await voiceAssistantService.stopListening();
      return;
    }

    await voiceAssistantService.startListening();
  }, []);

  const stopListening = useCallback(async () => {
    await voiceAssistantService.stopListening();
  }, []);

  return {
    status,
    isListening,
    toggleListening,
    stopListening,
  };
}
