export {};

declare global {
  interface SpeechRecognitionResultLike {
    readonly isFinal: boolean;
    readonly 0: { readonly transcript: string };
  }

  interface SpeechRecognitionResultListLike {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionResultLike;
  }

  interface SpeechRecognitionEventLike extends Event {
    readonly results: SpeechRecognitionResultListLike;
  }

  interface SpeechRecognitionErrorEventLike extends Event {
    readonly error: string;
  }

  interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEventLike) => void) | null;
    onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEventLike) => void) | null;
    onend: ((this: SpeechRecognitionInstance) => void) | null;
  }

  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}
