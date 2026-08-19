# How-To: Interactive Notifications via node-notifier (mac input / Windows SnoreToast)

Reference doc for adding **action buttons and text input inside native
notifications** to this `terminal-notifier` CLI, based on the node-notifier
source vendored at `submodules/node-notifier` (v10.0.1-14-gb36c237).
No code was modified; this document only describes the integration.

---

## 1. What node-notifier demonstrates

### 1.1 macOS — notification with input (`example/macInput.js`)

```js
const nc = new notifier.NotificationCenter();

nc.notify(
  {
    title: 'Notifications',
    message: 'Are they cool?',
    sound: 'Funk',
    closeLabel: 'Absolutely not', // case-sensitive label for the cancel button
    actions: 'Most def.'          // case-sensitive action label (string or array → dropdown)
  },
  (err, response, metadata) => {
    if (metadata.activationValue !== 'Most def.') return; // user picked something else
    nc.notify(
      { title: 'Notifications', message: 'Do you want to reply to them?',
        reply: true },               // text field directly in the notification
      (err, response, metadata) => { /* metadata holds the typed text */ }
    );
  }
);

nc.on('replied', (obj, options, metadata) => {
  console.log('User replied', metadata);
});
```

Key API points (macOS `NotificationCenter`):

| Option | Meaning |
|---|---|
| `reply: true` | Adds a text field to the notification. Typed value arrives in the callback's 3rd arg (`metadata`) and in the `replied` event. |
| `actions` | `'Label'` or `['A', 'B']`. With multiple labels a dropdown appears; use `dropdownLabel` for its title. |
| `closeLabel` | Label for the notification's other (cancel) button. Case-sensitive. |
| `timeout` / `wait` | **Must be high (or unset) when using `reply`/`actions`**, otherwise the notification disappears before the user can act. `wait` ≡ `timeout: 5`. |

Result metadata (from the terminal-notifier binary's JSON output) includes
`activationType` (`actionClicked` / `replied` / `activate`…) and
`activationValue` (which action was chosen, or the typed reply text).

### 1.2 Windows — SnoreToast actions (`example/toaster-with-actions.js`)

```js
notifier.notify(
  { message: 'Are you sure you want to continue?',
    icon: path.join(__dirname, 'coulson.jpg'),
    actions: ['OK', 'Cancel'] },   // buttons rendered on the toast
  (err, data) => { /* fires when the toast closes; data has the outcome */ }
);

notifier.on('timeout',   () => {});  // built-in events
notifier.on('activate',  () => {});  // toast body clicked
notifier.on('dismissed', () => {});
notifier.on('ok',     () => {});     // per-button events, lower-cased label
notifier.on('cancel', () => {});
```

How it works internally (`notifiers/toaster.js`):

- Wraps the vendored `vendor/snoreToast/snoretoast-x64.exe` (or `-x86`).
- node-notifier creates a **named pipe** (`\\.\pipe\notifierPipe-<uuid>`, or
  `/tmp/...` under WSL) and passes it via `-pipeName`; SnoreToast writes a
  `key=value;key=value` result (UTF-16LE) there.
- SnoreToast exit codes carry the outcome:
  `0` Success, `1` Hidden, `2` Dismissed, `3` TimedOut, `4` ButtonPressed,
  `5` TextEntered. `-1` = failure (the only code mapped to an error).
- Parsed result exposes `action` (`buttonClicked`, …) and `button`
  (which label was pressed); `activationType` is normalized from these.
- Windows toast caveats: `icon` must be an absolute path to a PNG
  < 1024×1024 px and < 200 KB. On Win10 1709+, pass a registered `appID`
  or the toast shows "SnoreToast" as the sender.

---

## 2. Current state of this repo

- `src/index.ts` — `notify()` already wraps `notifier.notify()` but only passes
  `title/subtitle/sound/open/icon` and resolves `Promise<void>`; the callback's
  `response`/`metadata` args (which carry action/reply results) are discarded.
- `src/index.ts` — `ask()` implements the current Yes/No flow with **separate
  dialog windows** (osascript / zenity / PowerShell MessageBox), *not*
  notification-embedded input.
- `src/args.ts` / `src/cli.ts` — CLI flags exist only for the options above
  plus `-ask`; there is no way to request `reply`/`actions` from the CLI, and
  nothing prints the user's answer back to stdout.
- `plugin/hooks/ask.sh` — the Claude Code Notification hook calls
  `terminal-notifier -ask "$message"`.
- `package.json` depends on `node-notifier@^10.0.1` (the npm package); the
  `submodules/node-notifier` checkout is a read-only reference copy.

---

## 3. Integration plan (doc only — nothing implemented)

### 3.1 Library layer (`src/index.ts`)

1. Extend `NotifyOptions` with the interactive flags:
   - `reply?: boolean`
   - `actions?: string | string[]`
   - `closeLabel?: string`
   - `dropdownLabel?: string`
   - `timeout?: number | false` (or `wait?: boolean`)
2. Change `notify()` to **return the outcome** instead of `void`:
   ```ts
   notify(message, options): Promise<NotifyResult>
   // NotifyResult = { activationType?: string; activationValue?: string }
   ```
   Resolve with the callback's 3rd argument (`metadata`) — this is where the
   chosen action label or typed reply text arrives on macOS.
3. When `reply`/`actions` is set, do **not** pass a small `timeout`;
   node-notifier's own docs recommend a high timeout or none (see README
   "Exception" note). The current `wait: options.open !== undefined` logic
   would need to consider interactive options too.
