import { describe, expect, test } from 'bun:test';
import { parseCaptionBlockDocument } from '../../src/rvs/caption-blocks/document';

describe('parseCaptionBlockDocument', () => {
  test('parses caption block documents', () => {
    expect(
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: ' 無料のベビーシッター ',
            file_name: ' 01_muryo_babysitter.mp3 ',
            narration: ' 「無料のベビーシッター」 ',
          },
          {
            caption: '預けているんだとか',
            file_name: '02_azukete.mp3',
            narration: '預けているんだとか。',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toEqual([
      {
        caption: '無料のベビーシッター',
        fileName: '01_muryo_babysitter.mp3',
        narration: '「無料のベビーシッター」',
      },
      {
        caption: '預けているんだとか',
        fileName: '02_azukete.mp3',
        narration: '預けているんだとか。',
      },
    ]);
  });

  test('rejects file names whose numbers do not match block positions', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: 'first',
            file_name: '01_first.mp3',
          },
          {
            caption: 'third',
            file_name: '03_third.mp3',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('file_name number must match the block position');
  });

  test('rejects captions longer than 15 characters', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: '1234567890123456',
            file_name: '01_demo.mp3',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('15 characters or fewer');
  });

  test('rejects unsafe file names', () => {
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
    ).toThrow('numbered MP3 filename');
  });

  test('rejects empty narration when the key is provided', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            caption: 'hello',
            file_name: '01_demo.mp3',
            narration: '   ',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('narration must not be empty');
  });
});
