//Load trigolib.js first

'use strict';

Trigo.ScreenTriangle=function(_x,_y,_pixX,_pixY){
    this.x=_x;
    this.y=_y;
    this.pixX=_pixX;
    this.pixY=_pixY;
};

Trigo.ScreenBoard=function(drawAreaID,sideLength,_unitSize,_offsetX,_offsetY){
	this.drawer=new Trigo.CanvasDrawer(drawAreaID,3);
	this.drawer.canvas.addEventListener("mousedown", this.clickEvent.bind(this), false);
	this.board=new Trigo.Board(sideLength);
    this.unitSize=_unitSize;
    this.offsetX=_offsetX;
    this.offsetY=_offsetY;
    this.h=this.unitSize*Math.cos(Math.PI/3);							//stored these as member variables
    this.l=2*this.unitSize*Math.cos(Math.PI/6);
    this.triangles=[];
    this.setUpGrid();
    this.ws=false;
};
Trigo.ScreenBoard.prototype.updateParams=function(){					//added
	this.h=this.unitSize*Math.cos(Math.PI/3);
    this.l=2*this.unitSize*Math.cos(Math.PI/6);
    this.triangles=[];
    this.setUpGrid();
    this.drawer.updateParams();
};
Trigo.ScreenBoard.prototype.makeTriangle=function(x,y){
    var ox=this.offsetX;
    var oy=this.offsetY;
    var remainder=x%2;
    if (remainder==1){
		//ox+=l/2+(x/2)*l+(l/2)*y;										//what? C++ code discards 0.5
        ox+=(x/2)*this.l+(this.l/2)*y;
        oy+=this.h+(this.unitSize+this.h)*y;
    } else {
		var ex=x-remainder;												//moved, this should be changed because remainder subtraction is in wrong place...
        ox+=(ex/2)*this.l+y*(this.l/2);
        oy+=(this.unitSize+this.h)*y;
    }
    return new Trigo.ScreenTriangle(x,y,ox,oy);
};
Trigo.ScreenBoard.prototype.setUpGrid=function(){
	if (this.triangles.length>0) this.triangles=[];						//added check
    var sideLength=this.board.tg.sideLength;
    for (let yt = 0; yt < sideLength; yt++) {
        var v=[];
        for (let xt = 0; xt <= 2*sideLength-2*yt-2; xt++) {
            v.push(this.makeTriangle(xt,yt));
        }
        this.triangles.push(v);
    }
};
Trigo.ScreenBoard.prototype.drawGrid=function(){
    var ylen=this.triangles.length;										//add checked array?
    for (let yt = 0; yt < ylen; yt++){
		var xlen=this.triangles[yt].length;
        for (let xt=0;xt<xlen;xt++){
			var tri=this.triangles[yt][xt];
            var adj=this.board.tg.adjacent(tri.x,tri.y);
            for (let a=0;a<adj.length;a++){
				var adja=this.triangles[adj[a].y][adj[a].x];
                this.drawer.line(tri.pixX,tri.pixY,adja.pixX,adja.pixY);
            }
        }
    }
};
Trigo.ScreenBoard.prototype.clickEvent = function (e) {
	var mouseX = e.pageX;
	var mouseY = e.pageY;
	var localX = mouseX - this.drawer.canvasOriginX;
	var localY = mouseY - this.drawer.canvasOriginY;
	//this.drawer.circle(localX,localY,"#0f0",this.unitSize/2);
	var leny=this.triangles.length;
    var breakLoop=false;
    for (let yt=0;yt<leny;yt++){
        var lenx=this.triangles[yt].length;
        for (let xt=0;xt<lenx;xt++){
            var tri=this.triangles[yt][xt];
            var distance=Math.sqrt(Math.pow(tri.pixX-localX,2)+Math.pow(tri.pixY-localY,2));
            if (distance<this.unitSize/2){
                breakLoop=true;
                if (this.board.tg.get(tri.x,tri.y).player==0){
                    var success=this.board.placeMove(tri.x,tri.y);
                    if (success){
                        this.placeMoves();	//maybe unnecessary to place all moves...
                        this.send("placeMove "+tri.x+","+tri.y);
                    }
                    break;
                } else {
                    this.board.markDeadStones(tri.x,tri.y);
                    this.placeMoves();
                }
            }
        }
        if (breakLoop){
            break;
        }
    }
};
Trigo.ScreenBoard.prototype.placeMoves=function(){
	this.drawer.context.clearRect(0, 0, this.drawer.canvas.width, this.drawer.canvas.height);
    this.drawGrid();
    var s=this.unitSize/2;
    var ylen=this.triangles.length;
    for (let yt = 0; yt < ylen; yt++){
        var xlen=this.triangles[yt].length;
        for (let xt=0;xt<xlen;xt++){
            var tri=this.triangles[yt][xt];
            var t=this.board.tg.get(tri.x,tri.y);
            if (t.player>0){
				this.drawer.circle(tri.pixX,tri.pixY,["#0f0","#00f"][t.player-1],s);
                if (t.markedDead){
					this.drawer.circle(tri.pixX,tri.pixY,"#f00",s/2);
                }
            }
        }
    }
    if (!(this.board.moves.length==0)){
        var t2=this.board.moves[this.board.moves.length-1];
        if (!t2.isPass()){
            var st=this.triangles[t2.y][t2.x];
            this.drawer.circle(st.pixX,st.pixY,"#fff",s/3);
        }
    }
    document.getElementById("board_moves").value=this.board.state();
};

