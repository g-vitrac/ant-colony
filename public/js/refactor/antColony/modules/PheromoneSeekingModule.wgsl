struct antData{
    pos: vec2f,
    angle: f32,
    speed: f32
}

struct behaviorCoefficient{
    antDetectionLength: f32,
    antDetectionAngle: f32,
    angRotation: f32,
    escapeTreshold: f32
}

@group(0) @binding(0) var<storage, read_write> data: array<antData>;                
@group(0) @binding(1) var<uniform> screen: vec2f;          
@group(0) @binding(2) var tex: texture_2d<f32>;
@group(0) @binding(3) var texSampler: sampler;
@group(0) @binding(4) var<uniform> time: f32;
@group(0) @binding(5) var<uniform> antBehavior: behaviorCoefficient;

// const antDetectionLength = 10;
// const antDetectionAngle = 5;
// const angRotation = 5; //100 * 0.016;
// const escapeTreshold = 0.15;

@compute @workgroup_size(64) fn cs(
    @builtin(global_invocation_id) gid: vec3<u32>,
    @builtin(local_invocation_id) lid: vec3<u32>,
    @builtin(workgroup_id) wid: vec3<u32>,
    @builtin(num_workgroups) nwg: vec3<u32>,     
) {    

    let bufferWidth = i32(floor(screen.x / 128) + 1) * 128;
    let bufferOffset = f32(bufferWidth) - screen.x;

    let i = gid.x;

    // if(i == 1){
    //     data[0].angle = f32(wid.x);
    // }
    var lp = vec2f(antBehavior.antDetectionLength * vec2f(cos(radians(data[i].angle + antBehavior.antDetectionAngle)), sin(radians(data[i].angle + antBehavior.antDetectionAngle)))) + data[i].pos;
    var rp = vec2f(antBehavior.antDetectionLength * vec2f(cos(radians(data[i].angle - antBehavior.antDetectionAngle)), sin(radians(data[i].angle - antBehavior.antDetectionAngle)))) + data[i].pos;

    var lpixp = (vec2f(lp.x, screen.y - rp.y)) / screen;
    var rpixp = (vec2f(rp.x, screen.y - rp.y)) / screen;

    var lpix = textureSampleBaseClampToEdge(tex, texSampler, lpixp);
    var rpix = textureSampleBaseClampToEdge(tex, texSampler, rpixp);

    if(rpix.a >= antBehavior.escapeTreshold)
    {
        data[i].angle +=  hash13(vec3f(data[i].pos.x, time, data[i].pos.y)) * antBehavior.angRotation - antBehavior.angRotation / 2;
    }else if(lpix.a >= antBehavior.escapeTreshold){
        data[i].angle -= antBehavior.angRotation;
    }else if(rpix.a != 0 && lpix.a <= rpix.a)
    {
        data[i].angle -= antBehavior.angRotation;
    }
    else if(lpix.a != 0)
    {
        data[i].angle += antBehavior.angRotation;
    }
    else{
        data[i].angle += hash13(vec3f(data[i].pos.x, time, data[i].pos.y)) * antBehavior.angRotation - antBehavior.angRotation / 2;
    }

    
    // if(i == 0){
    //     data[0].angle = f32(nwg.x);
    // }

    // if(i == 1){
    //     data[i].angle = f32(id.x);
    // }
    // data[i].pos.x = f32(id.x);
    // data[i].pos.y = f32(lid.x);
    // data[i].angle = 0;
    // data[i].speed = 0;
}

fn hash11(v : f32) -> f32
{
    var p = fract(sin(radians(v)) * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

fn hash12(v : vec2f) -> f32
{
	var p3  = fract(vec3f(v.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}


fn hash13(v : vec3f) -> f32
{
	var p3  = fract(v * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}