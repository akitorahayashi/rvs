import { describe, expect, test } from 'bun:test';
import {
  createRenderProps,
  parseShortRenderProps,
} from '../../src/remotion/props';

const sampleBgmVolume = 0.35;
const sampleBackgroundVideoVolume = 0.75;
const sampleNarrationVolume = 1.25;

describe('Remotion props', () => {
  test('accepts valid render props', () => {
    expect(
      createRenderProps({
        backgroundVideo: 'background.mp4',
        backgroundVideoVolume: sampleBackgroundVideoVolume,
        bgm: 'bgm.mp3',
        bgmVolume: sampleBgmVolume,
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
            audioFile: 'audio/01_demo.mp3',
            durationInFrames: 30,
            id: '1',
            startFrame: 0,
          },
        ],
        narrationVolume: sampleNarrationVolume,
        width: 720,
      }),
    ).toEqual({
      backgroundVideo: 'background.mp4',
      backgroundVideoVolume: sampleBackgroundVideoVolume,
      bgm: 'bgm.mp3',
      bgmVolume: sampleBgmVolume,
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
          audioFile: 'audio/01_demo.mp3',
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
      parseShortRenderProps({
        backgroundVideo: 'background.mp4',
        backgroundVideoVolume: sampleBackgroundVideoVolume,
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
      }),
    ).toThrow('captions.0.durationInFrames');

    expect(() =>
      parseShortRenderProps({
        backgroundVideo: 'background.mp4',
        backgroundVideoVolume: sampleBackgroundVideoVolume,
        bgm: ' ',
        bgmVolume: sampleBgmVolume,
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
      parseShortRenderProps({
        backgroundVideo: 'background.mp4',
        backgroundVideoVolume: sampleBackgroundVideoVolume,
        bgmVolume: -0.1,
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
      parseShortRenderProps({
        backgroundVideo: 'background.mp4',
        backgroundVideoVolume: -0.1,
        bgmVolume: sampleBgmVolume,
        captions: [],
        durationInFrames: 30,
        fps: 30,
        height: 1280,
        narration: [],
        narrationVolume: sampleNarrationVolume,
        width: 720,
      }),
    ).toThrow('backgroundVideoVolume');

    expect(() =>
      parseShortRenderProps({
        backgroundVideo: 'background.mp4',
        backgroundVideoVolume: sampleBackgroundVideoVolume,
        bgmVolume: sampleBgmVolume,
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
