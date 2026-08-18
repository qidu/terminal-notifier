---
description: Send a desktop notification or a Yes/No dialog via terminal-notifier
argument-hint: <message> [--ask]
---

Send the user a desktop notification using the `terminal-notifier` CLI.

- Default: run `terminal-notifier -title 'Claude' -message '<message>'`
- If the user asks a yes/no question or says "ask": run
  `terminal-notifier -title 'Claude' -ask '<question>'` — this shows a
  blocking Yes/No dialog. The command prints `YES` or `NO` and exits 0 for
  Yes, 1 for No. Wait for it to finish (it blocks until the user answers)
  and use the output as the user's answer.

Examples:

- "notify me when the deploy is done" → after the deploy completes, run the
  notification command with the result as the message.
- "ask me if I want to run the tests" → run the `-ask` command and act on
  YES/NO.
