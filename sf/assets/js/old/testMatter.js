// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Vector = Matter.Vector,
    Composite = Matter.Composite;

// create an engine
var engine = Engine.create({gravity: {scale: 0}, enableSleeping: true});


// create a renderer
var render = Render.create({
    element: document.body,
    engine: engine
});

for(let i = 0; i < 50; i++)
{
    let ant = Bodies.circle(100, 100, 2);    
    Body.setVelocity(ant, Vector.create(0, 5), {
        body: {
            frictionAir: 0,
            frictionStatic: 0,
        }
    });
    Composite.add(engine.world, ant);
}


// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
//Runner.run(runner, engine);




let lastTime = 0;
const main = (time) => {
    let delta = time - lastTime;
    lastTime = time;
    Engine.update(engine, delta);
    requestAnimationFrame(main);
}

requestAnimationFrame(main);
