"use client";

import { useEffect, useRef } from "react";
import { Box, Stack, Text } from "@mantine/core";
import type { PracticeMessage } from "@/types/interview-practice";

interface PracticeChatThreadProps {
  messages: PracticeMessage[];
}

export function PracticeChatThread({ messages }: PracticeChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  return (
    <Box
      aria-label="会話"
      style={{
        maxHeight: 360,
        overflowY: "auto",
        padding: "4px 2px",
      }}
    >
      <Stack gap={8}>
        {messages.map((m, i) => {
          const mine = m.role === "candidate";
          return (
            <div
              key={`${m.role}-${i}`}
              style={{
                display: "flex",
                justifyContent: mine ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "8px 12px",
                  borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: mine
                    ? "var(--mantine-color-teal-1)"
                    : "var(--mantine-color-gray-1)",
                }}
              >
                <Text size="xs" fw={600} c={mine ? "teal.8" : "dimmed"} mb={2}>
                  {mine ? "あなた" : "相手役"}
                </Text>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {m.content}
                </Text>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </Stack>
    </Box>
  );
}
