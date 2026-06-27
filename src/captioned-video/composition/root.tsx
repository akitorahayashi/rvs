import { Composition, registerRoot } from 'remotion';
import {
  type CaptionedVideoRenderProps,
  captionedVideoCompositionId,
  captionedVideoRenderPropsSchema,
  defaultCaptionedVideoRenderProps,
  parseCaptionedVideoRenderProps,
} from '../render-props';
import { CaptionedVideo } from './video';

function Root() {
  return (
    <Composition
      calculateMetadata={({ props }: { props: CaptionedVideoRenderProps }) => {
        const renderProps = parseCaptionedVideoRenderProps(props);
        return {
          durationInFrames: renderProps.durationInFrames,
          fps: renderProps.fps,
          height: renderProps.height,
          width: renderProps.width,
        };
      }}
      component={CaptionedVideo}
      defaultProps={defaultCaptionedVideoRenderProps}
      durationInFrames={defaultCaptionedVideoRenderProps.durationInFrames}
      fps={defaultCaptionedVideoRenderProps.fps}
      height={defaultCaptionedVideoRenderProps.height}
      id={captionedVideoCompositionId}
      schema={captionedVideoRenderPropsSchema}
      width={defaultCaptionedVideoRenderProps.width}
    />
  );
}

registerRoot(Root);
