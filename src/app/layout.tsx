import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "Gmail Kanban",
  description: "Gmailの案件をカンバンで管理するタスク管理アプリ",
  openGraph: {
    title: "Gmail Kanban",
    description: "Gmailの案件をカンバンで管理するタスク管理アプリ",
    type: "website",
    locale: "ja_JP",
    siteName: "Gmail Kanban",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gmail Kanban",
    description: "Gmailの案件をカンバンで管理するタスク管理アプリ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ja" suppressHydrationWarning>
        <head>
          <ColorSchemeScript />
        </head>
        <body>
          <MantineProvider>
            <Notifications />
            {children}
          </MantineProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
