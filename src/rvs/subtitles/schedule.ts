import { SubtitleContractError } from '../errors';
import type { SubtitleCue } from './cue';

export interface ScheduleCaptionBlock {
  durationMs: number;
  fileName: string;
  text: string;
}

export function scheduleSubtitleCues(
  blocks: readonly ScheduleCaptionBlock[],
): SubtitleCue[] {
  let cursorMs = 0;
  const cues: SubtitleCue[] = [];

  for (const [index, block] of blocks.entries()) {
    if (!Number.isFinite(block.durationMs) || block.durationMs <= 0) {
      throw new SubtitleContractError(
        `Caption block ${block.fileName} must have a positive audio duration.`,
      );
    }

    const startMs = cursorMs;
    const endMs = startMs + Math.ceil(block.durationMs);

    cues.push({
      endMs,
      id: String(index + 1),
      startMs,
      text: block.text,
    });

    cursorMs = endMs;
  }

  return cues;
}
