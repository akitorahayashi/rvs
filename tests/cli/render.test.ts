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
    expect(result.stdout).toContain('serve');
    expect(result.stdout).toContain('tts <project>');
    expect(result.stdout).toContain('render <project>');
  });

  test('prints the package version', () => {
    const result = runCli(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('rvs 0.1.0');
  });

  test('fails when a required project is missing', () => {
    const result = runCli(['render']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('missing required args');
  });

  test('fails when a required tts project is missing', () => {
    const result = runCli(['tts']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('missing required args');
  });

  test('fails for unexpected serve positional arguments', () => {
    const result = runCli(['serve', 'extra']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unexpected positional arguments: extra.');
  });

  test('fails for unexpected positional arguments', () => {
    const result = runCli(['render', 'demo', 'extra']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unexpected positional arguments: extra.');
  });

  test('rejects project references outside projects', () => {
    const result = runCli(['render', '../demo']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('safe project ID');
    expect(result.stdout).toBe('');
  });
});
