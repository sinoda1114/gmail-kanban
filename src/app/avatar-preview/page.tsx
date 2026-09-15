"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { InterviewerAvatar } from "@/components/projects/InterviewerAvatar";

/**
 * Dogfood: GPT Image interviewer + real mouth lip-sync (no red marker, no hand-drawn face).
 */
function AvatarPreviewInner() {
  const audioLevelRef = useRef(0);
  const [level, setLevel] = useState(0.4);
  const [autoTalk, setAutoTalk] = useState(true);
  const speaking = level > 0.06;

  useEffect(() => {
    audioLevelRef.current = level;
  }, [level]);

  useEffect(() => {
    if (!autoTalk) return;
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      const pulse = (Math.sin(frame / 2.1) + 1) / 2;
      const burst = (Math.sin(frame / 6.5) + 1) / 2;
      const gate = Math.sin(frame / 18) > -0.35 ? 1 : 0.04;
      const next = (0.1 + pulse * 0.55 + burst * 0.3) * gate;
      setLevel(next);
      audioLevelRef.current = next;
    }, 70);
    return () => window.clearInterval(id);
  }, [autoTalk]);

  const stageTitle = useMemo(
    () => (speaking ? "相手役が話しています" : "待機中"),
    [speaking]
  );

  return (
    <main
      style={{
        margin: 0,
        minHeight: "100vh",
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        background: "#f6f7f9",
        color: "#212529",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: "1.25rem", margin: "0 0 8px" }}>
        面接官アバター ドッグフード
      </h1>
      <p
        style={{
          color: "#868e96",
          margin: "0 0 20px",
          lineHeight: 1.5,
          maxWidth: "44rem",
        }}
      >
        見た目は GPT Image 生成。口パクは画像の口を開閉します（手描き顔・赤いマーカーなし）。
      </p>

      <nav
        aria-label="関連リンク"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Link href="/avatar-preview" aria-current="page" style={tabStyle(true)}>
          口パク確認
        </Link>
        <a href="/avatars/interviewer-female.png" style={tabStyle(false)}>
          生成画像単体
        </a>
      </nav>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <section
          aria-label="ライブ面談プレゼンス風プレビュー"
          style={{
            background: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            maxWidth: 560,
          }}
        >
          <InterviewerAvatar
            audioLevelRef={audioLevelRef}
            speaking={speaking}
            width={220}
            height={286}
          />
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "1.1rem",
                color: "#7950f2",
              }}
            >
              {stageTitle}
            </h2>
            <p
              style={{
                margin: "0 0 12px",
                color: "#868e96",
                fontSize: "0.9rem",
              }}
            >
              GPT Image の顔 ＋ 口そのものが開閉
            </p>
            <div style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>
              <strong style={{ color: "#868e96" }}>相手役: </strong>
              <span>
                自己紹介をお願いします。これまでのご経験を中心に教えてください。
              </span>
            </div>
          </div>
        </section>

        <aside
          style={{
            background: "#fff",
            border: "1px solid #dee2e6",
            borderRadius: 12,
            padding: 16,
            maxWidth: 320,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.9rem",
              marginBottom: 14,
            }}
          >
            <input
              type="checkbox"
              checked={autoTalk}
              onChange={(e) => setAutoTalk(e.target.checked)}
            />
            自動で口パク（おすすめ）
          </label>
          <label
            htmlFor="level"
            style={{ display: "block", fontSize: "0.85rem", marginBottom: 6 }}
          >
            手動: 話す強さ（{Math.round(level * 100)}）
          </label>
          <input
            id="level"
            type="range"
            min={0}
            max={100}
            value={Math.round(level * 100)}
            disabled={autoTalk}
            onChange={(e) => {
              const next = Number(e.target.value) / 100;
              setLevel(next);
              audioLevelRef.current = next;
            }}
            style={{ width: "100%" }}
          />
        </aside>
      </div>
    </main>
  );
}

function tabStyle(active: boolean): CSSProperties {
  return {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 999,
    border: `1px solid ${active ? "#7950f2" : "#dee2e6"}`,
    background: active ? "#7950f2" : "#fff",
    color: active ? "#fff" : "#212529",
    textDecoration: "none",
    fontSize: "0.9rem",
  };
}

export default function AvatarPreviewPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
          読み込み中…
        </main>
      }
    >
      <AvatarPreviewInner />
    </Suspense>
  );
}
