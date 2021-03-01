import { ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

import * as chokidar from 'chokidar'
import * as esbuild from 'esbuild'

import * as time from '../../util/time'

import {
  copyWebHtml,
  jsSrcPath,
  rsSrcPath,
  serverBuildOpts,
  serverOutputPath,
  updateWebBuildVersion,
  webBuildOpts,
  webEphemeralPath,
  writeServerBuildVersion,
} from './common'
import { DebouncedBuilder } from './DebouncedBuilder'
import { SignalError, spawnAsync } from './spawnAsync'

function getMtimeMs(filepath: string): number {
  const stats = fs.statSync(filepath)
  if (stats.isDirectory()) {
    const files = fs.readdirSync(filepath)
    const mtimes = files.map((f) => getMtimeMs(path.join(filepath, f)))
    return mtimes.reduce((accum, t) => Math.max(accum, t), -1)
  }

  return stats.mtimeMs
}

class DevDaemon {
  private jsBuilder: DebouncedBuilder
  private rsBuilder: DebouncedBuilder

  private server: ChildProcess | undefined
  private incrementalBuilds:
    | {
        server: esbuild.BuildIncremental
        web: esbuild.BuildIncremental
      }
    | undefined

  constructor() {
    this.jsBuilder = new DebouncedBuilder(async () => {
      await this.jsBuild()
    })
    this.rsBuilder = new DebouncedBuilder(async () => {
      await this.rsBuild()
    })
  }

  public start(): void {
    chokidar
      .watch([rsSrcPath, jsSrcPath], { ignoreInitial: true, persistent: true })
      .on('all', (_event, filename) => {
        if (filename.startsWith(webEphemeralPath)) {
          return
        }

        if (filename.startsWith(jsSrcPath)) {
          this.jsBuilder.touch()
        }

        if (filename.startsWith(rsSrcPath) && filename.endsWith('.rs')) {
          this.rsBuilder.touch()
        }
      })

    this.jsBuild()
  }

  private async jsBuild(): Promise<void> {
    const buildVersion = getMtimeMs(jsSrcPath).toString()

    console.log(`Spawning JS build jobs for build version ${buildVersion}...`)
    const start = time.current()

    let buildSuccess = false
    try {
      await this.rebuildAssets(buildVersion)
      buildSuccess = true
    } catch (err) {
      console.log(`asset build error: ${err.toString()}`)
    }

    const elapsed = time.current() - start
    console.log(`JS build completed in ${elapsed.toFixed(3)}s`)

    if (buildSuccess) {
      this.restartServer()
    }
  }

  private async rsBuild(): Promise<void> {
    console.log(`Spawning Rust build...`)
    const start = time.current()

    try {
      await spawnAsync({
        cmd: path.join(rsSrcPath, 'build.sh'),
        onStdout: (s) => console.log(`rs stdout: ${s.trimEnd()}`),
        onStderr: (s) => console.log(`rs stderr: ${s.trimEnd()}`),
      }).promise
    } catch (err) {
      console.log(`Rust build error: ${err}`)
    }

    const elapsed = time.current() - start
    console.log(`Rust build completed in ${elapsed.toFixed(3)}s`)
  }

  private async rebuildAssets(buildVersion: string): Promise<void> {
    // Make build version available to web build.
    await updateWebBuildVersion(buildVersion)

    if (this.incrementalBuilds !== undefined) {
      await Promise.all([
        this.incrementalBuilds.server.rebuild(),
        this.incrementalBuilds.web.rebuild(),
      ])
    } else {
      const [server, web] = await Promise.all([
        esbuild.build({
          ...serverBuildOpts,
          incremental: true,
        }),
        esbuild.build({
          ...webBuildOpts,
          incremental: true,
        }),
      ])
      this.incrementalBuilds = { server, web }
    }

    // Post-build tasks:
    // - copy index.html for web programs
    // - make build version available to server.
    await Promise.all([copyWebHtml(), writeServerBuildVersion(buildVersion)])
  }

  private restartServer(): void {
    if (this.server !== undefined) {
      this.server.kill()
    }

    const spawn = spawnAsync({
      cmd: 'node',
      args: [path.join(serverOutputPath, 'main.js')],
      onStdout: (s) => console.log(s.trimEnd()),
      onStderr: (s) => console.log(s.trimEnd()),
    })
    this.server = spawn.proc
    spawn.promise.catch((err) => {
      if (err instanceof SignalError && err.signal === 'SIGTERM') {
        // Ignore SIGTERM, which the dev server uses to kill the game server.
        return
      }
      throw err
    })
  }
}

const daemon = new DevDaemon()
daemon.start()
