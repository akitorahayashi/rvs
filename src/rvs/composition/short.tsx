import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion';
import type { ShortRenderProps } from '../remotion/props';
import { Caption } from './caption';

export function Short(props: ShortRenderProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black', overflow: 'hidden' }}>
      <OffthreadVideo
        src={staticFile(props.backgroundVideo)}
        style={{
          height: '100%',
          objectFit: 'cover',
          width: '100%',
        }}
      />
      {props.captions.map((cue) => (
        <Sequence
          durationInFrames={cue.durationInFrames}
          from={cue.startFrame}
          key={cue.id}
        >
          <Caption durationInFrames={cue.durationInFrames} text={cue.text} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
