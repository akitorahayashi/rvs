import { describe, expect, test } from 'bun:test';
import { parseCaptionBlocks } from '../../src/speech/formats/caption-narration-v1';

describe('parseCaptionBlocks', () => {
  test('parses caption narration documents', () => {
    expect(
      parseCaptionBlocks({
        blocks: [
          {
            caption: ' 無料のベビーシッター ',
            file_name: ' muryo_babysitter ',
            narration: ' 「無料のベビーシッター」 ',
          },
          {
            caption: '預けているんだとか',
            file_name: 'azukete',
            narration: '預けているんだとか。',
          },
        ],
        tts_format: 'caption_narration/v1',
      }),
    ).toEqual([
      {
        caption: '無料のベビーシッター',
        fileName: 'muryo_babysitter',
        narration: '「無料のベビーシッター」',
      },
      {
        caption: '預けているんだとか',
        fileName: 'azukete',
        narration: '預けているんだとか。',
      },
    ]);
  });

  test('rejects duplicate file names', () => {
    expect(() =>
      parseCaptionBlocks({
        blocks: [
          {
            caption: 'first',
            file_name: 'same',
            narration: 'first',
          },
          {
            caption: 'second',
            file_name: 'same',
            narration: 'second',
          },
        ],
        tts_format: 'caption_narration/v1',
      }),
    ).toThrow("duplicate file_name 'same'");
  });

  test('rejects captions longer than 15 display characters', () => {
    expect(() =>
      parseCaptionBlocks({
        blocks: [
          {
            caption: '1234567890123456',
            file_name: 'demo',
            narration: 'demo',
          },
        ],
        tts_format: 'caption_narration/v1',
      }),
    ).toThrow('15 characters');
  });

  test('allows line breaks without counting them as display characters', () => {
    expect(
      parseCaptionBlocks({
        blocks: [
          {
            caption: '12345678\n9012345',
            file_name: 'demo',
            narration: 'demo',
          },
        ],
        tts_format: 'caption_narration/v1',
      }),
    ).toHaveLength(1);
  });

  test('rejects empty caption lines', () => {
    expect(() =>
      parseCaptionBlocks({
        blocks: [
          {
            caption: 'hello\n\nworld',
            file_name: 'demo',
            narration: 'demo',
          },
        ],
        tts_format: 'caption_narration/v1',
      }),
    ).toThrow('caption lines must not be empty');
  });

  test('rejects file names with extensions or path separators', () => {
    expect(() =>
      parseCaptionBlocks({
        blocks: [
          {
            caption: 'hello',
            file_name: '../demo.mp3',
            narration: 'hello',
          },
        ],
        tts_format: 'caption_narration/v1',
      }),
    ).toThrow('file_name');
    expect(() =>
      parseCaptionBlocks({
        blocks: [
          {
            caption: 'hello',
            file_name: 'demo.mp3',
            narration: 'hello',
          },
        ],
        tts_format: 'caption_narration/v1',
      }),
    ).toThrow('file_name');
  });

  test('rejects missing narration', () => {
    expect(() =>
      parseCaptionBlocks({
        blocks: [
          {
            caption: 'hello',
            file_name: 'demo',
          },
        ],
        tts_format: 'caption_narration/v1',
      }),
    ).toThrow('narration');
  });

  test('rejects unknown document and block properties', () => {
    expect(() =>
      parseCaptionBlocks({
        blocks: [
          {
            caption: 'hello',
            extra: true,
            file_name: 'demo',
            narration: 'hello',
          },
        ],
        tts_format: 'caption_narration/v1',
        version: 1,
      }),
    ).toThrow('Unrecognized');
  });
});
