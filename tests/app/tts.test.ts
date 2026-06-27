import { describe, expect, test } from 'bun:test';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runTts } from '../../src/app/tts';
import type { VoicevoxProfile } from '../../src/voicevox/profile';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'tts');
const createSilentProgress = () => ({
  advance() {},
  finish() {},
});

describe('runTts', () => {
  test('generates numbered MP3 files from captions', async () => {
    await resetRoot();
    await createCaptionsProject('demo');
    await mkdir(path.join(projectDirectory('demo'), 'narration'), {
      recursive: true,
    });
    await writeFile(
      path.join(projectDirectory('demo'), 'narration', 'stale.mp3'),
      'stale',
    );

    const result = await runTts({
      captions:
        'content/reaction_vertical_short/active/demo/demo.captions.json',
      createProgress: createSilentProgress,
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

    expect(result.narrationLocation).toBe(
      'content/reaction_vertical_short/active/demo/narration',
    );
    expect(
      await readFile(
        path.join(projectDirectory('demo'), 'narration', '01_first.mp3'),
      ),
    ).toEqual(Buffer.from([5]));
    expect(
      await readFile(
        path.join(projectDirectory('demo'), 'narration', '02_second.mp3'),
      ),
    ).toEqual(Buffer.from([6]));
    await expect(
      readFile(path.join(projectDirectory('demo'), 'narration', 'stale.mp3')),
    ).rejects.toThrow();
  });

  test('uses narration when provided for synthesis', async () => {
    await resetRoot();
    await createCaptionsProject('spoken', [
      {
        caption: '字幕',
        file_name: 'first',
        narration: '読み上げる音声',
      },
    ]);

    const synthesizedTexts: string[] = [];

    await runTts({
      captions:
        'content/reaction_vertical_short/active/spoken/spoken.captions.json',
      createProgress: createSilentProgress,
      rootDirectory,
      synthesize: async (
        _engineUrl: string,
        text: string,
        _profile: VoicevoxProfile,
      ) => {
        synthesizedTexts.push(text);
        return new Uint8Array([text.length]);
      },
      writeMp3: async (wavBytes: Uint8Array, outputPath: string) => {
        await writeFile(outputPath, wavBytes);
      },
    });

    expect(synthesizedTexts).toEqual(['読み上げる音声']);
  });
});

async function createCaptionsProject(
  id: string,
  blocks: Array<{
    caption: string;
    file_name: string;
    narration?: string;
  }> = [
    {
      caption: 'first',
      file_name: 'first',
      narration: 'first',
    },
    {
      caption: 'second',
      file_name: 'second',
      narration: 'second',
    },
  ],
): Promise<void> {
  const directory = projectDirectory(id);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, `${id}.captions.json`),
    JSON.stringify({
      blocks,
      tts_format: 'caption_narration/v1',
    }),
  );
}

function projectDirectory(id: string): string {
  return path.join(
    rootDirectory,
    'content',
    'reaction_vertical_short',
    'active',
    id,
  );
}

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
