import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readVideoMetadata } from '../media/video';
import { loadProject } from '../projects/load';
import { createOutputPath } from '../projects/paths';
import { createRenderProps } from '../remotion/props';
import { renderShortVideo } from '../remotion/render';
import { parseSrt } from '../subtitles/srt';
import { assertCuesFitVideo, toFrameCues } from '../subtitles/timing';

export interface RenderProjectRequest {
  now?: Date;
  project: string;
  rootDirectory?: string;
}

export interface RenderProjectResult {
  outputLocation: string;
  outputPath: string;
  projectId: string;
}

export async function renderProject(
  request: RenderProjectRequest,
): Promise<RenderProjectResult> {
  const rootDirectory = path.resolve(request.rootDirectory ?? process.cwd());
  const project = await loadProject({
    project: request.project,
    rootDirectory,
  });
  const metadata = await readVideoMetadata(project.backgroundPath);
  const srt = await readFile(project.captionsPath, 'utf8');
  const subtitleCues = parseSrt(srt);
  const captionCues = toFrameCues({
    cues: subtitleCues,
    fps: metadata.fps,
  });

  assertCuesFitVideo({
    cues: captionCues,
    durationInFrames: metadata.durationInFrames,
  });

  const outputPath = await createOutputPath({
    now: request.now,
    projectId: project.id,
    rootDirectory,
  });
  const props = createRenderProps({
    backgroundVideo: project.backgroundAssetPath,
    captions: captionCues,
    durationInFrames: metadata.durationInFrames,
    fps: metadata.fps,
    height: metadata.height,
    width: metadata.width,
  });

  await renderShortVideo({
    inputProps: props,
    outputPath,
    publicDir: project.directory,
    rootDirectory,
  });

  return {
    outputLocation: path.relative(rootDirectory, outputPath),
    outputPath,
    projectId: project.id,
  };
}
