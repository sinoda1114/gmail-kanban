"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Group,
  Text,
  Button,
  Textarea,
  Paper,
  Title,
  Badge,
  List,
  Divider,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBroadcast, IconPlayerPlay, IconSend } from "@tabler/icons-react";
import type {
  InterviewQuestion,
  InterviewAnswer,
  InterviewPracticeSession,
} from "@/db/schema";
import type { RehearsalFeedback } from "@/types/interview-prep";
import type { PracticeMessage } from "@/types/interview-practice";
import { MAX_PRACTICE_MESSAGE_CHARS } from "@/types/interview-practice";
import {
  startInterviewPractice,
  submitPracticeReply,
  startLiveInterviewPractice,
  finishLiveInterviewPractice,
} from "@/app/dashboard/projects/interview-practice-action";
import { lastInterviewerContent, type PracticeInputMode } from "@/lib/practice-input-mode";
import { isLivePracticeModel, type LiveConnectSetup } from "@/lib/practice-live";
import { InterviewRehearsalSection } from "./InterviewRehearsalSection";
import { PracticeInputControls } from "./PracticeInputControls";
import {
  PracticeLiveSession,
  PracticeLiveUnsupported,
} from "./PracticeLiveSession";
import { PracticeLivePresence } from "./PracticeLivePresence";
import { PracticeChatThread } from "./PracticeChatThread";
import { canUsePracticeLive } from "@/lib/practice-live-audio";

interface QuestionWithAnswer extends InterviewQuestion {
  answer: InterviewAnswer | null;
}

interface InterviewPracticeTabProps {
  projectId: string;
  questions: QuestionWithAnswer[];
  session: InterviewPracticeSession | null;
}

function subscribeNever() {
  return () => {};
}

