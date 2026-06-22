import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell, Container, Title, Group, Button } from "@mantine/core";
import { AppHeader } from "@/components/layout/AppHeader";
import { NewProjectForm } from "@/components/projects/NewProjectForm";

export default async function NewProjectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>
        <Container size="md" py="xl">
          <Group mb="xl">
            <Title order={2}>案件登録</Title>
            <Button variant="subtle" component="a" href="/dashboard">
              キャンセル
            </Button>
          </Group>
          <NewProjectForm />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
