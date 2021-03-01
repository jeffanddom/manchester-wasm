use std::u32;

use js_sys::Float32Array;
use web_sys::{WebGl2RenderingContext, WebGlVertexArrayObject};

use super::shader::Attrib;

pub struct Model {
    pub vao: WebGlVertexArrayObject,
    pub vert_count: i32,
}

impl Model {
    pub fn new(ctx: &WebGl2RenderingContext, pos: &[f32], colors: &[f32]) -> Result<Model, String> {
        let vao = ctx
            .create_vertex_array()
            .ok_or_else(|| String::from("could not create vertex array"))?;
        ctx.bind_vertex_array(Some(&vao));

        bind_attrib_buffer(ctx, Attrib::Position as u32, pos, 3)?;
        bind_attrib_buffer(ctx, Attrib::Color as u32, colors, 4)?;

        ctx.bind_vertex_array(None);

        Ok(Model {
            vao,
            vert_count: pos.len() as i32 / 3,
        })
    }
}

fn bind_attrib_buffer(
    ctx: &WebGl2RenderingContext,
    attrib_loc: u32,
    data: &[f32],
    attrib_size: i32,
) -> Result<(), String> {
    let buf = ctx
        .create_buffer()
        .ok_or_else(|| String::from("could not create GL buffer"))?;
    ctx.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&buf));

    let js_arr: Float32Array;
    unsafe {
        js_arr = Float32Array::view(data);
    }
    ctx.buffer_data_with_array_buffer_view(
        WebGl2RenderingContext::ARRAY_BUFFER,
        &js_arr,
        WebGl2RenderingContext::STATIC_DRAW,
    );

    ctx.vertex_attrib_pointer_with_i32(
        attrib_loc,
        attrib_size,
        WebGl2RenderingContext::FLOAT,
        false,
        0,
        0,
    );
    ctx.enable_vertex_attrib_array(attrib_loc);

    ctx.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, None);

    Ok(())
}
