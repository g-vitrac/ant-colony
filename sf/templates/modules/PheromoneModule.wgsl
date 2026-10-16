const screenSizedSquare = array<vec2f, 6>(      
    vec2f( -1.0,  -1.0),
    vec2f( 1.0,  -1.0),
    vec2f( -1.0,  1.0),
    vec2f( -1.0,  1.0),
    vec2f( 1.0,  -1.0),
    vec2f( 1.0,  1.0),
);

struct Screen{
    size: vec2f
}

struct TexData {
    @builtin(position) position: vec4f,
    @location(0) texcoord: vec2f,
}

@group(0) @binding(0) var texSampler: sampler;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var<uniform> screen: Screen;

@vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> TexData {
    var vsOutput: TexData;
    vsOutput.position = vec4f(screenSizedSquare[vertexIndex], 0.0, 1.0);
    vsOutput.texcoord = (screenSizedSquare[vertexIndex] * vec2f(1, -1) + 1) / 2;
    return vsOutput;
}        
    
@fragment fn fs (fsInput: TexData) -> @location(0) vec4f {
    var texcoord = fsInput.texcoord;
    var onePixToTexCoordX = 1 / screen.size.x;
    var onePixToTexCoordY = 1 / screen.size.y;
    var tl = textureSample(tex, texSampler, vec2f(texcoord.x - onePixToTexCoordX, texcoord.y + onePixToTexCoordY)); //topLeft
    var tc = textureSample(tex, texSampler, vec2f(texcoord.x, texcoord.y + onePixToTexCoordY)); //topCenter
    var tr = textureSample(tex, texSampler, vec2f(texcoord.x + onePixToTexCoordX, texcoord.y + onePixToTexCoordY)); //topRight
    var ml = textureSample(tex, texSampler, vec2f(texcoord.x - onePixToTexCoordX, texcoord.y)); //middleLeft
    var mr = textureSample(tex, texSampler, vec2f(texcoord.x + onePixToTexCoordX, texcoord.y)); //middleCenter
    var bl = textureSample(tex, texSampler, vec2f(texcoord.x - onePixToTexCoordX, texcoord.y - onePixToTexCoordY)); //bottomLeft
    var bc = textureSample(tex, texSampler, vec2f(texcoord.x , texcoord.y - onePixToTexCoordY)); //bottomCenter
    var br = textureSample(tex, texSampler, vec2f(texcoord.x + onePixToTexCoordX, texcoord.y - onePixToTexCoordY)); //bottomRight            
    var color = textureSample(tex, texSampler, texcoord); //center
    
    var addComponent = 50 * 0.016 * ( ((tl.rgba + tr.rgba + bl.rgba + br.rgba) + (tc.rgba + ml.rgba + mr.rgba + bc.rgba)) / 8 - color.rgba);
    
    color = color + addComponent; // vec4f(color.rgba + addComponent);
    
    //color = vec4f(texcoord.x, texcoord.y, 0, 1);
    
    return max(vec4(0), vec4f(color.rgba - 0.01));
}