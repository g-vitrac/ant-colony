import { WebGPUContext } from "../../../WebGPUContext.js";
import { ModuleService } from "../../../ModuleService.js";

const antSize = 0.5;

export const AntRenderer = async () => {

    let device = WebGPUContext.device;
    
    let format = navigator.gpu.getPreferredCanvasFormat();
    let ctx = WebGPUContext.canvas.getContext('webgpu');

    ctx.configure({device, format});

    let m = device.createShaderModule({
        label: 'ant rendering module',
        code: await ModuleService.getModule('AntRenderer')
    });

    let p = device.createRenderPipeline({
        label: 'ant rendering pipeline',
        layout: 'auto',
        vertex: {
            module: m,
            entryPoint: 'vs',
            buffers: [{
                arrayStride: 2 * 4,
                attributes: [
                    {shaderLocation: 0, offset: 0, format: 'float32x2'}
                ]
            }]
        },
        fragment: {
            module: m,
            entryPoint: 'fs',
            targets: [{format}]
        }
    });

    let vd = Float32Array.from([
        -antSize, -antSize,
        -antSize, antSize,
        antSize, -antSize,
        antSize, antSize,
    ]);

    let id = Uint32Array.from([
        0,1,2,
        3,1,2
    ]);

    let sd = Float32Array.from([
        WebGPUContext.canvas.width, WebGPUContext.canvas.height
    ])

    let vb = device.createBuffer({
        label: 'vertex buffer describing an ant',
        size: vd.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    let ib = device.createBuffer({
        label: 'index buffer describing an ant',
        size: id.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });

    let sb = device.createBuffer({
        label: 'uniform for screen size',
        size: sd.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });    

    device.queue.writeBuffer(vb, 0, vd);
    device.queue.writeBuffer(ib, 0, id);
    device.queue.writeBuffer(sb, 0, sd);

    let bg = null;
    let nbAnts = 0;   
    let renderingTarget = null; 

    let rp = {
        label: 'ant render pass descriptor',
        colorAttachments: [
            {
                clearValue: [0, 0, 0, 0],
                loadOp: 'load',
                storeOp: 'store'
            }
        ]
    }    

    return {
        setRenderTarget: (target) => {            
            renderingTarget = target;
        },
        initBindGroup: (buffer) => {            
            nbAnts = buffer.size / 16;
            bg = device.createBindGroup({
                label: 'ant drawing bindGroup',
                layout: p.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: sb} },
                    { binding: 1, resource: { buffer } }
                ]
            });
        },
        run: () => {

            if(bg == null) throw Error('You must initialize the bind group before running the renderer');
            
            let encoder = device.createCommandEncoder();            

            rp.colorAttachments[0].view = renderingTarget?.createView() ?? ctx.getCurrentTexture().createView();

            let pass = encoder.beginRenderPass(rp);                  

            pass.setPipeline(p);
            pass.setVertexBuffer(0, vb);
            pass.setBindGroup(0, bg);
            pass.setIndexBuffer(ib, 'uint32');
            pass.drawIndexed(6, nbAnts);
            pass.end();

            device.queue.submit([encoder.finish()]);

        }
    }
};
