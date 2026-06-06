import { Platform } from 'react-native';

export type TranscriptHandler = (
  transcript: string,
  isFinal: boolean,
) => void;

export type RecognitionErrorHandler = (
  message: string,
) => void;

type WebSpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: {
    resultIndex: number;
    results: {
      isFinal: boolean;
      0: { transcript: string };
      length: number;
    }[];
  }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type WebSpeechWindow = {
  SpeechRecognition?: new () => WebSpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => WebSpeechRecognitionInstance;
};

export interface IVoiceRecognitionAdapter {
  isAvailable(): Promise<boolean>;
  start(
    onTranscript: TranscriptHandler,
    onError: RecognitionErrorHandler,
  ): Promise<void>;
  stop(): Promise<void>;
}

class WebSpeechRecognitionAdapter
  implements IVoiceRecognitionAdapter
{
  private recognition: WebSpeechRecognitionInstance | null =
    null;

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      return false;
    }

    const win = globalThis as unknown as WebSpeechWindow;

    return Boolean(
      win.SpeechRecognition ?? win.webkitSpeechRecognition,
    );
  }

  async start(
    onTranscript: TranscriptHandler,
    onError: RecognitionErrorHandler,
  ): Promise<void> {
    const win = globalThis as unknown as WebSpeechWindow;
    const SpeechRecognitionCtor =
      win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      onError('Reconhecimento de voz indisponível no browser');
      return;
    }

    this.recognition = new SpeechRecognitionCtor();
    this.recognition.lang = 'pt-PT';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }

      const isFinal =
        event.results[event.results.length - 1]?.isFinal ?? false;

      onTranscript(transcript.trim(), isFinal);
    };

    this.recognition.onerror = (event) => {
      onError(event.error ?? 'Erro de reconhecimento');
    };

    this.recognition.onend = () => {
      this.recognition = null;
    };

    this.recognition.start();
  }

  async stop(): Promise<void> {
    this.recognition?.stop();
    this.recognition = null;
  }
}

class ExpoSpeechRecognitionAdapter
  implements IVoiceRecognitionAdapter
{
  private subscriptions: { remove: () => void }[] = [];

  private nativeModule: {
    isRecognitionAvailable: () => boolean;
    start: (options: {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
    }) => void;
    stop: () => void;
    abort: () => void;
  } | null = null;

  private async loadModule(): Promise<boolean> {
    if (this.nativeModule) {
      return true;
    }

    try {
      const mod = await import('expo-speech-recognition');
      this.nativeModule = mod.ExpoSpeechRecognitionModule;
      return true;
    } catch {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    const loaded = await this.loadModule();

    if (!loaded || !this.nativeModule) {
      return false;
    }

    try {
      return this.nativeModule.isRecognitionAvailable();
    } catch {
      return false;
    }
  }

  async start(
    onTranscript: TranscriptHandler,
    onError: RecognitionErrorHandler,
  ): Promise<void> {
    const loaded = await this.loadModule();

    if (!loaded || !this.nativeModule) {
      onError(
        'Reconhecimento nativo indisponível. Use npx expo run:android',
      );
      return;
    }

    const mod = await import('expo-speech-recognition');

    this.subscriptions.push(
      mod.ExpoSpeechRecognitionModule.addListener(
        'result',
        (event: {
          results?: { transcript?: string }[];
          isFinal?: boolean;
        }) => {
          const transcript =
            event.results?.[0]?.transcript?.trim() ?? '';

          if (transcript) {
            onTranscript(transcript, Boolean(event.isFinal));
          }
        },
      ),
    );

    this.subscriptions.push(
      mod.ExpoSpeechRecognitionModule.addListener(
        'error',
        (event: { error?: string; message?: string }) => {
          onError(event.message ?? event.error ?? 'Erro de voz');
        },
      ),
    );

    this.nativeModule.start({
      lang: 'pt-PT',
      interimResults: true,
      continuous: true,
    });
  }

  async stop(): Promise<void> {
    this.subscriptions.forEach((sub) => sub.remove());
    this.subscriptions = [];

    if (this.nativeModule) {
      try {
        this.nativeModule.stop();
      } catch {
        this.nativeModule.abort();
      }
    }
  }
}

export async function createVoiceRecognitionAdapter(): Promise<IVoiceRecognitionAdapter> {
  if (Platform.OS === 'web') {
    const web = new WebSpeechRecognitionAdapter();

    if (await web.isAvailable()) {
      return web;
    }
  }

  const expo = new ExpoSpeechRecognitionAdapter();

  if (await expo.isAvailable()) {
    return expo;
  }

  return new WebSpeechRecognitionAdapter();
}
