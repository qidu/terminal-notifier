#!/bin/sh
# Codex CLI notify hook: sends a desktop notification when a Codex
# agent turn completes. Configure in ~/.codex/config.toml:
#
#   notify = ["sh", "/path/to/terminal-notifier/codex/notify.sh"]
#
# Codex pipes a JSON payload on stdin, e.g.:
# {"type":"agent-turn-complete","turn-id":...,"last_agent_message":"..."}
input=$(cat)

message=$(printf '%s' "$input" | node -e "
let d = '';
process.stdin.on('data', (c) => (d += c));
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(d);
    const body = (parsed.last_agent_message || parsed.type || 'Turn complete.');
    console.log(body.replace(/\\s+/g, ' ').slice(0, 200));
  } catch {
    console.log('Turn complete.');
  }
});
")

terminal-notifier -title 'Codex' -message "$message" -sound default || true
