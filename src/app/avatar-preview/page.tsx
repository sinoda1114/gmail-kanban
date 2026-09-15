"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type CandidateId = "1" | "3";

const CATALOG: Record<CandidateId, { src: string; label: string }> = {
  "1": {
    src: "/avatar-preview/candidate-1-shino.png",
    label: "候補1: 千駄ヶ谷しの系（実在ポートレート）",
  },
  "3": {
    src: "/avatar-preview/candidate-3-custom.png",
    label: "候補3: 自作の目標イメージ（概念イラスト・未VRM）",
  },
};

function AvatarPreviewInner() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("c");
  // Prefer candidate 3 as the current favorite; allow ?c=1 explicitly.
  const candidate: CandidateId = raw === "1" ? "1" : "3";
  const item = CATALOG[candidate];

  const [level, setLevel] = useState(55);
  const [autoTalk, setAutoTalk] = useState(true);

  useEffect(() => {
    if (!autoTalk) return;
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      // Rough speech envelope: open/close every ~180ms with varying amplitude.
      const pulse = (Math.sin(frame / 2.2) + 1) / 2;
      const burst = (Math.sin(frame / 7) + 1) / 2;
      setLevel(Math.round(18 + pulse * 55 + burst * 25));
    }, 90);
    return () => window.clearInterval(id);
  }, [autoTalk]);

  const talking = level > 8;
  const mouthHeightPx = 4 + (level / 100) * 22;
  const mouthWidthPct = 14 + (level / 100) * 8;

  const stageTitle = useMemo(
    () => (talking ? "相手役が話しています" : "待機中"),
    [talking]
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
        アバター候補ドッグフード
      </h1>
      <p
        style={{
          color: "#868e96",
          margin: "0 0 20px",
          lineHeight: 1.5,
          maxWidth: "42rem",
        }}
      >
        候補3（自作イメージ）を優先表示。口元の赤い楕円が開閉するのが疑似口パクです。
        「自動で口パク」をONにすると動きが見えます（本番 Live 音声ではありません）。
      </p>

      <nav
        aria-label="候補切り替え"
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Link
          href="/avatar-preview?c=1"
          aria-current={candidate === "1" ? "page" : undefined}
          style={tabStyle(candidate === "1")}
        >
          候補1 · しの系
        </Link>
        <Link
          href="/avatar-preview?c=3"
          aria-current={candidate === "3" ? "page" : undefined}
          style={tabStyle(candidate === "3")}
        >
          候補3 · 自作イメージ
        </Link>
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
            aria-hidden
            style={{
              width: "min(100%, 220px)",
              flex: "1 1 160px",
              borderRadius: 12,
              overflow: "hidden",
              background: "linear-gradient(180deg, #f3e8ff, #f8f9fa 55%)",
              position: "relative",
              transform: talking ? "translateY(-2px)" : undefined,
              boxShadow: talking
                ? "0 0 0 2px rgba(121, 80, 242, 0.35)"
                : undefined,
              transition: "transform 120ms ease",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt=""
              style={{
                display: "block",
                width: "100%",
                height: 280,
                objectFit: "cover",
                objectPosition: "center top",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "26%",
                width: `${mouthWidthPct}%`,
                height: mouthHeightPx,
                transform: "translateX(-50%)",
                background: "#c2255c",
                borderRadius: "50%",
                opacity: talking ? 0.95 : 0.25,
                pointerEvents: "none",
                boxShadow: talking
                  ? "0 0 0 2px rgba(255,255,255,0.65)"
                  : undefined,
                transition: "height 60ms linear, width 60ms linear, opacity 80ms",
              }}
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
              口元の赤いマーカーが開閉＝疑似口パク
            </p>
            <div style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>
              <strong style={{ color: "#868e96" }}>相手役: </strong>
              <span>
                自己紹介をお願いします。これまでのご経験を中心に教えてください。
              </span>
            </div>
            <p
              style={{ marginTop: 12, fontSize: "0.85rem", color: "#868e96" }}
            >
              {item.label}
            </p>
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
            手動: 話す強さ（{level}）
          </label>
          <input
            id="level"
            type="range"
            min={0}
            max={100}
            value={level}
            disabled={autoTalk}
            onChange={(e) => setLevel(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <p
            style={{ margin: "10px 0 0", fontSize: "0.8rem", color: "#868e96" }}
          >
            自動OFFにしてスライダーを動かすと、口の大きさが追従します。
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
