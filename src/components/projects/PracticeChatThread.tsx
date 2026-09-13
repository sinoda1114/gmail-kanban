"use client";

import { useEffect, useRef } from "react";
import { Text } from "@mantine/core";
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
    <div aria-label="会話" style={{ maxHeight: 360, overflowY: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {messages.map((m, i) => {
            const mine = m.role === "candidate";
            return (
              <tr key={`${m.role}-${i}`}>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: mine ? "right" : "left",
                    verticalAlign: "top",
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div ref={endRef} />
    </div>
  );
}
