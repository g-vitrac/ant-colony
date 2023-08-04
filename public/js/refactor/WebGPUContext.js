export const WebGPUContext = await function () {
    return (async function (){
        let _a = await navigator.gpu?.requestAdapter();
        let _d = await _a?.requestDevice();
        if (!_d) {
            fail('need a browser that supports WebGPU');
            return;
        }
        return {
            device: _d, 
            adapter: _a, 
            canvas: null
        };
    }());
}();