#!/bin/sh
# Notification hook: shows a Yes/No dialog when Claude needs a decision,
# permission, or user input. Yes/No both dismiss the dialog; the answer is
# informational (it does not control Claude).
input=$(cat)

message=$(printf '%s' "$input" | node -e "
let d = '';
process.stdin.on('data', (c) => (d += c));
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(d);
    console.log(parsed.message || 'Claude needs your attention.');
  } catch {
    console.log('Claude needs your attention.');
  }
});
")

terminal-notifier -title 'Claude' -ask "$message" || true
