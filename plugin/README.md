# terminal-notifier plugin for Claude Code

Sends desktop notifications (macOS, Linux, Windows) for Claude Code events,
and adds a `/notify` command for on-demand notifications and Yes/No dialogs.

## What it does

- **Notification hook** — shows a Yes/No dialog (`terminal-notifier -ask`)
  whenever Claude needs a decision, permission, or input. The dialog shows
  the event's message; Yes/No dismisses it (the answer is informational and
  does not control Claude).
- **/notify command** — ask Claude to send a notification, or a blocking
  Yes/No dialog (`terminal-notifier -ask`) whose answer Claude uses directly.

## Prerequisites

Install the `terminal-notifier` CLI globally from the repository root:

```
npm install -g /path/to/terminal-notifier
```

Linux additionally needs `notify-send` (and `zenity` for `-ask`).

## Install the plugin

After cloning this repository:

```
git clone https://github.com/julienXX/terminal-notifier
```

### 1. Install the CLI globally

The plugin's hooks call the `terminal-notifier` binary, so install it first:

```
npm install -g ./terminal-notifier
```

(Run from the directory containing the clone. On macOS, unlink any
Homebrew version first: `brew unlink terminal-notifier`.)

### 2. Add the repository as a plugin marketplace

The repository root contains a `.claude-plugin/marketplace.json`, so the
whole repo acts as a local marketplace:

```
claude plugin marketplace add ./terminal-notifier
```

### 3. Install the plugin

```
claude plugin install terminal-notifier@terminal-notifier
```

(Or use the `/plugin marketplace add` and `/plugin install` equivalents
inside Claude Code.)

### 4. Restart Claude Code

Hooks load at session start, so restart Claude Code (exit and run `claude`
again) for the Notification hook to take effect. Use `/hooks` to confirm
the hook is loaded.

## Verify

1. Run any Claude Code session from a directory using this plugin.
2. When Claude finishes responding, you should get a notification titled
   "Claude".
3. Ask Claude to "notify me: done" to exercise the `/notify` command.
