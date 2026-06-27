import type { VoicevoxProfile } from 'vcvx-ts';

export interface SpeechClip {
  index: number;
  outputFileName: string;
  text: string;
}

export interface TtsFormat {
  id: string;
  loadClips(document: unknown): SpeechClip[];
  loadSpeakerId(document: unknown): number | undefined;
  voicevoxProfile: VoicevoxProfile;
}
