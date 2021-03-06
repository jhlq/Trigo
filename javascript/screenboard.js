//Load trigolib.js first

'use strict';

Trigo.ScreenTriangle=function(_x,_y,_pixX,_pixY){
    this.x=_x;
    this.y=_y;
    this.pixX=_pixX;
    this.pixY=_pixY;
};

Trigo.ScreenBoard=function(drawAreaID,sideLength){
	this.drawer=new Trigo.CanvasDrawer(drawAreaID,3);
	this.drawer.canvas.addEventListener("mousedown", this.clickEvent.bind(this), false);
	this.board=new Trigo.Board(sideLength);
    this.updateParams();
    this.ws=false;
};
Trigo.ScreenBoard.prototype.updateParams=function(){					//added
	this.drawer.updateParams();
	this.unitSize=(this.drawer.canvas.width)/(2*this.board.tg.sideLength)/Math.cos(Math.PI/6);
	this.h=this.unitSize*Math.cos(Math.PI/3);
    this.l=2*this.unitSize*Math.cos(Math.PI/6);
    this.triangles=[];
    this.setUpGrid();
};
Trigo.ScreenBoard.prototype.makeTriangle=function(x,y){
    var ox=this.unitSize;
    var oy=this.unitSize;
    var remainder=x%2;
    if (remainder==1){
		//ox+=l/2+(x/2)*l+(l/2)*y;										//what? C++ code discards 0.5. Fix that
        ox+=(x/2)*this.l+(this.l/2)*y;
        oy+=this.h+(this.unitSize+this.h)*y;
    } else {
		ox+=(x/2)*this.l+y*(this.l/2);
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
Trigo.ScreenBoard.prototype.handleClick=function(x,y){
	var tri=x;
	if (y!==undefined) tri=new Trigo.Triangle(x,y);
	var imt=this.board.invalidMoveType(tri.x,tri.y,this.board.player);
	if (imt==4){
		alert("That move is outside the board.");
	} else if (imt==3){
		alert("That move would recreate a previous board position, ko!");
	} else if (imt==2){
		alert("That move would be suicide.");
	} else if (imt==0){
		if (this.ws){
			this.send("placeMove "+tri.x+","+tri.y);
		} else {
			this.board.unmarkDeadStones();
			this.board.placeMove(tri.x,tri.y);
			this.placeMoves();
			if (document.getElementById("autoAI").checked){
				//this.letAIPlay(); //this doesn't draw the clicked move until after the AI is done...
				var _this=this;
				setTimeout(function(){ _this.letAIPlay(); },50);
			}
		}
	} else if (imt==1){
		if (this.ws){
			this.send("markDeadStones "+tri.x+","+tri.y)
		} else {
			this.board.markDeadStones(tri.x,tri.y);
			this.placeMoves();
		}
	}
}
Trigo.ScreenBoard.prototype.clickEvent = function (e) {
	var mouseX = e.pageX;
	var mouseY = e.pageY;
	this.drawer.updateParams();
	var localX = mouseX - this.drawer.canvasOriginX;
	var localY = mouseY - this.drawer.canvasOriginY;
	var leny=this.triangles.length;
    var breakLoop=false;
    for (let yt=0;yt<leny;yt++){
        var lenx=this.triangles[yt].length;
        for (let xt=0;xt<lenx;xt++){
            var tri=this.triangles[yt][xt];
            var distance=Math.sqrt(Math.pow(tri.pixX-localX,2)+Math.pow(tri.pixY-localY,2));
            if (distance<this.unitSize/2){
                this.handleClick(tri);
                return;
            }
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
    this.drawer.circle(this.drawer.canvas.width-3*s, this.drawer.canvas.height-3*s,["#0f0","#00f"][this.board.player-1],s);
    document.getElementById("board_moves").value=this.board.state();
};

//CanvasDrawer

Trigo.CanvasDrawer=function(drawAreaID,l){
	this.canvas = document.getElementById(drawAreaID);
	this.context = this.canvas.getContext('2d');
	this.updateParams();
};
Trigo.CanvasDrawer.prototype.updateParams = function(){
	var rect = this.canvas.getBoundingClientRect();
	var paddingY=0;
	if (window.pageYOffset!==undefined){
		paddingY=window.pageYOffset;
	} else {
		paddingY=(document.documentElement || document.body.parentNode || document.body).scrollTop;
	}
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
	this.board.spreadInfluence(range,tunneling);
	for (let y=0;y<this.board.influence.length;y++){
		for (let x=0;x<this.board.influence[y].length;x++){
			if (this.board.tg.triangles[y][x].alive()) continue;
			var st=this.triangles[y][x];
			var it=this.board.influence[y][x];
			if (player==1 && it.green>0){
				this.drawer.circle(st.pixX,st.pixY,"#0f0",this.unitSize*it.green/3);
			} else if (player==2 && it.blue>0){
				this.drawer.circle(st.pixX,st.pixY,"#00f",this.unitSize*it.blue/3);
			} else if (player==0){
				var infl=it.green-it.blue;
				if (infl>0){
					this.drawer.circle(st.pixX,st.pixY,"#0f0",this.unitSize*infl/3);
				} else if (infl<0){
					this.drawer.circle(st.pixX,st.pixY,"#00f",this.unitSize*Math.abs(infl)/3);
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
	var s=this.board.score();
	var sum=s[0]-s[1];
	var result=this.board.ruleset+" ruleset gives final result: ";
	if (sum>0){
		result+="Green by "+sum+" points.";
	} else if (sum<0){
		result+="Blue by "+Math.abs(sum)+" points.";
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
Trigo.ScreenBoard.prototype.estimateScore=function(){
	this.plotInfluence();
	var s=this.board.estimateScore(false);
	var sum=s[0]-s[1];
	var result=this.board.ruleset+" ruleset. ";
	if (sum>0){
		result+="Green by "+sum+" points.";
	} else if (sum<0){
		result+="Blue by "+Math.abs(sum)+" points.";
	} else {
		result+="Draw!";
	}
	var ss="<b>Last score estimate</b><br>";
	ss+="Green: "+s[0]+". "+this.board.stones[0]+" stones and "+this.board.captures[0]+" captures.<br>";
	ss+="Blue: "+s[1]+". "+this.board.stones[1]+" stones and "+this.board.captures[1]+" captures.<br>";
	ss+="Komi for blue is set at "+this.board.komi+".<br>";
	ss+=result;
	document.getElementById("scores").innerHTML=ss;
	
	var ssa="Score estimate\n";
	ssa+="Green: "+s[0]+". "+this.board.stones[0]+" stones and "+this.board.captures[0]+" captures.\n";
	ssa+="Blue: "+s[1]+". "+this.board.stones[1]+" stones and "+this.board.captures[1]+" captures.\n";
	ssa+="Komi for blue is set at "+this.board.komi+".\n";
	ssa+=result;
	alert(ssa);
};
Trigo.ScreenBoard.prototype.loadGame=function(){
	if (this.ws){
		this.send("loadGame "+document.getElementById("board_moves").value);
	} else {
		this.board.loadGame(document.getElementById("board_moves").value);
		this.updateParams();
		this.placeMoves();
	}
};
Trigo.ScreenBoard.prototype.setupWS=function(id){
	if (id=="boards/noWS") return;
	if (window["WebSocket"]) {
		var wsid="/ws";
		if (id) wsid+="/"+id;
        this.ws = new WebSocket("ws://" + document.location.host + wsid);
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
					_this.board.loadGame(arr[1]);
					_this.updateParams();
					_this.placeMoves();
					document.getElementById("sidelength").value=_this.board.tg.sideLength;
				} else if (arr[0]=="markDeadStones"){
					var lp=arr[1].split(':');
					var loc=lp[0].split(',');
					_this.board.markDeadStones(parseInt(loc[0]),parseInt(loc[1]));
                    _this.placeMoves();
				} else if (arr[0]=="undo"){
					_this.board.undo();
					_this.placeMoves();
				} else if (arr[0]=="reset"){
					_this.board.reset();
					_this.placeMoves();
				} else if (arr[0]=="ruleset"){
					if (arr[1]=="Hybrid"){
						_this.board.ruleset="Hybrid";
					} else if (arr[1]=="Area"){
						_this.board.ruleset="Area";
					} else if (arr[1]=="Territory"){
						_this.board.ruleset="Territory";
					}
				} else if (arr[0]=="markDead"){
					if (arr[1]=="true"){
						document.getElementById("atEnd").innerHTML=["Green","Blue"][_this.board.player-1]+', please mark dead stones. <button onclick="sb.done()">Done!</button>';
					} else if (arr[1]=="false"){
						document.getElementById("atEnd").innerHTML='';
					}
					sb.updateParams();
				} else if (arr[0]=="unmarkDeadStones"){
					_this.board.unmarkDeadStones();
					_this.placeMoves();
				} else if (arr[0]=="done"){
					_this.board.switchPlayer();
					_this.placeMoves();
					document.getElementById("atEnd").innerHTML=["Green","Blue"][_this.board.player-1]+', please mark dead stones. <button onclick="sb.done()">Done!</button>';
				} else if (arr[0]=="winner"){
					if (arr[1]=="draw!"){
						document.getElementById("winner").innerHTML="<b>Draw!</b>";
					} else {
						document.getElementById("winner").innerHTML="<b>Winner: "+arr[1]+" by "+arr[2]+"</b>";
					}
					document.getElementById("atEnd").innerHTML='<button onclick="sb.updateScore()">Score.</button>';
				} else if (arr[0]=="notYourTurn"){
					var item = document.createElement("div");
					item.innerHTML = "<b>Not your turn.</b>";
					appendLog(item);
				} else if (arr[0]=="comment"){
					var item = document.createElement("div");
					item.innerHTML = "<b>Local: </b>"+messages[i].substr(8);
					appendLog(item);
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
	if (this.ws.readyState !== WebSocket.OPEN) {
		alert("WebSocket is not open, try refreshing the page. If the problem persists please file an issue.");
		return false;
	}
	this.ws.send(string);
	return true;
};
Trigo.ScreenBoard.prototype.pass=function(){
	if (this.ws){
		this.send("placeMove -1,-1")
	} else {
		this.board.pass();
		this.placeMoves();
		if (document.getElementById("autoAI").checked){
			this.letAIPlay();
		}
	}
};
Trigo.ScreenBoard.prototype.undo=function(){
	if (this.ws){
		this.send("undo")
	} else {
		this.board.undo();
		this.placeMoves();
	}
};
Trigo.ScreenBoard.prototype.reset=function(){
	if (this.ws){
		this.send("reset")
	} else {
		this.board.reset();
		this.placeMoves();
	}
};
Trigo.ScreenBoard.prototype.autoMarkDeadStones=function(){
	if (this.ws){
		var tbm=this.board.toBeMarked();
		for (let clusteri=0;clusteri<tbm.length;clusteri++){
			var c0=tbm[clusteri][0];
			this.send("markDeadStones "+c0.x+","+c0.y);
		}
	} else {
		this.board.autoMarkDeadStones();
		this.placeMoves();
	}
};
Trigo.ScreenBoard.prototype.letAIPlay=function(){
	if (this.ws){
		this.ai.board=this.board.copy()
		this.ai.placeSmartMove();
		var nmoves=this.ai.board.moves.length;
		this.send("placeMove "+this.ai.board.moves[nmoves-1].x+","+this.ai.board.moves[nmoves-1].y);
		this.ai.board=this.board;
	} else {
		this.ai.placeSmartMove();
		var nmoves=this.board.moves.length;
		if (this.board.moves[nmoves-1].isPass() && this.board.moves[nmoves-2].isPass()){
			this.autoMarkDeadStones();
			this.updateScore();
		} else {
			this.placeMoves();
		}
	}
};
Trigo.ScreenBoard.prototype.changesize=function(){
	var s=parseInt(document.getElementById("canvassize").value);
	sb.drawer.canvas.width=s;
	sb.drawer.canvas.height=s*0.9;
	var sl=this.board.tg.sideLength;
	if (document.getElementById("sidelength")){
		sl=parseInt(document.getElementById("sidelength").value);
	}
	if (sl!=sb.board.tg.sideLength){
		document.getElementById("board_moves").value=sl+";";
		this.loadGame();
	} else {
		this.updateParams();
		this.placeMoves();
	}
};
Trigo.ScreenBoard.prototype.unmarkDeadStones=function(){
	this.board.unmarkDeadStones();
	this.placeMoves();
};
Trigo.ScreenBoard.prototype.done=function(){
	var s=this.board.score();
	this.send("done "+(s[0]-s[1]));
};
Trigo.ScreenBoard.prototype.resign=function(){
	this.send("resign");
};
