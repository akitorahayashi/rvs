import type { CaptionedVideoBinding } from '../captioned-video/binding';
import {
  type LoadedProjectManifest,
  loadProjectManifest,
} from '../project-manifest/load';
import { reactionVerticalShortType } from './reaction-vertical-short';

export interface LoadedVideoProject {
  captionedVideo: CaptionedVideoBinding;
  type: string;
}

interface VideoTypeDefinition {
  load(manifest: LoadedProjectManifest): CaptionedVideoBinding;
  type: string;
}

const videoTypes = new Map<string, VideoTypeDefinition>(
  [reactionVerticalShortType].map((videoType) => [videoType.type, videoType]),
);

export async function loadVideoProject(request: {
  projectFile: string;
  rootDirectory: string;
}): Promise<LoadedVideoProject> {
  const manifest = await loadProjectManifest(request);
  const videoType = videoTypes.get(manifest.base.type);
  if (videoType === undefined) {
    throw new Error(`Unsupported project type '${manifest.base.type}'.`);
  }

  return {
    captionedVideo: videoType.load(manifest),
    type: videoType.type,
  };
}
