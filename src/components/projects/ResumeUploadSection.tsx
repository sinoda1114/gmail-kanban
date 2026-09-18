"use client";

import { useState } from "react";
import {
  Stack,
  Group,
  Text,
  Button,
  Paper,
  Title,
  FileButton,
  Alert,
  List,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconUpload, IconFileTypePdf } from "@tabler/icons-react";
import { uploadAndAnalyzeResume, getResumeAnalysis } from "@/app/dashboard/projects/resume-upload-action";
import type { ResumeAnalysis } from "@/types/resume-analysis";

interface ResumeUploadSectionProps {
  onAnalysisComplete?: (analysis: ResumeAnalysis) => void;
}

export function ResumeUploadSection({
  onAnalysisComplete,
}: ResumeUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFileUpload(file: File | null) {
    if (!file) return;

    setUploading(true);
    setFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          notifications.show({
            color: "red",
            message: "ファイルの読み込みに失敗しました",
          });
          setUploading(false);
          return;
        }

        const result = await uploadAndAnalyzeResume(
          file.name,
          file.type,
          file.size,
          dataUrl
        );

        if (result.success) {
          const analysisResult = await getResumeAnalysis(result.uploadId);

          setUploading(false);

          if (analysisResult.success) {
            setAnalysis(analysisResult.analysis);
            onAnalysisComplete?.(analysisResult.analysis);
            notifications.show({
              color: "teal",
              title: "分析完了",
              message: "履歴書・キャリアシートの分析が完了しました",
            });
          } else {
            notifications.show({
              color: "red",
              title: "分析失敗",
              message: analysisResult.error,
            });
          }
        } else {
          setUploading(false);
          notifications.show({
            color: "red",
            title: "アップロード失敗",
            message: result.error,
          });
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File upload error:", error);
      notifications.show({
        color: "red",
        message: "ファイルのアップロードに失敗しました",
      });
      setUploading(false);
    }
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <div>
            <Title order={5}>履歴書・キャリアシート分析</Title>
            <Text size="sm" c="dimmed">
              PDF・画像をアップロードして経歴を自動抽出
            </Text>
          </div>
          <FileButton
            onChange={handleFileUpload}
            accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
          >
            {(props) => (
              <Button
                {...props}
                leftSection={<IconUpload size={16} />}
                variant="light"
                loading={uploading}
              >
                アップロード
              </Button>
            )}
          </FileButton>
        </Group>

        {fileName && (
          <Alert color="blue" title="アップロード済み" icon={<IconFileTypePdf />}>
            {fileName}
          </Alert>
        )}

        {analysis && (
          <Stack gap="md">
            <div>
              <Text size="xs" fw={600} c="dimmed" mb={4}>
                経歴サマリー
              </Text>
              <Text size="sm">{analysis.summary}</Text>
            </div>

            {analysis.strengths.length > 0 && (
              <div>
                <Text size="xs" fw={600} c="dimmed" mb={4}>
                  強み・アピールポイント
                </Text>
                <List size="sm" spacing={2}>
                  {analysis.strengths.map((item, i) => (
                    <List.Item key={i}>{item}</List.Item>
                  ))}
                </List>
              </div>
            )}

            {analysis.skills.length > 0 && (
              <div>
                <Text size="xs" fw={600} c="dimmed" mb={4}>
                  スキル・技術
                </Text>
                <Group gap="xs">
                  {analysis.skills.map((skill, i) => (
                    <Text key={i} size="xs" c="dimmed">
                      {skill}
                      {i < analysis.skills.length - 1 ? "," : ""}
                    </Text>
                  ))}
                </Group>
              </div>
            )}

            {analysis.careerHistory.length > 0 && (
              <div>
                <Text size="xs" fw={600} c="dimmed" mb={4}>
                  職歴ハイライト
                </Text>
                <List size="sm" spacing={2}>
                  {analysis.careerHistory.map((item, i) => (
                    <List.Item key={i}>{item}</List.Item>
                  ))}
                </List>
              </div>
            )}

            {analysis.likelyQuestions.length > 0 && (
              <div>
                <Text size="xs" fw={600} c="dimmed" mb={4}>
                  聞かれそうな質問
                </Text>
                <List size="sm" spacing={2}>
                  {analysis.likelyQuestions.map((q, i) => (
                    <List.Item key={i}>{q}</List.Item>
                  ))}
                </List>
              </div>
            )}
          </Stack>
        )}

        <Alert color="gray" title="対応形式">
          <Text size="sm">PDF, JPEG, PNG, WebP（最大10MB）</Text>
        </Alert>
      </Stack>
    </Paper>
  );
}
