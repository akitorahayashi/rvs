import { describe, expect, test } from 'bun:test';
import { parseCaptionedVideoRenderProps } from '../src/captioned-video/render-props';

const sampleBgmVolume = 0.35;
const sampleSourceVideoVolume = 0.75;
const sampleNarrationVolume = 1.25;

describe('captioned video render props', () => {
  test('accepts valid render props', () => {
    expect(
      parseCaptionedVideoRenderProps({
        sourceVideo: 'media/reaction_vertical_short/source/demo.mp4',
        sourceVideoVolume: sampleSourceVideoVolume,
        bgm: 'media/bgm/music.mp3',
        bgmVolume: sampleBgmVolume,
        captionPosition: {
          bottomPercent: 18,
          horizontalInset: 48,
          type: 'bottomBand',
        },
        captionStrokeWidthPx: 0,
        captions: [
          {
            durationInFrames: 30,
            id: '1',
            startFrame: 0,
            text: 'hello',
          },
        ],
        durationInFrames: 30,
        fps: 30,
        height: 1280,
        narration: [
          {
            audioFile:
              'content/reaction_vertical_short/active/demo/narration/01_demo.mp3',
            durationInFrames: 30,
            id: '1',
            startFrame: 0,
          },
        ],
        narrationVolume: sampleNarrationVolume,
        width: 720,
      }),
    ).toEqual({
      sourceVideo: 'media/reaction_vertical_short/source/demo.mp4',
      sourceVideoVolume: sampleSourceVideoVolume,
      bgm: 'media/bgm/music.mp3',
      bgmVolume: sampleBgmVolume,
      captionPosition: {
        bottomPercent: 18,
        horizontalInset: 48,
        type: 'bottomBand',
      },
      captionStrokeWidthPx: 0,
      captions: [
        {
          durationInFrames: 30,
          id: '1',
          startFrame: 0,
          text: 'hello',
        },
      ],
      durationInFrames: 30,
      fps: 30,
      height: 1280,
      narration: [
        {
          audioFile:
            'content/reaction_vertical_short/active/demo/narration/01_demo.mp3',
          durationInFrames: 30,
          id: '1',
          startFrame: 0,
        },
      ],
      narrationVolume: sampleNarrationVolume,
      width: 720,
    });
  });

  test('rejects invalid cue structure and frame values', () => {
    expect(() =>
      parseCaptionedVideoRenderProps({
        sourceVideo: 'media/reaction_vertical_short/source/demo.mp4',
        sourceVideoVolume: sampleSourceVideoVolume,
        bgm: 'media/bgm/music.mp3',
        captions: [
          {
            durationInFrames: 0,
            id: '1',
            startFrame: 0,
            text: 'hello',
          },
        ],
        durationInFrames: 30,
        fps: 30,
        height: 1280,
        narration: [],
        narrationVolume: sampleNarrationVolume,
        width: 720,
        bgmVolume: sampleBgmVolume,
        captionPosition: {
          bottomPercent: 18,
          horizontalInset: 48,
          type: 'bottomBand',
        },
        captionStrokeWidthPx: 0,
      }),
    ).toThrow('captions.0.durationInFrames');

    expect(() =>
      parseCaptionedVideoRenderProps({
        sourceVideo: 'media/reaction_vertical_short/source/demo.mp4',
        sourceVideoVolume: sampleSourceVideoVolume,
        bgm: ' ',
        bgmVolume: sampleBgmVolume,
        captionPosition: {
          bottomPercent: 18,
          horizontalInset: 48,
          type: 'bottomBand',
        },
        captionStrokeWidthPx: 0,
        captions: [],
        durationInFrames: 30,
        fps: 30,
        height: 1280,
        narration: [],
        narrationVolume: sampleNarrationVolume,
        width: 720,
      }),
    ).toThrow('bgm');

    expect(() =>
      parseCaptionedVideoRenderProps({
        sourceVideo: 'media/reaction_vertical_short/source/demo.mp4',
        sourceVideoVolume: sampleSourceVideoVolume,
        bgm: 'media/bgm/music.mp3',
        bgmVolume: -0.1,
        captionPosition: {
          bottomPercent: 18,
          horizontalInset: 48,
          type: 'bottomBand',
        },
        captionStrokeWidthPx: 0,
        captions: [],
        durationInFrames: 30,
        fps: 30,
        height: 1280,
        narration: [],
        narrationVolume: sampleNarrationVolume,
        width: 720,
      }),
    ).toThrow('bgmVolume');

    expect(() =>
      parseCaptionedVideoRenderProps({
        sourceVideo: 'media/reaction_vertical_short/source/demo.mp4',
        sourceVideoVolume: -0.1,
        bgm: 'media/bgm/music.mp3',
        bgmVolume: sampleBgmVolume,
        captionPosition: {
          bottomPercent: 18,
          horizontalInset: 48,
          type: 'bottomBand',
        },
        captionStrokeWidthPx: 0,
        captions: [],
        durationInFrames: 30,
        fps: 30,
        height: 1280,
        narration: [],
        narrationVolume: sampleNarrationVolume,
        width: 720,
      }),
    ).toThrow('sourceVideoVolume');

    expect(() =>
      parseCaptionedVideoRenderProps({
        sourceVideo: 'media/reaction_vertical_short/source/demo.mp4',
        sourceVideoVolume: sampleSourceVideoVolume,
        bgm: 'media/bgm/music.mp3',
        bgmVolume: sampleBgmVolume,
        captionPosition: {
          bottomPercent: 18,
          horizontalInset: 48,
          type: 'bottomBand',
        },
        captionStrokeWidthPx: 0,
        captions: [],
        durationInFrames: 30,
        fps: 30,
        height: 1280,
        narration: [
          {
            audioFile: '',
            durationInFrames: 30,
            id: '1',
            startFrame: 0,
          },
        ],
        narrationVolume: sampleNarrationVolume,
        width: 720,
      }),
    ).toThrow('narration.0.audioFile');
  });
});
