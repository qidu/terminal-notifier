# terminal-notifier for DeepSeek Harness (dsh)

A dsh plugin bundle that wires the `terminal-notifier` CLI into the agent
loop:

- **Turn completion** — listens to the `turn/end` session event and posts a
  desktop notification (with sound) when an agent turn finishes.
- **Approval requests** — listens to the `approval/request` waterfall and
  shows a blocking Yes/No dialog (`terminal-notifier -ask`): **YES approves
  once** (`allowed-once`), **NO rejects**. Unlike the Claude Code plugin,
  the dialog answer genuinely decides the approval. If the dialog fails,
  times out (`askTimeout`, default 120 s), or `askApprovals` is false, the
  request falls through to other answerers such as the Web UI.

## Prerequisites

Install the `terminal-notifier` CLI globally from the repository root:

```
npm install -g ./terminal-notifier
```

dsh must run on a machine with a desktop (for remote/headless dsh, set
`command` in the patch row to an `ssh`-relay wrapper instead).

### Headless host with an RDP session

If dsh runs on a headless server that you access via xrdp/XFCE, install
[`terminal-notifier-session.sh`](terminal-notifier-session.sh) as
`/usr/local/bin/terminal-notifier-session` (plus `zenity`, `dbus-x11`, and the
`terminal-notifier` CLI). It discovers the newest active X display (by
socket mtime) and DBus user bus, so SSH-launched dsh turns show
notifications and dialogs inside the RDP session. Point the plugin row at it:

```yaml
- id: terminal-notifier
  config:
    command: /usr/local/bin/terminal-notifier-session
```

> **Notice — no active desktop session:** the wrapper exits `127` when no
> X display exists (no logged-in RDP/desktop session). The plugin treats
> any code outside `{0, 1}` as "not answerable": approval requests defer
> to other answerers such as the Web UI (nothing is silently rejected),
> and turn-completion notifications are dropped. Without this guard,
> `zenity` would exit `1` on a missing display — indistinguishable from a
> "No" answer — causing every approval to be auto-rejected while no one
> is logged in; `notify-send` would likewise report phantom success (exit
> `0`) for notifications that were never shown. If the RDP session drops
> *while* a dialog is open, the dialog hangs until `askTimeout` (default
> 300 s) fires, then defers.

## Install

```
dsh plugin --profile <name> add ./dsh-plugin
```

Then restart the profile. Verify the row composed:

```
dsh --profile <name> --dump-config | grep -A3 terminal-notifier
```

## Configuration

Row config in the profile layers (see `cordis.patch.yml`):

| Option         | Default             | Meaning                                     |
| -------------- | ------------------- | ------------------------------------------- |
| `command`      | `terminal-notifier` | Binary to invoke (PATH or absolute path)    |
| `sound`        | `default`           | Sound name for turn-completion notices      |
| `askApprovals` | `true`              | Pop the Yes/No dialog for approval requests |
| `askTimeout`   | `120`               | Seconds before deferring to other answerers |

## Test the plugin directly

```
node -e "
import('./index.js').then(({ apply }) => {
  const events = {}
  const ctx = { on: (name, fn) => (events[name] = fn) }
  apply(ctx)
  events['session/event'](null, { type: 'turn/end', turn: 1, reason: 'complete' })
})"
```

(Shows a "Turn 1 complete." notification if the CLI is installed.)
