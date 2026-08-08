import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Container, Title, Group, Button } from "@mantine/core";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { NewProjectForm } from "@/components/projects/NewProjectForm";

export default async function NewProjectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return (
    <DashboardShell>
      <Container size="md" py="xl">
        <Group mb="xl">
          <Title order={2}>案件登録</Title>
          <Button variant="subtle" component="a" href="/dashboard">
            キャンセル
          </Button>
        </Group>
        <NewProjectForm />
      </Container>
    </DashboardShell>
  );
}
