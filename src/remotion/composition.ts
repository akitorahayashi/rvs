import { selectComposition } from '@remotion/renderer';
import {
  type CaptionedVideoRenderProps,
  captionedVideoCompositionId,
} from '../captioned-video/render-props';

export interface SelectShortCompositionRequest {
  inputProps: CaptionedVideoRenderProps;
  serveUrl: string;
}

export async function selectShortComposition(
  request: SelectShortCompositionRequest,
) {
  return selectComposition({
    id: captionedVideoCompositionId,
    inputProps: request.inputProps,
    logLevel: 'warn',
    serveUrl: request.serveUrl,
  });
}
