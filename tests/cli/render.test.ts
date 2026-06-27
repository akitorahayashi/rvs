import { describe, expect, test } from 'bun:test';
import path from 'node:path';

interface CommandResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

function runCli(args: string[]): CommandResult {
  const command = Bun.spawnSync(['bun', 'src/main.ts', ...args], {
    cwd: path.join(import.meta.dir, '..', '..'),
    stderr: 'pipe',
    stdout: 'pipe',
  });

  if (command.exitCode === null) {
    throw new Error('CLI process did not exit normally.');
  }

  return {
    exitCode: command.exitCode,
    stderr: command.stderr.toString().trim(),
    stdout: command.stdout.toString().trim(),
  };
}

describe('render command', () => {
  test('prints help when no command is provided', () => {
    const result = runCli([]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('tts <captions-file>');
    expect(result.stdout).toContain('render <project-file>');
  });

  test('prints the package version', () => {
    const result = runCli(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('0.1.0');
  });

  test('fails when a required project file is missing', () => {
    const result = runCli(['render']);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Not enough positional arguments');
  });

  test('fails when a required captions file is missing', () => {
    const result = runCli(['tts']);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Not enough positional arguments');
  });

  test('fails for unexpected positional arguments', () => {
    const result = runCli(['render', 'demo.project.ts', 'extra']);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Unexpected positional arguments: extra.');
  });

  test('rejects project manifests outside the repository root', () => {
    const result = runCli(['render', '../demo.project.ts']);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('repository root');
  });
});
