var fs = require('fs');
eval(fs.readFileSync('javascript/trigolib.js')+'');    //this is bad practice but turning it into a module is unnecessary since the server runs on Golang
var b=new Trigo.Board(9);
var ai=new Trigo.AI(b);
var r=ai.playNGames(50,true);
console.log(r[0]);
fs.appendFile("data/simulations.txt", r[1], function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
}); 
