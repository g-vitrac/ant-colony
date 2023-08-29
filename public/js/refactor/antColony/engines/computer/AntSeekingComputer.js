import { WebGPUContext } from "../../../Engine.js";
import { ModuleService } from "../../../ModuleService.js";

export const AntSeekingComputer = async function(antsBuffer, pheromoneTexture){
    let wb = antsBuffer;

    let device = WebGPUContext.device;

    let m = device.createShaderModule({
        label: 'ant seeking behaviour module',
        code: await ModuleService.getModule('PheromoneSeekingModule')
    });

    let p = device.createComputePipeline({
        label: 'ant seeking behaviour pipeline',
        layout: 'auto',
        compute: {
            module: m,
            entryPoint: 'cs'
        }
    })

    let t = pheromoneTexture;

    let s = device.createSampler({
        // addressModeU: 'clamp-to-edge',
        // addressModeV: 'clamp-to-edge',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: 'linear',
    });

    let cs = new Float32Array([WebGPUContext.canvas.width, WebGPUContext.canvas.height]);

    let sb = device.createBuffer({
        label: 'screen size uniform',
        size: cs.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });    

    let tb = device.createBuffer({
        label: 'time uniform for pseudo random generation',
        size: 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    
    let ab = device.createBuffer({
        label: 'ant coefficient uniform that controls their behavior',
        size: 4 * 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    let td = new Float32Array(1);

    let abd = new Float32Array([10, 5, 5, 0.15]);

    device.queue.writeBuffer(sb, 0, cs);
    device.queue.writeBuffer(tb, 0, td);
    device.queue.writeBuffer(ab, 0, abd);

    let bg = device.createBindGroup({
        label: 'bindGroup for ant seeking behaviour',
        layout: p.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: wb } },
            { binding: 1, resource: { buffer: sb } },
            { binding: 2, resource: t.createView() },
            { binding: 3, resource: s },
            { binding: 4, resource: { buffer: tb } },
            { binding: 5, resource: { buffer: ab } }
        ]
    });

    let test = device.createBuffer({
        size: td.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    })

    let i = 0;

    return {
        updateAntBehavior: (data) => {
            device.queue.writeBuffer(ab, 0, data);
        },
        run: async () => {

            let encoder = device.createCommandEncoder({
                label: 'ant seeking behaviour encoder'
            });

            let pass = encoder.beginComputePass({
                label: 'ant seeking behaviour pass'
            });

            
            td[0] += 1;
            device.queue.writeBuffer(tb, 0, td);
            // console.log(td[0])


            pass.setPipeline(p);
            pass.setBindGroup(0, bg);
            let nbInvocation = Math.ceil(wb.size / 16);
            pass.dispatchWorkgroups((nbInvocation / 64) + 1);
            pass.end();         
            
            device.queue.submit([encoder.finish()]);
        },
        setWorkingBuffer: (buffer) => {
            wb = buffer;
            bg = device.createBindGroup({
                label: 'bindGroup for ant seeking behaviour',
                layout: p.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: wb } },
                    { binding: 1, resource: { buffer: sb } },
                    { binding: 2, resource: t.createView() },
                    { binding: 3, resource: s },
                    { binding: 4, resource: { buffer: tb } },
                    { binding: 5, resource: { buffer: ab } }
                ]
            });
        }
    }
}