4. Keep in mind: the default-exported `notifier.notify` works for
   fire-and-forget actions on Windows (button events are emitted as
   lower-cased label events), but for macOS `replied` you may want a dedicated
   `new NotificationCenter()` instance (as `example/macInput.js` does) if you
   prefer the EventEmitter style. The callback-based `metadata` works without
   an instance.

### 3.2 CLI layer (`src/args.ts`, `src/cli.ts`)

1. Add flags (following the existing `-flag value` convention):
   - `-reply` (boolean — needs a new BOOLEAN_FLAGS concept; today every flag
     takes a value)
   - `-actions VALUE` (comma-separated → array)
   - `-closeLabel VALUE`, `-dropdownLabel VALUE`, `-timeout VALUE`
2. After `notify()` resolves, print the outcome so shell callers (hooks,
   scripts) can consume it, e.g.:
   ```
   $ terminal-notifier -message 'Continue?' -actions OK,Cancel -closeLabel No
   ACTIVATION=OK
   ```
3. Update `-help` text and the platform notes:
   - `reply`/`actions`/`closeLabel`: macOS 10.9+ only (via NotificationCenter).
   - `actions` on Windows: Win8+/WSL via SnoreToast; outcome derived from
     exit code + named-pipe result.

### 3.3 Interaction with the existing `-ask` flow

Two possible relationships — a decision to make before implementing:

- **Replace**: native notification input (`reply`, toast text fields) could
  replace the osascript/zenity/PowerShell dialogs. Pro: one UX, no extra
  window. Con: on macOS the input only exists while the notification is
  visible; if the user misses it (Focus/DND, notification expired), there is
  no answer at all — the dialog is more robust.
- **Augment**: keep `-ask` as the reliable blocking path, add
  `-reply`/`-actions` as a "best effort" interactive notification mode.
  The current plugin README's "Limitations" section would still apply.

The plugin hook (`plugin/hooks/ask.sh`) would only change if "Replace" is
chosen.

### 3.4 Windows-specific setup notes

- SnoreToast needs banners enabled for the toast app
  (Settings > System > Notifications & actions).
- Pass a real `appID` (registered at install time, e.g.
  `com.squirrel.your.app`) or the notification is attributed to "SnoreToast".
- node-notifier already handles the named-pipe plumbing; the CLI only needs
  to surface the parsed `activationType`/`button`.

### 3.5 Testing notes

- macOS: manual test — send `reply: true` and confirm the resolved metadata
  contains the typed text; verify a high/absent `timeout` behaves as expected.
- Windows: run under Win10 1709+ or WSL; check exit code 4 (`ButtonPressed`)
  and 5 (`TextEntered`) map to a non-error result.
- Unit tests should assert the *parsed outcome* (activation value, chosen
  button), not merely "did not throw".

---

## 4. File map (reference)

| Path | What it shows |
|---|---|
| `submodules/node-notifier/example/macInput.js` | macOS actions + reply + `closeLabel`, `replied` event |
| `submodules/node-notifier/example/toaster-with-actions.js` | SnoreToast buttons + built-in/button events |
| `submodules/node-notifier/notifiers/notificationcenter.js` | mac wrapper; `activate`/`timeout`/`replied` action mapping |
| `submodules/node-notifier/notifiers/toaster.js` | SnoreToast wrapper; named pipe, exit codes, result parsing |
| `submodules/node-notifier/lib/utils.js` | `mapToMac` / `mapToWin8` option→flag mapping |
| `src/index.ts` | current `notify()`/`ask()` wrappers to extend |
| `src/args.ts`, `src/cli.ts` | CLI flag parsing and output to extend |
