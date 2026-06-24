import { describe, expect, test } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readProjectNarrationCues } from '../../src/narration/project-timeline';

const rootDirectory = path.join(
  process.cwd(),
  '.tmp',
  'tests',
  'narration-project-timeline',
);

describe('readProjectNarrationCues', () => {
  test('keeps captions for subtitle text when narration is provided', async () => {
    await resetRoot();
    const projectDirectory = path.join(rootDirectory, 'projects', 'demo');
    const audioDirectory = path.join(projectDirectory, 'audio');
    await mkdir(audioDirectory, { recursive: true });
    await writeFile(
      path.join(projectDirectory, 'caption-blocks.json'),
      JSON.stringify({
        blocks: [
          {
            caption: '字幕',
            file_name: 'first',
            narration: '読み上げる音声',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    );
    await writeFile(path.join(audioDirectory, '01_first.mp3'), '');

    const cues = await readProjectNarrationCues({
      project: {
        audioDirectory,
        captionBlocksPath: path.join(projectDirectory, 'caption-blocks.json'),
        id: 'demo',
      },
      readDuration: async () => 1.25,
    });

    expect(cues).toEqual([
      {
        audioFile: 'audio/01_first.mp3',
        endMs: 1250,
        id: '1',
        startMs: 0,
        text: '字幕',
      },
    ]);
  });
});

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
