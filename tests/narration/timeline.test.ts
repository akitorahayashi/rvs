import { describe, expect, test } from 'bun:test';
import type { NarrationCue } from '../../src/narration/cue';
import {
  scheduleNarrationCues,
  toFrameNarrationCues,
} from '../../src/narration/timeline';

describe('scheduleNarrationCues', () => {
  test('uses audio durations to schedule narration sequentially', () => {
    const cues = scheduleNarrationCues([
      {
        audioFile: 'narration/01_first.mp3',
        durationMs: 1200.2,
        text: 'first',
      },
      {
        audioFile: 'narration/02_second.mp3',
        durationMs: 800,
        text: 'second',
      },
      {
        audioFile: 'narration/03_third.mp3',
        durationMs: 500,
        text: 'third',
      },
    ]);

    expect(cues).toEqual([
      {
        audioFile: 'narration/01_first.mp3',
        endMs: 1200,
        id: '1',
        startMs: 0,
        text: 'first',
      },
      {
        audioFile: 'narration/02_second.mp3',
        endMs: 2000,
        id: '2',
        startMs: 1200,
        text: 'second',
      },
      {
        audioFile: 'narration/03_third.mp3',
        endMs: 2500,
        id: '3',
        startMs: 2000,
        text: 'third',
      },
    ]);
  });

  test('keeps a precise cursor so rounding does not accumulate drift', () => {
    const cues = scheduleNarrationCues(
      Array.from({ length: 100 }, (_, index) => ({
        audioFile: `narration/${index}.mp3`,
        durationMs: 1200.2,
        text: String(index),
      })),
    );

    expect(cues[cues.length - 1]?.endMs).toBe(120_020);
  });
});

describe('toFrameNarrationCues', () => {
  test('converts narration timing to frame timing', () => {
    expect(
      toFrameNarrationCues({
        cues: [
          {
            audioFile: 'narration/01_first.mp3',
            endMs: 1500,
            id: '1',
            startMs: 500,
            text: 'hello',
          },
        ],
        fps: 30,
      }),
    ).toEqual([
      {
        audioFile: 'narration/01_first.mp3',
        durationInFrames: 30,
        id: '1',
        startFrame: 15,
      },
    ]);
  });
});

describe('narration cue data', () => {
  test('preserves text and timing for downstream rendering', () => {
    const cues: NarrationCue[] = [
      {
        audioFile: 'narration/01_first.mp3',
        endMs: 1201,
        id: '1',
        startMs: 0,
        text: 'first',
      },
    ];

    expect(cues[0]).toEqual({
      audioFile: 'narration/01_first.mp3',
      endMs: 1201,
      id: '1',
      startMs: 0,
      text: 'first',
    });
  });
});
