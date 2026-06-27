export interface ProjectManifest {
  audio: {
    bgm: string;
    bgmVolume: number;
    narration?: {
      volume?: number;
    };
  };
  captions: {
    strokeWidthPx: number;
  };
  id: string;
  type: string;
  video: {
    name: string;
    source: string;
    sourceVolume: number;
  };
}

export function defineProject<T extends ProjectManifest>(project: T): T {
  return project;
}
