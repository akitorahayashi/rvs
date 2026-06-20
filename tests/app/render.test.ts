import { describe, expect, test } from 'bun:test';
import { assertBgmCoversRenderDuration } from '../../src/rvs/app/render';

describe('assertBgmCoversRenderDuration', () => {
  test('accepts missing bgm input', async () => {
    await expect(
      assertBgmCoversRenderDuration({
        durationInFrames: 300,
        fps: 30,
        projectId: 'whale',
      }),
    ).resolves.toBeUndefined();
  });

  test('accepts bgm that covers the render duration', async () => {
    const calls: Array<{ audioPath: string; displayPath: string }> = [];

    await expect(
      assertBgmCoversRenderDuration({
        bgmPath: '/root/projects/whale/bgm.mp3',
        durationInFrames: 300,
        fps: 30,
        projectId: 'whale',
        readDuration: async (audioPath: string, displayPath: string) => {
          calls.push({ audioPath, displayPath });
          return 12;
        },
      }),
    ).resolves.toBeUndefined();

    expect(calls).toEqual([
      {
        audioPath: '/root/projects/whale/bgm.mp3',
        displayPath: 'projects/whale/bgm.mp3',
      },
    ]);
  });

  test('rejects bgm shorter than the rendered background duration', async () => {
    await expect(
      assertBgmCoversRenderDuration({
        bgmPath: '/root/projects/whale/bgm.mp3',
        durationInFrames: 301,
        fps: 30,
        projectId: 'whale',
        readDuration: async () => 10,
      }),
    ).rejects.toThrow('projects/whale/bgm.mp3 must be at least 10.033 seconds');
  });
});
