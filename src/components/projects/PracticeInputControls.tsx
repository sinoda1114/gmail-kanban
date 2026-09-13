"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Alert, Button, Group, SegmentedControl, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMicrophone, IconPlayerStop, IconVolume } from "@tabler/icons-react";
import {
  parsePracticeInputMode,
  spokenUtteranceKey,
  type PracticeInputMode,
} from "@/lib/practice-input-mode";
import {
  PRACTICE_SPEECH_LANG,
  canUsePracticeVoice,
  clipPracticeTranscript,
  getSpeechRecognitionConstructor,
  joinRecognitionTranscript,
  pickJapaneseVoice,
  type SpeechRecognitionLike,
} from "@/lib/practice-speech";
import { MAX_PRACTICE_MESSAGE_CHARS } from "@/types/interview-practice";

interface PracticeInputControlsProps {
  mode: PracticeInputMode;
  onModeChange: (mode: PracticeInputMode) => void;
  draft: string;
  onDraftChange: (value: string) => void;
  lastInterviewer: string | null;
  sessionId: string | null;
  active: boolean;
  sending?: boolean;
  starting?: boolean;
  modeDisabled?: boolean;
}

const SPEAK_DELAY_MS = 100;

function subscribeNever() {
  return () => {};
}

export function PracticeInputControls({
  mode,
  onModeChange,
  draft,
  onDraftChange,
  lastInterviewer,
  sessionId,
  active,
  sending = false,
  starting = false,
  modeDisabled = false,
}: PracticeInputControlsProps) {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const capability = mounted
    ? canUsePracticeVoice()
    : { tts: false, stt: false };
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const draftBaseRef = useRef("");
  const spokenRef = useRef<string | null>(null);
  const speakTimerRef = useRef<number | null>(null);
  const busy = sending || starting;

  function abortListening() {
    recognitionRef.current?.abort();
  }

  function cancelSpeech() {
    if (speakTimerRef.current != null) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }

  function speakJapanese(text: string) {
    if (!text.trim() || typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }
    abortListening();
    cancelSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = PRACTICE_SPEECH_LANG;
    const picked = pickJapaneseVoice(window.speechSynthesis.getVoices());
    if (picked) {
      const voice = window.speechSynthesis
        .getVoices()
        .find((item) => item.name === picked.name && item.lang === picked.lang);
      if (voice) utterance.voice = voice;
    }
    speakTimerRef.current = window.setTimeout(() => {
      speakTimerRef.current = null;
      window.speechSynthesis.speak(utterance);
    }, SPEAK_DELAY_MS);
  }

  useEffect(() => {
    const refreshVoices = () => {
      window.speechSynthesis?.getVoices();
    };
    window.speechSynthesis?.addEventListener("voiceschanged", refreshVoices);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", refreshVoices);
      cancelSpeech();
      abortListening();
    };
  }, []);

  useEffect(() => {
    if (mode !== "voice") {
      cancelSpeech();
      abortListening();
      spokenRef.current = null;
      return;
    }
    const key = spokenUtteranceKey(sessionId, lastInterviewer);
    if (!key || spokenRef.current === key) return;
    spokenRef.current = key;
    speakJapanese(lastInterviewer ?? "");
    // speakJapanese is a render helper; the utterance key is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lastInterviewer, sessionId]);

  useEffect(() => {
    if (!busy) return;
    abortListening();
  }, [busy]);

  function handleModeChange(next: PracticeInputMode) {
    if (next !== "voice") {
      cancelSpeech();
      abortListening();
      setListening(false);
    }
    onModeChange(next);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function startListening() {
    if (busy) return;
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      notifications.show({
        color: "yellow",
        message: "このブラウザは音声入力に対応していません。Chrome を使ってください。",
      });
      return;
    }
    cancelSpeech();
    abortListening();
    const recognition = new Ctor();
    recognition.lang = PRACTICE_SPEECH_LANG;
    recognition.continuous = true;
    recognition.interimResults = true;
    draftBaseRef.current = draft.trim() ? `${draft.trim()}\n` : "";
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      const spoken = joinRecognitionTranscript(event.results);
      onDraftChange(
        clipPracticeTranscript(
          `${draftBaseRef.current}${spoken}`,
          MAX_PRACTICE_MESSAGE_CHARS
        )
      );
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      if (event.error === "not-allowed") {
        notifications.show({
          color: "red",
          message: "マイクの使用が拒否されました。ブラウザの設定を確認してください。",
        });
      } else if (event.error !== "aborted" && event.error !== "no-speech") {
        notifications.show({
          color: "yellow",
          message: "音声の聞き取りに失敗しました。もう一度話してください。",
        });
      }
      setListening(false);
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      setListening(false);
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      notifications.show({
        color: "yellow",
        message: "音声入力を開始できませんでした。",
      });
    }
  }

  const voiceUnsupported = mode === "voice" && !capability.stt && !capability.tts;

  return (
    <>
      <div role="group" aria-label="入力モード">
        <SegmentedControl
          value={mode}
          onChange={(value) => handleModeChange(parsePracticeInputMode(value))}
          disabled={modeDisabled}
          data={[
            { label: "テキスト", value: "text" },
            { label: "音声", value: "voice" },
            { label: "ライブ", value: "live" },
          ]}
        />
      </div>
      {mode === "voice" && (
        <Text size="sm" c="dimmed">
          相手役の質問を読み上げ、マイクで答えます。途中でテキストに戻しても同じ練習です。聞き取り結果は下の欄で直せます。
        </Text>
      )}
      {mode === "live" && (
        <Text size="sm" c="dimmed">
          Gemini Live
          で相手役とリアルタイムに会話します。話す番と入力中は下の相手役とメーターで分かります。
        </Text>
      )}
      {mode === "voice" && !capability.stt && (
        <Alert color="yellow" title="音声入力が使えません">
          このブラウザは Web Speech の聞き取りに対応していません。Chrome
          など対応ブラウザを使うか、テキストモードで入力してください。
        </Alert>
      )}
      {mode === "voice" && !capability.tts && (
        <Alert color="yellow" title="読み上げが使えません">
          このブラウザは音声合成に対応していません。テキストモードに切り替えるか、対応ブラウザを使ってください。
        </Alert>
      )}
      {voiceUnsupported && (
        <Alert color="gray">読み上げも聞き取りも使えません。</Alert>
      )}
      {mode === "voice" && active && (
        <Group>
          <Button
            variant="light"
            leftSection={<IconVolume size={16} />}
            disabled={!lastInterviewer || !capability.tts || busy || listening}
            onClick={() => {
              if (lastInterviewer) speakJapanese(lastInterviewer);
            }}
          >
            相手役を読み上げ
          </Button>
          {listening ? (
            <Button
              color="red"
              variant="light"
              leftSection={<IconPlayerStop size={16} />}
              onClick={stopListening}
            >
              聞き取りを止める
            </Button>
          ) : (
            <Button
              variant="light"
              color="teal"
              leftSection={<IconMicrophone size={16} />}
              disabled={!capability.stt || busy}
              onClick={startListening}
            >
              マイクで話す
            </Button>
          )}
        </Group>
      )}
    </>
  );
}
