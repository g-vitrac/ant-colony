import { WebGPUContext } from "../../../Engine.js";
import { ModuleService } from "../../../ModuleService.js";

export const AntMovementComputer = async function(antsBuffer){

    let wb = antsBuffer;

    let device = WebGPUContext.device;   

    let m = device.createShaderModule({
        label: 'ant movement computer module',
        code: await ModuleService.getModule('AntMovementComputer')
    });

    let p = device.createComputePipeline({
        label: 'ant compute pipeline',
        layout: 'auto',
        compute: {
            module: m,
            entryPoint: 'computeSomething',
        },
    });

    let cs = new Float32Array([WebGPUContext.canvas.width, WebGPUContext.canvas.height]);
    
    let sb = device.createBuffer({
        label: 'screen size uniform',
        size: cs.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    
    device.queue.writeBuffer(sb, 0, cs);

    let bg = device.createBindGroup({
        label: 'bindGroup for work buffer',
        layout: p.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: wb } },
            { binding: 1, resource: { buffer: sb } }
        ],
    });

    let bt = device.createBuffer({
        label: 'test buffer',
        size: wb.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    })

    return {
        run: async () => {
                        
            let encoder = device.createCommandEncoder({
                label: 'ant movement computer encoder'
            });

            let pass = encoder.beginComputePass({
                label: 'ant movement computer pass'
            });

            pass.setPipeline(p);
            pass.setBindGroup(0, bg);
            let nbInvocation = Math.ceil(wb.size / 16);
            // console.log(nbInvocation)
            pass.dispatchWorkgroups((nbInvocation / 64) + 1);
            pass.end();

            device.queue.submit([encoder.finish()]);
        },
        setWorkingBuffer: (buffer) => {
            wb = buffer;
            bg = device.createBindGroup({
                label: 'bindGroup for work buffer',
                layout: p.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: wb } },
                    { binding: 1, resource: { buffer: sb } }
                ],
            });
        }
    }
};