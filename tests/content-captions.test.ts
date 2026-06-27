import { describe, expect, test } from 'bun:test';
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadCaptionContent } from '../src/content/captions';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'content');

describe('loadCaptionContent', () => {
  test('resolves captions and sibling narration paths', async () => {
    await resetRoot();
    const captionsPath = path.join(
      rootDirectory,
      'content',
      'reaction_vertical_short',
      'active',
      'demo',
      'demo.captions.json',
    );
    await mkdir(path.dirname(captionsPath), { recursive: true });
    await writeFile(captionsPath, '{}');

    const content = await loadCaptionContent({
      captionsFile:
        'content/reaction_vertical_short/active/demo/demo.captions.json',
      rootDirectory,
    });

    expect(content.id).toBe('demo');
    expect(content.captionsPath).toBe(captionsPath);
    expect(content.narrationDirectory).toBe(
      path.join(path.dirname(captionsPath), 'narration'),
    );
    expect(content.displayPaths.narrationDirectory).toBe(
      'content/reaction_vertical_short/active/demo/narration',
    );
  });

  test('rejects narration directories that are symlinks', async () => {
    await resetRoot();
    const projectDirectory = path.join(
      rootDirectory,
      'content',
      'reaction_vertical_short',
      'active',
      'escape',
    );
    const outsideDirectory = path.join(rootDirectory, 'outside');
    await mkdir(projectDirectory, { recursive: true });
    await mkdir(outsideDirectory, { recursive: true });
    await writeFile(path.join(projectDirectory, 'escape.captions.json'), '{}');
    await symlink(outsideDirectory, path.join(projectDirectory, 'narration'));

    await expect(
      loadCaptionContent({
        captionsFile:
          'content/reaction_vertical_short/active/escape/escape.captions.json',
        rootDirectory,
      }),
    ).rejects.toThrow('narration/ must not be a symlink');
  });
});

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
