mod renderer;

use std::{cell::RefCell, rc::Rc};

use renderer::Renderer;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::WebGl2RenderingContext;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen(start)]
pub fn start() -> Result<(), JsValue> {
    #[cfg(feature = "console_error_panic_hook")]
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));

    let document = web_sys::window().unwrap().document().unwrap();
    let canvas = document.get_element_by_id("canvas").unwrap();
    let canvas: web_sys::HtmlCanvasElement = canvas.dyn_into::<web_sys::HtmlCanvasElement>()?;

    let ctx = canvas
        .get_context("webgl2")?
        .unwrap()
        .dyn_into::<WebGl2RenderingContext>()?;

    let mut renderer = Renderer::new(ctx);
    renderer.init();

    renderer.load_shader(
        "std",
        r#"#version 300 es
        in vec3 position;
        in vec3 color;
        out vec3 outcolor;
        void main() {
            gl_Position = vec4(position, 1.0);
            outcolor = color;
        }
    "#,
        r#"#version 300 es
        precision mediump float;
        in vec3 outcolor;
        out vec4 fcolor;
        void main() {
            fcolor = vec4(outcolor, 1.0);
        }
    "#,
        &[],
    )?;
    renderer.use_shader("std")?;

    #[rustfmt::skip]
    renderer.load_model(
        "triangle",
        &[
            -0.7, -0.7, 0.0,
            0.7, -0.7, 0.0,
            0.0, 0.7, 0.0
        ],
        &[
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0
        ],
    )?;

    let f = Rc::new(RefCell::new(None));
    let g = f.clone();

    *g.borrow_mut() = Some(Closure::wrap(Box::new(move || {
        request_animation_frame(f.borrow().as_ref().unwrap());
        renderer.use_shader("std").unwrap();
        renderer.render(&["triangle"]).unwrap();
    }) as Box<dyn FnMut()>));

    request_animation_frame(g.borrow().as_ref().unwrap());

    Ok(())
}

fn window() -> web_sys::Window {
    web_sys::window().expect("no global `window` exists")
}

fn request_animation_frame(f: &Closure<dyn FnMut()>) {
    window()
        .request_animation_frame(f.as_ref().unchecked_ref())
        .expect("should register `requestAnimationFrame` OK");
}
