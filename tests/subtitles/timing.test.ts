import { describe, expect, test } from 'bun:test';
import {
  assertCuesFitVideo,
  toFrameCues,
} from '../../src/rvs/subtitles/timing';

describe('subtitle timing', () => {
  test('converts SRT millisecond timing to frame timing', () => {
    expect(
      toFrameCues({
        cues: [
          {
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
        durationInFrames: 30,
        id: '1',
        startFrame: 15,
        text: 'hello',
      },
    ]);
  });

  test('rejects captions that exceed the video duration', () => {
    expect(() =>
      assertCuesFitVideo({
        cues: [
          {
            durationInFrames: 31,
            id: '1',
            startFrame: 0,
            text: 'hello',
          },
        ],
        durationInFrames: 30,
      }),
    ).toThrow('ends after the background video duration');
  });

  test('rejects cues that overlap after frame conversion', () => {
    expect(() =>
      toFrameCues({
        cues: [
          {
            endMs: 10,
            id: '1',
            startMs: 0,
            text: 'first',
          },
          {
            endMs: 20,
            id: '2',
            startMs: 11,
            text: 'second',
          },
        ],
        fps: 30,
      }),
    ).toThrow('overlaps after frame conversion');
  });
});
