import { describe, expect, test } from 'bun:test';
import { parseCaptionBlockDocument } from '../../src/caption-blocks/document';

describe('parseCaptionBlockDocument', () => {
  test('parses caption block documents', () => {
    expect(
      parseCaptionBlockDocument({
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
        format: 'caption_blocks/v1',
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
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: 'first',
            file_name: 'same',
          },
          {
            caption: 'second',
            file_name: 'same',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow("file_name 'same' is not unique");
  });

  test('rejects captions longer than 15 characters', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: '1234567890123456',
            file_name: 'demo',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('15 characters or fewer');
  });

  test('rejects file names with extensions or path separators', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: 'hello',
            file_name: '../demo.mp3',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('lower snake name');
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: 'hello',
            file_name: 'demo.mp3',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('lower snake name');
  });

  test('rejects file names that are not lower snake names', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: 'hello',
            file_name: 'DemoName',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('lower snake name');
  });

  test('rejects empty narration when the key is provided', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: 'hello',
            file_name: 'demo',
            narration: '   ',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('narration must not be empty');
  });

  test('rejects unknown document and block properties', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: 'hello',
            extra: true,
            file_name: 'demo',
          },
        ],
        format: 'caption_blocks/v1',
        version: 1,
      }),
    ).toThrow('Unrecognized');
  });
});
