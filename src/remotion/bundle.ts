import path from 'node:path';
import { bundle } from '@remotion/bundler';

export interface BundleRootRequest {
  publicDir: string;
  rootDirectory: string;
}

export async function bundleRoot(request: BundleRootRequest): Promise<string> {
  return bundle({
    entryPoint: path.join(
      request.rootDirectory,
      'src',
      'captioned-video',
      'composition',
      'root.tsx',
    ),
    publicDir: request.publicDir,
    webpackOverride: (config) => config,
  });
}
