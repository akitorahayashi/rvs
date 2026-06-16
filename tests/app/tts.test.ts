import { describe, expect, test } from 'bun:test';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runTts } from '../../src/rvs/app/tts';
import type { VoicevoxProfile } from '../../src/rvs/voicevox/profile';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'tts');

describe('runTts', () => {
  test('generates numbered MP3 files from caption blocks', async () => {
    await resetRoot();
    await createCaptionBlocksProject('demo');
    await mkdir(path.join(rootDirectory, 'projects', 'demo', 'audio'), {
      recursive: true,
    });
    await writeFile(
      path.join(rootDirectory, 'projects', 'demo', 'audio', 'stale.mp3'),
      'stale',
    );

    const result = await runTts({
      project: 'demo',
      rootDirectory,
      synthesize: async (
        _engineUrl: string,
        text: string,
        _profile: VoicevoxProfile,
      ) => {
        return new Uint8Array([text.length]);
      },
      writeMp3: async (wavBytes: Uint8Array, outputPath: string) => {
        await writeFile(outputPath, wavBytes);
      },
    });

    expect(result.audioLocation).toBe('projects/demo/audio');
    expect(
      await readFile(
        path.join(rootDirectory, 'projects', 'demo', 'audio', '01_first.mp3'),
      ),
    ).toEqual(Buffer.from([5]));
    expect(
      await readFile(
        path.join(rootDirectory, 'projects', 'demo', 'audio', '02_second.mp3'),
      ),
    ).toEqual(Buffer.from([6]));
    await expect(
      readFile(
        path.join(rootDirectory, 'projects', 'demo', 'audio', 'stale.mp3'),
      ),
    ).rejects.toThrow();
  });
});

async function createCaptionBlocksProject(id: string): Promise<void> {
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
        {
          file_name: '02_second.mp3',
          text: 'second',
        },
      ],
      format: 'caption_blocks/v1',
    }),
  );
}

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
