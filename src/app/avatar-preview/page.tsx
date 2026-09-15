"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { InterviewerAvatar } from "@/components/projects/InterviewerAvatar";

/**
 * Dogfood page for the candidate-3 illustrated interviewer.
 * Lip-sync moves the SVG mouth itself (no red overlay marker).
 */
function AvatarPreviewInner() {
  const searchParams = useSearchParams();
  const demo = searchParams.get("demo") !== "off";

  const audioLevelRef = useRef(0);
  const [level, setLevel] = useState(0.45);
  const [autoTalk, setAutoTalk] = useState(demo);
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
      // Keep some silence gaps so open/close is obvious.
      const gate = Math.sin(frame / 18) > -0.35 ? 1 : 0.05;
      const next = (0.12 + pulse * 0.55 + burst * 0.28) * gate;
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
          maxWidth: "42rem",
        }}
      >
        候補3寄りの女性イラスト面接官です。赤いマーカーは使いません。
        <strong>口そのもの</strong>が開閉します。「自動で口パク」をONにして確認してください。
      </p>

      <nav
        aria-label="関連リンク"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Link href="/avatar-preview" aria-current="page" style={tabStyle(true)}>
          口パク付きイラスト
        </Link>
        <a href="/avatar-preview/candidate-3-custom.png" style={tabStyle(false)}>
          元コンセプト画像
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
          <div
            style={{
              width: "min(100%, 220px)",
              flex: "1 1 160px",
              transform: speaking ? "translateY(-2px)" : undefined,
              transition: "transform 120ms ease",
            }}
          >
            <InterviewerAvatar
              audioLevelRef={audioLevelRef}
              speaking={speaking}
              width={220}
              height={286}
            />
          </div>
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
              SVG の口（楕円）が音声レベルで開閉します
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
          <p
            style={{ margin: "10px 0 0", fontSize: "0.8rem", color: "#868e96" }}
          >
            自動OFFにしてスライダーを動かすと、口の開きが追従します。
          </p>
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
