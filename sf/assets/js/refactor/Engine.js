import { WebGPUContext } from "./WebGPUContext.js"

const Engine = (engines) => {    
    let _e = engines ?? [];   
    return {
        run: async() => _e.forEach( async (e, i) => {            
            await e.run();
        }),
        addEngine: (e) => {
            _e.push(e);
        },
    }
};

export {Engine, WebGPUContext};