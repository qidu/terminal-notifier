---
description: Send a desktop notification, or ask the user a Yes/No question via an on-screen dialog. Use when the user says "notify me", "ask me", "question me", or needs a yes/no decision or a notification while away from the terminal.
argument-hint: [message | ask: QUESTION]
---

Send the user a desktop notification using the `terminal-notifier` CLI.

- Notification: `terminal-notifier -title 'Claude' -message '<message>'`
- Yes/No dialog: `terminal-notifier -title 'Claude' -ask '<question>'` — use
  this whenever the request contains "ask", a question, or a yes/no choice.
  The command blocks until the user answers, prints `YES` or `NO` (exit 0
  for Yes, 1 for No). Wait for it to finish and treat the output as the
  user's answer.

Examples:

- "notify me when the deploy is done" → after the deploy completes, run the
  notification command with the result as the message.
- "ask me if I want to run the tests" → run the `-ask` command with that
  question and act on YES/NO.
- "ask: deploy to production?" → same, dialog with that question.

Limitations: the dialog is Yes/No only (use AskUserQuestion for multiple
options), and it must be answered within the Bash tool timeout (~10 min).
It cannot replace Claude Code's permission prompts.
