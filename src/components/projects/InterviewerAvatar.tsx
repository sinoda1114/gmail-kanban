"use client";

import { useEffect, useRef, type RefObject } from "react";

interface InterviewerAvatarProps {
  /** Written by the live audio monitor; read each frame (no React re-render). */
  audioLevelRef?: RefObject<number>;
  /** When false, mouth stays in a closed smile. */
  lipSyncActive?: boolean;
  /** Soft highlight when the partner is speaking. */
  speaking?: boolean;
  width?: number;
  height?: number;
}

/**
 * Lightweight illustrated interviewer (business attire).
 * Prefer this over VTuber-style VRM samples for interview practice UX.
 * Optional VRM (e.g. Sendagaya Shino) remains available via VRMAvatar.
 */
export function InterviewerAvatar({
  audioLevelRef,
  lipSyncActive = false,
  speaking = false,
  width = 200,
  height = 260,
}: InterviewerAvatarProps) {
  const mouthRef = useRef<SVGEllipseElement>(null);

  useEffect(() => {
    const el = mouthRef.current;
    if (!lipSyncActive) {
      // Idle / preview: keep a closed mouth and do not run a RAF loop.
      el?.setAttribute("ry", "2");
      el?.setAttribute("cy", "148");
      return;
    }

    let raf = 0;
    const tick = () => {
      const mouth = mouthRef.current;
      if (mouth) {
        const raw = Math.max(0, Math.min(1, (audioLevelRef?.current ?? 0) * 1.8));
        // Closed smile ≈ ry=2; open speech up to ry=10.
        mouth.setAttribute("ry", String(2 + raw * 8));
        mouth.setAttribute("cy", String(148 + raw * 2));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioLevelRef, lipSyncActive]);

  return (
    <svg
      viewBox="0 0 200 260"
      width={width}
      height={height}
      role="img"
      aria-label="相手役アバター"
      style={{
        display: "block",
        borderRadius: 12,
        background: speaking
          ? "linear-gradient(180deg, #eef2ff 0%, #f8f9fa 55%)"
          : "linear-gradient(180deg, #f1f3f5 0%, #f8f9fa 55%)",
      }}
    >
      {/* shoulders / suit jacket */}
      <path
        d="M28 250 C40 200 55 176 100 176 C145 176 160 200 172 250 Z"
        fill="#1c3d5a"
      />
      {/* shirt */}
      <path
        d="M78 178 L100 250 L122 178 Z"
        fill="#f8f9fa"
      />
      {/* tie */}
      <path
        d="M100 178 L92 210 L100 248 L108 210 Z"
        fill="#c92a2a"
      />
      <path d="M94 178 L100 188 L106 178 Z" fill="#a61e1e" />

      {/* neck */}
      <rect x="88" y="152" width="24" height="28" rx="6" fill="#f1d4b8" />

      {/* head */}
      <ellipse cx="100" cy="112" rx="46" ry="52" fill="#f3d7bc" />

      {/* short professional hair */}
      <path
        d="M54 112 C54 68 72 52 100 50 C128 52 146 68 146 112
           C140 88 128 74 100 72 C72 74 60 88 54 112 Z"
        fill="#212529"
      />
      <path
        d="M54 108 C58 96 62 100 64 118 L54 120 Z"
        fill="#212529"
      />
      <path
        d="M146 108 C142 96 138 100 136 118 L146 120 Z"
        fill="#212529"
      />

      {/* eyebrows */}
      <path
        d="M72 98 Q82 94 90 98"
        fill="none"
        stroke="#343a40"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M110 98 Q118 94 128 98"
        fill="none"
        stroke="#343a40"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* eyes */}
      <ellipse cx="81" cy="112" rx="5.5" ry="6" fill="#212529" />
      <ellipse cx="119" cy="112" rx="5.5" ry="6" fill="#212529" />
      <circle cx="83" cy="110" r="1.6" fill="#fff" />
      <circle cx="121" cy="110" r="1.6" fill="#fff" />

      {/* nose */}
      <path
        d="M100 118 L96 132 Q100 134 104 132"
        fill="none"
        stroke="#d4a373"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* mouth — ry/cy driven by RAF lip-sync */}
      <ellipse
        ref={mouthRef}
        cx="100"
        cy="148"
        rx="10"
        ry="2"
        fill="#5c3a2a"
      />

      {/* speaking cue */}
      {speaking ? (
        <>
          <path
            d="M158 100 Q172 112 158 128"
            fill="none"
            stroke="#4c6ef5"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M168 92 Q188 112 168 136"
            fill="none"
            stroke="#4c6ef5"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </>
      ) : null}
    </svg>
  );
}
