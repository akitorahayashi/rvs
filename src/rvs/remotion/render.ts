import { renderMedia } from '@remotion/renderer';
import { bundleRoot } from './bundle';
import { selectShortComposition } from './composition';
import type { ShortRenderProps } from './props';

export interface RenderShortVideoRequest {
  inputProps: ShortRenderProps;
  outputPath: string;
  publicDir: string;
  rootDirectory: string;
}

export async function renderShortVideo(
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
