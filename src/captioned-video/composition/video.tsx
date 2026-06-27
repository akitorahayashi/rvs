import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
} from 'remotion';
import type { CaptionedVideoRenderProps } from '../render-props';
import { Caption } from './caption';

export function CaptionedVideo(props: CaptionedVideoRenderProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black', overflow: 'hidden' }}>
      <OffthreadVideo
        src={staticFile(props.sourceVideo)}
        style={{
          height: '100%',
          objectFit: 'cover',
          width: '100%',
        }}
        volume={props.sourceVideoVolume}
      />
      <Audio
        src={staticFile(props.bgm)}
        trimAfter={props.durationInFrames}
        volume={props.bgmVolume}
      />
      {props.narration.map((cue) => (
        <Sequence
          durationInFrames={cue.durationInFrames}
          from={cue.startFrame}
          key={`audio-${cue.id}`}
        >
          <Audio
            src={staticFile(cue.audioFile)}
            volume={props.narrationVolume}
          />
        </Sequence>
      ))}
      {props.captions.map((cue) => (
        <Sequence
          durationInFrames={cue.durationInFrames}
          from={cue.startFrame}
          key={cue.id}
        >
          <Caption
            bottomPercent={props.captionPosition.bottomPercent}
            durationInFrames={cue.durationInFrames}
            horizontalInset={props.captionPosition.horizontalInset}
            strokeWidthPx={props.captionStrokeWidthPx}
            text={cue.text}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
