import type { CSSProperties } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export interface CaptionProps {
  bottomPercent: number;
  durationInFrames: number;
  horizontalInset: number;
  strokeWidthPx: number;
  text: string;
}

const captionTextStyle: CSSProperties = {
  color: 'white',
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 58,
  fontWeight: 800,
  lineHeight: 1.24,
  textAlign: 'center',
  whiteSpace: 'pre-wrap',
  wordBreak: 'keep-all',
};

export function Caption(props: CaptionProps) {
  const frame = useCurrentFrame();
  const animation = createAnimation({
    durationInFrames: props.durationInFrames,
    frame,
  });

  return (
    <div
      style={{
        bottom: `${props.bottomPercent}%`,
        left: props.horizontalInset,
        opacity: animation.opacity,
        position: 'absolute',
        right: props.horizontalInset,
        transform: `translateY(${animation.translateY}px) scale(${animation.scale})`,
      }}
    >
      <div
        style={{
          position: 'relative',
        }}
      >
        <div
          aria-hidden
          style={{
            ...captionTextStyle,
            inset: 0,
            position: 'absolute',
            textShadow:
              '0 0 1.6px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.75)',
            WebkitTextStroke: `${props.strokeWidthPx}px black`,
          }}
        >
          {props.text}
        </div>
        <div
          style={{
            ...captionTextStyle,
            position: 'relative',
          }}
        >
          {props.text}
        </div>
      </div>
    </div>
  );
}

function createAnimation(request: { durationInFrames: number; frame: number }) {
  if (request.durationInFrames < 4) {
    return {
      opacity: 1,
      scale: 1,
      translateY: 0,
    };
  }

  const enterFrames = Math.min(
    8,
    Math.max(2, Math.floor(request.durationInFrames / 3)),
  );
  const enter = interpolate(request.frame, [0, enterFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {
    opacity: enter,
    scale: interpolate(enter, [0, 1], [1.05, 1]),
    translateY: interpolate(enter, [0, 1], [-9, 0]),
  };
}
