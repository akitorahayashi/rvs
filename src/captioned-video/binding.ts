import type { VoicevoxProfile } from 'vcvx-ts';

export interface CaptionedVideoCanvas {
  fps: number;
  height: number;
  width: number;
}

export interface CaptionedVideoCaptionPosition {
  bottomPercent: number;
  horizontalInset: number;
  type: 'bottomBand';
}

export interface CaptionedVideoBinding {
  directory: string;
  displayPaths: {
    bgm: string;
    captions: string;
    narrationDirectory: string;
    output: string;
    source: string;
  };
  file: string;
  id: string;
  paths: {
    bgm: string;
    captions: string;
    narrationDirectory: string;
    output: string;
    source: string;
  };
  settings: {
    audio: {
      bgmVolume: number;
      narrationVolume: number;
      sourceVideoVolume: number;
      voice: VoicevoxProfile;
    };
    captions: {
      position: CaptionedVideoCaptionPosition;
      strokeWidthPx: number;
    };
    canvas: CaptionedVideoCanvas;
  };
}
