export interface VoicevoxProfile {
  intonationScale: number;
  pitchScale: number;
  postPhonemeLength: number;
  prePhonemeLength: number;
  speakerId: number;
  speedScale: number;
  volumeScale: number;
}

export const narrationProfile: VoicevoxProfile = {
  intonationScale: 1.0,
  pitchScale: 0.0,
  postPhonemeLength: 0.1,
  prePhonemeLength: 0.1,
  speakerId: 2,
  speedScale: 1.15,
  volumeScale: 1.0,
};
