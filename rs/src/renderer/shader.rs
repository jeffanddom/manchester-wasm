use std::collections::HashMap;

use web_sys::{WebGl2RenderingContext, WebGlProgram, WebGlShader, WebGlUniformLocation};
pub struct Shader {
    pub program: WebGlProgram,
    pub uniforms: HashMap<String, WebGlUniformLocation>,
}

pub enum Attrib {
    Position,
    Color,
}

impl Shader {
    pub fn new(
        context: &WebGl2RenderingContext,
        vs_src: &str,
        fs_src: &str,
        uniforms: &[&str],
    ) -> Result<Shader, String> {
        let vs = compile_shader(context, WebGl2RenderingContext::VERTEX_SHADER, vs_src)?;
        let fs = compile_shader(context, WebGl2RenderingContext::FRAGMENT_SHADER, fs_src)?;
        let program = link_program(context, &vs, &fs)?;
        let mut locs = HashMap::new();

        for u in uniforms {
            match context.get_uniform_location(&program, *u) {
                None => return Err(format!("unknown uniform {}", *u)),
                Some(loc) => {
                    locs.insert(u.to_string(), loc);
                }
            }
        }

        Ok(Shader {
            program,
            uniforms: locs,
        })
    }
}

fn compile_shader(
    context: &WebGl2RenderingContext,
    shader_type: u32,
    source: &str,
) -> Result<WebGlShader, String> {
    let shader = context
        .create_shader(shader_type)
        .ok_or_else(|| String::from("Unable to create shader object"))?;
    context.shader_source(&shader, source);
    context.compile_shader(&shader);

    if context
        .get_shader_parameter(&shader, WebGl2RenderingContext::COMPILE_STATUS)
        .as_bool()
        .unwrap_or(false)
    {
        Ok(shader)
    } else {
        Err(context
            .get_shader_info_log(&shader)
            .unwrap_or_else(|| String::from("Unknown error creating shader")))
    }
}

fn link_program(
    context: &WebGl2RenderingContext,
    vert_shader: &WebGlShader,
    frag_shader: &WebGlShader,
) -> Result<WebGlProgram, String> {
    let program = context
        .create_program()
        .ok_or_else(|| String::from("Unable to create shader object"))?;

    context.attach_shader(&program, vert_shader);
    context.attach_shader(&program, frag_shader);
    context.link_program(&program);

    if context
        .get_program_parameter(&program, WebGl2RenderingContext::LINK_STATUS)
        .as_bool()
        .unwrap_or(false)
    {
        Ok(program)
    } else {
        Err(context
            .get_program_info_log(&program)
            .unwrap_or_else(|| String::from("Unknown error creating program object")))
    }
}
