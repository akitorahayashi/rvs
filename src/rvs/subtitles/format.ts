import type { SubtitleCue } from './cue';

export function formatSrt(cues: readonly SubtitleCue[]): string {
  return `${cues.map(formatCue).join('\n\n')}\n`;
}

function formatCue(cue: SubtitleCue): string {
  return [
    cue.id,
    `${formatTimestamp(cue.startMs)} --> ${formatTimestamp(cue.endMs)}`,
    cue.text,
  ].join('\n');
}

function formatTimestamp(milliseconds: number): string {
  const totalMilliseconds = Math.max(0, Math.round(milliseconds));
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const millis = totalMilliseconds % 1000;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${String(millis).padStart(3, '0')}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
