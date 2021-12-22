module.exports = {
    id:0,
    createEntity: function(type,x,y){
        let id = ++this.createEntity.id
        return {id,type,x,y}
    },
    drawEntity: function(entity){
        const visuals = {
            player: ['@', "hsl(60, 100%, 50%)"],
            troll: ['T', "hsl(120, 60%, 50%)"],
            orc: ['o', "hsl(100, 30%, 50%)"],
        };
    
        const [ch, fg, bg] = visuals[entity.type];
        this.display.draw(entity.x, entity.y, ch, fg, bg);

    }
}