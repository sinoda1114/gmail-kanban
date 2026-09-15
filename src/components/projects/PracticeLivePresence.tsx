"use client";

import { Group, Paper, Stack, Text } from "@mantine/core";
import type { RefObject } from "react";
import {
  liveMeterBars,
  liveStageCopy,
  type LiveStageId,
} from "@/lib/practice-live";
import { InterviewerAvatar } from "./InterviewerAvatar";

interface PracticeLivePresenceProps {
  stage: LiveStageId;
  level: number;
  partnerCaption?: string;
  userCaption?: string;
  /** Live playback level; Avatar reads this each frame (no React re-render). */
  playbackLevelRef?: RefObject<number>;
}

export function PracticeLivePresence({
  stage,
  level,
  partnerCaption,
  userCaption,
  playbackLevelRef,
}: PracticeLivePresenceProps) {
  const copy = liveStageCopy(stage);
  const talking = stage === "partner" || stage === "barge_in";
  const inputting = stage === "user" || stage === "barge_in";
  const bars = liveMeterBars(level);
  const color =
    stage === "partner"
      ? "violet"
      : stage === "your_turn"
        ? "teal"
        : inputting
          ? "orange"
          : "gray";

  const avatarWidth = 200;
  const avatarHeight = 260;

  return (
    <Paper withBorder p="md" radius="md">
      <Group align="flex-start" gap="lg" wrap="wrap">
        <div
          aria-hidden
          style={{
            width: "min(100%, 200px)",
            maxWidth: avatarWidth,
            flex: "1 1 140px",
            transform: talking ? "translateY(-2px)" : undefined,
            transition: "transform 120ms ease",
          }}
        >
          <InterviewerAvatar
            audioLevelRef={playbackLevelRef}
            speaking={talking}
            width={avatarWidth}
            height={avatarHeight}
          />
        </div>
        <Stack gap={6} style={{ flex: "1 1 180px", minWidth: 0 }}>
          <div aria-live="polite">
            <Text fw={700} size="lg" c={color}>
              {copy.title}
            </Text>
            <Text size="sm" c="dimmed">
              {copy.hint}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              音声入力
            </Text>
            <Group
              gap={4}
              align="flex-end"
              h={40}
              px={8}
              py={6}
              role="meter"
              aria-label="音声入力メーター"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Math.max(0, Math.min(1, level)) * 100)}
              aria-valuetext={
                inputting ? "声が乗っています" : "待機中"
              }
              style={{
                background: "var(--mantine-color-gray-1)",
                border: "1px solid var(--mantine-color-gray-3)",
                borderRadius: 8,
                width: "100%",
                maxWidth: 220,
              }}
            >
              {bars.map((bar, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: Math.max(10, bar * 28),
                    borderRadius: 3,
                    background: inputting
                      ? "var(--mantine-color-orange-5)"
                      : "var(--mantine-color-gray-5)",
                    opacity: bar > 0.2 ? 1 : 0.7,
                  }}
                />
              ))}
            </Group>
          </div>
          {partnerCaption ? (
            <Text size="sm" lineClamp={2}>
              <Text span fw={600} c="dimmed">
                相手役:{" "}
              </Text>
              {partnerCaption}
            </Text>
          ) : null}
          {userCaption ? (
            <Text size="sm" lineClamp={2}>
              <Text span fw={600} c="dimmed">
                あなた:{" "}
              </Text>
              {userCaption}
            </Text>
          ) : null}
        </Stack>
      </Group>
    </Paper>
  );
}
