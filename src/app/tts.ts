import path from 'node:path';
import type { VoicevoxProfile } from 'vcvx-ts';
import { narrationDirectoryName, resetOutputDirectory } from '../audio/output';
import type { NarrationProgress } from '../audio/progress';
import type { TtsFormat } from '../speech/format';
import { resolveTtsFormat } from '../speech/registry';
import { synthesizeSpeechClips } from '../speech/synthesize';

export interface RunTtsRequest {
  inputPath: string;
  rootDirectory?: string;
  createProgress?: (total: number) => NarrationProgress;
  synthesize?: Parameters<typeof synthesizeSpeechClips>[0]['synthesize'];
  writeMp3?: Parameters<typeof synthesizeSpeechClips>[0]['writeMp3'];
}

export interface RunTtsResult {
  narrationLocation: string;
  audioPaths: string[];
}

export async function runTts(request: RunTtsRequest): Promise<RunTtsResult> {
  const rootDirectory = path.resolve(request.rootDirectory ?? process.cwd());
  const inputPath = path.resolve(rootDirectory, request.inputPath);
  const outputDirectory = defaultOutputDirectory(inputPath);
  const document = await readJson(inputPath);
  const format = resolveTtsFormat(document);
  const clips = format.loadClips(document);
  const speakerId = format.loadSpeakerId(document);

  await resetOutputDirectory(outputDirectory);
  const audioPaths = await synthesizeSpeechClips({
    clips,
    createProgress: request.createProgress,
    outputDirectory,
    profile: resolveVoiceProfile(format, speakerId),
    synthesize: request.synthesize,
    writeMp3: request.writeMp3,
  });

  return {
    narrationLocation: path.relative(rootDirectory, outputDirectory),
    audioPaths,
  };
}

async function readJson(inputPath: string): Promise<unknown> {
  try {
    return JSON.parse(await Bun.file(inputPath).text());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`TTS input is invalid: ${message}`);
  }
}

function defaultOutputDirectory(inputPath: string): string {
  const parent = path.dirname(inputPath);
  return parent === '.'
    ? narrationDirectoryName
    : path.join(parent, narrationDirectoryName);
}

function resolveVoiceProfile(
  format: TtsFormat,
  speakerId: number | undefined,
): VoicevoxProfile {
  if (speakerId === undefined) {
    return format.voicevoxProfile;
  }

  return {
    ...format.voicevoxProfile,
    speakerId,
  };
}
