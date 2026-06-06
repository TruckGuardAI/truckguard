import { useCallback, useEffect, useState } from 'react';

import { voiceAssistantService } from '../services/voiceAssistant.service';

import type { ProcessCommandResult } from '../types/voice.types';

import type { VoiceUiStatus } from '../types/voice.types';

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

  const [status, setStatus] = useState<VoiceUiStatus>({
    state: 'idle',
    message: 'Toque para falar',
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
