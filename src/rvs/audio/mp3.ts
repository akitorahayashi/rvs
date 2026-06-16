import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MediaContractError } from '../errors';

export async function writeMp3(
  wavBytes: Uint8Array,
  outputPath: string,
): Promise<void> {
  const tempWavPath = path.join(
    path.dirname(outputPath),
    `.rvs-${process.pid}-${Date.now()}.wav`,
  );

  await writeFile(tempWavPath, wavBytes);
  try {
    await runFfmpeg([
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      tempWavPath,
      '-codec:a',
      'libmp3lame',
      '-q:a',
      '0',
      outputPath,
    ]);
  } finally {
    await rm(tempWavPath, { force: true });
  }
}

async function runFfmpeg(args: string[]): Promise<void> {
  let process: ReturnType<typeof Bun.spawn>;
  try {
    process = Bun.spawn(['ffmpeg', ...args], {
      stderr: 'pipe',
      stdout: 'pipe',
    });
  } catch (error: unknown) {
    if (isMissingExecutable(error)) {
      throw new MediaContractError('ffmpeg is required but was not found.');
    }

    throw error;
  }

  const [stderr, exitCode] = await Promise.all([
    readStream(process.stderr),
    process.exited,
  ]);

  if (exitCode === 0) {
    return;
  }

  const message = stderr.trim();
  throw new MediaContractError(
    `ffmpeg failed: ${message === '' ? 'unknown ffmpeg failure' : message}`,
  );
}

async function readStream(
  stream: number | ReadableStream<Uint8Array> | undefined,
): Promise<string> {
  if (!(stream instanceof ReadableStream)) {
    return '';
  }

  return new Response(stream).text();
}

function isMissingExecutable(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}
