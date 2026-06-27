import { lstat, mkdir, rm } from 'node:fs/promises';
import { OutputContractError } from '../errors';

export const narrationDirectoryName = 'narration';

export async function ensureOutputDirectory(outdir: string): Promise<void> {
  assertValidOutputDirectory(outdir);
  await mkdir(outdir, { recursive: true });
}

export async function resetOutputDirectory(outdir: string): Promise<void> {
  assertValidOutputDirectory(outdir);

  try {
    const stats = await lstat(outdir);
    if (stats.isSymbolicLink()) {
      throw new OutputContractError(`${outdir} must not be a symlink.`);
    }
    if (!stats.isDirectory()) {
      throw new OutputContractError(`${outdir} must be a directory.`);
    }

    await rm(outdir, { force: true, recursive: true });
  } catch (error: unknown) {
    if (error instanceof OutputContractError) {
      throw error;
    }
    if (!isMissingPathError(error)) {
      throw error;
    }
  }

  await mkdir(outdir, { recursive: true });
}

export function assertValidOutputDirectory(path: string): void {
  if (
    path === '' ||
    path === '.' ||
    path === '..' ||
    path === '/' ||
    path === '\\'
  ) {
    throw new OutputContractError(`Invalid tts output directory: ${path}`);
  }
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
