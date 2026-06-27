import path from 'node:path';
import type { VoicevoxProfile } from 'vcvx-ts';
import { writeMp3 as writeMp3File } from '../audio/mp3';
import {
  createNarrationProgress,
  type NarrationProgress,
} from '../audio/progress';
import { synthesizeWav, voicevoxUrl } from '../voicevox/synthesis';

const synthesisConcurrency = 4;

export interface SynthesisClip {
  outputFileName: string;
  text: string;
}

export interface SynthesizeSpeechRequest {
  clips: readonly SynthesisClip[];
  createProgress?: (total: number) => NarrationProgress;
  engineUrl?: string;
  outputDirectory: string;
  profile: VoicevoxProfile;
  synthesize?: typeof synthesizeWav;
  writeMp3?: typeof writeMp3File;
}

export async function synthesizeSpeechClips(
  request: SynthesizeSpeechRequest,
): Promise<string[]> {
  const createProgress = request.createProgress ?? createNarrationProgress;
  const synthesize = request.synthesize ?? synthesizeWav;
  const writeMp3 = request.writeMp3 ?? writeMp3File;

  const engineUrl = request.engineUrl ?? voicevoxUrl();
  const outputs = new Array<string>(request.clips.length);
  const progress = createProgress(request.clips.length);

  let nextIndex = 0;
  let failed = false;
  async function worker(): Promise<void> {
    while (nextIndex < request.clips.length && !failed) {
      const index = nextIndex;
      nextIndex += 1;
      const clip = request.clips[index];
      if (clip === undefined) {
        continue;
      }
      const outputPath = path.join(
        request.outputDirectory,
        clip.outputFileName,
      );
      try {
        const wavBytes = await synthesize(
          engineUrl,
          clip.text,
          request.profile,
        );
        await writeMp3(wavBytes, outputPath);
        outputs[index] = outputPath;
        progress.advance();
      } catch (error: unknown) {
        failed = true;
        throw error;
      }
    }
  }

  const workerCount = Math.min(synthesisConcurrency, request.clips.length);
  try {
    const results = await Promise.allSettled(
      Array.from({ length: workerCount }, () => worker()),
    );
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (failure !== undefined) {
      throw failure.reason;
    }
  } finally {
    progress.finish();
  }

  return outputs;
}
