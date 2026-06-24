import { selectComposition } from '@remotion/renderer';
import { compositionId, type ShortRenderProps } from './props';

export interface SelectShortCompositionRequest {
  inputProps: ShortRenderProps;
  serveUrl: string;
}

export async function selectShortComposition(
  request: SelectShortCompositionRequest,
) {
  return selectComposition({
    id: compositionId,
    inputProps: request.inputProps,
    logLevel: 'warn',
    serveUrl: request.serveUrl,
  });
}
