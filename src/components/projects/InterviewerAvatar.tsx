"use client";

import { useEffect, useRef, type RefObject } from "react";

interface InterviewerAvatarProps {
  /** Written by the live audio monitor; read each frame (no React re-render). */
  audioLevelRef?: RefObject<number>;
  /** Partner speaking: drives lip-sync RAF and highlight. */
  speaking?: boolean;
  width?: number;
  height?: number;
}

/**
 * Female illustrated interviewer aligned with candidate-3 look
 * (adult, brown bob, navy blazer, cream blouse).
 * The mouth ellipse itself opens/closes from playback level — no overlay marker.
 */
export function InterviewerAvatar({
  audioLevelRef,
  speaking = false,
  width = 200,
  height = 260,
}: InterviewerAvatarProps) {
  const mouthRef = useRef<SVGEllipseElement>(null);
  const teethRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const mouth = mouthRef.current;
    const teeth = teethRef.current;
    if (!speaking) {
      mouth?.setAttribute("ry", "2.2");
      mouth?.setAttribute("cy", "150");
      teeth?.setAttribute("height", "0");
      teeth?.setAttribute("opacity", "0");
      return;
    }

    let raf = 0;
    const tick = () => {
      const m = mouthRef.current;
      const t = teethRef.current;
      if (m) {
        const raw = Math.max(0, Math.min(1, (audioLevelRef?.current ?? 0) * 1.85));
        const ry = 2.2 + raw * 9;
        const cy = 150 + raw * 2.2;
        m.setAttribute("ry", String(ry));
        m.setAttribute("cy", String(cy));
        if (t) {
          const open = raw > 0.12;
          t.setAttribute("height", open ? String(1.5 + raw * 5) : "0");
          t.setAttribute("y", String(cy - (open ? 1.5 + raw * 2.5 : 0)));
          t.setAttribute("opacity", open ? "0.95" : "0");
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioLevelRef, speaking]);

  return (
    <svg
      viewBox="0 0 200 260"
      width={width}
      height={height}
      aria-hidden
      style={{
        display: "block",
        borderRadius: 12,
        background: speaking
          ? "linear-gradient(180deg, #f3e8ff 0%, #f8f9fa 55%)"
          : "linear-gradient(180deg, #f1f3f5 0%, #f8f9fa 55%)",
      }}
    >
      {/* navy blazer */}
      <path
        d="M24 252 C38 196 54 170 100 170 C146 170 162 196 176 252 Z"
        fill="#1c3d5a"
      />
      {/* cream blouse */}
      <path d="M78 172 L100 252 L122 172 Z" fill="#f8f1e7" />
      <path d="M88 172 L100 190 L112 172 Z" fill="#fff8f0" />
      {/* lapels */}
      <path d="M62 188 L86 172 L78 220 Z" fill="#16324a" />
      <path d="M138 188 L114 172 L122 220 Z" fill="#16324a" />

      {/* neck */}
      <rect x="88" y="152" width="24" height="24" rx="8" fill="#f0c9a8" />

      {/* head */}
      <ellipse cx="100" cy="112" rx="44" ry="50" fill="#f3d0b3" />

      {/* brown bob + bangs */}
      <path
        d="M54 108 C52 62 72 46 100 44 C128 46 148 62 146 108
           C148 150 138 168 128 176 C122 156 118 140 118 120
           C110 132 90 132 82 120 C82 140 78 156 72 176
           C62 168 52 150 54 108 Z"
        fill="#5c4033"
      />
      <path
        d="M58 96 C70 78 88 72 100 70 C112 72 130 78 142 96
           C130 88 116 92 100 90 C84 92 70 88 58 96 Z"
        fill="#4a3428"
      />

      {/* soft blush */}
      <ellipse cx="72" cy="128" rx="9" ry="5" fill="#f8a5c2" opacity="0.28" />
      <ellipse cx="128" cy="128" rx="9" ry="5" fill="#f8a5c2" opacity="0.28" />

      {/* eyebrows */}
      <path
        d="M72 96 Q82 91 92 96"
        fill="none"
        stroke="#4a3428"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M108 96 Q118 91 128 96"
        fill="none"
        stroke="#4a3428"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* eyes */}
      <ellipse cx="82" cy="112" rx="7.5" ry="9" fill="#fff" />
      <ellipse cx="118" cy="112" rx="7.5" ry="9" fill="#fff" />
      <ellipse cx="82" cy="113" rx="4.5" ry="6" fill="#5c4033" />
      <ellipse cx="118" cy="113" rx="4.5" ry="6" fill="#5c4033" />
      <ellipse cx="82" cy="114" rx="2.4" ry="3.4" fill="#212529" />
      <ellipse cx="118" cy="114" rx="2.4" ry="3.4" fill="#212529" />
      <circle cx="84" cy="110" r="1.5" fill="#fff" />
      <circle cx="120" cy="110" r="1.5" fill="#fff" />

      {/* nose */}
      <path
        d="M100 120 L97 134 Q100 136 103 134"
        fill="none"
        stroke="#d4a373"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* teeth peek when open */}
      <rect
        ref={teethRef}
        x="92"
        y="150"
        width="16"
        height="0"
        rx="1"
        fill="#fff5f5"
        opacity="0"
      />

      {/* mouth — opens with audio level */}
      <ellipse
        ref={mouthRef}
        cx="100"
        cy="150"
        rx="9"
        ry="2.2"
        fill="#a61e4d"
      />

      {speaking ? (
        <>
          <path
            d="M156 100 Q170 112 156 128"
            fill="none"
            stroke="#7950f2"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M166 92 Q186 112 166 136"
            fill="none"
            stroke="#7950f2"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </>
      ) : null}
    </svg>
  );
}
