
Engine.canvas = document.querySelector('#c');

Engine.canvas.width = Math.min(Engine.canvas.clientWidth, 1648);
Engine.canvas.height = Math.min(Engine.canvas.clientHeight, 875);

let antRenderer = new AntRenderer();

let antEngine = new AntEngine(document.querySelector('#ant-number').value);

let lastTime = 0;
let calltime = 0;

let i = 0;

let req = null;

let delta ;

let callPerSecond = 0;

let fpsElement = document.querySelector('#fps');

setInterval( () => {
    fpsElement.value = callPerSecond;
    callPerSecond = 0;
}, 1000);

const main = async (time) => {  
    
    callPerSecond++;    
    calltime = time;
    delta = time - lastTime;
    lastTime = time;

    
    await antEngine.compute(delta, await antRenderer.render(delta));    

    if(! antEngine.debug){
        if(req != null){        
            requestAnimationFrame(main);
        }
    }else{
        if(++i < document.querySelector('#frame-to-test').value){            
            if(req != null){        
                requestAnimationFrame(main);
            }
        }
    }
}

const init = async () => {  
    
    Engine.canvas.width = Engine.canvas.clientWidth;
    Engine.canvas.height = Engine.canvas.clientHeight;  
    
    await antEngine.init();
    await antEngine.compute(0);
    await antRenderer.init(antEngine);
    req = requestAnimationFrame(main);
    console.log(antRenderer.canvas.width, antRenderer.canvas.clientWidth)
    console.log(antRenderer.canvas.height, antRenderer.canvas.clientHeight)
}

init();



document.querySelector('#hide-btn').addEventListener('click', () => {
    let optCtn = document.querySelector('#options-container');
    optCtn.classList.toggle("d-none");
})

document.querySelector('#smoke-cb').addEventListener('change', () => {
    antRenderer.smoke = ! antRenderer.smoke;    
})

document.querySelector('#engine-debug').addEventListener('change', () => {
    if(antEngine.debug){        
        antEngine.size[3] = 0
        antEngine.device.queue.writeBuffer(antEngine.screenBuffer, 0, antEngine.size);
        req = requestAnimationFrame(main);
    }else{
        antEngine.size[3] = 1
        antEngine.device.queue.writeBuffer(antEngine.screenBuffer, 0, antEngine.size);
    }
    antEngine.debug = ! antEngine.debug    
})

document.querySelector('#ant-number').addEventListener('change', () => {
    restart();
})

document.addEventListener('keypress', (e) => {
     //console.log(e);
    if(e.key == 'r')
        restart();
    if(e.key == 'p' || e.code === 'Space'){
        cancelAnimationFrame(req);
        req = req === null ? requestAnimationFrame(main) : null; 
    }
    if(e.key == 't'){   
        if(antEngine.debug)     
            req = requestAnimationFrame(main); 
        i = 0;
    }
    if(e.key == 'c'){
        console.clear();
        console.log(i)
    }
    if(e.key == 'd'){
        document.querySelector('#engine-debug').click()
    }
    if(e.key == 's'){
        document.querySelector('#smoke-cb').click();
    }
});

function restart()
{
    req = null; 
    console.clear();
    i = 0;   

    setTimeout(() => {
        let debug = antEngine.debug;        
        antEngine = new AntEngine(document.querySelector('#ant-number').value);
        
        antEngine.debug = debug;

        init();
    }, 100);
}