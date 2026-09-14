"use client";

import { Group, Paper, Stack, Text } from "@mantine/core";
import { useState, useEffect } from "react";
import {
  liveMeterBars,
  liveStageCopy,
  type LiveStageId,
} from "@/lib/practice-live";
import { Live2DAvatar } from "./Live2DAvatar";

interface PracticeLivePresenceProps {
  stage: LiveStageId;
  level: number;
  partnerCaption?: string;
  userCaption?: string;
  playbackLevel?: number;
}

function mouthFor(stage: LiveStageId) {
  if (stage === "partner" || stage === "barge_in") {
    return <ellipse cx="60" cy="86" rx="14" ry="9" fill="#3b3b3b" />;
  }
  if (stage === "user") {
    return (
      <path
        d="M46 84 Q60 90 74 84"
        fill="none"
        stroke="#3b3b3b"
        strokeWidth="3"
        strokeLinecap="round"
      />
    );
  }
  return (
    <path
      d="M46 82 Q60 92 74 82"
      fill="none"
      stroke="#3b3b3b"
      strokeWidth="3"
      strokeLinecap="round"
    />
  );
}

export function PracticeLivePresence({
  stage,
  level,
  partnerCaption,
  userCaption,
  playbackLevel = 0,
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

  const [useLive2D, setUseLive2D] = useState(false);
  const [modelAvailable, setModelAvailable] = useState(false);

  useEffect(() => {
    async function checkModelAvailability() {
      try {
        const response = await fetch(
          "/live2d-models/Hiyori/Hiyori.model3.json",
          { method: "HEAD" }
        );
        setModelAvailable(response.ok);
        setUseLive2D(response.ok);
      } catch {
        setModelAvailable(false);
        setUseLive2D(false);
      }
    }
    void checkModelAvailability();
  }, []);

  const avatarWidth = 200;
  const avatarHeight = 260;

  return (
    <Paper withBorder p="md" radius="md">
      <Group align="flex-start" gap="lg" wrap="nowrap">
        <div
          aria-hidden
          style={{
            width: useLive2D ? avatarWidth : 120,
            flex: useLive2D ? `0 0 ${avatarWidth}px` : "0 0 120px",
            transform: talking ? "translateY(-2px)" : undefined,
            transition: "transform 120ms ease",
          }}
        >
          {useLive2D && modelAvailable ? (
            <Live2DAvatar
              audioLevel={talking ? playbackLevel : 0}
              width={avatarWidth}
              height={avatarHeight}
            />
          ) : (
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill={talking ? "#eee9ff" : inputting ? "#fff4e6" : "#e7f5ff"}
                stroke={
                  talking ? "#7950f2" : inputting ? "#f08c00" : "#15aabf"
                }
                strokeWidth="3"
              />
              <circle cx="44" cy="52" r="5" fill="#1f1f1f" />
              <circle cx="76" cy="52" r="5" fill="#1f1f1f" />
              {mouthFor(stage)}
              {talking ? (
                <>
                  <path
                    d="M100 44 Q112 60 100 76"
                    fill="none"
                    stroke="#7950f2"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M108 38 Q124 60 108 82"
                    fill="none"
                    stroke="#7950f2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                </>
              ) : null}
            </svg>
          )}
        </div>
        <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
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
