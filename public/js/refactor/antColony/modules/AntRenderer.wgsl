struct AntVertex {
    @location(0) vertexPosition: vec2f,
};

struct AntData{
    pos: vec2f,
    angle: f32,
    speed: f32
};

struct Screen{
    size: vec2f
};

@group(0) @binding(0) var<uniform> screen: Screen;
@group(0) @binding(1) var<storage, read> antData: array<AntData>;

@vertex fn vs(antVertex: AntVertex, @builtin(instance_index) instanceIndex: u32) -> @builtin(position) vec4f {    
    return vec4f((antVertex.vertexPosition + antData[instanceIndex].pos.xy) / screen.size * 2 - vec2f(1), 0, 1);
}

// @vertex fn vs(antVertex: AntVertex, @builtin(instance_index) instanceIndex: u32) -> @builtin(position) vec4f {
//     return vec4f((antVertex.vertexPosition + antData[instanceIndex].pos.xy) / screen.size * 2 - vec2f(1), 0.0, 1.0);
// }

@fragment fn fs() -> @location(0) vec4f {
    return vec4f(1.0, 1.0, 1.0, 1.0);
}