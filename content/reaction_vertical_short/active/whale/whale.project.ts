// Contract: content/reaction_vertical_short/AGENTS.md
import { defineProject } from '../../../../src/project-manifest/define';

export default defineProject({
  id: 'whale',
  type: 'reaction_vertical_short',

  video: {
    name: 'マッコウクジラに飲み込まれる！？',
    source: 'whale.mp4',
    sourceVolume: 0.3,
  },

  audio: {
    bgm: 'breezy-pocket.mp3',
    bgmVolume: 0.55,
  },

  captions: {
    strokeWidthPx: 0,
  },
});