export function InterviewPracticeTab({
  projectId,
  questions,
  session,
}: InterviewPracticeTabProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PracticeInputMode>("text");
  const [liveAuth, setLiveAuth] = useState<{
    sessionId: string;
    token: string;
    setup: LiveConnectSetup;
  } | null>(null);
  const [liveMessages, setLiveMessages] = useState<PracticeMessage[] | null>(null);
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const liveCapable = mounted && canUsePracticeLive();

  const active = session?.status === "active";
  const completed = session?.status === "completed";
  const feedback = session?.feedback as RehearsalFeedback | null;
  const displayMessages = liveMessages ?? session?.messages ?? [];
  const lastInterviewer = lastInterviewerContent(displayMessages);
  const liveActive = Boolean(liveAuth);
  const strandedLive = Boolean(
    session && active && isLivePracticeModel(session.model) && !liveAuth
  );

  async function handleStart() {
    if (mode === "live") {
      await handleStartLive();
      return;
    }
    setStarting(true);
    setError(null);
    const result = await startInterviewPractice(projectId);
    setStarting(false);
    if (result.success) {
      setDraft("");
      router.refresh();
      notifications.show({
        color: "teal",
        message: "通し練習を開始しました。相手役の質問に答えてください。",
      });
    } else {
      setError(result.error ?? "開始に失敗しました");
    }
  }

  async function handleStartLive() {
    if (!liveCapable) {
      setError("このブラウザではライブ面談を始められません。");
      return;
    }
    setStarting(true);
    setError(null);
    const result = await startLiveInterviewPractice(projectId);
    setStarting(false);
    if (result.success && result.sessionId && result.token && result.setup) {
      setDraft("");
      setLiveMessages([]);
      setLiveAuth({
        sessionId: result.sessionId,
        token: result.token,
        setup: result.setup,
      });
      notifications.show({
        color: "teal",
        message: "ライブ面談を開始します。マイクの許可を出してください。",
      });
    } else {
      setError(result.error ?? "開始に失敗しました");
    }
  }

  async function handleLiveEnded(messages: PracticeMessage[]) {
    const sessionId = liveAuth?.sessionId;
    setLiveAuth(null);
    if (!sessionId) return;
    const result = await finishLiveInterviewPractice(sessionId, messages);
    if (!result.success) {
      setError(result.error ?? "ライブ面談の保存に失敗しました");
      setLiveMessages(messages);
      return;
    }
    setLiveMessages(null);
    router.refresh();
    notifications.show({
      color: "teal",
      message: "ライブ面談を終了しました。",
    });
  }

  async function handleReply() {
    if (!session) return;
    if (!draft.trim()) {
      notifications.show({ color: "yellow", message: "回答を入力してください" });
      return;
    }
    setSending(true);
    setError(null);
    const result = await submitPracticeReply(session.id, draft);
    setSending(false);
    if (result.success) {
      setDraft("");
      router.refresh();
    } else {
      setError(result.error ?? "送信に失敗しました");
    }
  }

  return (
    <Stack gap="md" p="md">
      {error && (
        <Alert color="red" title="エラー">
          {error}
        </Alert>
      )}

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="sm" align="flex-start">
          <Title order={5}>通し練習</Title>
          <Group gap="sm">
            {session && (
              <Badge variant="light" color={completed ? "gray" : "teal"}>
                {completed ? "終了" : "進行中"}
              </Badge>
            )}
          </Group>
        </Group>
        <Stack gap="sm" mb="sm">
          <PracticeInputControls
            mode={mode}
            onModeChange={setMode}
            draft={draft}
            onDraftChange={setDraft}
            lastInterviewer={lastInterviewer}
            sessionId={session?.id ?? null}
            active={Boolean(active)}
            sending={sending}
            starting={starting}
          />
          {mode === "live" && !liveCapable && <PracticeLiveUnsupported />}
        </Stack>
        <Text size="sm" c="dimmed" mb="sm">
          {mode === "live"
            ? "テキスト／音声の通し練習はそのまま使えます。相手役とメーターは会話の下に固定するので、入力中でも見失いません。"
            : "相手役が連続で質問し、回答を深掘りします。最後に短いフィードバックが出ます。入力はテキストと音声を途中で切り替えられます。"}
        </Text>
        <Button
          variant="light"
          color={mode === "live" ? "teal" : "violet"}
          leftSection={
            mode === "live" ? <IconBroadcast size={16} /> : <IconPlayerPlay size={16} />
          }
          loading={starting}
          disabled={liveActive}
          onClick={handleStart}
        >
          {mode === "live"
            ? session || liveAuth
              ? "ライブ面談をやり直す"
              : "ライブ面談を開始"
            : session
              ? "通し練習をやり直す"
              : "通し練習を開始"}
        </Button>
      </Paper>

      {(session || liveMessages) && (
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <PracticeChatThread messages={displayMessages} />

            {strandedLive && (
              <Alert color="yellow" title="ライブ面談が途中です">
                接続は切れているので、テキストでは続きを書けません。「ライブ面談をやり直す」から再開してください。
              </Alert>
            )}
            {active && !liveActive && !strandedLive && (
              <>
                <Textarea
                  label="あなたの回答"
                  placeholder={
                    mode === "voice"
                      ? "マイクで話すか、ここに直してから回答する..."
                      : "面談で話すつもりで書いてください..."
                  }
                  rows={4}
                  maxLength={MAX_PRACTICE_MESSAGE_CHARS}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Group justify="flex-end">
                  <Button
                    leftSection={<IconSend size={16} />}
                    loading={sending}
                    onClick={handleReply}
                  >
                    回答する
                  </Button>
                </Group>
              </>
            )}

            {completed && feedback && (
              <>
                <Divider />
                <Text size="sm" fw={600}>
                  通しのフィードバック
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    具体性:{" "}
                  </Text>
                  {feedback.specificity}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    長さ・構成:{" "}
                  </Text>
                  {feedback.length}
                </Text>
                {feedback.weaknesses.length > 0 && (
                  <div>
                    <Text size="sm" fw={600} mb={4}>
                      改善点
                    </Text>
                    <List size="sm" spacing={4}>
                      {feedback.weaknesses.map((w, i) => (
                        <List.Item key={i}>{w}</List.Item>
                      ))}
                    </List>
                  </div>
                )}
                <Text size="sm" c="dimmed" fs="italic">
                  {feedback.summary}
                </Text>
              </>
            )}
          </Stack>
        </Paper>
      )}

      {mode === "live" && liveCapable && (
        <div
          style={
            liveActive
              ? {
                  position: "sticky",
                  bottom: 0,
                  zIndex: 5,
                  paddingTop: 8,
                  paddingBottom: 8,
                  background: "var(--mantine-color-body)",
                }
              : undefined
          }
        >
          {liveAuth ? (
            <PracticeLiveSession
              key={liveAuth.token}
              token={liveAuth.token}
              setup={liveAuth.setup}
              onMessages={setLiveMessages}
              onEnded={(messages) => {
                void handleLiveEnded(messages);
              }}
              onFailed={(message) => setError(message)}
            />
          ) : (
            <PracticeLivePresence stage="idle" level={0} />
          )}
        </div>
      )}

      <Divider label="1問だけの練習" labelPosition="left" />

      {questions.length > 0 ? (
        <InterviewRehearsalSection questions={questions} />
      ) : (
        <Text size="sm" c="dimmed">
          1問練習は、面談準備で想定質問を作ったあとに使えます。通し練習は対策パックだけでも開始できます。
        </Text>
      )}
    </Stack>
  );
}
