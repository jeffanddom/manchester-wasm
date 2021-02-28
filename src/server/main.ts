import * as fs from 'fs'

import * as hapi from '@hapi/hapi'
import inert from '@hapi/inert'

import { serverBuildVersionPath, webOutputPath } from '~/cli/build/common'

async function buildVersion(): Promise<string> {
  return (await fs.promises.readFile(serverBuildVersionPath)).toString()
}

async function main(): Promise<void> {
  // TODO: read from envvar
  const port = 3000

  const httpServer = new hapi.Server({
    port,
    host: 'localhost',
  })

  await httpServer.register(inert)

  httpServer.route({
    method: 'GET',
    path: '/',
    handler: async (req, h) => {
      return h.redirect('/client')
    },
  })

  // Static assets
  httpServer.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: webOutputPath,
        index: 'index.html',
      },
    },
  })

  const bv = await buildVersion()
  console.log(`Starting dev server on port ${port}, build version ${bv}`)
  await httpServer.start()
}

main()

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})
