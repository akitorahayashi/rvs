import type { SubtitleCue } from '../subtitles/cue';

export interface NarrationCue extends SubtitleCue {
  audioFile: string;
}

export interface NarrationFrameCue {
  audioFile: string;
  durationInFrames: number;
  id: string;
  startFrame: number;
}
