"use client";

import { useEffect, useRef } from "react";
import { Text } from "@mantine/core";
import type { PracticeMessage } from "@/types/interview-practice";

interface PracticeChatThreadProps {
  messages: PracticeMessage[];
}

/** Newest messages first (top). Older history scrolls downward. */
export function PracticeChatThread({ messages }: PracticeChatThreadProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const newestFirst = [...messages].reverse();

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  return (
    <div
      role="log"
      aria-label="会話"
      aria-relevant="additions"
      style={{ maxHeight: 360, overflowY: "auto" }}
    >
      <div ref={topRef} />
      {newestFirst.map((m, i) => {
        const mine = m.role === "candidate";
        // Stable-ish key from reverse index position in the original timeline.
        const originalIndex = messages.length - 1 - i;
        return (
          <div
            key={`practice-${m.role}-${originalIndex}-${m.content.slice(0, 24)}`}
            role="article"
            aria-label={mine ? "あなた" : "相手役"}
            style={{
              display: "block",
              width: "100%",
              textAlign: mine ? "right" : "left",
              padding: "4px 0",
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "80%",
                textAlign: "left",
                padding: "8px 12px",
                borderRadius: mine
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",
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
    </div>
  );
}
