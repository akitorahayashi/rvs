import path from 'node:path';
import type { VoicevoxProfile } from 'vcvx-ts';
import { z } from 'zod';
import type { CaptionedVideoBinding } from '../captioned-video/binding';
import { ProjectContractError } from '../errors';
import type { LoadedProjectManifest } from '../project-manifest/load';
import {
  fileNameSchema,
  projectIdPattern,
  rejectEscapedRoot,
} from '../project-manifest/paths';
import { narrationProfile } from '../speech/formats/caption-narration-v1';
import { formatZodError } from '../zod-error';

export const reactionVerticalShortTypeId = 'reaction_vertical_short';

const policy = {
  canvas: {
    fps: 30,
    height: 1280,
    width: 720,
  },
  captionPositionType: 'bottomBand',
  captions: {
    bottomPercent: 18,
    horizontalInset: 48,
  },
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
            voice: z
              .object({
                intonationScale: z.number().finite().optional(),
                pitchScale: z.number().finite().optional(),
                postPhonemeLength: nonNegativeNumberSchema.optional(),
                prePhonemeLength: nonNegativeNumberSchema.optional(),
                speakerId: z.number().int().nonnegative().optional(),
                speedScale: z.number().finite().positive().optional(),
                volumeScale: nonNegativeNumberSchema.optional(),
              })
              .strict()
              .optional(),
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

export const reactionVerticalShortType = {
  load(manifest: LoadedProjectManifest): CaptionedVideoBinding {
    return loadReactionVerticalShort(manifest);
  },
  type: reactionVerticalShortTypeId,
};

function loadReactionVerticalShort(
  loaded: LoadedProjectManifest,
): CaptionedVideoBinding {
  const rootDirectory = loaded.rootDirectory;
  const project = parseManifest(loaded.manifest, loaded.displayPath);

  const sourceDisplayPath = path.join(
    policy.media.sourceDirectory,
    project.video.source,
  );
  const bgmDisplayPath = path.join(
    policy.media.bgmDirectory,
    project.audio.bgm,
  );
  const sourcePath = resolveRepositoryPath(rootDirectory, sourceDisplayPath);
  const bgmPath = resolveRepositoryPath(rootDirectory, bgmDisplayPath);
  const captionsPath = resolveProjectPath(
    loaded.directory,
    `${project.id}.captions.json`,
  );
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

  return {
    directory: loaded.directory,
    displayPaths: {
      bgm: bgmDisplayPath,
      captions: path.relative(rootDirectory, captionsPath),
      narrationDirectory: path.relative(rootDirectory, narrationDirectory),
      output: outputDisplayPath,
      source: sourceDisplayPath,
    },
    file: loaded.file,
    id: project.id,
    paths: {
      bgm: bgmPath,
      captions: captionsPath,
      narrationDirectory,
      output: outputPath,
      source: sourcePath,
    },
    settings: {
      audio: {
        bgmVolume: project.audio.bgmVolume,
        narrationVolume: project.audio.narration?.volume ?? 1.5,
        sourceVideoVolume: project.video.sourceVolume,
        voice: resolveNarrationVoice(project),
      },
      captions: {
        position: {
          bottomPercent: policy.captions.bottomPercent,
          horizontalInset: policy.captions.horizontalInset,
          type: policy.captionPositionType,
        },
        strokeWidthPx: project.captions.strokeWidthPx,
      },
      canvas: policy.canvas,
    },
  };
}

function resolveRepositoryPath(
  rootDirectory: string,
  repositoryRelativePath: string,
): string {
  const filePath = path.join(rootDirectory, repositoryRelativePath);
  rejectEscapedRoot({
    displayPath: repositoryRelativePath,
    rootDirectory,
    targetPath: filePath,
  });
  return filePath;
}

function resolveProjectPath(
  projectDirectory: string,
  relativePath: string,
): string {
  const filePath = path.join(projectDirectory, relativePath);
  const resolvedPath = path.resolve(filePath);
  const relative = path.relative(projectDirectory, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new ProjectContractError(
      `${relativePath} must stay inside the project directory.`,
    );
  }
  return resolvedPath;
}

function resolveNarrationVoice(
  project: ReactionVerticalShortManifest,
): VoicevoxProfile {
  return {
    ...narrationProfile,
    ...project.audio.narration?.voice,
  };
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
