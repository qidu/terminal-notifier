#!/bin/sh
# Runs terminal-notifier inside an active desktop session (xrdp/RDP, local
# console, or an already-inherited DISPLAY), so notifications and Yes/No
# dialogs from SSH-launched processes (e.g. dsh) reach the desktop instead
# of failing with no DISPLAY.
#
# Discovery: uses $DISPLAY when already set (process launched inside the
# session); otherwise picks the newest X socket under /tmp/.X11-unix by
# mtime (xrdp sessions do not appear in `who`/utmp). Uses the systemd
# user bus when present.
#
# With no display available, exits 127 — a code outside {0, 1} so callers
# like the dsh plugin treat it as "not answerable" (zenity would otherwise
# exit 1 for a missing display, indistinguishable from a "No" answer).

if [ -z "$DISPLAY" ]; then
  # Newest session wins: sockets' mtimes track session creation, so the
  # most recently opened desktop (RDP or local) receives the dialog.
  for sock in $(ls -t /tmp/.X11-unix/X* 2>/dev/null); do
    [ -S "$sock" ] || continue
    export DISPLAY=":${sock#/tmp/.X11-unix/X}"
    break
  done
fi

if [ -z "$DISPLAY" ]; then
  echo "terminal-notifier-session: no active X display" >&2
  exit 127
fi

if [ -z "$DBUS_SESSION_BUS_ADDRESS" ] && [ -S "/run/user/$(id -u)/bus" ]; then
  export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u)/bus"
fi

exec "$(command -v terminal-notifier)" "$@"
