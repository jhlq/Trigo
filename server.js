const http = require('http');
//require("trigolib.js")();
var fs = require('fs');
eval(fs.readFileSync('trigolib.js')+'');
var b=new Trigo.Board(9);
var ai=new Trigo.AI(b);
var r=ai.playNGames(10,true);
console.log(r[0]);
fs.appendFile("data/simulations.txt", r[1], function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
}); 

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  var b=new Trigo.Board(9);
  res.end('Hello World\n'+b.tg.nTriangles());
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
