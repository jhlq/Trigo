//Load trigolib.js first

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
};
Trigo.ScreenBoard.prototype.makeTriangle=function(x,y){
    var ox=this.offsetX;
    var oy=this.offsetY;
    var remainder=x%2;
    if (remainder==1){
		//ox+=l/2+(x/2)*l+(l/2)*y;										//what?
        ox+=(x/2)*this.l+(this.l/2)*y;
        oy+=this.h+(this.unitSize+this.h)*y;
    } else {
		var ex=x-remainder;												//moved
        ox+=(ex/2)*this.l+y*(this.l/2);
        oy+=(this.unitSize+this.h)*y;
    }
    return new Trigo.ScreenTriangle(x,y,ox,oy);
}
Trigo.ScreenBoard.prototype.setUpGrid=function(){
    var sideLength=this.board.tg.sideLength;
    for (let yt = 0; yt < sideLength; yt++) {
        var v=[];
        for (let xt = 0; xt <= 2*sideLength-2*yt-2; xt++) {
            v.push(this.makeTriangle(xt,yt));
        }
        this.triangles.push(v);
    }
}
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
}
Trigo.ScreenBoard.prototype.clickEvent = function (e) {
	var mouseX = e.pageX;
	var mouseY = e.pageY;
	var localX = mouseX - this.drawer.canvasOriginX;
	var localY = mouseY - this.drawer.canvasOriginY;
	this.drawer.circle(localX,localY,"#0f0",this.unitSize/2);
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
                        //emit modifiedmoves();
                        this.placeMoves();
                    }
                    break;
                } else {
                    this.board.markDeadStones(tri.x,tri.y);
                    this.placeMoves();
                    //emit modifiedmoves();
                    
                }
            }
        }
        if (breakLoop){
            break;
        }
    }
/*	for (var key in this.map){
		var xy=key.split(',');
		var x=this.drawer.x0+parseInt(xy[0],10)*this.drawer.d+parseInt(xy[1],10)*this.drawer.yvec[0];
		var y=this.drawer.y0-parseInt(xy[1],10)*this.drawer.yvec[1];
		if (this.core.distance(localX,localY,x,y)<this.drawer.d/2 && document.getElementById("x")){
			document.getElementById("x").value=xy[0];
			document.getElementById("y").value=xy[1];
			this.drawAll();
			this.drawer.circle(x,y,this.col());
			break;
		}
	}
	if (document.getElementById("clicksubmit").checked){
		submit();
	}*/
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
                this.drawer.circle(tri.pixX,tri.pixY,["#0f0","#00f"][t.player],s);
                if (t.markedDead){
					this.drawer.circle(tri.pixX,tri.pixY,"#f00",s/2);
                }
            }
        }
    }
    if (!this.board.moves.length==0){
        var t=this.board.moves[this.board.moves.length-1];
        if (!t.isPass()){
            var st=this.triangles[t.y][t.x];
            this.drawer.circle(tri.pixX,tri.pixY,"#000",s/3);
        }
    }
//    updatescore();
};
Trigo.CanvasDrawer=function(drawAreaID,l){
	this.canvas = document.getElementById(drawAreaID);
	this.context = this.canvas.getContext('2d');

	var rect = this.canvas.getBoundingClientRect();
	var paddingY=(document.documentElement || document.body.parentNode || document.body).scrollTop;
	this.canvasOriginX = rect.left;
	this.canvasOriginY = rect.top+paddingY;
/*
	this.d=this.canvas.width/(2*l+1);
	this.l=l;
	this.yvec=[this.d/2,this.d*Math.sin(Math.PI/3)];

	this.x0=this.canvas.width/2;
	this.y0=this.canvas.height/2;
	this.sl=(this.l-1)*this.d;
	this.h=Math.sin(Math.PI/3)*this.d;
	this.ssl=Math.sin(Math.PI/3)*this.sl;
	this.csl=Math.cos(Math.PI/3)*this.sl;	
	*/
}
Trigo.CanvasDrawer.prototype.updateParams = function(){
	var rect = this.canvas.getBoundingClientRect();
	var paddingY=(document.documentElement || document.body.parentNode || document.body).scrollTop;
	this.canvasOriginX = rect.left;
	this.canvasOriginY = rect.top+paddingY;
/*
	this.d=this.canvas.width/(2*this.l+1);
	this.l=this.l;
	this.yvec=[this.d/2,this.d*Math.sin(Math.PI/3)];

	this.x0=this.canvas.width/2;
	this.y0=this.canvas.height/2;
	this.sl=(this.l-1)*this.d;
	this.h=Math.sin(Math.PI/3)*this.d;
	this.ssl=Math.sin(Math.PI/3)*this.sl;
	this.csl=Math.cos(Math.PI/3)*this.sl;
	*/
};
Trigo.CanvasDrawer.prototype.line = function(x0, y0, x1, y1, col, text) {
	if (typeof(col)==='undefined') col = "#000";
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
	if (col===undefined) col="#f00";
	if (r<0) r = 0;
	this.context.fillStyle=col;
	this.context.beginPath();
	this.context.arc(x,y,r,0,2*Math.PI);
	this.context.fill();
};
