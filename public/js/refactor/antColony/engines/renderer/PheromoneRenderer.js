import { WebGPUContext } from "../../../WebGPUContext.js";
import { ModuleService } from "../../../ModuleService.js";

export const PheromoneRenderer = async (pheromoneTexture) => {
    let device = WebGPUContext.device;

    let format = navigator.gpu.getPreferredCanvasFormat();
    let ctx = WebGPUContext.canvas.getContext('webgpu');

    ctx.configure({device, format});

    let m = device.createShaderModule({
        label: 'pheromone rendering module',
        code: await ModuleService.getModule('PheromoneModule')
    });

    let p = device.createRenderPipeline({
        label: 'pheromone rendering pipeline',
        layout: 'auto',
        vertex: {
            module: m,
            entryPoint: 'vs',
        },
        fragment: {
            module: m,
            entryPoint: 'fs',
            targets: [{format}]
        }
    })

    let s = device.createSampler({
        // addressModeU: 'clamp-to-edge',
        // addressModeV: 'clamp-to-edge',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: 'linear',
    });

    let sd = Float32Array.from([
        ctx.canvas.clientWidth, ctx.canvas.clientHeight
    ]);

    let sb = device.createBuffer({
        size: sd.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(sb, 0, sd);

    let ta = device.createTexture({
        label: 'ant texture',
        size: [ctx.canvas.width, ctx.canvas.height],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    });

    let tp = pheromoneTexture ?? device.createTexture({
        label: 'pheromone texture',
        size: [ctx.canvas.clientWidth, ctx.canvas.clientHeight],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    });

    let bg = device.createBindGroup({
        label: 'bindGroup for pheromone rendering',
        layout: p.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: s},
          {binding: 1, resource: tp.createView()},
          {binding: 2, resource: {buffer: sb}}
        ]
    });

    let rp = {
        label: 'ant to canvas renderPass',
        colorAttachments: [
            {
              clearValue: [0, 0, 0, 0],
              loadOp: 'clear',
              storeOp: 'store',
            }
        ]
    };

    let smokeToggled = true;

    return {
        getAntTexture: () => ta,
        toggleSmoke: () => smokeToggled = !smokeToggled,
        run: () => {
            let encoder = device.createCommandEncoder();

            encoder.copyTextureToTexture({texture: ta}, {texture: tp}, {width: ctx.canvas.width, height: ctx.canvas.height})

            rp.colorAttachments[0].view = ta.createView();

            let pass = encoder.beginRenderPass(rp);
            pass.setPipeline(p);
            pass.setBindGroup(0, bg);
            pass.draw(6);
            pass.end();

            if(smokeToggled){
                // console.log('i')
                rp.colorAttachments[0].view = ctx.getCurrentTexture().createView();
                pass = encoder.beginRenderPass(rp);
                pass.setPipeline(p);
                pass.setBindGroup(0, bg);
                pass.draw(6);
                pass.end();
            }

            device.queue.submit([encoder.finish()]);
        }
    }

}