"use client";

import { useEffect, useRef, type RefObject } from "react";

const AVATAR_SRC = "/avatars/interviewer-female.png";

interface InterviewerAvatarProps {
  /** Written by the live audio monitor; read each frame (no React re-render). */
  audioLevelRef?: RefObject<number>;
  /** Partner speaking: drives lip-sync RAF and highlight. */
  speaking?: boolean;
  width?: number;
  height?: number;
}

/**
 * GPT Image interviewer portrait + real mouth open/close.
 * Face art is the generated PNG; SVG only draws the mouth (no hand-drawn face).
 */
export function InterviewerAvatar({
  audioLevelRef,
  speaking = false,
  width = 200,
  height = 260,
}: InterviewerAvatarProps) {
  const mouthRef = useRef<SVGEllipseElement>(null);
  const innerRef = useRef<SVGEllipseElement>(null);
  const teethRef = useRef<SVGRectElement>(null);
  const coverRef = useRef<SVGEllipseElement>(null);

  // Mouth anchor on the GPT portrait (viewBox 200x260, object-fit cover / top).
  // Calibrated from lip-colored pixels in interviewer-female.png (~y=497/1152).
  const mouthCy = 113;

  useEffect(() => {
    const reset = () => {
      mouthRef.current?.setAttribute("ry", "2.2");
      mouthRef.current?.setAttribute("cy", String(mouthCy));
      innerRef.current?.setAttribute("ry", "0");
      innerRef.current?.setAttribute("opacity", "0");
      teethRef.current?.setAttribute("height", "0");
      teethRef.current?.setAttribute("opacity", "0");
      coverRef.current?.setAttribute("ry", "6");
      coverRef.current?.setAttribute("cy", String(mouthCy));
    };

    if (!speaking) {
      reset();
      return;
    }

    let raf = 0;
    const tick = () => {
      const raw = Math.max(0, Math.min(1, (audioLevelRef?.current ?? 0) * 1.9));
      const ry = 2.2 + raw * 7.5;
      const cy = mouthCy + raw * 1.4;
      mouthRef.current?.setAttribute("ry", String(ry));
      mouthRef.current?.setAttribute("cy", String(cy));

      const open = raw > 0.1;
      if (innerRef.current) {
        innerRef.current.setAttribute(
          "ry",
          open ? String(Math.max(0.7, ry * 0.5)) : "0"
        );
        innerRef.current.setAttribute("cy", String(cy + raw * 0.5));
        innerRef.current.setAttribute("opacity", open ? "0.92" : "0");
      }
      if (teethRef.current) {
        const h = open ? 1 + raw * 3.6 : 0;
        teethRef.current.setAttribute("height", String(h));
        teethRef.current.setAttribute("y", String(cy - h * 0.8));
        teethRef.current.setAttribute("opacity", open ? "0.88" : "0");
      }
      coverRef.current?.setAttribute("ry", String(6 + raw * 2.5));
      coverRef.current?.setAttribute("cy", String(cy));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      reset();
    };
  }, [audioLevelRef, speaking, mouthCy]);

  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 12,
        overflow: "hidden",
        background: speaking
          ? "linear-gradient(180deg, #f3e8ff 0%, #f8f9fa 55%)"
          : "linear-gradient(180deg, #f1f3f5 0%, #f8f9fa 55%)",
        boxShadow: speaking ? "0 0 0 2px rgba(121, 80, 242, 0.28)" : undefined,
        transform: speaking ? "translateY(-2px)" : undefined,
        transition: "transform 120ms ease, box-shadow 120ms ease",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AVATAR_SRC}
        alt=""
        width={width}
        height={height}
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
      <svg
        viewBox="0 0 200 260"
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          pointerEvents: "none",
        }}
      >
        {/* Cover the still smile on the PNG so the animated lips read as the real mouth */}
        <ellipse
          ref={coverRef}
          cx="100"
          cy="113"
          rx="14"
          ry="5.5"
          fill="#efc2a3"
        />

        {/* lips — open/close with audio */}
        <ellipse
          ref={mouthRef}
          cx="100"
          cy="113"
          rx="9"
          ry="2.2"
          fill="#b85a6a"
        />

        {/* inner mouth */}
        <ellipse
          ref={innerRef}
          cx="100"
          cy="114"
          rx="6"
          ry="0"
          fill="#6b2438"
          opacity="0"
        />

        {/* teeth */}
        <rect
          ref={teethRef}
          x="93"
          y="113"
          width="14"
          height="0"
          rx="1.5"
          fill="#fff6f4"
          opacity="0"
        />

        {speaking ? (
          <>
            <path
              d="M158 104 Q172 116 158 132"
              fill="none"
              stroke="#7950f2"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M168 96 Q186 116 168 140"
              fill="none"
              stroke="#7950f2"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}
