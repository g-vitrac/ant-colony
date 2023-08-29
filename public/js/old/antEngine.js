
class AntEngine extends Engine{

    init = async () => {
        
        await Engine.getWebGPU();

        this.module = this.device.createShaderModule({
            label: 'ant compute module',
            code: `

                struct antData{
                    pos: vec2f,
                    angle: f32,
                    speed: f32
                }

                @group(0) @binding(0) var<storage, read_write> data: array<antData>;                
                @group(0) @binding(1) var<uniform> screen: vec2f;          
                @group(0) @binding(2) var<storage, read> texData: array<u32>;
                @group(0) @binding(3) var<storage, read_write> testData: array<f32>;
                @group(0) @binding(4) var<uniform> additionalData: vec3f;

                const antDetectionLength = 35;
                const antDetectionAngle = 10;
                const angRotation = 100 * 0.016;
            

                @compute @workgroup_size(1) fn computeSomething(
                    @builtin(global_invocation_id) id: vec3<u32>,
                    @builtin(local_invocation_id) lid: vec3<u32>       
                ) {                                        
                    

                    let bufferWidth = i32(floor(screen.x / 128) + 1) * 128;
                    let bufferOffset = f32(bufferWidth) - screen.x;

                    let i = id.x;
                    let rad = radians(data[i].angle);
                    data[i].pos.x += cos(rad) * data[i].speed *  0.016;
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

                    var antPosition = vec2i(i32(data[i].pos.x), i32(data[i].pos.y));

                    var lp = vec2i(antDetectionLength * vec2f(cos(radians(data[i].angle + antDetectionAngle)), sin(radians(data[i].angle + antDetectionAngle)))) + antPosition;                    
                    var rp = vec2i(antDetectionLength * vec2f(cos(radians(data[i].angle - antDetectionAngle)), sin(radians(data[i].angle - antDetectionAngle)))) + antPosition;                    

                    lp = vec2i(max(0, lp.x - 1), i32(screen.y) - max(lp.y, 1));
                    rp = vec2i(max(0, rp.x - 1), i32(screen.y) - max(rp.y, 1));
                    
                    var texelLeft = unpack4x8unorm(texData[(i32(screen.x) * lp.y) + (lp.y * i32(bufferOffset)) + lp.x]);
                    var texelRight = unpack4x8unorm(texData[(i32(screen.x) * rp.y) + (rp.y * i32(bufferOffset)) + rp.x]);

                    if(texelRight.r != 0 && texelLeft.r <= texelRight.r)
                    {
                        data[i].angle -= angRotation;
                    }
                    else if(texelLeft.r != 0)
                    {
                        data[i].angle += angRotation;
                    }else{
                        data[i].angle += (additionalData.z * 2 - 1) * angRotation;
                    }                                    
                         
                    if(additionalData.y == 1){
                        testData[0] = additionalData[0];
                        testData[1] = screen.x;   
                        testData[2] = f32(bufferWidth);   
                        testData[3] = bufferOffset;                        
                    }
                }
            `,
        });

        this.pipeline = this.device.createComputePipeline({
            label: 'ant compute pipeline',
            layout: 'auto',
            compute: {
                module: this.module,
                entryPoint: 'computeSomething',
            },
        });

        this.antArr = [];

        for(let i = 0; i < this.nbAnts; i++)
        {
            //[x, y, rad from (1,0), v.norm]   

            // let direction = Math.random() < 0.5 ? (Math.random() < 0.5 ? 0 : 90) : (Math.random() < 0.5 ? 180 : 270);

            let direction = Math.random() * 360;
            // console.log(direction);

            this.antArr = this.antArr.concat([
                // 10, Math.random() * this.canvas.height , 0, 5,                

                Math.random() * this.canvas.width, Math.random() * this.canvas.height , direction, 100,
                // this.canvas.width / 2, Math.random() * this.canvas.height, Math.random() > 0.5 ? 270 : 90, 10,
            ]);
        } 

        // this.antArr = [
        //     // 930, 420, 90, 1,
        //     // this.canvas.width / 2  - 15, this.canvas.height / 2 - 15, 90, 5,
        //     // this.canvas.width / 2, this.canvas.height / 2, 0, 0,
        //     29, 29, 0, 0
        // ]

        

        // this.antArr = [
        //     // 5, 5, 90, 0,
        //     //1647,1, 0, 0,
        //     120, 0, 90, 50,
        //     111, 111, 0, 0,
        //     // this.canvas.width - 1, 0, 0, 0,
        //     // 0, this.canvas.height - 1, 0, 0,
        //     // this.canvas.width - 1, this.canvas.height - 1, 0, 0,
        //     // this.canvas.width / 2, this.canvas.height / 2 + 10, 0, 0,
        //     // this.canvas.width / 2 - 10, this.canvas.height / 2, 90, 0,
        //     // 940, 660, 0, 0,
        //     // 930, 150, 90, 100
        //     // this.canvas.width / 2 - 5, this.canvas.height / 8, 90, 50,
        //     // this.canvas.width / 2 + 5, this.canvas.height / 8, 90, 50,
        //     // this.canvas.width / 2 + 10, this.canvas.height / 8, 90, 50
        // ];

        this.input = new Float32Array(this.antArr);

        // create a buffer on the GPU to hold our computation
        // input and output
        this.workBuffer = this.device.createBuffer({
            label: 'work buffer',
            size: this.input.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        this.testBuffer = this.device.createBuffer({
            label: 'work buffer',
            size: this.input.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });

        this.resultBuffer = this.device.createBuffer({
            label: 'result for watching',
            size: this.input.byteLength,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });

        this.testReadBuffer = this.device.createBuffer({
            label: 'result for watching',
            size: this.input.byteLength,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });

        // Copy our input data to that buffer
        this.device.queue.writeBuffer(this.workBuffer, 0, this.input);

        this.size = new Float32Array([
            this.canvas.width, 
            this.canvas.height
        ]);

        this.additionalData = new Float32Array([
            0, 
            antEngine.debug ? '1' : 0, 
            0
        ]);

        this.screenBuffer = this.device.createBuffer({
            label: 'screen size uniform',
            size: this.size.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.additionalDataBuffer = this.device.createBuffer({
            label: 'screen size uniform',
            size: this.additionalData.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.antBuffer = this.device.createBuffer({
            size: 4 * 4 * this.canvas.width * this.canvas.height,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.device.queue.writeBuffer(this.screenBuffer, 0, this.size);
        this.device.queue.writeBuffer(this.additionalDataBuffer, 0, this.additionalData);

        // Setup a bindGroup to tell the shader which
        // buffer to use for the computation
        this.bindGroup = this.device.createBindGroup({
          label: 'bindGroup for work buffer',
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: this.workBuffer } },
            { binding: 1, resource: { buffer: this.screenBuffer } },
            { binding: 2, resource: { buffer: this.antBuffer } },
            { binding: 3, resource: { buffer: this.testBuffer } },
            { binding: 4, resource: { buffer: this.additionalDataBuffer } },
          ],
        });

        // Encode commands to do the computation
        this.encoder = this.device.createCommandEncoder({
            label: 'doubling encoder',
        });
    }


    constructor(nbAnts = 1) {
        super();
        this.nbAnts = nbAnts;
        this.antSpeed = 0;
    }

    compute = async (delta, buffer) => {   
        
        this.nbAnts = this.antArr.length / 4;
        
        //console.log(buffer);

        // console.log('size : ' + delta)
        this.additionalData[0] = delta;
        this.additionalData[2] = Math.random();

        // console.log(delta);
        // console.log(this.size)     
        this.device.queue.writeBuffer(this.additionalDataBuffer, 0, this.additionalData);

        this.encoder = this.device.createCommandEncoder();

        
        if(buffer != null){

            this.encoder.copyBufferToBuffer(buffer, 0, this.antBuffer, 0, this.antBuffer.size);            

            if(this.antReadBuffer == undefined){
                this.antReadBuffer = this.device.createBuffer({
                    label: 'result for watching',
                    size: buffer.size,
                    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
                });
            }else if(this.debug){
                this.encoder.copyBufferToBuffer(buffer, 0, this.antReadBuffer, 0, buffer.size);            

                await this.antReadBuffer.mapAsync(GPUMapMode.READ);

                let res = this.antReadBuffer.getMappedRange().slice();

                console.log(new Uint8Array(res));

                this.antReadBuffer.unmap();
            }
            
        }

        let pass = this.encoder.beginComputePass({
            label: 'doubling compute pass',
        });        

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.dispatchWorkgroups(this.nbAnts);
        pass.end();        

        if(this.debug){
            
            
            this.encoder.copyBufferToBuffer(this.workBuffer, 0, this.resultBuffer, 0, this.workBuffer.size);

            await this.resultBuffer.mapAsync(GPUMapMode.READ);

            let res = new Float32Array(this.resultBuffer.getMappedRange());

            console.log('res', res);

            this.resultBuffer.unmap();

            this.encoder.copyBufferToBuffer(this.testBuffer, 0, this.testReadBuffer, 0, this.testBuffer.size);
            
            await this.testReadBuffer.mapAsync(GPUMapMode.READ);

            let test = new Float32Array(this.testReadBuffer.getMappedRange().slice());

            console.log('test', test);//new Uint8Array(test.slice(0, 2)), test);

            this.testReadBuffer.unmap();

        }

        let commandBuffer = this.encoder.finish();
        this.device.queue.submit([commandBuffer]);
    }
}