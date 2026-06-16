import { interpolate, useCurrentFrame } from 'remotion';

export interface CaptionProps {
  durationInFrames: number;
  text: string;
}

export function Caption(props: CaptionProps) {
  const frame = useCurrentFrame();
  const animation = createAnimation({
    durationInFrames: props.durationInFrames,
    frame,
  });

  return (
    <div
      style={{
        alignItems: 'center',
        bottom: '18%',
        display: 'flex',
        justifyContent: 'center',
        left: 48,
        opacity: animation.opacity,
        position: 'absolute',
        right: 48,
        transform: `translateY(${animation.translateY}px) scale(${animation.scale})`,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.64)',
          borderRadius: 14,
          boxShadow: '0 14px 34px rgba(0, 0, 0, 0.35)',
          color: 'white',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1.24,
          maxWidth: '100%',
          padding: '18px 24px',
          textAlign: 'center',
          textShadow: '0 3px 8px rgba(0, 0, 0, 0.8)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'keep-all',
        }}
      >
        {props.text}
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

  const edgeFrames = Math.min(
    8,
    Math.max(2, Math.floor(request.durationInFrames / 3)),
  );
  const exitStart = Math.max(
    edgeFrames + 1,
    request.durationInFrames - edgeFrames,
  );
  const enter = interpolate(request.frame, [0, edgeFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exit = interpolate(
    request.frame,
    [exitStart, request.durationInFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  return {
    opacity: Math.min(enter, exit),
    scale: interpolate(enter, [0, 1], [0.96, 1]),
    translateY: interpolate(enter, [0, 1], [18, 0]),
  };
}
