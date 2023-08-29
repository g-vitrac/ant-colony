import { WebGPUContext } from "./WebGPUContext.js";
import { AntMotionEngine } from "./antColony/engines/AntMotionEngine.js";
import { AntFactory } from "./antColony/AntFactory.js";

WebGPUContext.canvas = document.querySelector('#c');
WebGPUContext.canvas.height = WebGPUContext.canvas.clientHeight;
WebGPUContext.canvas.width = WebGPUContext.canvas.clientWidth;

AntFactory.speed.min = 50;
AntFactory.pos.maxX = WebGPUContext.canvas.width;
AntFactory.pos.maxY = WebGPUContext.canvas.height;
AntFactory.loader = document.querySelector('#loader');

let callPerSecond = 0;

let fpsElement = document.querySelector('#fps');

setInterval( () => {
    fpsElement.value = callPerSecond;
    callPerSecond = 0;
}, 1000);

// let antArr = [
//     10, WebGPUContext.canvas.height / 2, 0, 100
// ]

//document.querySelector('#ant-number').value

//AntFactory.createRandomAnts(1);

let ame = null;

// ar.initBindGroup(amc.getAntBuffer());
// ar.setRenderTarget(pr.getAntTexture());

let i = 0;

function main(time)
{
    callPerSecond++;

    ame.run();
    
    if(req != null){// && i++ < 1000){        
        requestAnimationFrame(main);
    }
}

let req = null;


document.querySelector('#hide-btn').addEventListener('click', () => {
    let optCtn = document.querySelector('#options-container');
    optCtn.classList.toggle("d-none");
})

document.querySelector('#smoke-cb').addEventListener('change', () => {
    ame.toggleSmoke();
})

document.querySelector('#ant-number').addEventListener('change', () => {
    AntFactory.loader.classList.remove('d-none');
    setTimeout( () => {
        restart();
    }, 1000)   
})

document.querySelectorAll('.ant-behavior').forEach( i => {    
    i.addEventListener('change', () => {
        let data = [];
        document.querySelectorAll('.ant-behavior').forEach(e => data.push(e.value));        
        data[3] = data[3] / 100;        
        ame.updateAntBehavior(new Float32Array(data));
    });
});

document.addEventListener('keypress', (e) => {

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

document.addEventListener('antLoaded', async () => {    
    ame = await AntMotionEngine(AntFactory.antArr);
    req = requestAnimationFrame(main);
    let addMouse = false;

    document.addEventListener('click', () => {
        addMouse = ! addMouse;
    })
    
    let direction = 0;
    let lastPost = {x: 0, y: 0};

    document.addEventListener('mousemove', (e) => {
        direction = Math.random() * 360
        if(addMouse){                        
            const addAnt = () => {
                ame.addAnt({x: e.clientX - 32, y: WebGPUContext.canvas.height - e.clientY + 32}, direction);
            }
            requestAnimationFrame(addAnt);          
        }
    })

});


function restart()
{
    req = null;     

    i = 0;
    
    AntFactory.createRandomAnts(document.querySelector('#ant-number').value);    

}
