import * as fs from 'fs'
import * as path from 'path'

import * as esbuild from 'esbuild'

const findProjectRoot = (): string => {
  let dir = __dirname
  while (dir.length > 1) {
    if (fs.readdirSync(dir).indexOf('package.json') >= 0) {
      return dir
    }
    dir = path.dirname(dir)
  }
  throw new Error(`project root not found when searching from ${__dirname}`)
}

export const projectRootPath = findProjectRoot()
export const rsSrcPath = path.join(projectRootPath, 'rs')
export const jsSrcPath = path.join(projectRootPath, 'src')
export const buildOutputPath = path.join(projectRootPath, 'out')
export const webOutputPath = path.join(buildOutputPath, 'web')
export const serverOutputPath = path.join(buildOutputPath, 'server')
export const webEphemeralPath = path.join(jsSrcPath, 'web', 'ephemeral')
export const serverBuildVersionPath = path.join(
  serverOutputPath,
  'buildVersion',
)

export const webEntrypoints = [
  ['client', 'main.ts'],
  ['tools/rendertoy', 'main.ts'],
  // ['tools/bench', 'main.tsx'],
]

const webWasmPlugin: esbuild.Plugin = {
  name: 'wasm',
  setup: (build) => {
    build.onResolve({ filter: /\.wasm$/ }, (args) => {
      if (path.isAbsolute(args.path)) {
        return { namespace: 'wasm', path: args.path }
      }

      if (args.path.startsWith('~/')) {
        return {
          namespace: 'wasm',
          path: path.join(jsSrcPath, args.path.substr(2)),
        }
      }

      return { namespace: 'wasm', path: path.join(args.resolveDir, args.path) }
    })

    // use binary loader for wasm files
    build.onLoad({ filter: /.*/, namespace: 'wasm' }, async (args) => ({
      contents: await fs.promises.readFile(args.path),
      loader: 'binary',
    }))
  },
}

export const webBuildOpts: esbuild.BuildOptions = {
  bundle: true,
  define: {
    'process.env.NODE_ENV': '"production"', // for react-dom
  },
  entryPoints: webEntrypoints.map(([dir, entryfile]) =>
    path.join(jsSrcPath, dir, entryfile),
  ),
  loader: {
    '.obj': 'text',
    '.gltf': 'json',
  },
  minify: false,
  outdir: webOutputPath,
  sourcemap: true,
  target: ['chrome88', 'firefox84', 'safari14'],
  plugins: [webWasmPlugin],
}

export const serverBuildOpts: esbuild.BuildOptions = {
  bundle: true,
  entryPoints: [path.join(jsSrcPath, 'server', 'main.ts')],
  outdir: serverOutputPath,
  platform: 'node',
  sourcemap: true,
  target: 'es2019',
}

export async function updateWebBuildVersion(
  buildVersion: string,
): Promise<void> {
  await fs.promises.mkdir(webEphemeralPath, { recursive: true })
  await fs.promises.writeFile(
    path.join(webEphemeralPath, 'buildVersion.ts'),
    `export const buildVersion = '${buildVersion}'`,
  )
}

export async function copyWebHtml(): Promise<void> {
  await Promise.all(
    webEntrypoints.map(async ([dir]) => {
      await fs.promises.mkdir(path.join(webOutputPath, dir), {
        recursive: true,
      })
      await fs.promises.copyFile(
        path.join(jsSrcPath, dir, 'index.html'),
        path.join(webOutputPath, dir, 'index.html'),
      )
    }),
  )
}

export async function writeServerBuildVersion(
  buildVersion: string,
): Promise<void> {
  await fs.promises.mkdir(
    path.normalize(path.join(serverBuildVersionPath, '..')),
    {
      recursive: true,
    },
  )
  await fs.promises.writeFile(serverBuildVersionPath, buildVersion)
}
