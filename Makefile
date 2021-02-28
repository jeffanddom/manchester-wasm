.PHONY: rs

rs:
	wasm-pack build --out-dir $(CURDIR)/src/gen/rs --out-name index --target web $(CURDIR)/rs