//CanvasDrawer

Trigo.CanvasDrawer=function(drawAreaID,l){
	this.canvas = document.getElementById(drawAreaID);
	this.context = this.canvas.getContext('2d');

	var rect = this.canvas.getBoundingClientRect();
	var paddingY=(document.documentElement || document.body.parentNode || document.body).scrollTop;
	this.canvasOriginX = rect.left;
	this.canvasOriginY = rect.top+paddingY;
};
Trigo.CanvasDrawer.prototype.updateParams = function(){
	var rect = this.canvas.getBoundingClientRect();
	var paddingY=(document.documentElement || document.body.parentNode || document.body).scrollTop;
	this.canvasOriginX = rect.left;
	this.canvasOriginY = rect.top+paddingY;
};
Trigo.CanvasDrawer.prototype.line = function(x0, y0, x1, y1, col, lw, text) {
	if (typeof(col)==='undefined') col = "#000";
	if (lw===undefined){
		this.context.lineWidth=1;
	} else {
		this.context.lineWidth=lw;
	}
	if (typeof(text)==='undefined') text = "";
	this.context.strokeStyle = col;
	this.context.beginPath();
	this.context.moveTo(x0, y0);
	this.context.lineTo(x1, y1);
	this.context.stroke();

	if (text) {
		this.context.font = "9px";
		this.context.fillStyle = "#000";
		this.context.fillText(text, x0 - this.d / 3, y0-this.d/30);
	}
};
Trigo.CanvasDrawer.prototype.circle=function(x,y,col,r){
	if (typeof(r)==='undefined') r = 30;	//how to make unitSize accessible?
	if (col===undefined) col="#000";
	if (r<0) r = 0;
	this.context.fillStyle=col;
	this.context.beginPath();
	this.context.arc(x,y,r,0,2*Math.PI);
	this.context.fill();
};

//New functions

