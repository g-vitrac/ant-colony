
class Engine {

    static adapter = null;

    static device = null;

    static canvas = null;

    static async getWebGPU() {
        if(this.adapter === null || this.device === null)
        {   
            this.adapter = await navigator.gpu?.requestAdapter();
            this.device = await this.adapter?.requestDevice();
            if (!this.device) {
                fail('need a browser that supports WebGPU');
                return;
            }
        }
    }

    constructor(canvas){
        this.canvas = canvas;
    }

    get device() {
        return Engine.device;
    }

    set device(value) {
        Engine.device = value;
    }

    get adapter() {
        return Engine.adapter;
    }

    set adapter(value)
    {
        Engine.adapter = value;
    }

    get canvas() {
        return Engine.canvas;
    }

    set canvas(value) {
        if(value != undefined || value != null)
            Engine.canvas = value;
    }

    
}