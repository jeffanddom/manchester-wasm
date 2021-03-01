#!/bin/bash
set -euo pipefail

rs_path=$(dirname $(realpath $0))
project_root=$(dirname $rs_path)
js_path="$project_root/src/gen/rs"

wasm-pack build --out-dir "$js_path" --out-name index --target web "$rs_path"
