struct antData{
    pos: vec2f,
    angle: f32,
    speed: f32,
};

@group(0) @binding(0) var<storage, read_write> data: array<antData>;                
@group(0) @binding(1) var<uniform> screen: vec2f;

const antDetectionLength = 35;
const antDetectionAngle = 10;
const angRotation = 100 * 0.016;


@compute @workgroup_size(64, 1) fn computeSomething(
    @builtin(global_invocation_id) id: vec3<u32>,
    @builtin(local_invocation_id) lid: vec3<u32>       
) {                                        
    

    let bufferWidth = i32(floor(screen.x / 128) + 1) * 128;
    let bufferOffset = f32(bufferWidth) - screen.x;

    let i = id.x;
    let rad = radians(data[i].angle);
    data[i].pos.x += cos(rad) * data[i].speed * 0.016;
    data[i].pos.y += sin(rad) * data[i].speed * 0.016;                
                        
    if(data[i].pos.x < 0){
        data[i].pos.x = screen.x;
    } else if(data[i].pos.x > screen.x)
    {
        data[i].pos.x = 0;
    }
    if(data[i].pos.y > f32(screen.y))
    {
        data[i].pos.y = 0;
    }else if(data[i].pos.y < 0)
    {
        data[i].pos.y = f32(screen.y);
    }                                  

}