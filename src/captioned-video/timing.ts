import { SubtitleContractError } from '../errors';
import type { CaptionCue, NarrationCue, SubtitleCue } from './cue';
import type { NarrationFrameCue } from './render-props';

export interface ScheduleNarrationBlock {
  audioFile: string;
  durationMs: number;
  text: string;
}

export function scheduleNarrationCues(
  blocks: readonly ScheduleNarrationBlock[],
): NarrationCue[] {
  let cursorMs = 0;
  const cues: NarrationCue[] = [];

  for (const [index, block] of blocks.entries()) {
    if (!Number.isFinite(block.durationMs) || block.durationMs <= 0) {
      throw new SubtitleContractError(
        `Caption block ${block.audioFile} must have a positive audio duration.`,
      );
    }

    const startMs = Math.round(cursorMs);
    const nextCursorMs = cursorMs + block.durationMs;
    const endMs = Math.round(nextCursorMs);

    cues.push({
      audioFile: block.audioFile,
      endMs,
      id: String(index + 1),
      startMs,
      text: block.text,
    });

    cursorMs = nextCursorMs;
  }

  return cues;
}

export function toFrameNarrationCues(request: {
  cues: readonly NarrationCue[];
  fps: number;
}): NarrationFrameCue[] {
  if (!Number.isFinite(request.fps) || request.fps <= 0) {
    throw new SubtitleContractError(
      `FPS must be positive. Received ${request.fps}.`,
    );
  }

  const frameCues: NarrationFrameCue[] = [];
  let nextAvailableFrame = 0;

  for (const cue of request.cues) {
    const startFrame = Math.round((cue.startMs / 1000) * request.fps);
    const endFrame = Math.round((cue.endMs / 1000) * request.fps);
    const durationInFrames = Math.max(1, endFrame - startFrame);

    if (startFrame < nextAvailableFrame) {
      throw new SubtitleContractError(
        `Narration cue ${cue.id} overlaps after frame conversion at ${request.fps} FPS.`,
      );
    }

    frameCues.push({
      audioFile: cue.audioFile,
      durationInFrames,
      id: cue.id,
      startFrame,
    });

    nextAvailableFrame = startFrame + durationInFrames;
  }

  return frameCues;
}

export function toFrameCues(request: {
  cues: readonly SubtitleCue[];
  fps: number;
}): CaptionCue[] {
  if (!Number.isFinite(request.fps) || request.fps <= 0) {
    throw new SubtitleContractError(
      `FPS must be positive. Received ${request.fps}.`,
    );
  }

  const captionCues: CaptionCue[] = [];
  let nextAvailableFrame = 0;

  for (const cue of request.cues) {
    const startFrame = Math.round((cue.startMs / 1000) * request.fps);
    const endFrame = Math.round((cue.endMs / 1000) * request.fps);
    const durationInFrames = Math.max(1, endFrame - startFrame);

    if (startFrame < nextAvailableFrame) {
      throw new SubtitleContractError(
        `SRT cue ${cue.id} overlaps after frame conversion at ${request.fps} FPS.`,
      );
    }

    captionCues.push({
      durationInFrames,
      id: cue.id,
      startFrame,
      text: cue.text,
    });

    nextAvailableFrame = startFrame + durationInFrames;
  }

  return captionCues;
}

export function assertCuesFitVideo(request: {
  cues: readonly CaptionCue[];
  durationInFrames: number;
}): void {
  for (const cue of request.cues) {
    const cueEndFrame = cue.startFrame + cue.durationInFrames;

    if (cueEndFrame > request.durationInFrames) {
      throw new SubtitleContractError(
        `SRT cue ${cue.id} ends after the background video duration.`,
      );
    }
  }
}
