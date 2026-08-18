import { spawn } from 'node:child_process'

export const name = 'dsh-terminal-notifier'

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {{ command?: string, sound?: string, askApprovals?: boolean, askTimeout?: number }} [config]
 */
export function apply(ctx, config = {}) {
  const command = config.command ?? 'terminal-notifier'
  const sound = config.sound ?? 'default'
  const askApprovals = config.askApprovals ?? true
  const askTimeout = config.askTimeout ?? 120

  /**
   * Run the notifier; resolves undefined on spawn failure, else
   * { code, stdout }. Exit code 0 = Yes, 1 = No (for -ask).
   */
  const run = (args) =>
    new Promise((resolve) => {
      const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
      let stdout = ''
      child.stdout.on('data', (chunk) => (stdout += chunk))
      child.on('error', () => resolve(undefined))
      child.on('close', (code) => resolve({ code: code ?? -1, stdout }))
    })

  const withTimeout = (promise, seconds) =>
    Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(undefined), seconds * 1000)),
    ])

  // Notify on turn completion.
  ctx.on('session/event', (session, event) => {
    if (event.type !== 'turn/end') return
    const turn = event.data?.turn ?? event.turn
    run(['-title', 'dsh', '-message', `Turn ${turn} complete.`, '-sound', sound])
  })

  // Answer approval requests with a Yes/No dialog: YES approves once,
  // NO rejects. On failure or timeout, defer to the next answerer
  // (the chain fails closed when nobody claims).
  if (!askApprovals) return
  ctx.on('approval/request', async (request, next) => {
    const question = request.reason ?? 'Approve this action?'
    const result = await withTimeout(run(['-title', 'dsh', '-ask', question]), askTimeout)
    if (result === undefined || (result.code !== 0 && result.code !== 1)) return next()
    return result.code === 0 ? 'allowed-once' : 'rejected'
  })
}
