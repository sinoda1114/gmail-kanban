"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, Group, Text } from "@mantine/core";
import { IconPlayerStop } from "@tabler/icons-react";
import type { PracticeMessage } from "@/types/interview-practice";
import {
  INITIAL_LIVE_CONVERSATION,
  LIVE_KICKOFF_TEXT,
  LIVE_PCM_MIME,
  flushLiveConversation,
  liveConstrainedWsUrl,
  parseLiveServerMessage,
  reduceLiveConversation,
  type LiveConnectSetup,
  type LiveConversationState,
} from "@/lib/practice-live";
import { PracticeLiveAudio } from "@/lib/practice-live-audio";

type LiveStatus = "connecting" | "listening" | "speaking";

interface PracticeLiveSessionProps {
  token: string;
  setup: LiveConnectSetup;
  onMessages: (messages: PracticeMessage[]) => void;
  onEnded: (messages: PracticeMessage[]) => void;
  onFailed: (message: string) => void;
}

async function readWsPayload(data: unknown): Promise<unknown> {
  if (typeof data === "string") return JSON.parse(data) as unknown;
  if (data instanceof Blob) return JSON.parse(await data.text()) as unknown;
  if (data instanceof ArrayBuffer) {
    return JSON.parse(new TextDecoder().decode(data)) as unknown;
  }
  return data;
}

export function PracticeLiveSession({
  token,
  setup,
  onMessages,
  onEnded,
  onFailed,
}: PracticeLiveSessionProps) {
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const conversationRef = useRef<LiveConversationState>(INITIAL_LIVE_CONVERSATION);
  const audioRef = useRef<PracticeLiveAudio | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const stoppedRef = useRef(false);
  const onMessagesRef = useRef(onMessages);
  const onEndedRef = useRef(onEnded);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onMessagesRef.current = onMessages;
    onEndedRef.current = onEnded;
    onFailedRef.current = onFailed;
  }, [onMessages, onEnded, onFailed]);

  function stopAndEmit() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    audioRef.current?.stop();
    socketRef.current?.close();
    onEndedRef.current(flushLiveConversation(conversationRef.current));
  }

  useEffect(() => {
    stoppedRef.current = false;
    conversationRef.current = INITIAL_LIVE_CONVERSATION;
    const audio = new PracticeLiveAudio();
    audioRef.current = audio;
    const socket = new WebSocket(liveConstrainedWsUrl(token));
    socketRef.current = socket;

    function sendJson(payload: unknown) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
      }
    }

    let micStarted = false;
    socket.onopen = () => {
      sendJson({ setup });
    };

    socket.onmessage = async (event) => {
      if (stoppedRef.current) return;
      let payload: unknown;
      try {
        payload = await readWsPayload(event.data);
      } catch {
        return;
      }
      const events = parseLiveServerMessage(payload);
      if (events.some((item) => item.type === "setupComplete") && !micStarted) {
        micStarted = true;
        sendJson({ realtimeInput: { text: LIVE_KICKOFF_TEXT } });
        try {
          await audio.start((chunk) => {
            sendJson({
              realtimeInput: {
                audio: { data: chunk, mimeType: LIVE_PCM_MIME },
              },
            });
          });
          if (!stoppedRef.current) setStatus("listening");
        } catch {
          onFailedRef.current("マイクを開始できませんでした。ブラウザの許可を確認してください。");
        }
      }
      if (events.some((item) => item.type === "interrupted")) {
        audio.interruptPlayback();
      }
      for (const item of events) {
        if (item.type === "audio") audio.playPcmBase64(item.data);
      }
      conversationRef.current = reduceLiveConversation(conversationRef.current, events);
      onMessagesRef.current(conversationRef.current.messages);
      if (conversationRef.current.speaking) setStatus("speaking");
      else if (socket.readyState === WebSocket.OPEN) setStatus("listening");
      if (events.some((item) => item.type === "goAway") && !stoppedRef.current) {
        stopAndEmit();
      }
    };

    socket.onerror = () => {
      if (!stoppedRef.current) {
        onFailedRef.current("Gemini Live への接続に失敗しました。");
      }
    };

    return () => {
      stoppedRef.current = true;
      audio.stop();
      if (socket.readyState === WebSocket.OPEN) socket.close();
      socketRef.current = null;
    };
    // Connect once per token/setup pair.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleStop() {
    stopAndEmit();
  }

  const label =
    status === "connecting"
      ? "接続中"
      : status === "speaking"
        ? "相手役が話しています"
        : "聞いています。どうぞ話してください";

  return (
    <Group justify="space-between" align="center">
      <Group gap="sm">
        <Badge color={status === "speaking" ? "violet" : "teal"} variant="light">
          {label}
        </Badge>
        <Text size="sm" c="dimmed">
          途中で割り込めます。終わったら終了してください。
        </Text>
      </Group>
      <Button
        color="red"
        variant="light"
        leftSection={<IconPlayerStop size={16} />}
        onClick={handleStop}
      >
        ライブ面談を終了
      </Button>
    </Group>
  );
}

export function PracticeLiveUnsupported() {
  return (
    <Alert color="yellow" title="ライブ面談が使えません">
      マイクと AudioContext が必要です。Chrome など対応ブラウザを使ってください。
    </Alert>
  );
}
