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
    const projectDirectory = path.join(
      rootDirectory,
      'content',
      'reaction_vertical_short',
      'active',
      'demo',
    );
    const narrationDirectory = path.join(projectDirectory, 'narration');
    await mkdir(narrationDirectory, { recursive: true });
    await writeFile(
      path.join(projectDirectory, 'demo.captions.json'),
      JSON.stringify({
        blocks: [
          {
            caption: '字幕',
            file_name: 'first',
            narration: '読み上げる音声',
          },
        ],
        tts_format: 'caption_narration/v1',
      }),
    );
    await writeFile(path.join(narrationDirectory, '01_first.mp3'), '');

    const cues = await readProjectNarrationCues({
      project: {
        captionsPath: path.join(projectDirectory, 'demo.captions.json'),
        displayPaths: {
          narrationDirectory:
            'content/reaction_vertical_short/active/demo/narration',
        },
        id: 'demo',
        narrationDirectory,
      },
      readDuration: async () => 1.25,
    });

    expect(cues).toEqual([
      {
        audioFile: 'narration/01_first.mp3',
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
