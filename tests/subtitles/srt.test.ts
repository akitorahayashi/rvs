import { describe, expect, test } from 'bun:test';
import { parseSrt } from '../../src/rvs/subtitles/srt';

describe('parseSrt', () => {
  test('parses timed caption cues', () => {
    expect(
      parseSrt(
        '1\n00:00:00,000 --> 00:00:01,250\nhello\n\n2\n00:00:01,250 --> 00:00:02,000\nworld\n',
      ),
    ).toEqual([
      {
        endMs: 1250,
        id: '1',
        startMs: 0,
        text: 'hello',
      },
      {
        endMs: 2000,
        id: '2',
        startMs: 1250,
        text: 'world',
      },
    ]);
  });

  test('parses cue blocks separated by whitespace-only lines', () => {
    expect(
      parseSrt(
        '1\n00:00:00,000 --> 00:00:01,000\nhello\n  \n2\n00:00:01,000 --> 00:00:02,000\nworld\n',
      ),
    ).toHaveLength(2);
  });

  test('rejects duplicate cue indexes', () => {
    expect(() =>
      parseSrt(
        '1\n00:00:00,000 --> 00:00:01,000\nhello\n\n1\n00:00:01,000 --> 00:00:02,000\nworld\n',
      ),
    ).toThrow('cue index 1 is not unique');
  });

  test('rejects invalid timestamps', () => {
    expect(() => parseSrt('1\n00:00:00.000 --> 00:00:01,000\nhello\n')).toThrow(
      "invalid timestamp '00:00:00.000'",
    );
  });

  test('rejects overlapping cues', () => {
    expect(() =>
      parseSrt(
        '1\n00:00:00,000 --> 00:00:02,000\nhello\n\n2\n00:00:01,000 --> 00:00:03,000\nworld\n',
      ),
    ).toThrow('starts before the previous cue ends');
  });
});
