"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  Group,
  Text,
  Button,
  Paper,
  Title,
  Badge,
  Accordion,
  Alert,
  List,
  Anchor,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSparkles, IconArrowRight } from "@tabler/icons-react";
import type { Project } from "@/db/schema";
import type { InterviewResearchPack } from "@/types/interview-research";
import {
  QUESTION_CATEGORY_LABELS,
  QUESTION_CATEGORY_COLORS,
  REVERSE_CATEGORY_LABELS,
  EVIDENCE_BASIS_LABELS,
  type QuestionCategory,
  type ReverseQuestionCategory,
  type EvidenceBasis,
} from "@/types/interview-prep";
import { generateInterviewResearch } from "@/app/dashboard/projects/interview-research-action";
import { generateInterviewPrep } from "@/app/dashboard/projects/interview-prep-action";

interface InterviewResearchTabProps {
  project: Project;
  pack: InterviewResearchPack | null;
  sources: string[];
  updatedAt: string | null;
}

export function InterviewResearchTab({
  project,
  pack,
  sources,
  updatedAt,
}: InterviewResearchTabProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await generateInterviewResearch(project.id);
    setLoading(false);
    if (result.success) {
      router.refresh();
      notifications.show({
        color: "teal",
        title: "面談対策を作成しました",
        message: "企業パックと想定質問を保存しました。",
      });
    } else {
      setError(result.error ?? "AI処理に失敗しました");
    }
  }

  async function handleApplyToPrep() {
    setApplying(true);
    setError(null);
    const result = await generateInterviewPrep(project.id);
    setApplying(false);
    if (result.success) {
      notifications.show({
        color: "teal",
        title: "面談準備に反映しました",
        message: "対策パックを材料に、想定質問とチートシートを生成しました。",
      });
      router.push(`/dashboard/projects/${project.id}?tab=interview_prep`);
      router.refresh();
    } else {
      setError(result.error ?? "面談準備の生成に失敗しました");
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
        <Title order={5} mb="xs">
          面談対策
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          企業と募集要項を調べ、よくある面談・想定質問・逆質問・自己紹介の型を先に作ります。検索で裏付けられないことは推測と表示します。
        </Text>
        <Group>
          <Button
            variant="light"
            color="violet"
            leftSection={<IconSparkles size={16} />}
            loading={loading}
            onClick={handleGenerate}
          >
            {pack ? "AIで面談対策を再作成" : "AIで面談対策を作成"}
          </Button>
          {pack && (
            <Button
              variant="light"
              color="teal"
              rightSection={<IconArrowRight size={16} />}
              loading={applying}
              onClick={handleApplyToPrep}
            >
              この対策を面談準備に反映
            </Button>
          )}
        </Group>
        {updatedAt && (
          <Text size="xs" c="dimmed" mt="sm">
            更新: {new Date(updatedAt).toLocaleString("ja-JP")}
          </Text>
        )}
      </Paper>

      {!pack && (
        <Text size="sm" c="dimmed">
          まだ対策パックはありません。案件タイトルと本文を材料に作成できます。
        </Text>
      )}

      {pack && (
        <>
          <div>
            <Title order={5} mb="sm">
              企業パック
            </Title>
            <Paper withBorder p="md" radius="md">
              <Text size="xs" fw={600} c="dimmed" mb={4}>
                企業・クライアント
              </Text>
              <Text size="sm" mb="sm">
                {pack.companyPack.companyName || "（不明）"}
              </Text>
              <Text size="xs" fw={600} c="dimmed" mb={4}>
                想定ドメイン
              </Text>
              <Text size="sm" mb="md">
                {pack.companyPack.domain}
              </Text>
              {pack.companyPack.facts.length > 0 && (
                <Stack gap="xs" mb="md">
                  <Text size="xs" fw={600} c="dimmed">
                    事実・仮説
                  </Text>
                  {pack.companyPack.facts.map((fact, i) => (
                    <Group key={i} gap="xs" wrap="nowrap" align="flex-start">
                      <Badge
                        size="xs"
                        variant="light"
                        color={fact.basis === "evidence" ? "teal" : "gray"}
                      >
                        {EVIDENCE_BASIS_LABELS[fact.basis as EvidenceBasis]}
                      </Badge>
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text size="sm">{fact.text}</Text>
                        {fact.sourceHint && (
                          <Text size="xs" c="dimmed">
                            根拠: {fact.sourceHint}
                          </Text>
                        )}
                      </Stack>
                    </Group>
                  ))}
                </Stack>
              )}
              {pack.companyPack.talkingPoints.length > 0 && (
                <Stack gap={4} mb="md">
                  <Text size="xs" fw={600} c="dimmed">
                    話すべきトピック
                  </Text>
                  {pack.companyPack.talkingPoints.map((item, i) => (
                    <Text key={i} size="sm">
                      ・{item}
                    </Text>
                  ))}
                </Stack>
              )}
              {pack.companyPack.topicsToAvoid.length > 0 && (
                <Stack gap={4}>
                  <Text size="xs" fw={600} c="dimmed">
                    避ける話題
                  </Text>
                  {pack.companyPack.topicsToAvoid.map((item, i) => (
                    <Text key={i} size="sm" c="orange.7">
                      ・{item}
                    </Text>
                  ))}
                </Stack>
              )}
            </Paper>
          </div>

          {pack.likelyInterviews.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                この募集で起きやすい面談
              </Title>
              <Stack gap="sm">
                {pack.likelyInterviews.map((item, i) => (
                  <Paper key={i} withBorder p="sm" radius="md">
                    <Text size="sm" fw={600}>
                      {item.format}
                    </Text>
                    <Text size="sm" c="dimmed" mb="xs">
                      {item.why}
                    </Text>
                    {item.typicalFlow.length > 0 && (
                      <List size="sm" spacing={2}>
                        {item.typicalFlow.map((step, j) => (
                          <List.Item key={j}>{step}</List.Item>
                        ))}
                      </List>
                    )}
                  </Paper>
                ))}
              </Stack>
            </div>
          )}

          {pack.anticipatedQuestions.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                想定質問（STARヒント）
              </Title>
              <Accordion variant="separated">
                {pack.anticipatedQuestions.map((q, i) => (
                  <Accordion.Item key={`${q.question}-${i}`} value={`q-${i}`}>
                    <Accordion.Control>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="sm" fw={500} style={{ flex: 1 }}>
                          Q{i + 1}. {q.question}
                        </Text>
                        <Badge
                          size="xs"
                          variant="light"
                          color={
                            QUESTION_CATEGORY_COLORS[q.category as QuestionCategory] ??
                            "gray"
                          }
                        >
                          {QUESTION_CATEGORY_LABELS[q.category as QuestionCategory] ??
                            q.category}
                        </Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs">
                        <Text size="sm">{q.why}</Text>
                        <Paper withBorder p="sm" radius="sm" bg="gray.0">
                          <Text size="xs" fw={600} c="dimmed" mb={4}>
                            STARヒント
                          </Text>
                          <Text size="sm">{q.starHint}</Text>
                        </Paper>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          )}

          {pack.reverseQuestionTemplates.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                逆質問テンプレ
              </Title>
              <Stack gap="sm">
                {pack.reverseQuestionTemplates.map((q, i) => (
                  <Paper key={i} withBorder p="sm" radius="md">
                    <Group gap="xs" mb={4}>
                      <Badge size="xs" variant="light">
                        {REVERSE_CATEGORY_LABELS[q.category as ReverseQuestionCategory] ??
                          q.category}
                      </Badge>
                    </Group>
                    <Text size="sm" fw={500}>
                      {q.question}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {q.why}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            </div>
          )}

          {pack.frameworks.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                フレームワーク
              </Title>
              <Accordion variant="separated">
                {pack.frameworks.map((fw, i) => (
                  <Accordion.Item key={`${fw.title}-${i}`} value={`fw-${i}`}>
                    <Accordion.Control>
                      <Text size="sm" fw={500}>
                        {fw.title}
                      </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {fw.script}
                      </Text>
                      {fw.tips && (
                        <Text size="xs" c="dimmed" mt="xs">
                          {fw.tips}
                        </Text>
                      )}
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          )}

          {sources.length > 0 && (
            <div>
              <Title order={5} mb="sm">
                参照した公開情報
              </Title>
              <Stack gap={4}>
                {sources.map((url) => (
                  <Anchor key={url} href={url} target="_blank" size="sm">
                    {url}
                  </Anchor>
                ))}
              </Stack>
            </div>
          )}
        </>
      )}
    </Stack>
  );
}
