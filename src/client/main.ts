import { default as wasm } from '../gen/rs/index_bg.wasm'
import init, { greet } from "~/gen/rs";

async function main(): Promise<void> {
  await init(wasm)
  greet("World")
}

main()
