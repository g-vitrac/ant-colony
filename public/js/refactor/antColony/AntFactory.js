

export const AntFactory = (() => {

    const createRandomAnt = () => {
        return {
            pos: {
                x: Math.random() * (AntFactory.pos.maxX - AntFactory.pos.minX) + AntFactory.pos.minX, 
                y: Math.random() * (AntFactory.pos.maxY - AntFactory.pos.minX) + AntFactory.pos.minY
            },
            angle: Math.random() * (AntFactory.direction.max - AntFactory.direction.min) + AntFactory.direction.min, 
            speed: 100//Math.random() * (AntFactory.speed.max - AntFactory.speed.min) + AntFactory.speed.min, 
        }
    }

    const createSquaredAnt = () => {
        let ant = createRandomAnt();
        ant.angle = Math.random() > 0.5 ? (Math.random() > 0.5 ? 0 : 90) : (Math.random() > 0.5 ? 180 : 270);
        return ant;
    }

    const createTestAnt = () => {
        return [10, 10, 0, 0];
    }

    return {
        createTestAnts: (nbAnts) => {
            AntFactory.antArr = [];
            for(let i = 0; i < nbAnts; i++)
            {
                AntFactory.antArr = AntFactory.antArr.concat(createTestAnt());
            }            
            loader.dispatchEvent(new CustomEvent('antLoaded', {bubbles: true}));
            loader.classList.add('d-none');
        },
        createRandomAnts: (nbAnts) => {
            AntFactory.antArr = new Float32Array(nbAnts * 4);
            console.log(AntFactory.antArr)
            loader.classList.remove('d-none');
            let spanLoader = loader.querySelector('output');
            let i = 0;
            spanLoader.value = 0;            
            let intervalId = setInterval( () => {                
                
                for(let j = 0; j < nbAnts; j++)
                {
                   let ant = createSquaredAnt();
                   AntFactory.antArr[i * 4] = ant.pos.x;
                   AntFactory.antArr[i * 4 + 1] = ant.pos.y;
                   AntFactory.antArr[i * 4 + 2] = ant.angle;
                   AntFactory.antArr[i * 4 + 3] = ant.speed;
                   i++;
                //    console.log(i * 4 + 3, AntFactory.antArr[i * 4 + 3])
                }

                // console.log(AntFactory.antArr)

                if(i >= nbAnts){                    
                    loader.dispatchEvent(new CustomEvent('antLoaded', {bubbles: true}));
                    loader.classList.add('d-none');
                    
                    clearInterval(intervalId)
                }
                spanLoader.value = Math.floor((i) / nbAnts * 100);
            })            
        },
        speed: {min: 0, max: 10},
        direction: {min: 0, max: 360},
        pos: {minX: 0, maxX: 0, minY: 0, maxY: 0},
        loader: null,
        antArr: null
    }
})();