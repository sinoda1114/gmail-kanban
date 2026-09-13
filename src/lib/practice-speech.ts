export const PRACTICE_SPEECH_LANG = "ja-JP";

type SpeechRecognitionResultLike = {
  isFinal?: boolean;
  0: { transcript: string };
};

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function pickJapaneseVoice(
  voices: ReadonlyArray<{ lang: string; name: string }>
): { lang: string; name: string } | null {
  const ja = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("ja")
  );
  if (ja.length === 0) return null;
  return (
    ja.find((voice) => /google|neural|premium/i.test(voice.name)) ?? ja[0]
  );
}

export function clipPracticeTranscript(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

export function joinRecognitionTranscript(
  results: ArrayLike<SpeechRecognitionResultLike>
): string {
  let text = "";
  for (let i = 0; i < results.length; i++) {
    text += results[i]?.[0]?.transcript ?? "";
  }
  return text;
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canUsePracticeVoice(): { tts: boolean; stt: boolean } {
  if (typeof window === "undefined") {
    return { tts: false, stt: false };
  }
  return {
    tts: "speechSynthesis" in window,
    stt: getSpeechRecognitionConstructor() !== null,
  };
}
