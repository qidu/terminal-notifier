#!/bin/sh
# TaskCompleted hook: shows a desktop notification when a task is marked
# completed. Other task status changes (pending/in_progress/deleted) are
# ignored.
input=$(cat)

subject=$(printf '%s' "$input" | node -e "
let d = '';
process.stdin.on('data', (c) => (d += c));
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(d);
    if (parsed.status === 'completed') console.log(parsed.subject || 'Task done.');
  } catch {}
});
")

[ -n "$subject" ] && terminal-notifier -title 'Claude' -message "Task completed: $subject" || true
