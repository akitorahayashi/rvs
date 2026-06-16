import type { NarrationFrameCue } from '../narration/cue';
import type { CaptionCue } from '../subtitles/cue';

export const compositionId = 'captioned-short';

export interface ShortRenderProps extends Record<string, unknown> {
  backgroundVideo: string;
  captions: CaptionCue[];
  durationInFrames: number;
  fps: number;
  height: number;
  narration: NarrationFrameCue[];
  width: number;
}

export interface CreateRenderPropsRequest {
  backgroundVideo: string;
  captions: CaptionCue[];
  durationInFrames: number;
  fps: number;
  height: number;
  narration: NarrationFrameCue[];
  width: number;
}

export const defaultRenderProps: ShortRenderProps = {
  backgroundVideo: 'background.mp4',
  captions: [],
  durationInFrames: 1,
  fps: 30,
  height: 1280,
  narration: [],
  width: 720,
};

export function createRenderProps(
  request: CreateRenderPropsRequest,
): ShortRenderProps {
  return {
    backgroundVideo: request.backgroundVideo,
    captions: request.captions,
    durationInFrames: request.durationInFrames,
    fps: request.fps,
    height: request.height,
    narration: request.narration,
    width: request.width,
  };
}
