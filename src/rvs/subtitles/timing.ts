import { SubtitleContractError } from '../errors';
import type { CaptionCue, SubtitleCue } from './cue';

export interface ToFrameCuesRequest {
  cues: readonly SubtitleCue[];
  fps: number;
}

export interface AssertCuesFitVideoRequest {
  cues: readonly CaptionCue[];
  durationInFrames: number;
}

export function toFrameCues(request: ToFrameCuesRequest): CaptionCue[] {
  if (!Number.isFinite(request.fps) || request.fps <= 0) {
    throw new SubtitleContractError(
      `FPS must be positive. Received ${request.fps}.`,
    );
  }

  return request.cues.map((cue) => {
    const startFrame = Math.round((cue.startMs / 1000) * request.fps);
    const endFrame = Math.round((cue.endMs / 1000) * request.fps);

    return {
      durationInFrames: Math.max(1, endFrame - startFrame),
      id: cue.id,
      startFrame,
      text: cue.text,
    };
  });
}

export function assertCuesFitVideo(request: AssertCuesFitVideoRequest): void {
  for (const cue of request.cues) {
    const cueEndFrame = cue.startFrame + cue.durationInFrames;

    if (cueEndFrame > request.durationInFrames) {
      throw new SubtitleContractError(
        `SRT cue ${cue.id} ends after the background video duration.`,
      );
    }
  }
}
