import init, { start } from '~/gen/rs'
import { default as wasm } from '~/gen/rs/index_bg.wasm'

async function main(): Promise<void> {
  await init(wasm)
  start()
}

main()
