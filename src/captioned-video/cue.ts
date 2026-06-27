export interface SubtitleCue {
  endMs: number;
  id: string;
  startMs: number;
  text: string;
}

export interface CaptionCue {
  durationInFrames: number;
  id: string;
  startFrame: number;
  text: string;
}

export interface NarrationCue extends SubtitleCue {
  audioFile: string;
}
