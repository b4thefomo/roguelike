

const displayOptions = {
    bg: "white",
    fg: "dimGrey",
    fontFamily: "Fira Mono",
    width: 25,
    height: 20,
    fontSize: 18,
    forceSquareRatio: true
  };

var Game = {
    display: null,
    map: {},
    engine: null,
    player: null,
    ananas:null,
    
    init: function() {
        this.display = new ROT.Display({fontSize:10,width:80,height:30});
        document.body.appendChild(this.display.getContainer());
        
        //this._generateDiggerMap();
        this._generateMapWithFov()
        //this._generateCellularMap();
        var scheduler = new ROT.Scheduler.Simple();
        scheduler.add(this.player, true);
        scheduler.add(this.pedro, true);

        this.engine = new ROT.Engine(scheduler);
        this.engine.start();
    },
    
    _generateDiggerMap: function() {
        var digger = new ROT.Map.Uniform();
        var freeCells = [];
        
        var digCallback = function(x, y, value) {
            if (value) { return; }
            
            var key = x+","+y;
            this.map[key] = "x";
            freeCells.push(key);
        }
        digger.create(digCallback.bind(this));
        
        //this._generateBoxes(freeCells);
        //this._generatePotions(freeCells)
        this._drawWholeMap();
       
        this.player = this._createBeing(Player,freeCells)
        this.pedro = this._createBeing(Pedro,freeCells)
        //_generateMapWithFov()
    },

    _generateCellularMap: function() {
        let freeCells = []; // this is where we shall store the moveable space
        let map = {}
        let digger = new ROT.Map.Cellular(
          displayOptions.width - 2,
          displayOptions.height - 2
        );
        digger.randomize(0.4);
        digger.create((x, y, value) => {
          if (value) {
            this.map[x + 1][y + 1] = "🌖"; // create the walls
          } else {
            freeCells.push({ x: x + 1, y: y + 1 });
            map[x + 1][y + 1] = "."; // add . to every free space just for esthetics
          }
        });
        
        this._generateBoxes(freeCells);
        this._generatePotions(freeCells)
        this._drawWholeMap();
        this._initiateFOV()
        this.player = this._createBeing(Player,freeCells)
        this.pedro = this._createBeing(Pedro,freeCells)
    },

    _generateMapWithFov: function(){
        ROT.RNG.setSeed(12345);
        let freeCells = []
        new ROT.Map.Uniform(80,30).create(function(x, y, type) {
            if(type==0){freeCells.push(`${x},${y}`)}
            Game.map[x+","+y] = type;
            Game.display.DEBUG(x, y, type);
        });



        /* input callback */
        function lightPasses(x, y) {
            var key = x+","+y;
            if (key in Game.map) { return (Game.map[key] == 0); }
            return false;
        }

        var fov = new ROT.FOV.PreciseShadowcasting(lightPasses);
      
        console.log(Game.map)

        /* output callback */
        fov.compute(50,20, 10, function(x, y, r, visibility) {
            var ch = (r ? "" : "@");
            var color = (Game.map[x+","+y] ? "#aa0": "#660");
            Game.display.draw(x, y, ch, "#fff", color);
        });
        console.log(Game.map)
        this.player = this._createBeing(Player,freeCells)
        this.pedro = this._createBeing(Pedro,freeCells)

    },
    
    _createBeing: function(what,freeCells) {
        var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        var key = freeCells.splice(index, 1)[0];
        var parts = key.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        return new what(x,y)
    },
    
    _generateBoxes: function(freeCells) {
        for (var i=0;i<10;i++) {
            var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
            var key = freeCells.splice(index, 1)[0];
            this.map[key] = "🧰";
            if (!i) { this.ananas = key; }
        }
    },

    _generatePotions: function(freeCells){
        for (var i=0;i<15;i++) {
            var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
            var key = freeCells.splice(index, 1)[0];
            this.map[key] = "🧪";
        }

    },
    
    _drawWholeMap: function() {
        for (var key in this.map) {
            var parts = key.split(",");
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            this.display.draw(x, y, this.map[key]);
        }
    },
    



};

var Player = function(x, y) {
    this._x = x;
    this._y = y;
    this._draw();
    
}

//exposing current players coordinates
Player.prototype.getX = function(){return this._x}
Player.prototype.getY = function(){return this._y}



Player.prototype._draw = function() {
    Game.display.draw(this._x, this._y, "@", "#ff0");
}

Player.prototype.act = function() {
    Game.engine.lock();
    /* wait for user input; do stuff when user hits a key */
    window.addEventListener("keydown", this);
}

Player.prototype._checkBox = function() {
    var key = this._x + "," + this._y;
    if (Game.map[key] != "🧰") {
        alert("There is no box here!");
    } else if (key == Game.ananas) {
        alert("Hooray! You found an ananas and won this game.");
        Game.engine.lock();
        window.removeEventListener("keydown", this);
    } else {
        alert("This box is empty :-(");
    }
}

Player.prototype.handleEvent = function(e) {
    /* process user input */


    var keyMap = {};
    keyMap[38] = 0;
    keyMap[33] = 1;
    keyMap[39] = 2;
    keyMap[34] = 3;
    keyMap[40] = 4;
    keyMap[35] = 5;
    keyMap[37] = 6;
    keyMap[36] = 7;

    var code = e.keyCode;

    if (!(code in keyMap)) { return; }
    if (code == 13 || code == 32) {
        this._checkBox();
        return;
    }

    var diff = ROT.DIRS[8][keyMap[code]];
    var newX = this._x + diff[0];
    var newY = this._y + diff[1];

    var newKey = newX + "," + newY;
    if (!(newKey in Game.map)) { return; } /* cannot move in this direction */

    Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
    this._x = newX;
    this._y = newY;
    this._draw();
    window.removeEventListener("keydown", this);
    Game.engine.unlock();

}

var Pedro = function(x, y) {
    this._x = x;
    this._y = y;
    this._draw();
}
    
Pedro.prototype._draw = function() {
    Game.display.draw(this._x, this._y, "P", "red");
}

Pedro.prototype.act = function(){
    //get current players coordinates, find what paths are possible to the player. Find shortest path found
    var x = Game.player.getX()
    var y = Game.player.getY()
    var passableCallback = function(x,y){
        return (x+','+y in Game.map)
        console.log(x+','+y in Game.map)
    }

    var path = []
    var pathCallback = function(x,y){
        path.push([x,y])
    }

    //using rot.js A* algorithm to plot shortest path between player and pedro using topology 4 methoD
    var astar = new ROT.Path.AStar(x,y,passableCallback,{topology:4})
    console.log(astar)
    astar.compute(this._x,this._y,pathCallback)

        //looks for what areas are passable given the current players location 



        path.shift(); /* remove Pedro's position */
        if (path.length == 1) {
            Game.engine.lock();
            alert("Game over - you were captured by Pedro!");
        } else {
            x = path[0][0];
            y = path[0][1];
            Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
            this._x = x;
            this._y = y;
            this._draw();
        }


}

