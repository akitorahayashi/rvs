import { Composition, registerRoot } from 'remotion';
import {
  compositionId,
  defaultRenderProps,
  parseShortRenderProps,
  type ShortRenderProps,
  shortRenderPropsSchema,
} from '../remotion/props';
import { Short } from './short';

function Root() {
  return (
    <Composition
      calculateMetadata={({ props }: { props: ShortRenderProps }) => {
        const renderProps = parseShortRenderProps(props);
        return {
          durationInFrames: renderProps.durationInFrames,
          fps: renderProps.fps,
          height: renderProps.height,
          width: renderProps.width,
        };
      }}
      component={Short}
      defaultProps={defaultRenderProps}
      durationInFrames={defaultRenderProps.durationInFrames}
      fps={defaultRenderProps.fps}
      height={defaultRenderProps.height}
      id={compositionId}
      schema={shortRenderPropsSchema}
      width={defaultRenderProps.width}
    />
  );
}

registerRoot(Root);
