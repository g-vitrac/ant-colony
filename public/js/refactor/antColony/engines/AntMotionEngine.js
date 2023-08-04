import { Engine, WebGPUContext } from "../../Engine.js";
import { AntMovementComputer } from "./computer/AntMovementComputer.js";
import { AntSeekingComputer } from "./computer/AntSeekingComputer.js";
import { AntRenderer } from "./renderer/AntRenderer.js";
import { PheromoneRenderer } from "./renderer/PheromoneRenderer.js";

export const AntMotionEngine = async (ants) => {    

    let device = WebGPUContext.device;   
    let ctx = WebGPUContext.canvas.getContext('webgpu');
    
    ants = new Float32Array(ants);
    
    let antsBuffer = device.createBuffer({
        label: 'work buffer',
        size: ants.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    let pheromoneTexture = device.createTexture({
        label: 'pheromone texture',
        size: [ctx.canvas.clientWidth, ctx.canvas.clientHeight],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST
    });

    device.queue.writeBuffer(antsBuffer, 0, ants);

    let amc = await AntMovementComputer(antsBuffer);

    let asc = await AntSeekingComputer(antsBuffer, pheromoneTexture);

    let ar = await AntRenderer();    
    let pr = await PheromoneRenderer(pheromoneTexture);
    
    ar.initBindGroup(antsBuffer);
    ar.setRenderTarget(pr.getAntTexture());

    let engine = Engine([amc, ar, pr, asc]);

    let smokeToggled = false;

    return {
        updateAntBehavior: (data) => {
            asc.updateAntBehavior(data);
        },
        run: () => {
            engine.run();
            if(smokeToggled){
                ar.setRenderTarget(null);
                ar.run();
                ar.setRenderTarget(pr.getAntTexture());
            }
        },
        toggleSmoke: () => {                    
            pr.toggleSmoke();
            smokeToggled = !smokeToggled;
        },
        addAnt: async (pos, angle = 0) => {
            let cpb = device.createBuffer({
                label: 'copy buffer',
                size: ants.byteLength,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });

            let encoder = device.createCommandEncoder();            

            encoder.copyBufferToBuffer(antsBuffer, 0, cpb, 0, ants.byteLength);
            
            device.queue.submit([encoder.finish()]);

            await cpb.mapAsync(GPUMapMode.READ);

            let currentAnts = new Float32Array(cpb.getMappedRange().slice());

            cpb.unmap();

            ants = new Float32Array(currentAnts.byteLength / 4 + 4);

            ants.set(currentAnts);

            ants.set([pos.x, pos.y, angle, 100], currentAnts.byteLength / 4);

            antsBuffer = device.createBuffer({
                label: 'work buffer',
                size: ants.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
            });

            amc.setWorkingBuffer(antsBuffer);
            asc.setWorkingBuffer(antsBuffer);
            ar.initBindGroup(antsBuffer);
            
            device.queue.writeBuffer(antsBuffer, 0, ants);

        }
    }
}

