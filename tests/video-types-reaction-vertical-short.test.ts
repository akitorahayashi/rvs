import { describe, expect, test } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadVideoProject } from '../src/video-types/registry';

const rootDirectory = path.join(
  process.cwd(),
  '.tmp',
  'tests',
  'reaction-vertical-short',
);

describe('loadVideoProject', () => {
  test('resolves content manifest files to isolated media files', async () => {
    await createProject();

    const loaded = await loadVideoProject({
      projectFile:
        'content/reaction_vertical_short/active/demo/demo.project.ts',
      rootDirectory,
    });
    const project = loaded.captionedVideo;

    expect(project.id).toBe('demo');
    expect(project.paths.source).toBe(
      path.join(
        rootDirectory,
        'media',
        'reaction_vertical_short',
        'source',
        'demo.mp4',
      ),
    );
    expect(project.paths.bgm).toBe(
      path.join(rootDirectory, 'media', 'bgm', 'music.mp3'),
    );
    expect(project.paths.captions).toBe(
      path.join(
        rootDirectory,
        'content',
        'reaction_vertical_short',
        'active',
        'demo',
        'demo.captions.json',
      ),
    );
    expect(project.paths.output).toBe(
      path.join(
        rootDirectory,
        'media',
        'reaction_vertical_short',
        'output',
        'Demo Video.mp4',
      ),
    );
    expect(project.displayPaths.source).toBe(
      'media/reaction_vertical_short/source/demo.mp4',
    );
    expect(project.displayPaths.bgm).toBe('media/bgm/music.mp3');
  });

  test('rejects source paths embedded in the manifest', async () => {
    await createProject({
      id: 'invalid-source',
      source: '../demo.mp4',
    });

    await expect(
      loadVideoProject({
        projectFile:
          'content/reaction_vertical_short/active/invalid-source/invalid-source.project.ts',
        rootDirectory,
      }),
    ).rejects.toThrow('video.source');
  });
});

async function createProject(
  overrides: { id?: string; source?: string } = {},
): Promise<void> {
  await resetRoot();
  const id = overrides.id ?? 'demo';
  const projectDirectory = path.join(
    rootDirectory,
    'content',
    'reaction_vertical_short',
    'active',
    id,
  );
  await mkdir(projectDirectory, { recursive: true });
  await mkdir(
    path.join(rootDirectory, 'media', 'reaction_vertical_short', 'source'),
    { recursive: true },
  );
  await mkdir(path.join(rootDirectory, 'media', 'bgm'), { recursive: true });
  await writeFile(
    path.join(
      rootDirectory,
      'media',
      'reaction_vertical_short',
      'source',
      'demo.mp4',
    ),
    '',
  );
  await writeFile(path.join(rootDirectory, 'media', 'bgm', 'music.mp3'), '');
  await writeFile(path.join(projectDirectory, `${id}.captions.json`), '{}');
  await writeFile(
    path.join(projectDirectory, `${id}.project.ts`),
    `export default {
      id: ${JSON.stringify(id)},
      type: "reaction_vertical_short",
      video: {
        name: "Demo Video",
        source: ${JSON.stringify(overrides.source ?? 'demo.mp4')},
        sourceVolume: 0.3,
      },
      audio: {
        bgm: "music.mp3",
        bgmVolume: 0.55,
      },
      captions: {
        strokeWidthPx: 0,
      },
    };\n`,
  );
}

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
