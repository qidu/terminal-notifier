# terminal-notifier for Codex CLI

Desktop notifications for the OpenAI Codex CLI via its `notify` hook:
shows a notification (with sound) when a Codex agent turn completes,
using the agent's last message as the notification body.

Note: Codex currently emits only the `agent-turn-complete` event, so there
is no equivalent of the Claude Code plugin's Yes/No decision dialog here.

## Prerequisites

Install the `terminal-notifier` CLI globally from the repository root:

```
npm install -g ./terminal-notifier
```

## Install

Add the notify hook to `~/.codex/config.toml` (replace the path with your
repository checkout):

```toml
notify = ["sh", "/path/to/terminal-notifier/codex/notify.sh"]
```

Or with a TOML inline table for readability:

```toml
notify = [
  "sh",
  "/path/to/terminal-notifier/codex/notify.sh",
]
```

## Verify

Run a Codex session that completes a turn; you should get a notification
titled "Codex". To test the script directly:

```
echo '{"type":"agent-turn-complete","last_agent_message":"Done!"}' | \
  sh codex/notify.sh
```
