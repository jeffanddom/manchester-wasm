import { default as wasm } from '../gen/rs/index_bg.wasm'
import init, { start } from "~/gen/rs";

async function main(): Promise<void> {
  await init(wasm)
  start()
}

main()
