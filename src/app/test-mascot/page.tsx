import { EmptyState } from "@/components/mascot/EmptyState";
import { Container, Stack, Title, Text, Paper } from "@mantine/core";

export default function MascotTestPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Title order={2}>カンちゃんマスコット - テストページ</Title>
            <Text size="sm" c="dimmed">
              このページでは、新しいマスコットキャラクター「カンちゃん」の動作を確認できます。
            </Text>
          </Stack>
        </Paper>

        <EmptyState />
      </Stack>
    </Container>
  );
}
