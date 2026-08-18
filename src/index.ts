import { spawn } from 'node:child_process';
import { platform } from 'node:process';
import notifier from 'node-notifier';

export interface NotifyOptions {
  /** Notification title. Defaults to 'Terminal'. */
  title?: string;
  /** Notification subtitle (macOS only). */
  subtitle?: string;
  /** Sound name (macOS, Windows). 'default' plays the default notification sound. */
  sound?: string;
  /** URL to open when the notification is clicked (macOS). */
  open?: string;
  /** Path or URL of an icon image (Linux, Windows). */
  icon?: string;
}

/**
 * Sends a desktop notification. Rejects if the notification could not
 * be delivered on this platform.
 */
export function notify(message: string, options: NotifyOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    notifier.notify(
      {
        title: options.title ?? 'Terminal',
        subtitle: options.subtitle,
        message,
        sound: options.sound === 'default' ? true : options.sound,
        open: options.open,
        icon: options.icon,
        wait: options.open !== undefined,
      },
      (error) => {
        if (error) reject(error);
        else resolve();
      }
    );
  });
}

function run(command: string, args: string[]): Promise<{ stdout: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve({ stdout, code: code ?? -1 }));
  });
}

/**
 * Shows a blocking Yes/No dialog and resolves to the user's answer.
 * Uses osascript on macOS, zenity on Linux, and PowerShell on Windows.
 */
export async function ask(question: string, options: NotifyOptions = {}): Promise<boolean> {
  const title = options.title ?? 'Terminal';

  if (platform === 'darwin') {
    const { stdout, code } = await run('osascript', [
      '-e',
      `display dialog ${JSON.stringify(question)} with title ${JSON.stringify(title)} buttons {"No", "Yes"} default button "Yes" with icon note`,
    ]);
    if (code !== 0) throw new Error(`osascript exited with code ${code}`);
    return stdout.includes('button returned:Yes');
  }

  if (platform === 'linux') {
    const { code } = await run('zenity', ['--question', `--title=${title}`, `--text=${question}`]);
    if (code === 0) return true;
    if (code === 1) return false;
    throw new Error(`zenity exited with code ${code} — is zenity installed?`);
  }

  if (platform === 'win32') {
    const script =
      `Add-Type -AssemblyName PresentationFramework; ` +
      `[System.Windows.MessageBox]::Show(${psQuote(question)}, ${psQuote(title)}, 4, 32)`;
    const { stdout, code } = await run('powershell', ['-NoProfile', '-Command', script]);
    if (code !== 0) throw new Error(`powershell exited with code ${code}`);
    return stdout.trim() === 'Yes';
  }

  throw new Error(`Yes/No dialogs are not supported on platform: ${platform}`);
}

function psQuote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}
