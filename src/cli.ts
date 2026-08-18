#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseArgs, ArgError } from './args.js';
import { notify, ask } from './index.js';

const HELP = `terminal-notifier is a command-line tool to send desktop notifications
on macOS, Linux, and Windows.

Usage: terminal-notifier -message VALUE [options]

   Either -message is required, or message data is piped to the tool:
   e.g. echo 'Hello' | terminal-notifier

   Options:

       -help              Display this help banner.
       -version           Display terminal-notifier version.
       -message VALUE     The notification message.
       -title VALUE       The notification title. Defaults to 'Terminal'.
       -subtitle VALUE    The notification subtitle. (macOS only)
       -sound NAME        The name of a sound to play when the notification
                          appears. (macOS, Windows)
       -open URL          The URL of a resource to open when the user clicks
                          the notification. (macOS only)
       -icon PATH         The path of an image to display as the notification
                          icon. (Linux, Windows)
       -ask QUESTION      Show a Yes/No dialog and wait for the answer.
                          Prints YES or NO and exits 0 for Yes, 1 for No.
                          (macOS, Linux with zenity, Windows)

For more information see https://github.com/julienXX/terminal-notifier.
`;

function printHelp(): void {
  process.stdout.write(HELP);
}

function fail(error: string): never {
  process.stderr.write(`${error}\n\n`);
  printHelp();
  process.exit(1);
}

async function readStdin(): Promise<string> {
  return readFileSync(0, 'utf8');
}

async function main(): Promise<void> {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    if (error instanceof ArgError) fail(error.message);
    throw error;
  }

  if (args.help) {
    printHelp();
    return;
  }

  if (args.version) {
    const { version } = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    );
    process.stdout.write(`terminal-notifier ${version}.\n`);
    return;
  }

  if (args.ask !== undefined) {
    try {
      const yes = await ask(args.ask, { title: args.title });
      process.stdout.write(yes ? 'YES\n' : 'NO\n');
      process.exit(yes ? 0 : 1);
    } catch (error) {
      process.stderr.write(`Failed to show dialog: ${String(error)}\n`);
      process.exit(1);
    }
  }

  let message = args.message;
  if (message === undefined && !process.stdin.isTTY) {
    const piped = await readStdin();
    if (piped.length > 0) message = piped.trimEnd();
  }

  if (message === undefined || message.length === 0) {
    fail('No message given and no data piped to the tool.');
  }

  try {
    await notify(message, {
      title: args.title,
      subtitle: args.subtitle,
      sound: args.sound,
      open: args.open,
      icon: args.icon,
    });
  } catch (error) {
    process.stderr.write(`Failed to deliver notification: ${String(error)}\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
