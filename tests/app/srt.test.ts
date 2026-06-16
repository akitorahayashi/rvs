import { describe, expect, test } from 'bun:test';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { writeProjectSrt } from '../../src/rvs/app/srt';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'srt');

describe('writeProjectSrt', () => {
  test('writes captions.srt from caption blocks and audio durations', async () => {
    await resetRoot();
    await createProject('demo');

    const result = await writeProjectSrt({
      project: 'demo',
      readDuration: async (_audioPath: string, displayPath: string) =>
        displayPath.endsWith('01_first.mp3') ? 1.2 : 0.8,
      rootDirectory,
    });

    expect(result.captionsLocation).toBe('projects/demo/captions.srt');
    expect(
      await readFile(
        path.join(rootDirectory, 'projects', 'demo', 'captions.srt'),
        'utf8',
      ),
    ).toBe(
      [
        '1',
        '00:00:00,000 --> 00:00:01,200',
        'first',
        '',
        '2',
        '00:00:01,200 --> 00:00:02,000',
        'second',
        '',
      ].join('\n'),
    );
  });
});

async function createProject(id: string): Promise<void> {
  const directory = path.join(rootDirectory, 'projects', id);
  await mkdir(path.join(directory, 'audio'), { recursive: true });
  await writeFile(
    path.join(directory, 'caption-blocks.json'),
    JSON.stringify({
      blocks: [
        {
          file_name: '01_first.mp3',
          text: 'first',
        },
        {
          file_name: '02_second.mp3',
          text: 'second',
        },
      ],
      format: 'caption_blocks/v1',
    }),
  );
  await writeFile(path.join(directory, 'audio', '01_first.mp3'), '');
  await writeFile(path.join(directory, 'audio', '02_second.mp3'), '');
}

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
