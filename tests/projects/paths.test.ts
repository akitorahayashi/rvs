import { describe, expect, test } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createOutputPath } from '../../src/projects/paths';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'output');
const now = new Date(2026, 5, 16, 14, 30, 5);

describe('createOutputPath', () => {
  test('creates a timestamped output path under the project output directory', async () => {
    await resetRoot();

    const outputPath = await createOutputPath({
      now,
      projectId: 'demo',
      rootDirectory,
    });

    expect(outputPath).toBe(
      path.join(rootDirectory, 'output', 'demo', '20260616-143005.mp4'),
    );
  });

  test('uses a suffix instead of overwriting an existing timestamped output', async () => {
    await resetRoot();
    const directory = path.join(rootDirectory, 'output', 'demo');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, '20260616-143005.mp4'), '');

    const outputPath = await createOutputPath({
      now,
      projectId: 'demo',
      rootDirectory,
    });

    expect(outputPath).toBe(
      path.join(rootDirectory, 'output', 'demo', '20260616-143005-001.mp4'),
    );
  });
});

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
