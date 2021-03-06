# manchester-wasm

An experiment in WebAssembly game development.

## Quick start

Install Rust via [rustup](https://www.rust-lang.org/tools/install), and then install [wasm-pack](https://rustwasm.github.io/docs/wasm-pack/):

```
cargo install wasm-pack
```

Clone this repo and build the Rust dependencies:

```
make rs
```

Start the dev server:

```
make
```

The dev server will rebuild and restart the game if it detects changes to the `src/` and `rs/` directories.

## Directory structure

- `rs`: a Rust project targeting WASM for the browser.
- `src`: TypeScript for both browser and server.
  - `gen`: auto-generated files
    - `rs`: JS/WASM artifacts generated by building the `rs` project.
