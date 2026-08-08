"use client";

import { AppShell } from "@mantine/core";
import { AppHeader } from "@/components/layout/AppHeader";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
