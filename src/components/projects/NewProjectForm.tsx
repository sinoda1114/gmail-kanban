"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInput, Textarea, Button, Stack, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createProject } from "@/app/dashboard/projects/actions";

export function NewProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = (formData.get("title") as string).trim();

    if (!title) {
      setError("案件タイトルは必須です");
      return;
    }

    setLoading(true);

    try {
      const result = await createProject({
        title,
        agentCompany: (formData.get("agentCompany") as string) || undefined,
        agentPerson: (formData.get("agentPerson") as string) || undefined,
        gmailUrl: (formData.get("gmailUrl") as string) || undefined,
        sourceText: (formData.get("sourceText") as string) || undefined,
        nextAction: (formData.get("nextAction") as string) || undefined,
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
      notifications.show({
        color: "red",
        title: "エラー",
        message,
      });
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

        <TextInput
          name="title"
          label="案件タイトル *"
          required
          placeholder="例: Reactエンジニア募集 - ○○社"
        />

        <TextInput
          name="agentCompany"
          label="エージェント会社名"
          placeholder="例: ○○エージェント"
        />

        <TextInput
          name="agentPerson"
          label="担当者名"
          placeholder="例: 田中様"
        />

        <TextInput
          name="gmailUrl"
          label="Gmail URL"
          placeholder="https://mail.google.com/mail/..."
        />

        <Textarea
          name="sourceText"
          label="メール本文"
          rows={8}
          placeholder="募集要項やメール本文をペースト"
        />

        <TextInput
          name="nextAction"
          label="次のアクション"
          placeholder="例: 職務経歴書を送付する"
        />

        <Button type="submit" loading={loading}>
          登録する
        </Button>
      </Stack>
    </form>
  );
}
