import { mkdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { ProjectContractError } from '../errors';
import { loadProjectManifest } from '../project-manifest/load';
import {
  fileNameSchema,
  projectIdPattern,
  rejectEscapedRoot,
} from '../project-manifest/paths';
import { defaultNarrationVolume } from '../remotion/props';
import { formatZodError } from '../zod-error';

export const reactionVerticalShortTypeId = 'reaction_vertical_short';

const policy = {
  media: {
    bgmDirectory: 'media/bgm',
    outputDirectory: 'media/reaction_vertical_short/output',
    sourceDirectory: 'media/reaction_vertical_short/source',
  },
  narrationDirectory: 'narration',
} as const;

const nonNegativeNumberSchema = z.number().finite().nonnegative();
const mp3FileNameSchema = fileNameSchema.refine(
  (value) => path.extname(value).toLowerCase() === '.mp3',
  { message: 'must end with .mp3' },
);
const mp4FileNameSchema = fileNameSchema.refine(
  (value) => path.extname(value).toLowerCase() === '.mp4',
  { message: 'must end with .mp4' },
);

const manifestSchema = z
  .object({
    audio: z
      .object({
        bgm: mp3FileNameSchema,
        bgmVolume: nonNegativeNumberSchema,
        narration: z
          .object({
            volume: nonNegativeNumberSchema.optional(),
          })
          .strict()
          .optional(),
      })
      .strict(),
    captions: z
      .object({
        strokeWidthPx: nonNegativeNumberSchema,
      })
      .strict(),
    id: z.string().trim().regex(projectIdPattern),
    type: z.literal(reactionVerticalShortTypeId),
    video: z
      .object({
        name: fileNameSchema,
        source: mp4FileNameSchema,
        sourceVolume: nonNegativeNumberSchema,
      })
      .strict(),
  })
  .strict();

export type ReactionVerticalShortManifest = z.infer<typeof manifestSchema>;

export interface ReactionVerticalShortFiles {
  bgmAssetPath: string;
  bgmPath: string;
  captionsPath: string;
  directory: string;
  displayPaths: {
    bgm: string;
    captions: string;
    narrationDirectory: string;
    output: string;
    source: string;
  };
  id: string;
  narrationDirectory: string;
  outputPath: string;
  sourceAssetPath: string;
  sourcePath: string;
  videoName: string;
  volumes: {
    bgm: number;
    narration: number;
    source: number;
  };
}

export interface LoadReactionVerticalShortRequest {
  projectFile: string;
  rootDirectory: string;
}

export async function loadReactionVerticalShort(
  request: LoadReactionVerticalShortRequest,
): Promise<ReactionVerticalShortFiles> {
  const rootDirectory = await realpath(path.resolve(request.rootDirectory));
  const loaded = await loadProjectManifest({
    projectFile: request.projectFile,
    rootDirectory,
  });
  const project = parseManifest(loaded.manifest, loaded.displayPath);

  const sourceDisplayPath = path.join(
    policy.media.sourceDirectory,
    project.video.source,
  );
  const bgmDisplayPath = path.join(
    policy.media.bgmDirectory,
    project.audio.bgm,
  );
  const sourcePath = await requireRepositoryFile({
    displayPath: sourceDisplayPath,
    repositoryRelativePath: sourceDisplayPath,
    rootDirectory,
  });
  const bgmPath = await requireRepositoryFile({
    displayPath: bgmDisplayPath,
    repositoryRelativePath: bgmDisplayPath,
    rootDirectory,
  });
  const captionsPath = await requireProjectFile({
    displayPath: `./${project.id}.captions.json`,
    projectDirectory: loaded.directory,
    relativePath: `${project.id}.captions.json`,
  });
  const narrationDirectory = path.join(
    loaded.directory,
    policy.narrationDirectory,
  );
  const outputDisplayPath = path.join(
    policy.media.outputDirectory,
    `${project.video.name}.mp4`,
  );
  const outputPath = path.join(rootDirectory, outputDisplayPath);
  rejectEscapedRoot({
    displayPath: outputDisplayPath,
    rootDirectory,
    targetPath: outputPath,
  });
  await mkdir(path.dirname(outputPath), { recursive: true });

  return {
    bgmAssetPath: bgmDisplayPath,
    bgmPath,
    captionsPath,
    directory: loaded.directory,
    displayPaths: {
      bgm: bgmDisplayPath,
      captions: path.relative(rootDirectory, captionsPath),
      narrationDirectory: path.relative(rootDirectory, narrationDirectory),
      output: outputDisplayPath,
      source: sourceDisplayPath,
    },
    id: project.id,
    narrationDirectory,
    outputPath,
    sourceAssetPath: sourceDisplayPath,
    sourcePath,
    videoName: project.video.name,
    volumes: {
      bgm: project.audio.bgmVolume,
      narration: project.audio.narration?.volume ?? defaultNarrationVolume,
      source: project.video.sourceVolume,
    },
  };
}

async function requireRepositoryFile(request: {
  displayPath: string;
  repositoryRelativePath: string;
  rootDirectory: string;
}): Promise<string> {
  const filePath = path.join(
    request.rootDirectory,
    request.repositoryRelativePath,
  );
  rejectEscapedRoot({
    displayPath: request.displayPath,
    rootDirectory: request.rootDirectory,
    targetPath: filePath,
  });
  const realFilePath = await requireFile(filePath, request.displayPath);
  rejectEscapedRoot({
    displayPath: request.displayPath,
    rootDirectory: request.rootDirectory,
    targetPath: realFilePath,
  });
  return realFilePath;
}

async function requireProjectFile(request: {
  displayPath: string;
  projectDirectory: string;
  relativePath: string;
}): Promise<string> {
  const filePath = path.join(request.projectDirectory, request.relativePath);
  const realFilePath = await requireFile(filePath, request.displayPath);
  const relativePath = path.relative(request.projectDirectory, realFilePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new ProjectContractError(
      `${request.displayPath} must stay inside the project directory.`,
    );
  }
  return realFilePath;
}

async function requireFile(
  filePath: string,
  displayPath: string,
): Promise<string> {
  try {
    const realFilePath = await realpath(filePath);
    const stats = await stat(realFilePath);

    if (!stats.isFile()) {
      throw new ProjectContractError(`${displayPath} must be a file.`);
    }

    return realFilePath;
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }

    throw new ProjectContractError(`${displayPath} is required.`);
  }
}

function parseManifest(
  manifest: unknown,
  displayPath: string,
): ReactionVerticalShortManifest {
  const result = manifestSchema.safeParse(manifest);
  if (!result.success) {
    throw new ProjectContractError(
      `${displayPath} manifest is invalid: ${formatZodError(result.error)}.`,
    );
  }

  return result.data;
}
