"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Group,
  Text,
  Button,
  TextInput,
  Textarea,
  Select,
  Badge,
  Paper,
  Checkbox,
  Accordion,
  Alert,
  Divider,
  Title,
  Anchor,
  List,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSparkles, IconCalendar, IconCopy } from "@tabler/icons-react";
import type {
  Project,
  InterviewPreparation,
  InterviewQuestion,
  InterviewAnswer,
  InterviewReverseQuestion,
} from "@/db/schema";
import {
  QUESTION_CATEGORY_LABELS,
  QUESTION_CATEGORY_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  REVERSE_CATEGORY_LABELS,
  INTERVIEW_PARTNER_LABELS,
  EVIDENCE_BASIS_LABELS,
  RED_FLAG_SEVERITY_LABELS,
  RED_FLAG_SEVERITY_COLORS,
  RED_FLAG_CATEGORY_LABELS,
  type QuestionCategory,
  type Priority,
  type ReverseQuestionCategory,
  type InterviewPartnerValue,
  type EvidenceBasis,
  type RedFlagSeverity,
  type RedFlagCategory,
} from "@/types/interview-prep";
import {
  saveInterviewInfo,
  generateInterviewPrep,
  updateInterviewAnswer,
  toggleReverseQuestionChecked,
} from "@/app/dashboard/projects/interview-prep-action";
import { createCalendarEvent } from "@/app/dashboard/projects/calendar-action";
import {
  resolveInterviewPartner,
  serializeInterviewPartner,
} from "@/lib/interview-prep-prompt";
import { formatCheatSheetForCopy } from "@/lib/interview-prep-format";

interface QuestionWithAnswer extends InterviewQuestion {
  answer: InterviewAnswer | null;
}

interface InterviewPrepTabProps {
  project: Project;
  prep: InterviewPreparation | null;
  questions: QuestionWithAnswer[];
  reverseQuestions: InterviewReverseQuestion[];
  calendarUrl: string | null;
}

type InfoForm = {
  interviewAt: string;
  interviewUrl: string;
  interviewType: string;
  partnerValue: InterviewPartnerValue;
  partnerCustom: string;
};

