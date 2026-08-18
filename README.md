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

## Development

```
npm install
npm test
```

`npm test` builds with `tsc` and runs the unit tests with the built-in
`node:test` runner.

## License

MIT. See [LICENSE.md](LICENSE.md).
