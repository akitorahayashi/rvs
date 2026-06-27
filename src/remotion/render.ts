import { renderMedia } from '@remotion/renderer';
import type { CaptionedVideoRenderProps } from '../captioned-video/render-props';
import { bundleRoot } from './bundle';
import { selectShortComposition } from './composition';

export interface RenderShortVideoRequest {
  inputProps: CaptionedVideoRenderProps;
  outputPath: string;
  publicDir: string;
  rootDirectory: string;
}

export async function renderCaptionedVideo(
  request: RenderShortVideoRequest,
): Promise<void> {
  const serveUrl = await bundleRoot({
    publicDir: request.publicDir,
    rootDirectory: request.rootDirectory,
  });
  const composition = await selectShortComposition({
    inputProps: request.inputProps,
    serveUrl,
  });

  await renderMedia({
    codec: 'h264',
    composition,
    inputProps: request.inputProps,
    logLevel: 'warn',
    outputLocation: request.outputPath,
    overwrite: false,
    serveUrl,
  });
}