Trigo.ScreenBoard.prototype.plotInfluence=function(player,range,tunneling){
	if (player==undefined) player=0;
	if (range==undefined) range=3;
	if (tunneling==undefined) tunneling=false;
	this.board.resetInfluence();
	this.board.spreadInfluence(range,tunneling);
	for (let y=0;y<this.board.influence.length;y++){
		for (let x=0;x<this.board.influence[y].length;x++){
			var it=this.board.influence[y][x];
			var st=this.triangles[y][x];
			if (player==1){
				this.drawer.circle(st.pixX,st.pixY,"#0f0",this.unitSize*it.green/2);
			} else if (player==2){
				this.drawer.circle(st.pixX,st.pixY,"#00f",this.unitSize*it.blue/2);
			} else if (player==0){
				var infl=it.green-it.blue;
				if (infl>0){
					this.drawer.circle(st.pixX,st.pixY,"#0f0",this.unitSize*infl/2);
				} else if (infl<0){
					this.drawer.circle(st.pixX,st.pixY,"#00f",this.unitSize*Math.abs(infl)/2);
				}
			}
		}
	}
};

Trigo.ScreenBoard.prototype.placeMove=function(x,y,player){
	if (player===undefined || isNaN(player)){
		if (this.board.placeMove(x,y)) this.placeMoves();
	} else {
		if (this.board.placeCustomMove(x,y,player)) this.placeMoves();
	}
};
Trigo.ScreenBoard.prototype.updateScore=function(){
	this.board.score();
	var hybridsum=this.board.stones[0]+this.board.captures[0]+this.board.territory[0]-this.board.stones[1]-this.board.captures[1]-this.board.territory[1]-this.board.komi;
	var result="Hybrid rules sum gives final result: ";
	if (hybridsum>0){
		result+="Green by "+hybridsum+" points.";
	} else if (hybridsum<0){
		result+="Blue by "+Math.abs(hybridsum)+" points.";
	} else {
		result+="Draw!";
	}
	var ss="<b>Last scoring</b><br>";
	ss+="Green: "+this.board.stones[0]+" stones, "+this.board.captures[0]+" captures and "+this.board.territory[0]+" territory.<br>";
	ss+="Blue: "+this.board.stones[1]+" stones, "+this.board.captures[1]+" captures and "+this.board.territory[1]+" territory.<br>";
	ss+="Komi for blue is set at "+this.board.komi+".<br>";
	ss+=result;
	document.getElementById("scores").innerHTML=ss;
	
	var ssa="Current score\n";
	ssa+="Green: "+this.board.stones[0]+" stones, "+this.board.captures[0]+" captures and "+this.board.territory[0]+" territory.\n";
	ssa+="Blue: "+this.board.stones[1]+" stones, "+this.board.captures[1]+" captures and "+this.board.territory[1]+" territory.\n";
	ssa+="Komi for blue is set at "+this.board.komi+".\n";
	ssa+=result;
	alert(ssa);
};
Trigo.ScreenBoard.prototype.loadGame=function(){
	var sl=this.board.tg.sideLength;
	this.board.loadGame(document.getElementById("board_moves").value);
	if (sl!=this.board.tg.sideLength){
		this.setUpGrid();
	}
	this.placeMoves();
};
Trigo.ScreenBoard.prototype.setupWS=function(){
	if (window["WebSocket"]) {
        this.ws = new WebSocket("ws://" + document.location.host + "/ws");
        this.ws.onclose = function (evt) {
            console.log("Connection closed.");
        };
        var _this=this;
        this.ws.onmessage = function (evt) {
            var messages = evt.data.split('\n');
            for (var i = 0; i < messages.length; i++) {
                var arr=messages[i].split(' ');
                if (arr[0]=="placeMove"){
					var lp=arr[1].split(':');
					var loc=lp[0].split(',');
					_this.placeMove(parseInt(loc[0]),parseInt(loc[1]),parseInt(lp[1]));
				} else if (arr[0]=="loadGame"){
					document.getElementById("board_moves").value=arr[1];
					_this.loadGame();
					_this.placeMoves();
				}
            }
        };
    }
};
Trigo.ScreenBoard.prototype.send=function(string){
	if (!this.ws) {
		return false;
	}
	if (!string) {
		return false;
	}
	this.ws.send(string);
	return true;
};
