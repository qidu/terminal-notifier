# terminal-notifier

terminal-notifier is a command-line tool and Node.js API to send desktop
notifications on macOS, Linux, and Windows.

Notifications are delivered per platform via
[node-notifier](https://github.com/mikaelbr/node-notifier):
osascript on macOS, `notify-send` on Linux, and native toasts on Windows.

## Install

```
$ npm install -g terminal-notifier
```

Linux requires `notify-send` (usually in the `libnotify` or `libnotify-bin`
package).

## CLI Usage

```
$ terminal-notifier -message VALUE [options]
```

At a minimum you must specify `-message`, or pipe the message via stdin:

```
$ echo 'Piped Message Data!' | terminal-notifier -sound default
```

Ask a Yes/No question (prints `YES` or `NO`; exit code 0 = Yes, 1 = No):

```
$ terminal-notifier -ask 'Deploy to production?' -title 'Build'
YES
```

### Options

| Option            | Description                                          | Platform        |
| ----------------- | ---------------------------------------------------- | --------------- |
| `-message VALUE`  | The notification message (required, or use stdin).   | all             |
| `-title VALUE`    | The notification title. Defaults to `Terminal`.      | all             |
| `-subtitle VALUE` | The notification subtitle.                           | macOS           |
| `-sound NAME`     | Sound to play. Use `default` for the default sound.  | macOS, Windows  |
| `-open URL`       | URL to open when the notification is clicked.        | macOS           |
| `-icon PATH`      | Path of an image to show as the notification icon.   | Linux, Windows  |
| `-ask QUESTION`   | Show a Yes/No dialog, print `YES`/`NO`, exit 0/1.    | macOS, Linux¹, Windows |
| `-help`           | Show help.                                           | all             |
| `-version`        | Show version.                                        | all             |

¹ Requires `zenity`.

Exit code is `0` on success and `1` on failure, with the reason printed
to stderr. For `-ask`, exit code `0` means Yes and `1` means No.

## API Usage

```js
import { notify, ask } from 'terminal-notifier';

await notify('Hello World', { title: 'Build', sound: 'default' });
const yes = await ask('Deploy to production?', { title: 'Build' }); // true/false
```

The promises reject if the notification or dialog cannot be shown.

## Claude Code plugin

A companion Claude Code plugin ships in [plugin/](plugin/): it shows a
Yes/No dialog when Claude needs a decision and adds a `/terminal-notifier:notify` command.

The dialog is an *additional* asking channel, not a replacement for
Claude Code's native prompts: it cannot answer permission prompts (those
must go through Claude Code's own UI), it is Yes/No only (native prompts
support multiple options), and it must be answered within the Bash tool
timeout (~10 minutes). It is best suited for binary decisions when the
user may be away from the terminal.

See [plugin/README.md](plugin/README.md) for installation:

```
# Register this repository as a plugin marketplace
claude plugin marketplace add ./terminal-notifier

# Install the plugin from that marketplace (plugin@marketplace, not npm)
claude plugin install terminal-notifier@terminal-notifier
```

## Codex CLI integration

For the OpenAI Codex CLI, a `notify` hook script ships in
[codex/](codex/) — add to `~/.codex/config.toml`:

```toml
notify = ["sh", "/path/to/terminal-notifier/codex/notify.sh"]
```

See [codex/README.md](codex/README.md) for details.

## DeepSeek Harness (dsh) plugin

For DeepSeek Harness, a plugin bundle ships in [dsh-plugin/](dsh-plugin/):
it notifies when an agent turn completes and — unlike the other
integrations — can *answer* dsh's approval requests with the Yes/No dialog
(YES approves once, NO rejects; on failure or timeout it defers to the
Web UI). The plugin is platform-agnostic and works wherever dsh runs on a
desktop — macOS, Windows, or Linux (via the
[terminal-notifier](README.md#install) CLI). Install:

```
dsh plugin --profile <name> add ./dsh-plugin
```

For headless Linux servers accessed over xrdp/RDP, a session-discovery
wrapper is included. See [dsh-plugin/README.md](dsh-plugin/README.md) for
configuration.

## Development

```
npm install
npm test
```

`npm test` builds with `tsc` and runs the unit tests with the built-in
`node:test` runner.

## License

MIT. See [LICENSE.md](LICENSE.md).
