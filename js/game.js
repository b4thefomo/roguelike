
let Game = {
    freeCells:[],
    display:null,
    init: function(){
        this.display = new ROT.Display({width: 60, height: 25});
        document.getElementById('game').appendChild(this.display.getContainer());
            ////Controls and EVENT Listeners
            const canvas = this.display.getContainer();
            canvas.addEventListener('keydown', handleKeyDown);
            canvas.setAttribute('tabindex', "1");
            canvas.focus();
        
            const focusReminder = document.getElementById('focus-reminder');
            canvas.addEventListener('blur', () => { focusReminder.style.visibility = 'visible'; });
            canvas.addEventListener('focus', () => { focusReminder.style.visibility = 'hidden'; });
        
            function handleKeys(keyCode) {
                const actions = {
                    [ROT.KEYS.VK_RIGHT]: () => ['move', +1, 0],
                    [ROT.KEYS.VK_LEFT]:  () => ['move', -1, 0],
                    [ROT.KEYS.VK_DOWN]:  () => ['move', 0, +1],
                    [ROT.KEYS.VK_UP]:    () => ['move', 0, -1],
                };
                let action = actions[keyCode];
                return action ? action() : undefined;
            }
            
            function handleKeyDown(event) {
                let action = handleKeys(event.keyCode);
                if (action) {
                    if (action[0] === 'move') {
                        
                        let [_, dx, dy] = action;
                        let newX = player.x + dx;
                        let newY = player.y + dy;
                        if (map.get(newX, newY) === 0) {
                            player.x = newX;
                            player.y = newY;
                        }
                        draw();
                    } else {
                        throw `unhandled action ${action}`;
                    }
                    event.preventDefault();
                }
            }
        }

    }
 



    function createMap(width, height) {
        let map = {
            width, height,
            tiles: new Map(),
            key(x, y) { return `${x},${y}`; },
            get(x, y) { return this.tiles.get(this.key(x, y)); },
            set(x, y, value) { this.tiles.set(this.key(x, y), value); },
        };
    
        const digger = new ROT.Map.Digger(width, height);
        digger.create((x, y, contents) => {
            if(!contents){
                Game.freeCells.push(`${x},${y}`)
            }
            map.set(x, y, contents)
        });

        return map;
    }
    let map = createMap(60, 25);
    console.log("MAP",map)
    
    const fov = new ROT.FOV.PreciseShadowcasting((x, y) => map.get(x, y))
    function draw() {
        console.log("MAP",map)
            Game.display.clear();
            let lightMap = new Map();
            console.log(player)
            fov.compute(player.x, player.y, 10, (x, y, r, visibility) => {
                lightMap.set(map.key(x, y), visibility);
            });
        
            const colors = {
                [false]: {[false]: "rgb(50, 50, 150)", [true]: "rgb(0, 0, 100)"},
                [true]: {[false]: "rgb(200, 180, 50)", [true]: "rgb(130, 110, 50)"}
            };

            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    let lit = lightMap.get(map.key(x, y)) > 0.0,
                    wall = map.get(x, y) !== 0;
                    let color = colors[lit][wall];
                    if(lit){
                        console.log(`${lit} at ${x},${y} while player is at ${player.x},${player.y} and color is ${colors[lit][wall]}`)
                    }
                    Game.display.draw(x, y, ' ', "black", color);
                }
            }

            for (let entity of entities.values()) {
                if (lightMap.get(map.key(entity.x, entity.y)) > 0.0) {
                    drawEntity(entity);
                }
            }
        }



  

    let entities = new Map();
    function createEntity(type) {
        let id = ++createEntity.id;
        let entity = { id, type };
        entities.set(id, entity);
        return entity
    }
    createEntity.id = 0;
    
    let player = createEntity('player');
    let troll = createEntity('troll');



    function drawEntity(entity) {

        if(entity.type == 'player' && !player.x){
            let spawnKey = Game.freeCells[0]
            let parts = spawnKey.split(",");
            entity.x = parseInt(parts[0]);
            entity.y = parseInt(parts[1]);
        }
        if(entity.type == 'troll' && !troll.x){
            let spawnKey = Game.freeCells[30]
            let parts = spawnKey.split(",");
            entity.x = parseInt(parts[0]);
            entity.y = parseInt(parts[1]);
        }
        const visuals = {
            player: ['@', "hsl(60, 100%, 50%)"],
            troll: ['T', "hsl(120, 60%, 50%)"],
            orc: ['o', "hsl(100, 30%, 50%)"],
        };
    
        const [ch, fg, bg] = visuals[entity.type];
        Game.display.draw(entity.x, entity.y, ch, fg, bg);
    }