const PARTNER_SELECT_DATA = Object.entries(INTERVIEW_PARTNER_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function InterviewPrepTab({
  project,
  prep,
  questions: initialQuestions,
  reverseQuestions: initialReverseQs,
  calendarUrl,
}: InterviewPrepTabProps) {
  const router = useRouter();
  const initialPartner = resolveInterviewPartner(prep?.interviewPartner);
  const [addingCalendar, setAddingCalendar] = useState(false);
  const [infoForm, setInfoForm] = useState<InfoForm>({
    interviewAt: prep?.interviewAt ?? "",
    interviewUrl: prep?.interviewUrl ?? "",
    interviewType: prep?.interviewType ?? "online",
    partnerValue: initialPartner.value,
    partnerCustom: initialPartner.customLabel,
  });
  const [infoSaving, setInfoSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      initialQuestions.map((q) => [q.id, q.answer?.userAnswer ?? ""])
    )
  );
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(initialReverseQs.filter((rq) => rq.checked).map((rq) => rq.id))
  );

  const hasGenerated = initialQuestions.length > 0;
  const techStack = Array.isArray(project.techStack) ? project.techStack : [];
  const companyBrief = prep?.companyBrief;
  const techDeepDive = prep?.techDeepDive ?? [];
  const redFlags = prep?.redFlags ?? [];
  const cheatSheet = prep?.cheatSheet;

  function buildSaveInput() {
    return {
      interviewAt: infoForm.interviewAt,
      interviewUrl: infoForm.interviewUrl,
      interviewType: infoForm.interviewType,
      interviewPartner: serializeInterviewPartner(
        infoForm.partnerValue,
        infoForm.partnerCustom
      ),
    };
  }

  async function handleSaveInfo() {
    setInfoSaving(true);
    const result = await saveInterviewInfo(project.id, buildSaveInput());
    setInfoSaving(false);
    if (result.success) {
      notifications.show({ color: "green", message: "面談情報を保存しました" });
    } else {
      notifications.show({
        color: "red",
        message: result.error ?? "保存に失敗しました",
      });
    }
  }

  async function handleAddToCalendar() {
    setAddingCalendar(true);
    const result = await createCalendarEvent(project.id);
    setAddingCalendar(false);
    if (result.success) {
      notifications.show({ color: "green", message: "カレンダーに追加しました" });
      router.refresh();
    } else {
      notifications.show({ color: "red", message: result.error ?? "カレンダー登録に失敗しました" });
    }
  }

  async function handleGenerate() {
    setAiLoading(true);
    setError(null);
    const saveResult = await saveInterviewInfo(project.id, buildSaveInput());
    if (!saveResult.success) {
      setError(saveResult.error ?? "面談情報の保存に失敗しました");
      setAiLoading(false);
      return;
    }
    const result = await generateInterviewPrep(project.id);
    setAiLoading(false);
    if (result.success) {
      router.refresh();
      notifications.show({
        color: "teal",
        title: "AI面談準備完了",
        message:
          "想定質問・逆質問・企業ブリーフ・技術深掘り・レッドフラグ・チートシートを生成しました。",
      });
    } else {
      setError(result.error ?? "AI処理に失敗しました");
    }
  }

  async function handleCopyCheatSheet() {
    if (!cheatSheet) return;
    try {
      await navigator.clipboard.writeText(formatCheatSheetForCopy(cheatSheet));
      notifications.show({ color: "green", message: "チートシートをコピーしました" });
    } catch {
      notifications.show({ color: "red", message: "コピーに失敗しました" });
    }
  }

  async function handleSaveAnswer(questionId: string) {
    setSavingAnswerId(questionId);
    const result = await updateInterviewAnswer(questionId, userAnswers[questionId] ?? "");
    setSavingAnswerId(null);
    if (!result.success) {
      notifications.show({ color: "red", message: result.error ?? "保存に失敗しました" });
    } else {
      notifications.show({ color: "green", message: "回答を保存しました" });
    }
  }

  async function handleToggleReverse(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    const result = await toggleReverseQuestionChecked(id);
    if (!result.success) {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }

  const reverseByCategory = REVERSE_CATEGORY_LABELS
    ? (Object.keys(REVERSE_CATEGORY_LABELS) as ReverseQuestionCategory[]).reduce(
        (acc, cat) => {
          acc[cat] = initialReverseQs.filter((rq) => rq.category === cat);
          return acc;
        },
        {} as Record<ReverseQuestionCategory, InterviewReverseQuestion[]>
      )
    : ({} as Record<ReverseQuestionCategory, InterviewReverseQuestion[]>);

  return (
    <Stack gap="md" p="md">
      {error && (
        <Alert color="red" title="エラー">
          {error}
        </Alert>
      )}

      {/* 面談情報 */}
      <Paper withBorder p="md" radius="md">
        <Title order={5} mb="sm">
          面談情報
        </Title>
        <Stack gap="sm">
          <TextInput
            label="面談日時"
            placeholder="例: 2026-07-01 14:00"
            value={infoForm.interviewAt}
            onChange={(e) =>
              setInfoForm((f) => ({ ...f, interviewAt: e.target.value }))
            }
          />
          <TextInput
            label="面談URL"
            placeholder="https://meet.google.com/..."
            value={infoForm.interviewUrl}
            onChange={(e) =>
              setInfoForm((f) => ({ ...f, interviewUrl: e.target.value }))
            }
          />
          <Select
            label="面談形式"
            data={[
              { value: "online", label: "オンライン" },
              { value: "onsite", label: "対面" },
            ]}
            value={infoForm.interviewType}
            onChange={(v) =>
              setInfoForm((f) => ({ ...f, interviewType: v ?? "online" }))
            }
          />
          <Select
            label="面談相手"
            description="AI生成の比重に影響します（未設定時はバランス重視）"
            data={PARTNER_SELECT_DATA}
            value={infoForm.partnerValue}
            onChange={(v) =>
              setInfoForm((f) => ({
                ...f,
                partnerValue: (v as InterviewPartnerValue) ?? "general",
              }))
            }
          />
          {infoForm.partnerValue === "custom" && (
            <TextInput
              label="面談相手（自由入力）"
              placeholder="例: 事業部マネージャー"
              value={infoForm.partnerCustom}
              onChange={(e) =>
                setInfoForm((f) => ({ ...f, partnerCustom: e.target.value }))
              }
            />
          )}
          <Group justify="flex-end">
            <Button
              variant="default"
              size="sm"
              loading={infoSaving}
              onClick={handleSaveInfo}
            >
              保存
            </Button>
          </Group>
          <Group>
            <Button
              variant="light"
              leftSection={<IconCalendar size={16} />}
              loading={addingCalendar}
              onClick={handleAddToCalendar}
              disabled={!prep?.interviewAt}
            >
              {calendarUrl ? "カレンダー再登録" : "カレンダーに追加"}
            </Button>
            {calendarUrl && (
              <Anchor href={calendarUrl} target="_blank" size="sm">
                Google カレンダーで確認
              </Anchor>
            )}
          </Group>
        </Stack>
      </Paper>

      {/* AI生成ボタン */}
      <Button
        variant="light"
        color="violet"
        leftSection={<IconSparkles size={16} />}
        loading={aiLoading}
        onClick={handleGenerate}
        fullWidth
      >
        {hasGenerated
          ? "AIで面談準備を再生成（拡張含む）"
          : "AIで面談準備を一括作成"}
      </Button>

      {hasGenerated && (
        <>
          <Divider />

          {cheatSheet && (
            <div>
              <Group justify="space-between" mb="sm">
                <Title order={5}>面談当日チートシート</Title>
                <Button size="xs" variant="light" leftSection={<IconCopy size={14} />} onClick={handleCopyCheatSheet}>
                  コピー
                </Button>
              </Group>
              <Paper withBorder p="md" radius="md" style={{ borderColor: "var(--mantine-color-teal-4)" }}>
                <Text size="sm" fw={600} mb="xs">{cheatSheet.summary}</Text>
                {cheatSheet.keyExperiences.length > 0 && (
                  <Stack gap={4} mb="sm">
                    <Text size="xs" fw={600} c="dimmed">強調する経験</Text>
                    {cheatSheet.keyExperiences.map((item, i) => <Text key={i} size="sm">・{item}</Text>)}
                  </Stack>
                )}
                {cheatSheet.numbers && cheatSheet.numbers.length > 0 && (
                  <Stack gap={4} mb="sm">
                    <Text size="xs" fw={600} c="dimmed">覚える数字</Text>
                    {cheatSheet.numbers.map((item, i) => <Text key={i} size="sm">・{item}</Text>)}
                  </Stack>
                )}
                {cheatSheet.topReverseQuestions.length > 0 && (
                  <Stack gap={4} mb="sm">
                    <Text size="xs" fw={600} c="dimmed">優先逆質問</Text>
                    {cheatSheet.topReverseQuestions.map((item, i) => <Text key={i} size="sm">・{item}</Text>)}
                  </Stack>
                )}
                {cheatSheet.dontTouchPoints.length > 0 && (
                  <Stack gap={4}>
                    <Text size="xs" fw={600} c="dimmed">触れないポイント</Text>
                    {cheatSheet.dontTouchPoints.map((item, i) => <Text key={i} size="sm">・{item}</Text>)}
                  </Stack>
                )}
              </Paper>
            </div>
          )}

          {companyBrief && (
            <div>
              <Title order={5} mb="sm">企業・クライアントブリーフ</Title>
              <Paper withBorder p="md" radius="md">
                <Text size="xs" fw={600} c="dimmed" mb={4}>想定ドメイン</Text>
                <Text size="sm" mb="md">{companyBrief.domain}</Text>
                {companyBrief.hypotheses.length > 0 && (
                  <Stack gap="xs" mb="md">
                    <Text size="xs" fw={600} c="dimmed">企業・案件仮説</Text>
                    {companyBrief.hypotheses.map((h, i) => (
                      <Group key={i} gap="xs" wrap="nowrap" align="flex-start">
                        <Badge size="xs" variant="light" color={h.basis === "evidence" ? "teal" : "gray"}>
                          {EVIDENCE_BASIS_LABELS[h.basis as EvidenceBasis]}
                        </Badge>
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Text size="sm">{h.text}</Text>
                          {h.sourceHint && <Text size="xs" c="dimmed">根拠: {h.sourceHint}</Text>}
                        </Stack>
                      </Group>
                    ))}
                  </Stack>
                )}
                {companyBrief.talkingPoints.length > 0 && (
                  <Stack gap={4} mb="md">
                    <Text size="xs" fw={600} c="dimmed">話すべきトピック</Text>
                    {companyBrief.talkingPoints.map((item, i) => <Text key={i} size="sm">・{item}</Text>)}
                  </Stack>
                )}
                {companyBrief.topicsToAvoid.length > 0 && (
                  <Stack gap={4}>
                    <Text size="xs" fw={600} c="dimmed">避ける話題</Text>
                    {companyBrief.topicsToAvoid.map((item, i) => <Text key={i} size="sm" c="orange.7">・{item}</Text>)}
                  </Stack>
                )}
              </Paper>
            </div>
          )}

          <div>
            <Title order={5} mb="sm">技術スタック深掘り</Title>
            {techStack.length === 0 ? (
              <Paper withBorder p="md" radius="md">
                <Text size="sm" c="dimmed">案件に技術スタックが登録されていません。案件情報を更新してから再生成してください。</Text>
              </Paper>
            ) : techDeepDive.length === 0 ? (
              <Paper withBorder p="md" radius="md">
                <Text size="sm" c="dimmed">技術深掘りはまだ生成されていません。上の「再生成」ボタンで作成できます。</Text>
              </Paper>
            ) : (
              <Accordion variant="separated">
                {techDeepDive.map((item, i) => (
                  <Accordion.Item key={`${item.tech}-${i}`} value={`tech-${i}`}>
                    <Accordion.Control><Text size="sm" fw={500}>{item.tech}</Text></Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="sm">
                        {item.deepDiveTopics.length > 0 && (
                          <div>
                            <Text size="xs" fw={600} c="dimmed" mb={4}>深掘りされそうなトピック</Text>
                            <List size="sm" spacing={2}>
                              {item.deepDiveTopics.map((topic, j) => <List.Item key={j}>{topic}</List.Item>)}
                            </List>
                          </div>
                        )}
                        <div>
                          <Text size="xs" fw={600} c="dimmed" mb={4}>経験との接続</Text>
                          <Text size="sm">{item.experienceConnection}</Text>
                        </div>
                        {item.phrasesToAvoid.length > 0 && (
                          <div>
                            <Text size="xs" fw={600} c="dimmed" mb={4}>避ける言い回し</Text>
                            {item.phrasesToAvoid.map((phrase, j) => <Text key={j} size="sm" c="orange.7">・{phrase}</Text>)}
                          </div>
                        )}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </div>

          {redFlags.length > 0 && (
            <div>
              <Title order={5} mb="sm">レッドフラグ（判断・確認）</Title>
              <Stack gap="sm">
                {redFlags.map((rf, i) => (
                  <Paper key={i} withBorder p="sm" radius="md" style={{ borderColor: rf.severity === "high" ? "var(--mantine-color-red-4)" : undefined }}>
                    <Group gap="xs" mb="xs">
                      <Badge size="xs" color={RED_FLAG_SEVERITY_COLORS[rf.severity as RedFlagSeverity]}>
                        {RED_FLAG_SEVERITY_LABELS[rf.severity as RedFlagSeverity]}
                      </Badge>
                      <Badge size="xs" variant="light">{RED_FLAG_CATEGORY_LABELS[rf.category as RedFlagCategory]}</Badge>
                    </Group>
                    <Text size="sm" fw={500} mb={4}>{rf.flag}</Text>
                    <Text size="xs" c="dimmed">確認質問: {rf.confirmationQuestion}</Text>
                  </Paper>
                ))}
              </Stack>
            </div>
          )}

          {/* 想定質問 */}
          <div>
            <Title order={5} mb="sm">
              想定質問 ({initialQuestions.length}件)
            </Title>
            <Accordion variant="separated">
              {initialQuestions.map((q, i) => (
                <Accordion.Item key={q.id} value={q.id}>
                  <Accordion.Control>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={500} style={{ flex: 1 }}>
                        Q{i + 1}. {q.question}
                      </Text>
                      <Badge
                        size="xs"
                        variant="light"
                        color={
                          QUESTION_CATEGORY_COLORS[
                            q.category as QuestionCategory
                          ] ?? "gray"
                        }
                      >
                        {QUESTION_CATEGORY_LABELS[
                          q.category as QuestionCategory
                        ] ?? q.category}
                      </Badge>
                      <Badge
                        size="xs"
                        variant="dot"
                        color={
                          PRIORITY_COLORS[q.priority as Priority] ?? "gray"
                        }
                      >
                        {PRIORITY_LABELS[q.priority as Priority] ?? q.priority}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      {q.answer?.aiAnswer && (
                        <Paper
                          withBorder
                          p="sm"
                          radius="sm"
                          style={{ borderColor: "var(--mantine-color-violet-3)" }}
                        >
                          <Text size="xs" c="violet.6" fw={600} mb={4}>
                            AI回答案
                          </Text>
                          <Text size="sm">{q.answer.aiAnswer}</Text>
                        </Paper>
                      )}
                      <Textarea
                        label="自分の回答"
                        placeholder="自分用の回答をメモ..."
                        rows={3}
                        value={userAnswers[q.id] ?? ""}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                      />
                      <Group justify="flex-end">
                        <Button
                          size="xs"
                          variant="default"
                          loading={savingAnswerId === q.id}
                          onClick={() => handleSaveAnswer(q.id)}
                        >
                          保存
                        </Button>
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>

          {/* 逆質問 */}
          {initialReverseQs.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                逆質問
              </Title>
              <Stack gap="sm">
                {(
                  Object.keys(REVERSE_CATEGORY_LABELS) as ReverseQuestionCategory[]
                )
                  .filter((cat) => (reverseByCategory[cat] ?? []).length > 0)
                  .map((cat) => (
                    <Paper key={cat} withBorder p="sm" radius="md">
                      <Text size="xs" fw={600} c="dimmed" mb="xs">
                        {REVERSE_CATEGORY_LABELS[cat]}
                      </Text>
                      <Stack gap="xs">
                        {(reverseByCategory[cat] ?? []).map((rq) => (
                          <Checkbox
                            key={rq.id}
                            label={rq.question}
                            checked={checkedIds.has(rq.id)}
                            onChange={() => handleToggleReverse(rq.id)}
                          />
                        ))}
                      </Stack>
                    </Paper>
                  ))}
              </Stack>
            </div>
          )}

          {/* 面談戦略 */}
          {prep?.strategy && (
            <div>
              <Title order={5} mb="sm">
                面談戦略
              </Title>
              <Paper withBorder p="md" radius="md">
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {prep.strategy}
                </Text>
              </Paper>
            </div>
          )}

          {/* 懸念点 */}
          {prep?.concerns && prep.concerns.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                懸念点・確認事項
              </Title>
              <Paper
                withBorder
                p="sm"
                radius="md"
                style={{ borderColor: "var(--mantine-color-yellow-5)" }}
              >
                <Stack gap={4}>
                  {prep.concerns.map((c, i) => (
                    <Text key={i} size="sm">
                      ・{c}
                    </Text>
                  ))}
                </Stack>
              </Paper>
            </div>
          )}

          {/* チェックリスト */}
          {prep?.checklist && prep.checklist.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                面談前チェックリスト
              </Title>
              <Paper withBorder p="sm" radius="md">
                <Stack gap="xs">
                  {prep.checklist.map((item, i) => (
                    <Text key={i} size="sm">
                      ☐ {item}
                    </Text>
                  ))}
                </Stack>
              </Paper>
            </div>
          )}
        </>
      )}
    </Stack>
  );
}
