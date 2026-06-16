import { describe, expect, test } from 'bun:test';
import type { NarrationCue } from '../../src/rvs/narration/cue';
import {
  scheduleNarrationCues,
  toFrameNarrationCues,
} from '../../src/rvs/narration/timeline';

describe('scheduleNarrationCues', () => {
  test('uses audio durations to schedule narration sequentially', () => {
    const cues = scheduleNarrationCues([
      {
        audioFile: 'audio/01_first.mp3',
        durationMs: 1200.2,
        text: 'first',
      },
      {
        audioFile: 'audio/02_second.mp3',
        durationMs: 800,
        text: 'second',
      },
      {
        audioFile: 'audio/03_third.mp3',
        durationMs: 500,
        text: 'third',
      },
    ]);

    expect(cues).toEqual([
      {
        audioFile: 'audio/01_first.mp3',
        endMs: 1201,
        id: '1',
        startMs: 0,
        text: 'first',
      },
      {
        audioFile: 'audio/02_second.mp3',
        endMs: 2001,
        id: '2',
        startMs: 1201,
        text: 'second',
      },
      {
        audioFile: 'audio/03_third.mp3',
        endMs: 2501,
        id: '3',
        startMs: 2001,
        text: 'third',
      },
    ]);
  });
});

describe('toFrameNarrationCues', () => {
  test('converts narration timing to frame timing', () => {
    expect(
      toFrameNarrationCues({
        cues: [
          {
            audioFile: 'audio/01_first.mp3',
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
        audioFile: 'audio/01_first.mp3',
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
        audioFile: 'audio/01_first.mp3',
        endMs: 1201,
        id: '1',
        startMs: 0,
        text: 'first',
      },
    ];

    expect(cues[0]).toEqual({
      audioFile: 'audio/01_first.mp3',
      endMs: 1201,
      id: '1',
      startMs: 0,
      text: 'first',
    });
  });
});
