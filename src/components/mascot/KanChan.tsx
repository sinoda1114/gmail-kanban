import type { SVGProps } from "react";

interface KanChanProps extends Omit<SVGProps<SVGSVGElement>, "viewBox"> {
  size?: number;
  mood?: "happy" | "waving" | "thinking";
}

export function KanChan({ size = 120, mood = "happy", ...props }: KanChanProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="カンちゃん - Gmail Kanbanのマスコット"
      {...props}
    >
      {/* 封筒の本体 */}
      <rect
        x="15"
        y="35"
        width="90"
        height="65"
        rx="8"
        fill="#4C9AFF"
        stroke="#2563EB"
        strokeWidth="2"
      />
      
      {/* 封筒のフラップ（閉じた状態） */}
      <path
        d="M15 35 L60 65 L105 35"
        fill="#5DADE2"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* 封筒のフラップライン */}
      <path
        d="M15 35 L60 65 L105 35"
        fill="none"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 目（左） */}
      <circle cx="40" cy="60" r="4" fill="#1E3A8A" />
      
      {/* 目（右） */}
      <circle cx="80" cy="60" r="4" fill="#1E3A8A" />

      {/* 笑顔の口 */}
      {mood === "happy" && (
        <path
          d="M45 75 Q60 85 75 75"
          fill="none"
          stroke="#1E3A8A"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {/* 手を振っている時の口 */}
      {mood === "waving" && (
        <>
          <ellipse cx="60" cy="75" rx="8" ry="10" fill="#1E3A8A" />
          <ellipse cx="60" cy="73" rx="6" ry="7" fill="#4C9AFF" />
        </>
      )}

      {/* 考え中の口 */}
      {mood === "thinking" && (
        <line
          x1="45"
          y1="75"
          x2="75"
          y2="75"
          stroke="#1E3A8A"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {/* 頬の赤み（左） */}
      <circle cx="30" cy="70" r="6" fill="#FF9AA2" opacity="0.6" />
      
      {/* 頬の赤み（右） */}
      <circle cx="90" cy="70" r="6" fill="#FF9AA2" opacity="0.6" />

      {/* 手を振っている時の手 */}
      {mood === "waving" && (
        <>
          <rect
            x="105"
            y="25"
            width="8"
            height="20"
            rx="4"
            fill="#4C9AFF"
            stroke="#2563EB"
            strokeWidth="1.5"
            transform="rotate(-20 109 35)"
          />
          <circle cx="112" cy="22" r="5" fill="#FFD93D" opacity="0.8" />
          <circle cx="116" cy="18" r="4" fill="#FFD93D" opacity="0.6" />
          <circle cx="119" cy="24" r="3" fill="#FFD93D" opacity="0.5" />
        </>
      )}

      {/* 考え中の思考バブル */}
      {mood === "thinking" && (
        <>
          <circle cx="95" cy="25" r="3" fill="#E8F4F8" stroke="#2563EB" strokeWidth="1" />
          <circle cx="102" cy="18" r="5" fill="#E8F4F8" stroke="#2563EB" strokeWidth="1" />
          <circle cx="112" cy="15" r="8" fill="#E8F4F8" stroke="#2563EB" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}
