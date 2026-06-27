import { lstat, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { writeMp3 as writeMp3File } from '../audio/mp3';
import { narrationAudioFileName } from '../audio/naming';
import {
  createNarrationProgress,
  type NarrationProgress,
} from '../audio/progress';
import { readCaptions } from '../captions/read';
import { loadCaptionContent } from '../content/captions';
import { OutputContractError } from '../errors';
import { narrationProfile } from '../voicevox/profile';
import { synthesizeWav, voicevoxUrl } from '../voicevox/synthesis';

export interface RunTtsRequest {
  captions: string;
  rootDirectory?: string;
  createProgress?: (total: number) => NarrationProgress;
  synthesize?: typeof synthesizeWav;
  writeMp3?: typeof writeMp3File;
}

export interface RunTtsResult {
  narrationLocation: string;
  audioPaths: string[];
  projectId: string;
}

const synthesisConcurrency = 4;

export async function runTts(request: RunTtsRequest): Promise<RunTtsResult> {
  const rootDirectory = path.resolve(request.rootDirectory ?? process.cwd());
  const content = await loadCaptionContent({
    captionsFile: request.captions,
    rootDirectory,
  });
  const blocks = await readCaptions(content.captionsPath);
  const createProgress = request.createProgress ?? createNarrationProgress;
  const synthesize = request.synthesize ?? synthesizeWav;
  const writeMp3 = request.writeMp3 ?? writeMp3File;

  await resetNarrationDirectory(content.narrationDirectory);

  const engineUrl = voicevoxUrl();
  const audioPaths = new Array<string>(blocks.length);
  const progress = createProgress(blocks.length);

  let nextIndex = 0;
  let failed = false;
  async function worker(): Promise<void> {
    while (nextIndex < blocks.length && !failed) {
      const index = nextIndex;
      nextIndex += 1;
      const block = blocks[index];
      if (block === undefined) {
        continue;
      }
      const outputPath = path.join(
        content.narrationDirectory,
        narrationAudioFileName(index, block.fileName),
      );
      try {
        const wavBytes = await synthesize(
          engineUrl,
          block.narration,
          narrationProfile,
        );
        await writeMp3(wavBytes, outputPath);
        audioPaths[index] = outputPath;
        progress.advance();
      } catch (error: unknown) {
        failed = true;
        throw error;
      }
    }
  }

  const workerCount = Math.min(synthesisConcurrency, blocks.length);
  try {
    const results = await Promise.allSettled(
      Array.from({ length: workerCount }, () => worker()),
    );
    const failure = results.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    if (failure !== undefined) {
      throw failure.reason;
    }
  } finally {
    progress.finish();
  }

  return {
    narrationLocation: content.displayPaths.narrationDirectory,
    audioPaths,
    projectId: content.id,
  };
}

async function resetNarrationDirectory(
  narrationDirectory: string,
): Promise<void> {
  try {
    const stats = await lstat(narrationDirectory);
    if (stats.isSymbolicLink()) {
      throw new OutputContractError('narration/ must not be a symlink.');
    }
    if (!stats.isDirectory()) {
      throw new OutputContractError('narration/ must be a directory.');
    }

    await rm(narrationDirectory, { force: true, recursive: true });
  } catch (error: unknown) {
    if (error instanceof OutputContractError) {
      throw error;
    }
    if (!isMissingPathError(error)) {
      throw error;
    }
  }

  await mkdir(narrationDirectory, { recursive: true });
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
