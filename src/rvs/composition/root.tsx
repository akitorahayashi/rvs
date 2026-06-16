import { Composition, registerRoot } from 'remotion';
import {
  compositionId,
  defaultRenderProps,
  type ShortRenderProps,
} from '../remotion/props';
import { Short } from './short';

function Root() {
  return (
    <Composition
      calculateMetadata={({ props }: { props: ShortRenderProps }) => {
        return {
          durationInFrames: props.durationInFrames,
          fps: props.fps,
          height: props.height,
          width: props.width,
        };
      }}
      component={Short}
      defaultProps={defaultRenderProps}
      durationInFrames={defaultRenderProps.durationInFrames}
      fps={defaultRenderProps.fps}
      height={defaultRenderProps.height}
      id={compositionId}
      width={defaultRenderProps.width}
    />
  );
}

registerRoot(Root);
