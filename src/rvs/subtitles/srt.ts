import { SubtitleContractError } from '../errors';
import type { SubtitleCue } from './cue';

const timingSeparator = '-->';
const timestampPattern = /^(\d{2}):([0-5]\d):([0-5]\d),(\d{3})$/;

export function parseSrt(input: string): SubtitleCue[] {
  const normalizedInput = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const trimmedInput = normalizedInput.replace(/^\uFEFF/, '').trim();

  if (trimmedInput === '') {
    throw new SubtitleContractError(
      'captions.srt must contain at least one cue.',
    );
  }

  const cues = trimmedInput.split(/\n{2,}/).map(parseBlock);
  rejectUnstableTiming(cues);

  return cues;
}

function parseBlock(block: string, blockIndex: number): SubtitleCue {
  const lines = block.split('\n');
  const indexLine = lines.shift()?.trim();

  if (!indexLine || !/^\d+$/.test(indexLine)) {
    throw new SubtitleContractError(
      `SRT cue ${blockIndex + 1} must start with a numeric index.`,
    );
  }

  const cueNumber = Number(indexLine);
  const timingLine = lines.shift()?.trim();

  if (!timingLine?.includes(timingSeparator)) {
    throw new SubtitleContractError(
      `SRT cue ${cueNumber} must contain a timestamp range.`,
    );
  }

  const [startText, endTextWithSettings] = timingLine.split(timingSeparator);
  const endText = endTextWithSettings?.trim().split(/\s+/)[0];

  if (!startText || !endText) {
    throw new SubtitleContractError(
      `SRT cue ${cueNumber} must contain a complete timestamp range.`,
    );
  }

  const startMs = parseTimestamp(startText.trim(), cueNumber);
  const endMs = parseTimestamp(endText, cueNumber);
  const text = lines.join('\n').trim();

  if (endMs <= startMs) {
    throw new SubtitleContractError(
      `SRT cue ${cueNumber} must have a positive duration.`,
    );
  }

  if (text === '') {
    throw new SubtitleContractError(`SRT cue ${cueNumber} text is required.`);
  }

  return {
    endMs,
    id: String(cueNumber),
    startMs,
    text,
  };
}

function parseTimestamp(timestamp: string, cueNumber: number): number {
  const match = timestampPattern.exec(timestamp);

  if (!match) {
    throw new SubtitleContractError(
      `SRT cue ${cueNumber} has invalid timestamp '${timestamp}'.`,
    );
  }

  const [, hoursText, minutesText, secondsText, millisecondsText] = match;
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  const milliseconds = Number(millisecondsText);

  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
}

function rejectUnstableTiming(cues: SubtitleCue[]): void {
  let previousEndMs = 0;

  for (const cue of cues) {
    if (cue.startMs < previousEndMs) {
      throw new SubtitleContractError(
        `SRT cue ${cue.id} starts before the previous cue ends.`,
      );
    }

    previousEndMs = cue.endMs;
  }
}
