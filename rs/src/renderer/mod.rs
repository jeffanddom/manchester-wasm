mod model;
mod shader;

use std::collections::HashMap;

use web_sys::WebGl2RenderingContext;

use self::{model::Model, shader::Shader};

pub struct Renderer {
    ctx: WebGl2RenderingContext,
    shaders: HashMap<String, Shader>,
    current_shader: Option<String>,
    models: HashMap<String, Model>,
}

impl Renderer {
    pub fn new(ctx: WebGl2RenderingContext) -> Renderer {
        Renderer {
            ctx,
            shaders: HashMap::new(),
            current_shader: None,
            models: HashMap::new(),
        }
    }

    pub fn init(&self) {
        self.ctx.clear_color(0.0, 0.0, 0.0, 1.0);
    }

    pub fn load_shader(
        &mut self,
        name: &str,
        vs_src: &str,
        fs_src: &str,
        uniforms: &[&str],
    ) -> Result<(), String> {
        self.shaders.insert(
            name.to_string(),
            Shader::new(&self.ctx, vs_src, fs_src, uniforms)?,
        );
        Ok(())
    }

    pub fn load_model(&mut self, name: &str, pos: &[f32], colors: &[f32]) -> Result<(), String> {
        let model = Model::new(&self.ctx, pos, colors)?;
        self.models.insert(name.to_string(), model);
        Ok(())
    }

    fn get_shader(&self, name: &str) -> Result<&Shader, String> {
        self.shaders
            .get(name)
            .ok_or_else(|| format!("shader not found: {}", name))
    }

    pub fn use_shader(&mut self, name: &str) -> Result<(), String> {
        let shader = self.get_shader(name)?;
        self.ctx.use_program(Some(&shader.program));
        self.current_shader = Some(name.to_string());
        Ok(())
    }

    pub fn render(&self, models: &[&str]) -> Result<(), String> {
        self.ctx.clear(WebGl2RenderingContext::COLOR_BUFFER_BIT);

        for m in models.iter() {
            let model = self
                .models
                .get(*m)
                .ok_or_else(|| format!("could not find model {}", *m))?;
            self.ctx.bind_vertex_array(Some(&model.vao));
            self.ctx
                .draw_arrays(WebGl2RenderingContext::TRIANGLES, 0, model.vert_count);
        }
        Ok(())
    }
}
