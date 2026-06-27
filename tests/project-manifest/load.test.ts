import { describe, expect, test } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadProjectManifest } from '../../src/project-manifest/load';

const rootDirectory = path.join(process.cwd(), '.tmp', 'tests', 'manifest');

describe('loadProjectManifest', () => {
  test('loads default-exported project manifests', async () => {
    await resetRoot();
    const manifestPath = path.join(
      rootDirectory,
      'content',
      'reaction_vertical_short',
      'active',
      'demo',
      'demo.project.ts',
    );
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(
      manifestPath,
      'export default { id: "demo", type: "reaction_vertical_short" };\n',
    );

    const loaded = await loadProjectManifest({
      projectFile:
        'content/reaction_vertical_short/active/demo/demo.project.ts',
      rootDirectory,
    });

    expect(loaded.displayPath).toBe(
      'content/reaction_vertical_short/active/demo/demo.project.ts',
    );
    expect(loaded.manifest).toEqual({
      id: 'demo',
      type: 'reaction_vertical_short',
    });
  });

  test('rejects non-project files', async () => {
    await resetRoot();
    await mkdir(rootDirectory, { recursive: true });
    await writeFile(
      path.join(rootDirectory, 'demo.ts'),
      'export default {};\n',
    );

    await expect(
      loadProjectManifest({
        projectFile: 'demo.ts',
        rootDirectory,
      }),
    ).rejects.toThrow('.project.ts');
  });
});

async function resetRoot(): Promise<void> {
  await rm(rootDirectory, { force: true, recursive: true });
}
