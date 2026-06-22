import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell, Container, Title, Group, Button, Text } from "@mantine/core";
import { IconPlus, IconBell } from "@tabler/icons-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { AppHeader } from "@/components/layout/AppHeader";
import { db } from "@/db/client";
import { projects, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (!user) {
    redirect("/onboarding");
  }

  const projectList = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
  });

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl" py="md">
          <Group justify="space-between" mb="xl">
            <Title order={2}>案件カンバン</Title>
            <Group>
              <Button
                variant="subtle"
                leftSection={<IconBell size={16} />}
                component="a"
                href="/dashboard/alerts"
              >
                要対応
              </Button>
              <Button
                leftSection={<IconPlus size={16} />}
                component="a"
                href="/dashboard/projects/new"
              >
                案件登録
              </Button>
            </Group>
          </Group>
          {projectList.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              案件がまだありません。「案件登録」から追加してください。
            </Text>
          ) : (
            <KanbanBoard projects={projectList} />
          )}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
