import { NonzeroStatusError, SignalError, spawnAsync } from './spawnAsync'

describe('spawnAsync', () => {
  it('resolves when script returns', async () => {
    await expect(spawnAsync({ cmd: 'true' }).promise).resolves.not.toThrow()
  })

  it('throws an error if the script returns a nonzero status', async () => {
    await expect(spawnAsync({ cmd: 'false' }).promise).rejects.toThrow(
      NonzeroStatusError,
    )
  })

  it('throws an error if the script is killed on a signal', async () => {
    const spawned = spawnAsync({ cmd: 'sleep', args: ['300'] })
    setTimeout(() => {
      spawned.proc.kill('SIGTERM')
    }, 1)
    await expect(spawned.promise).rejects.toThrow(SignalError)
  })

  it('captures stdout', async () => {
    let captured = ''
    await spawnAsync({
      cmd: 'echo',
      args: ['test-output'],
      onStdout: (s) => (captured = s),
    }).promise
    expect(captured).toBe('test-output\n')
  })

  it('captures stderr', async () => {
    let captured = ''
    await spawnAsync({
      cmd: 'logger',
      args: ['-s', 'test-output'],
      onStderr: (s) => (captured = s),
    }).promise
    expect(captured.endsWith('test-output\n')).toBe(true)
  })
})
