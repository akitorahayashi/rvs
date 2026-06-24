import { describe, expect, test } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readCaptionBlocks } from '../../src/caption-blocks/read';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'caption-read');

describe('readCaptionBlocks', () => {
  test('distinguishes missing files from invalid JSON', async () => {
    await resetRoot();

    await expect(
      readCaptionBlocks(path.join(rootDirectory, 'caption-blocks.json')),
    ).rejects.toThrow('could not be read');

    await mkdir(rootDirectory, { recursive: true });
    const invalidJsonPath = path.join(rootDirectory, 'caption-blocks.json');
    await writeFile(invalidJsonPath, '{');

    await expect(readCaptionBlocks(invalidJsonPath)).rejects.toThrow(
      'invalid JSON',
    );
  });
});

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
