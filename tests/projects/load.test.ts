import { describe, expect, test } from 'bun:test';
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  loadCaptionBlocksProject,
  loadRenderProject,
} from '../../src/rvs/projects/load';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'projects');

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

describe('loadRenderProject', () => {
  test('accepts projects/<project-id> references', async () => {
    await createCaptionBlocksProject('demo-path');
    const projectDirectory = path.join(rootDirectory, 'projects', 'demo-path');
    await writeFile(path.join(projectDirectory, 'background.mp4'), '');

    const project = await loadRenderProject({
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
      loadRenderProject({
        project: 'missing-input',
        rootDirectory,
      }),
    ).rejects.toThrow('background.mp4 is required');
  });

  test('rejects unsafe project references', async () => {
    await expect(
      loadRenderProject({
        project: 'projects/../demo',
        rootDirectory,
      }),
    ).rejects.toThrow('safe project ID');
  });

  test('resolves render project files without requiring generated subtitle files', async () => {
    await createCaptionBlocksProject('renderable');
    const projectDirectory = path.join(rootDirectory, 'projects', 'renderable');
    await writeFile(path.join(projectDirectory, 'background.mp4'), '');
    await mkdir(path.join(projectDirectory, 'audio'), { recursive: true });

    const project = await loadRenderProject({
      project: 'renderable',
      rootDirectory,
    });

    expect(project.backgroundPath).toBe(
      path.join(projectDirectory, 'background.mp4'),
    );
    expect(project.captionBlocksPath).toBe(
      path.join(projectDirectory, 'caption-blocks.json'),
    );
    expect(project.audioDirectory).toBe(path.join(projectDirectory, 'audio'));
  });

  test('rejects project input symlinks that escape the project directory', async () => {
    await resetRoot();
    const projectDirectory = path.join(rootDirectory, 'projects', 'escape');
    const outsideDirectory = path.join(rootDirectory, 'outside');
    await mkdir(projectDirectory, { recursive: true });
    await mkdir(outsideDirectory, { recursive: true });
    await writeFile(path.join(outsideDirectory, 'background.mp4'), '');
    await writeFile(
      path.join(projectDirectory, 'caption-blocks.json'),
      JSON.stringify({
        blocks: [{ caption: 'first', file_name: 'first' }],
        format: 'caption_blocks/v1',
      }),
    );
    await symlink(
      path.join(outsideDirectory, 'background.mp4'),
      path.join(projectDirectory, 'background.mp4'),
    );

    await expect(
      loadRenderProject({
        project: 'escape',
        rootDirectory,
      }),
    ).rejects.toThrow('stay inside projects');
  });
});

async function createCaptionBlocksProject(id: string): Promise<void> {
  await resetRoot();
  const directory = path.join(rootDirectory, 'projects', id);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'caption-blocks.json'),
    JSON.stringify({
      blocks: [
        {
          caption: 'first',
          file_name: 'first',
        },
      ],
      format: 'caption_blocks/v1',
    }),
  );
}

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
