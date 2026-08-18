export interface ParsedArgs {
  message?: string;
  title?: string;
  subtitle?: string;
  sound?: string;
  open?: string;
  icon?: string;
  ask?: string;
  help: boolean;
  version: boolean;
}

export class ArgError extends Error {}

const VALUE_FLAGS: ReadonlyArray<keyof ParsedArgs> = [
  'message',
  'title',
  'subtitle',
  'sound',
  'open',
  'icon',
  'ask',
];

/**
 * Parses arguments in the original terminal-notifier style: `-flag value`
 * or `-flag=value`. Value flags require a value; unknown flags are an error.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { help: false, version: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      throw new ArgError(`Unexpected argument: ${arg}`);
    }

    let flag = arg.slice(1);
    let inlineValue: string | undefined;
    const eq = flag.indexOf('=');
    if (eq !== -1) {
      inlineValue = flag.slice(eq + 1);
      flag = flag.slice(0, eq);
    }

    if (flag === 'help' || flag === 'version') {
      args[flag] = true;
      continue;
    }

    if (!VALUE_FLAGS.includes(flag as keyof ParsedArgs)) {
      throw new ArgError(`Unknown option: -${flag}`);
    }

    const value = inlineValue !== undefined ? inlineValue : argv[++i];
    if (value === undefined) {
      throw new ArgError(`Missing value for option: -${flag}`);
    }
    args[flag as 'message'] = value;
  }

  return args;
}
