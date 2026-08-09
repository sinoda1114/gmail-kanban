"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TextInput,
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
import { createProject } from "@/app/dashboard/projects/actions";
import { extractProjectFromText } from "@/app/dashboard/projects/extract-action";
import { fetchGmailThread } from "@/app/dashboard/projects/gmail-action";
import { GmailFetchFields } from "@/components/projects/GmailFetchFields";
import { parseGmailInput } from "@/lib/gmail-url";
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

const MAX_GMAIL_INPUT_LENGTH = 500;

export function NewProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectLimitHit, setProjectLimitHit] = useState(false);
  const [aiResult, setAiResult] = useState<ProjectExtraction | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFetchGmail() {
    const input = form.gmailUrl.trim();
    if (!input) {
      const message = "Gmail URL またはスレッド ID を入力してください";
      setError(message);
      return;
    }
    if (input.length > MAX_GMAIL_INPUT_LENGTH) {
      const message = `入力が長すぎます（${MAX_GMAIL_INPUT_LENGTH}文字以内）`;
      setError(message);
      notifications.show({
        color: "red",
        title: "Gmail取得エラー",
        message,
      });
      return;
    }
    if (!parseGmailInput(input)) {
      const message =
        "Gmail の URL またはスレッド ID の形式が正しくありません";
      setError(message);
      notifications.show({
        color: "red",
        title: "Gmail取得エラー",
        message,
      });
      return;
    }
    setGmailLoading(true);
    setError(null);
    try {
      const result = await fetchGmailThread(input);
      if (!result.success) {
        setError(result.error);
        notifications.show({
          color: "red",
          title: "Gmail取得エラー",
          message: result.error,
        });
        return;
      }
      setForm((f) => ({
        ...f,
        gmailUrl: result.gmailUrl,
        sourceText: result.text,
      }));
      notifications.show({
        color: "teal",
        title: "Gmail取得完了",
        message: "スレッド本文をメール本文欄に反映しました",
      });
    } catch {
      const message =
        "Gmail 取得中にエラーが発生しました。しばらく待ってから再試行してください";
      setError(message);
      notifications.show({
        color: "red",
        title: "Gmail取得エラー",
        message,
      });
    } finally {
      setGmailLoading(false);
    }
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
    setProjectLimitHit(false);
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
        setProjectLimitHit(result.code === "project_limit");
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
            {projectLimitHit && (
              <Text size="sm" mt="xs">
                <Link href="/dashboard/billing" style={{ fontWeight: 600 }}>
                  課金・プラン画面で Pro にアップグレード
                </Link>
              </Text>
            )}
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

        <GmailFetchFields
          gmailInput={form.gmailUrl}
          sourceText={form.sourceText}
          onGmailInputChange={(value) => set("gmailUrl", value)}
          onSourceTextChange={(value) => set("sourceText", value)}
          onFetchGmail={handleFetchGmail}
          gmailLoading={gmailLoading}
          onAiExtract={handleAiExtract}
          aiLoading={aiLoading}
        />

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
