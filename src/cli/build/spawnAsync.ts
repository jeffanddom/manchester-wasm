import * as childProcess from 'child_process'

export class NonzeroStatusError extends Error {
  public code: number

  constructor(code: number) {
    super(`exited with nonzero status code ${code}`)
    this.code = code
  }
}

export class SignalError extends Error {
  public signal: NodeJS.Signals

  constructor(signal: NodeJS.Signals) {
    super(`exited due to signal ${signal}`)
    this.signal = signal
  }
}

export function spawnAsync(params: {
  cmd: string
  args?: string[]
  opts?: childProcess.SpawnOptionsWithoutStdio
  onStdout?: (data: string) => void
  onStderr?: (data: string) => void
}): {
  proc: childProcess.ChildProcess
  promise: Promise<void>
} {
  const proc = childProcess.spawn(params.cmd, params.args, params.opts)
  const promise = new Promise<void>((resolve, reject) => {
    proc.on('close', (code, signal) => {
      if (code !== null && code !== 0) {
        reject(new NonzeroStatusError(code))
        return
      }

      if (signal !== null) {
        reject(new SignalError(signal))
        return
      }

      resolve()
    })

    const onStdout = params.onStdout
    if (onStdout !== undefined) {
      proc.stdout.on('data', (data) => onStdout(data.toString()))
    }

    const onStderr = params.onStderr
    if (onStderr !== undefined) {
      proc.stderr.on('data', (data) => onStderr(data.toString()))
    }
  })

  return { proc, promise }
}
