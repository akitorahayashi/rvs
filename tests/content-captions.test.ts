import { describe, expect, test } from 'bun:test';
import {
  lstat,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { resetOutputDirectory } from '../src/audio/output';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'audio-output');

describe('resetOutputDirectory', () => {
  test('recreates narration output directories and clears stale files', async () => {
    await resetRoot();
    const outdir = path.join(rootDirectory, 'content', 'demo', 'narration');
    await mkdir(outdir, { recursive: true });
    await writeFile(path.join(outdir, 'stale.mp3'), 'stale');

    await resetOutputDirectory(outdir);

    expect((await lstat(outdir)).isDirectory()).toBe(true);
    await expect(readFile(path.join(outdir, 'stale.mp3'))).rejects.toThrow();
  });

  test('rejects narration directories that are symlinks', async () => {
    await resetRoot();
    const projectDirectory = path.join(rootDirectory, 'content', 'escape');
    const outsideDirectory = path.join(rootDirectory, 'outside');
    await mkdir(projectDirectory, { recursive: true });
    await mkdir(outsideDirectory, { recursive: true });
    await symlink(outsideDirectory, path.join(projectDirectory, 'narration'));

    await expect(
      resetOutputDirectory(path.join(projectDirectory, 'narration')),
    ).rejects.toThrow('narration/ must not be a symlink');
  });
});

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
