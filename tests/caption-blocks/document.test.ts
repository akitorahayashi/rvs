import { describe, expect, test } from 'bun:test';
import { parseCaptionBlockDocument } from '../../src/rvs/caption-blocks/document';

describe('parseCaptionBlockDocument', () => {
  test('parses caption block documents', () => {
    expect(
      parseCaptionBlockDocument({
        blocks: [
          {
            file_name: ' 01_demo.mp3 ',
            text: ' 丸呑みされる！？ ',
          },
          {
            file_name: '02_intro.mp3',
            text: 'でも実はこれ',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toEqual([
      {
        fileName: '01_demo.mp3',
        text: '丸呑みされる！？',
      },
      {
        fileName: '02_intro.mp3',
        text: 'でも実はこれ',
      },
    ]);
  });

  test('rejects file names whose numbers do not match block positions', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            file_name: '01_first.mp3',
            text: 'first',
          },
          {
            file_name: '03_third.mp3',
            text: 'third',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('file_name number must match the block position');
  });

  test('rejects text longer than 15 characters', () => {
    expect(() =>
      parseCaptionBlockDocument({
        blocks: [
          {
            file_name: '01_demo.mp3',
            text: '1234567890123456',
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
            file_name: '../demo.mp3',
            text: 'hello',
          },
        ],
        format: 'caption_blocks/v1',
      }),
    ).toThrow('numbered MP3 filename');
  });
});
