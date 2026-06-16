import { describe, expect, test } from 'bun:test';
import { formatSrt } from '../../src/rvs/subtitles/format';
import { scheduleSubtitleCues } from '../../src/rvs/subtitles/schedule';

describe('scheduleSubtitleCues', () => {
  test('uses audio durations to schedule subtitles sequentially', () => {
    const cues = scheduleSubtitleCues([
      {
        durationMs: 1200.2,
        fileName: '01_first.mp3',
        text: 'first',
      },
      {
        durationMs: 800,
        fileName: '02_second.mp3',
        text: 'second',
      },
      {
        durationMs: 500,
        fileName: '03_third.mp3',
        text: 'third',
      },
    ]);

    expect(cues).toEqual([
      {
        endMs: 1201,
        id: '1',
        startMs: 0,
        text: 'first',
      },
      {
        endMs: 2001,
        id: '2',
        startMs: 1201,
        text: 'second',
      },
      {
        endMs: 2501,
        id: '3',
        startMs: 2001,
        text: 'third',
      },
    ]);
  });
});

describe('formatSrt', () => {
  test('formats subtitle cues as SRT', () => {
    expect(
      formatSrt([
        {
          endMs: 1201,
          id: '1',
          startMs: 0,
          text: 'first',
        },
      ]),
    ).toBe('1\n00:00:00,000 --> 00:00:01,201\nfirst\n');
  });
});
