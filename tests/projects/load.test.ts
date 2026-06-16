import { describe, expect, test } from 'bun:test';
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  loadCaptionBlocksProject,
  loadProject,
} from '../../src/rvs/projects/load';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'projects');

describe('loadProject', () => {
  test('resolves a project ID to conventional project files', async () => {
    await createProject('demo');

    const project = await loadProject({
      project: 'demo',
      rootDirectory,
    });

    expect(project.id).toBe('demo');
    expect(project.backgroundPath).toBe(
      path.join(rootDirectory, 'projects', 'demo', 'background.mp4'),
    );
    expect(project.captionsPath).toBe(
      path.join(rootDirectory, 'projects', 'demo', 'captions.srt'),
    );
    expect(project.backgroundAssetPath).toBe('background.mp4');
  });

  test('accepts projects/<project-id> references', async () => {
    await createProject('demo-path');

    const project = await loadProject({
      project: 'projects/demo-path/',
      rootDirectory,
    });

    expect(project.id).toBe('demo-path');
  });

  test('rejects missing conventional inputs', async () => {
    await resetRoot();
    await mkdir(path.join(rootDirectory, 'projects', 'missing-input'), {
      recursive: true,
    });

    await expect(
      loadProject({
        project: 'missing-input',
        rootDirectory,
      }),
    ).rejects.toThrow('background.mp4 is required');
  });

  test('rejects unsafe project references', async () => {
    await expect(
      loadProject({
        project: 'projects/../demo',
        rootDirectory,
      }),
    ).rejects.toThrow('safe project ID');
  });

  test('rejects project input symlinks that escape the project directory', async () => {
    await resetRoot();
    const projectDirectory = path.join(rootDirectory, 'projects', 'escape');
    const outsideDirectory = path.join(rootDirectory, 'outside');
    await mkdir(projectDirectory, { recursive: true });
    await mkdir(outsideDirectory, { recursive: true });
    await writeFile(path.join(outsideDirectory, 'background.mp4'), '');
    await symlink(
      path.join(outsideDirectory, 'background.mp4'),
      path.join(projectDirectory, 'background.mp4'),
    );
    await writeFile(
      path.join(projectDirectory, 'captions.srt'),
      '1\n00:00:00,000 --> 00:00:01,000\nhello\n',
    );

    await expect(
      loadProject({
        project: 'escape',
        rootDirectory,
      }),
    ).rejects.toThrow('stay inside projects');
  });
});

describe('loadCaptionBlocksProject', () => {
  test('resolves conventional caption block project files', async () => {
    await createCaptionBlocksProject('demo');

    const project = await loadCaptionBlocksProject({
      project: 'demo',
      rootDirectory,
    });

    expect(project.captionBlocksPath).toBe(
      path.join(rootDirectory, 'projects', 'demo', 'caption-blocks.json'),
    );
    expect(project.audioDirectory).toBe(
      path.join(rootDirectory, 'projects', 'demo', 'audio'),
    );
    expect(project.captionsPath).toBe(
      path.join(rootDirectory, 'projects', 'demo', 'captions.srt'),
    );
  });

  test('rejects writable project paths that are symlinks', async () => {
    await createCaptionBlocksProject('escape');
    const projectDirectory = path.join(rootDirectory, 'projects', 'escape');
    const outsideDirectory = path.join(rootDirectory, 'outside');
    await mkdir(outsideDirectory, { recursive: true });
    await symlink(outsideDirectory, path.join(projectDirectory, 'audio'));

    await expect(
      loadCaptionBlocksProject({
        project: 'escape',
        rootDirectory,
      }),
    ).rejects.toThrow('audio must not be a symlink');
  });
});

async function createProject(id: string): Promise<void> {
  await resetRoot();
  const directory = path.join(rootDirectory, 'projects', id);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'background.mp4'), '');
  await writeFile(
    path.join(directory, 'captions.srt'),
    '1\n00:00:00,000 --> 00:00:01,000\nhello\n',
  );
}

async function createCaptionBlocksProject(id: string): Promise<void> {
  await resetRoot();
  const directory = path.join(rootDirectory, 'projects', id);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'caption-blocks.json'),
    JSON.stringify({
      blocks: [
        {
          file_name: '01_first.mp3',
          text: 'first',
        },
      ],
      format: 'caption_blocks/v1',
    }),
  );
}

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
