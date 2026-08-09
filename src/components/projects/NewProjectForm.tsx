"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextInput,
  Textarea,
  Button,
  Stack,
  Alert,
  Group,
  Text,
  Paper,
  TagsInput,
  Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSparkles } from "@tabler/icons-react";
import { createProject } from "@/app/dashboard/projects/actions";
import { extractProjectFromText } from "@/app/dashboard/projects/extract-action";
import type { ProjectExtraction } from "@/types/ai";
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  isProjectStatus,
  type ProjectStatus,
} from "@/types/project";

type FormState = {
  title: string;
  agentCompany: string;
  agentPerson: string;
  gmailUrl: string;
  sourceText: string;
  nextAction: string;
  summary: string;
  price: string;
  workRate: string;
  location: string;
  remoteType: string;
  techStack: string[];
  startDateText: string;
  contractPeriod: string;
  status: ProjectStatus;
};

const initialForm: FormState = {
  title: "",
  agentCompany: "",
  agentPerson: "",
  gmailUrl: "",
  sourceText: "",
  nextAction: "",
  summary: "",
  price: "",
  workRate: "",
  location: "",
  remoteType: "",
  techStack: [],
  startDateText: "",
  contractPeriod: "",
  status: "reply_required",
};

export function NewProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<ProjectExtraction | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAiExtract() {
    if (!form.sourceText.trim()) {
      setError("メール本文を入力してからAI整理を実行してください");
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const result = await extractProjectFromText(form.sourceText);
      if (!result.success || !result.data) {
        setError(result.error ?? "AI処理に失敗しました");
        return;
      }
      const d = result.data;
      setAiResult(d);
      const suggestedStatus =
        d.suggestedStatus && isProjectStatus(d.suggestedStatus)
          ? d.suggestedStatus
          : undefined;
      setForm((f) => ({
        ...f,
        title: d.title || f.title,
        agentCompany: d.agentCompany || f.agentCompany,
        agentPerson: d.agentPerson || f.agentPerson,
        nextAction: d.suggestedNextAction || f.nextAction,
        summary: d.summary || f.summary,
        price: d.price || f.price,
        workRate: d.workRate || f.workRate,
        location: d.location || f.location,
        remoteType: d.remoteType || f.remoteType,
        techStack: d.techStack && d.techStack.length > 0 ? d.techStack : f.techStack,
        startDateText: d.startDateText || f.startDateText,
        contractPeriod: d.contractPeriod || f.contractPeriod,
        status: suggestedStatus ?? f.status,
      }));
      notifications.show({
        color: "teal",
        title: "AI整理完了",
        message: "メール本文から案件情報を抽出しました。内容を確認して登録してください。",
      });
    } catch {
      setError("AI処理中にエラーが発生しました");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("案件タイトルは必須です");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createProject({
        title: form.title,
        agentCompany: form.agentCompany || undefined,
        agentPerson: form.agentPerson || undefined,
        gmailUrl: form.gmailUrl || undefined,
        sourceText: form.sourceText || undefined,
        nextAction: form.nextAction || undefined,
        summary: form.summary || undefined,
        price: form.price || undefined,
        workRate: form.workRate || undefined,
        location: form.location || undefined,
        remoteType: form.remoteType || undefined,
        techStack: form.techStack.length > 0 ? form.techStack : undefined,
        startDateText: form.startDateText || undefined,
        contractPeriod: form.contractPeriod || undefined,
        status: form.status,
      });
      if (!result.success) {
        setError(result.error ?? "登録に失敗しました");
        notifications.show({
          color: "red",
          title: "登録エラー",
          message: result.error ?? "登録に失敗しました",
        });
        return;
      }
      router.push(`/dashboard/projects/${result.projectId}`);
    } catch {
      const message = "予期しないエラーが発生しました";
      setError(message);
      notifications.show({ color: "red", title: "エラー", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {error !== null && (
          <Alert color="red" title="エラー">
            {error}
          </Alert>
        )}

        {aiResult?.concerns && aiResult.concerns.length > 0 && (
          <Paper
            withBorder
            p="sm"
            radius="md"
            style={{ borderColor: "var(--mantine-color-yellow-5)" }}
          >
            <Text size="sm" fw={600} mb="xs" c="yellow.7">
              AI が検出した確認事項
            </Text>
            <Stack gap={4}>
              {aiResult.concerns.map((c, i) => (
                <Text key={i} size="sm">
                  ・{c}
                </Text>
              ))}
            </Stack>
          </Paper>
        )}

        <TextInput
          label="案件タイトル *"
          required
          placeholder="例: Reactエンジニア募集 - ○○社"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />

        <TextInput
          label="エージェント会社名"
          placeholder="例: ○○エージェント"
          value={form.agentCompany}
          onChange={(e) => set("agentCompany", e.target.value)}
        />

        <TextInput
          label="担当者名"
          placeholder="例: 田中様"
          value={form.agentPerson}
          onChange={(e) => set("agentPerson", e.target.value)}
        />

        <TextInput
          label="Gmail URL"
          placeholder="https://mail.google.com/mail/..."
          value={form.gmailUrl}
          onChange={(e) => set("gmailUrl", e.target.value)}
        />

        <div>
          <Textarea
            label="メール本文"
            rows={8}
            placeholder="募集要項やメール本文をペーストして「AIで整理する」を押すと各フィールドに自動入力されます"
            value={form.sourceText}
            onChange={(e) => set("sourceText", e.target.value)}
          />
          <Group mt="xs" justify="flex-end">
            <Button
              variant="light"
              color="violet"
              leftSection={<IconSparkles size={16} />}
              loading={aiLoading}
              onClick={handleAiExtract}
              type="button"
            >
              AIで整理する
            </Button>
          </Group>
        </div>

        {aiResult && (
          <>
            <TextInput
              label="サマリー"
              placeholder="案件の概要"
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
            />
            <Group grow>
              <TextInput
                label="単価"
                placeholder="例: 90万円"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
              <TextInput
                label="稼働率"
                placeholder="例: 週5日"
                value={form.workRate}
                onChange={(e) => set("workRate", e.target.value)}
              />
            </Group>
            <Group grow>
              <TextInput
                label="勤務地"
                placeholder="例: フルリモート"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
              <TextInput
                label="開始時期"
                placeholder="例: 即日"
                value={form.startDateText}
                onChange={(e) => set("startDateText", e.target.value)}
              />
            </Group>
            <TextInput
              label="契約期間"
              placeholder="例: 3ヶ月更新"
              value={form.contractPeriod}
              onChange={(e) => set("contractPeriod", e.target.value)}
            />
            <TagsInput
              label="技術スタック"
              splitChars={[",", " ", "、"]}
              placeholder="タグを入力してEnter"
              value={form.techStack}
              onChange={(v) => set("techStack", v)}
            />
            <Select
              label="ステータス"
              description={
                aiResult.suggestedStatus
                  ? `AI推奨: ${STATUS_LABELS[aiResult.suggestedStatus]}`
                  : undefined
              }
              data={PROJECT_STATUSES.map((s) => ({
                value: s,
                label: STATUS_LABELS[s],
              }))}
              value={form.status}
              onChange={(v) => {
                if (v !== null && isProjectStatus(v)) {
                  set("status", v);
                }
              }}
            />
          </>
        )}

        <TextInput
          label="次のアクション"
          placeholder="例: 職務経歴書を送付する"
          value={form.nextAction}
          onChange={(e) => set("nextAction", e.target.value)}
        />

        <Button type="submit" loading={loading}>
          登録する
        </Button>
      </Stack>
    </form>
  );
}
