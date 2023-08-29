
const antSize = 2  / 2;

class AntRenderer extends Engine{

  async init(antEngine)
  {
    
    await Engine.getWebGPU();

    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: super.device,
        format: this.presentationFormat
    });

    this.antPositionsBuffer = antEngine.workBuffer;

    this.module = this.device.createShaderModule({
        code: `
            struct AntVertex {
              @location(0) position: vec2f,
            };
            
            struct AntData{
              pos: vec2f,
              angle: f32,
              speed: f32,              
            }
            
            struct ScreenData {
              size: vec2f
            }
            
            struct TexData {
              @builtin(position) position: vec4f,
              @location(0) texcoord: vec2f,
            }
            
            const screenSizedSquare = array<vec2f, 6>(      
              vec2f( -1.0,  -1.0),
              vec2f( 1.0,  -1.0),
              vec2f( -1.0,  1.0),
              vec2f( -1.0,  1.0),
              vec2f( 1.0,  -1.0),
              vec2f( 1.0,  1.0),
            );
            
            @group(0) @binding(0) var<uniform> screenData: ScreenData;
            @group(0) @binding(1) var<storage, read> antData: array<AntData>;
            
            @group(1) @binding(0) var texSampler: sampler;
            @group(1) @binding(1) var tex: texture_2d<f32>;
            
            @vertex fn vs(ant: AntVertex, @builtin(instance_index) instanceIndex: u32) -> @builtin(position) vec4f {
              return vec4f((ant.position + antData[instanceIndex].pos.xy) / screenData.size * 2 - vec2f(1), 0.0, 1.0);              
            }
            
            @fragment fn fs() -> @location(0) vec4f {
              return vec4f(1.0, 1.0, 1.0, 1.0);
            }
            
            @vertex fn texFullCanvasVs(@builtin(vertex_index) vertexIndex: u32) -> TexData {
              var vsOutput: TexData;
              vsOutput.position = vec4f(screenSizedSquare[vertexIndex], 0.0, 1.0);
              vsOutput.texcoord = (screenSizedSquare[vertexIndex] * vec2f(1, -1) + 1) / 2;
              return vsOutput;
            }        
                
            @fragment fn texFullCanvasFs (fsInput: TexData) -> @location(0) vec4f {
              var texcoord = fsInput.texcoord;
              var onePixToTexCoordX = 1 / screenData.size.x;
              var onePixToTexCoordY = 1 / screenData.size.y;
              var tl = textureSample(tex, texSampler, vec2f(texcoord.x - onePixToTexCoordX, texcoord.y + onePixToTexCoordY)); //topLeft
              var tc = textureSample(tex, texSampler, vec2f(texcoord.x, texcoord.y + onePixToTexCoordY)); //topCenter
              var tr = textureSample(tex, texSampler, vec2f(texcoord.x + onePixToTexCoordX, texcoord.y + onePixToTexCoordY)); //topRight
              var ml = textureSample(tex, texSampler, vec2f(texcoord.x - onePixToTexCoordX, texcoord.y)); //middleLeft
              var mr = textureSample(tex, texSampler, vec2f(texcoord.x + onePixToTexCoordX, texcoord.y)); //middleCenter
              var bl = textureSample(tex, texSampler, vec2f(texcoord.x - onePixToTexCoordX, texcoord.y - onePixToTexCoordY)); //bottomLeft
              var bc = textureSample(tex, texSampler, vec2f(texcoord.x , texcoord.y - onePixToTexCoordY)); //bottomCenter
              var br = textureSample(tex, texSampler, vec2f(texcoord.x + onePixToTexCoordX, texcoord.y - onePixToTexCoordY)); //bottomRight            
              var color = textureSample(tex, texSampler, texcoord); //center
              
              var addComponent = 50 * 0.016 * ( ((tl.rgb + tr.rgb + bl.rgb + br.rgb) + (tc.rgb + ml.rgb + mr.rgb + bc.rgb)) / 8 - color.rgb);
              
              color = vec4f(color.rgb + addComponent, 1);
              
              //color = vec4f(texcoord.x, texcoord.y, 0, 1);
              
              return max(vec4(0), vec4f(color.rgb - 0.01, 1));
            }
        `, label: 'render ants shader module'
    });

    this.toTexLayout = this.device.createBindGroupLayout({
        label: 'toTexLayout',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {
              type: 'uniform'
            }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type: 'read-only-storage'
            }
          }
        ]
    });

    this.texToScreenLayout = this.device.createBindGroupLayout({
        label: 'texToScreenLayout', 
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {}
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {}
          }
        ]
    });

    this.pipelineLayout = this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.toTexLayout,
          this.texToScreenLayout
        ]
    });

    this.pipeline = this.device.createRenderPipeline({
        label: 'render ants',
        layout: this.pipelineLayout,
        vertex: {
          module: this.module,
          entryPoint: 'vs',
          buffers: [{
            arrayStride: 2 * 4,
            attributes: [
              {shaderLocation: 0, offset: 0, format: 'float32x2'}
            ]
          }]
        },
        fragment: {
          module: this.module,
          entryPoint: 'fs',
          targets: [{format: this.presentationFormat}],
        }
    });

    this.texturePipeline = this.device.createRenderPipeline({
        label: 'render texture on screen',
        layout: this.pipelineLayout,
        vertex: {
          module: this.module,
          entryPoint: 'texFullCanvasVs',
        },
        fragment: {
          module: this.module,
          entryPoint: 'texFullCanvasFs',
          targets: [{format: this.presentationFormat}],
        }
    });

    this.sampler = this.device.createSampler({
        // addressModeU: 'clamp-to-edge',
        // addressModeV: 'clamp-to-edge',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: 'linear',
    });

    this.vertexData = Float32Array.from([
        -antSize, -antSize,
        -antSize, antSize,
        antSize, -antSize,
        antSize, antSize,
    ]); //We will make a simple square so we need 4 vertices, and 6 indices to indicate how to build our square;
    
    this.indexData = Uint32Array.from([
        0,1,2,
        3,1,2
    ]);
    
    this.screenData = Float32Array.from([
        this.canvas.clientWidth, this.canvas.clientHeight
    ]);

    // this.antPositionData = Float32Array.from([
    //     0, 0,
    //     0, this.canvas.clientHeight - 10,
    //     this.canvas.clientWidth - 10, 0,
    //     this.canvas.clientWidth - 10, this.canvas.clientHeight - 10,
    // ]);

    this.vertexBuffer = this.device.createBuffer({
        label: 'vertex buffer for an ant',
        size: this.vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    this.indexBuffer = this.device.createBuffer({
        label: 'index buffer for ant',
        size: this.indexData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    
    this.screenUniformBuffer = this.device.createBuffer({
        size: this.screenData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    //console.log(antData.byteLength)
    
    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertexData);
    this.device.queue.writeBuffer(this.indexBuffer, 0, this.indexData);
    this.device.queue.writeBuffer(this.screenUniformBuffer, 0, this.screenData);

    this.texA = this.device.createTexture({
        size: [this.context.canvas.clientWidth, this.context.canvas.clientHeight],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    });
      
    this.texB = this.device.createTexture({
        size: [this.context.canvas.clientWidth, this.context.canvas.clientHeight],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    });
        
    this.bindGroup = this.device.createBindGroup({
        label: 'bindGroup for screen + ants',
        layout: this.toTexLayout,
        entries: [
          {binding: 0, resource: {buffer: this.screenUniformBuffer}},
          {binding: 1, resource: {buffer: this.antPositionsBuffer}}
        ]
    });
      
    this.texBindGroup = this.device.createBindGroup({
        label: 'bindGroup for texture to canvas rendering',
        layout: this.texToScreenLayout,
        entries: [
          {binding: 0, resource: this.sampler},
          {binding: 1, resource: this.texB.createView()}
        ]
    });

    this.renderPassDescriptorToTex = {
        label: 'ant to canvas renderPass',
        colorAttachments: [
            {
              clearValue: [0, 0, 0, 1],
              loadOp: 'load',
              storeOp: 'store',
            } 
        ]
    };
    
    this.renderPassDescriptorTexToCanvas = {
        label: 'ant to canvas renderPass',
        colorAttachments: [
            {
              clearValue: [0, 0, 0, 1],
              loadOp: 'clear',
              storeOp: 'store',
            }
        ]
    };
            
    this.readBuff = this.device.createBuffer({
      size: 4 * 4 * this.canvas.clientWidth * this.canvas.clientHeight,
      usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });
  }
  
  constructor() {
    super();

    this.lastTime = 0;            

    // this.canvas.width = this.canvas.clientWidth;
    // this.canvas.height = this.canvas.clientHeight;
    
    this.context = this.canvas.getContext('webgpu');
    this.bytesPerRow = (Math.floor(this.canvas.clientWidth / 256) + 1) * 256;
    
    this.smoke = true;
  }

  render = async (delta) => {                    
    
    this.encoder = this.device.createCommandEncoder();    

    this.renderPassDescriptorToTex.colorAttachments[0].view = this.texA.createView();
    // this.renderPassDescriptorToTex.colorAttachments[0].view = this.context.getCurrentTexture().createView();
    let pass = this.encoder.beginRenderPass(this.renderPassDescriptorToTex);
    
    pass.setPipeline(this.pipeline);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setBindGroup(0, this.bindGroup);
    pass.setBindGroup(1, this.texBindGroup);
    pass.setIndexBuffer(this.indexBuffer, 'uint32');    
    pass.drawIndexed(6, this.antPositionsBuffer.size / 4);
    pass.end();
    
    this.encoder.copyTextureToTexture({texture: this.texA}, {texture: this.texB}, {width: this.context.canvas.clientWidth, height: this.context.canvas.clientHeight});
        
    this.renderPassDescriptorTexToCanvas.colorAttachments[0].view = this.texA.createView();
    pass = this.encoder.beginRenderPass(this.renderPassDescriptorTexToCanvas);    
    pass.setPipeline(this.texturePipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setBindGroup(1, this.texBindGroup);
    pass.draw(6);
    pass.end();        
        
    if(this.smoke){

      this.renderPassDescriptorTexToCanvas.colorAttachments[0].view = this.context.getCurrentTexture().createView();
      pass = this.encoder.beginRenderPass(this.renderPassDescriptorTexToCanvas);    
      pass.setPipeline(this.texturePipeline);
      pass.setBindGroup(0, this.bindGroup);
      pass.setBindGroup(1, this.texBindGroup);
      pass.draw(6);
      pass.end();  

    }else{      
      this.renderPassDescriptorToTex.colorAttachments[0].view = this.context.getCurrentTexture().createView();    
      let pass = this.encoder.beginRenderPass(this.renderPassDescriptorToTex);
      pass.setPipeline(this.pipeline);
      pass.setVertexBuffer(0, this.vertexBuffer);
      pass.setBindGroup(0, this.bindGroup);
      pass.setBindGroup(1, this.texBindGroup);
      pass.setIndexBuffer(this.indexBuffer, 'uint32');    
      pass.drawIndexed(6, this.antPositionsBuffer.size / 4);
      pass.end();
    }

    let bytesPerRow = (Math.floor(this.canvas.clientWidth * 4 / 256) + 1) * 256;      
    // console.log(bytesPerRow)
    // console.log(this.canvas.clientWidth / 256);
    this.encoder.copyTextureToBuffer({texture: this.texB}, {buffer: this.readBuff, bytesPerRow}, {width: this.context.canvas.clientWidth, height: this.context.canvas.clientHeight});
    // console.log(this.readBuff)

    this.commandBuffer = this.encoder.finish();
    this.device.queue.submit([this.commandBuffer]);        
    
    return this.readBuff;
  }
    
}