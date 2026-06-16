import { lstat, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { writeMp3 as writeMp3File } from '../audio/mp3';
import { readCaptionBlocks } from '../caption-blocks/read';
import { OutputContractError } from '../errors';
import { loadCaptionBlocksProject } from '../projects/load';
import { narrationProfile } from '../voicevox/profile';
import { synthesizeWav, voicevoxUrl } from '../voicevox/synthesis';

export interface RunTtsRequest {
  rootDirectory?: string;
  project: string;
  synthesize?: typeof synthesizeWav;
  writeMp3?: typeof writeMp3File;
}

export interface RunTtsResult {
  audioLocation: string;
  audioPaths: string[];
  projectId: string;
}

export async function runTts(request: RunTtsRequest): Promise<RunTtsResult> {
  const rootDirectory = path.resolve(request.rootDirectory ?? process.cwd());
  const project = await loadCaptionBlocksProject({
    project: request.project,
    rootDirectory,
  });
  const blocks = await readCaptionBlocks(project.captionBlocksPath);
  const synthesize = request.synthesize ?? synthesizeWav;
  const writeMp3 = request.writeMp3 ?? writeMp3File;

  await resetAudioDirectory(project.audioDirectory);

  const engineUrl = voicevoxUrl();
  const audioPaths: string[] = [];

  for (const block of blocks) {
    const outputPath = path.join(project.audioDirectory, block.fileName);
    process.stderr.write(`Generating narration: ${outputPath}\n`);
    const wavBytes = await synthesize(engineUrl, block.text, narrationProfile);
    await writeMp3(wavBytes, outputPath);
    audioPaths.push(outputPath);
  }

  return {
    audioLocation: path.relative(rootDirectory, project.audioDirectory),
    audioPaths,
    projectId: project.id,
  };
}

async function resetAudioDirectory(audioDirectory: string): Promise<void> {
  try {
    const stats = await lstat(audioDirectory);
    if (stats.isSymbolicLink()) {
      throw new OutputContractError('audio/ must not be a symlink.');
    }
    if (!stats.isDirectory()) {
      throw new OutputContractError('audio/ must be a directory.');
    }

    await rm(audioDirectory, { force: true, recursive: true });
  } catch (error: unknown) {
    if (error instanceof OutputContractError) {
      throw error;
    }
    if (!isMissingPathError(error)) {
      throw error;
    }
  }

  await mkdir(audioDirectory, { recursive: true });
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
