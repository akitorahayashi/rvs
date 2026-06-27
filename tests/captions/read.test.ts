import { describe, expect, test } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readCaptions } from '../../src/captions/read';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'caption-read');

describe('readCaptions', () => {
  test('distinguishes missing files from invalid JSON', async () => {
    await resetRoot();

    await expect(
      readCaptions(path.join(rootDirectory, 'demo.captions.json')),
    ).rejects.toThrow('could not be read');

    await mkdir(rootDirectory, { recursive: true });
    const invalidJsonPath = path.join(rootDirectory, 'demo.captions.json');
    await writeFile(invalidJsonPath, '{');

    await expect(readCaptions(invalidJsonPath)).rejects.toThrow('invalid JSON');
  });
});

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
