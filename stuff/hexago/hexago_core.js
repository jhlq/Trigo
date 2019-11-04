function Core(){
	this.love="all";
}
Core.prototype.newBoard=function(l){
	return this.putboard(l,{});
};
Core.prototype.putborder = function(l,map,col){
	if (typeof(col)==='undefined') { 
		col = ''; 
	} else {
		var clone=true;
		col=JSON.parse(JSON.stringify(col));
	}
	if (l==1){
		map[[0,0]]=col;
	} else {
		var dirs=[[0,1],[1,0],[1,-1],[0,-1],[-1,0],[-1,1]];
		var loc=[-l+1,0];
		for (var i = 0; i < 6; i++) { 
			for (var j = 0; j < l-1; j++) { 
				map[loc]=col;
				if (clone) { col=JSON.parse(JSON.stringify(col)); }
				loc[0]+=dirs[i][0];
				loc[1]+=dirs[i][1];
			}
		}
	}
	return map;
};
Core.prototype.putboard=function(l,map,data,start){
	if (typeof(start)==='undefined') start = 1;
	//if (typeof(data)==='object') { data = $.extend({},data);console.log(123)}
	for (var k=start;k<=l;k++){
		this.putborder(k,map,data);
	}
	return map;
};

Core.prototype.distance=function(x1,y1,x2,y2){
	return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
};
Core.prototype.adjacent=function(loc){
	if (typeof(loc)==='undefined') loc = [0,0];
	return [ [loc[0],loc[1]+1], [loc[0]+1,loc[1]], [loc[0]+1,loc[1]-1], [loc[0],loc[1]-1], [loc[0]-1,loc[1]], [loc[0]-1,loc[1]+1] ];
};
Core.prototype.keytoloc=function(key){
	var xy=key.split(',');
	return [parseInt(xy[0],10),parseInt(xy[1],10)];
};
Core.prototype.hexdistance=function(x1,y1,x2,y2){
	var z1=-x1-y1;
	var z2=-x2-y2;
	return (Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2)) / 2;
};
Core.prototype.keydistance=function(key1,key2){
	var a1=this.keytoloc(key1);
	var a2=this.keytoloc(key2);
	return this.hexdistance(a1[0],a1[1],a2[0],a2[1]);
};
Core.prototype.indexOfMax=function(arr) {
	if (arr.length === 0) {
		return -1;
	}
	var max = arr[0];
	var maxIndex = 0;
	for (var i = 1; i < arr.length; i++) {
		if (arr[i] > max) {
			maxIndex = i;
			max = arr[i];
		}
	}
	return maxIndex;
};
Core.prototype.round1000=function(val){
	return Math.round(val*1000)/1000;
};
Core.prototype.AI=function(map,moves,col){
	
	
};


function CanvasDrawer(drawAreaID,l){
	this.canvas = document.getElementById(drawAreaID);
	this.context = this.canvas.getContext('2d');

	var rect = this.canvas.getBoundingClientRect();
	var paddingY=(document.documentElement || document.body.parentNode || document.body).scrollTop;
	this.canvasOriginX = rect.left;
	this.canvasOriginY = rect.top+paddingY;

	this.d=this.canvas.width/(2*l+1);
	this.l=l;
	this.yvec=[this.d/2,this.d*Math.sin(Math.PI/3)];

	this.x0=this.canvas.width/2;
	this.y0=this.canvas.height/2;
	this.sl=(this.l-1)*this.d;
	this.h=Math.sin(Math.PI/3)*this.d;
	this.ssl=Math.sin(Math.PI/3)*this.sl;
	this.csl=Math.cos(Math.PI/3)*this.sl;	
}
CanvasDrawer.prototype.updateParams = function(){
	var rect = this.canvas.getBoundingClientRect();
	var paddingY=(document.documentElement || document.body.parentNode || document.body).scrollTop;
	this.canvasOriginX = rect.left;
	this.canvasOriginY = rect.top+paddingY;

	this.d=this.canvas.width/(2*this.l+1);
	this.l=this.l;
	this.yvec=[this.d/2,this.d*Math.sin(Math.PI/3)];

	this.x0=this.canvas.width/2;
	this.y0=this.canvas.height/2;
	this.sl=(this.l-1)*this.d;
	this.h=Math.sin(Math.PI/3)*this.d;
	this.ssl=Math.sin(Math.PI/3)*this.sl;
	this.csl=Math.cos(Math.PI/3)*this.sl;
};
CanvasDrawer.prototype.line = function(x0, y0, x1, y1, col, text) {
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
CanvasDrawer.prototype.gridLine=function(offset,lineWidth,ax,col,text,clearfirst){
	if (typeof(lineWidth)==='undefined') lineWidth = 1;
	if (typeof(ax)==='undefined') ax = 'x';
	if (typeof(col)==='undefined') col = "#000";
	if (typeof(text)==='undefined') text = "";
	if (typeof(clearfirst)==='undefined') clearfirst = false;
	if (clearfirst){
		this.grid();
	}
	this.context.lineWidth=lineWidth;
	this.context.strokeStyle = col;
	var sl=(this.l-1)*this.d;
	var h=Math.sin(Math.PI/3)*this.d;
	var ssl=Math.sin(Math.PI/3)*sl;
	var csl=Math.cos(Math.PI/3)*sl;
	if (ax=='y'){
		this.line(this.x0-sl+Math.abs(offset)*this.d/2,this.y0-offset*h,this.x0+sl-Math.abs(offset)*this.d/2,this.y0-offset*h,col,text);
	} else if (ax=='x') {
		offset=-offset;
		if (offset>0) {
			this.line(this.x0-csl-offset*this.d/2,this.y0+ssl-offset*h,this.x0+csl-offset*this.d,this.y0-ssl,col,text);
		} else {
			this.line(this.x0-csl-offset*this.d,this.y0+ssl,this.x0+csl-offset*this.d/2,this.y0-ssl-offset*h,col,text);
		}
	} else {
		this.drawLine(this.x0+csl+offset*this.d/2,this.y0+ssl-offset*h,this.x0-csl+offset*this.d,this.y0-ssl);
	}
};
CanvasDrawer.prototype.grid = function() {
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.context.strokeStyle='#000';
	this.context.lineWidth=1;
	this.line(this.x0-this.sl,this.y0,this.x0+this.sl,this.y0);
	this.line(this.x0-this.csl,this.y0+this.ssl,this.x0+this.csl,this.y0-this.ssl);
	this.line(this.x0+this.csl,this.y0+this.ssl,this.x0-this.csl,this.y0-this.ssl);
	for (var i = 1; i < this.l; i++) {
		//this.drawGridLine(i);
		//this.drawGridLine(-i);
		this.gridLine(i,1,"x");
		this.gridLine(-i,1,"x");
		this.gridLine(i,1,"y");
		this.gridLine(-i,1,"y");
		//this.drawLine(this.x0-this.sl+i*this.d/2,this.y0-i*this.h,this.x0+this.sl-i*this.d/2,this.y0-i*this.h);
		//this.drawLine(this.x0-this.csl-i*this.d/2,this.y0+this.ssl-i*this.h,this.x0+this.csl-i*this.d,this.y0-this.ssl);
		//this.drawLine(this.x0-this.csl+i*this.d,this.y0+this.ssl,this.x0+this.csl+i*this.d/2,this.y0-this.ssl+i*this.h);
		this.line(this.x0+this.csl+i*this.d/2,this.y0+this.ssl-i*this.h,this.x0-this.csl+i*this.d,this.y0-this.ssl);
		this.line(this.x0+this.csl-i*this.d,this.y0+this.ssl,this.x0-this.csl-i*this.d/2,this.y0-this.ssl+i*this.h);
	}
};
CanvasDrawer.prototype.xylines = function() {
	if (document.getElementById("x")){
		var o=document.getElementById('x').value;
		this.gridLine(o,3,'x',"#909",o);
		o=document.getElementById('y').value;
		this.gridLine(o,3,'y',"#909",o);
	}
};
CanvasDrawer.prototype.circle=function(x,y,col,r){
	if (typeof(r)==='undefined') r = this.d/2;
	if (r<0) r = 0;
	this.context.fillStyle=col;
	this.context.beginPath();
	this.context.arc(x,y,r,0,2*Math.PI);
	this.context.fill();

};
CanvasDrawer.prototype.circleKey=function(key,col,r){
	var xy=key.split(',');
	this.circleAt(parseInt(xy[0],10),parseInt(xy[1],10),col,r);
};
CanvasDrawer.prototype.circleAt=function(xi,yi,col,r){
	var x=this.x0+xi*this.d+yi*this.yvec[0];
	var y=this.y0-yi*this.yvec[1];
	this.circle(x,y,col,r);
};
CanvasDrawer.prototype.map=function(map,obstructions){
	for (var key in map){
		if (map[key]){
			this.circleKey(key,map[key]);
		}
	}
	for (var key in obstructions){
		this.circleKey(key,obstructions[key]);
	}
};

CanvasDrawer.prototype.influence = function(maxinf){
	for (var k in maxinf){
		this.circleKey(k,maxinf[k],this.d/9);
	}
};

function Common(drawAreaID,l,ir,supersolidity){
	this.core=new Core();
	this.l=l;
	this.ir=ir || l;
	this.map=this.core.newBoard(l);
	this.obstructions={};
	this.drawer=new CanvasDrawer(drawAreaID,l);
	this.drawer.canvas.addEventListener("mousedown", this.clickEvent.bind(this), false);
	this.loadMoves();
	this.setScore();
	this.supersolidity=supersolidity;
}
Common.prototype.drawAll=function(){
	this.drawer.grid();
	this.drawer.map({},this.obstructions);
	this.setScore();
	this.loadMoves();
	this.drawer.xylines();
	this.drawer.influence(this.maxinf);
};
Common.prototype.moves = function(col){
	var m=document.getElementById("board_moves").value;
	m=(m||"#909:0,0").split('+');
	var mo=[];
	for (var i=0;i<m.length;i++){
		var move=m[i].split(':');
		if (move[1]!=="pass" && (!col || col===move[0])){
			mo.push(move);
		}
	}
	return mo;
};
Common.prototype.loadMoves = function(){
	var moves=this.moves();
	var lastmove=moves[moves.length-1];//.split(':');
	for (var m in this.map){
		this.map[m]="";
	}
	for (var move in moves){
		var ma=moves[move];//.split(':');
		if (ma[0]=="#909"){
			delete(this.map[ma[1]]);
			this.obstructions[ma[1]]="#909";
		} else if (this.map[ma[1]]=="") {
			this.map[ma[1]]=ma[0];
		}
	}
	this.drawer.map(this.map);
	this.drawer.circleKey(lastmove[1],"#000",this.drawer.d/6);
};

Common.prototype.AImove=function(col,nplayers){
	var bests=-1000;
	var startscore=this.scoreDict()[col];
	var bestloc="0,0";
	var maxit=90;
	var nit=0;
	var locs=this.moves(col);
	//if (locs.length===0){
		locs.push([col,"0,0"]);
	//}
	//console.log(locs)
	locs=locs.reverse();
	for (var i=0;i<locs.length;i++){
		var locc=locs[i];
		if (locc[0]===col){
			//console.log(locc)
			var adj=this.core.adjacent(this.core.keytoloc(locc[1]));
			for (var locai=0;locai<adj.length;locai++){
				var loc=adj[locai].toString();
				//console.log(loc);
		 		if (this.map[loc]==""){
					//console.log(this.score(this.map)[0])
					this.map[loc]=col;
					if (this.supersolidity){
						var oldmoves=document.getElementById("board_moves").value;
						document.getElementById("board_moves").value+="+"+col+":"+loc;
						this.spreadInfluenceAll();
						document.getElementById("board_moves").value=oldmoves;
					} else {
						this.spreadInfluenceOne(loc,col);
					}
					//console.log(2,this.score(this.map)[0])
					var dict=this.scoreDict();
					var s=dict[col];
					//if (loc==="1,-3"){ console.log(s,startscore) }
					if (s<=startscore){
						this.map[loc]="";
						this.spreadInfluenceAll();
						continue;
					}
					var lowest=this.l*1000;
					var highest=-1;
					for (var key in dict){
						if (key!=col){
							//s-=dict[key];
							if (dict[key]>highest){
								highest=dict[key];
							}
							if (dict[key]<lowest){
								lowest=dict[key];
							}
						}
					}
					var scomb;
					if (nplayers>2){
						var scalefac=this.l*this.l*9;
						var inequality=lowest-highest;
						var equalizer=1;
						scomb=Math.tanh(s/scalefac)+Math.tanh(equalizer*inequality/scalefac);
					} else {
						scomb=s;
					}
					if (scomb>bests){
						bests=scomb;
						bestloc=loc;
					}
					this.map[loc]="";
					nit+=1;
					if (nit>maxit){
						break;
					}
					this.spreadInfluenceAll();
			 	}
			}
		}
	}
	this.setScore();
	return bestloc;
};
Common.prototype.setScore=function(){
	var s=this.score();
	var ss="";
	var w=this.drawer.canvas.width;
	var vo=0;
	var nor=Math.max(s[0][0],1);
	for (var i=0;i<s[0].length;i++){
		if (i!=0){
			ss+=", ";
			if (s[0][i]!=s[0][i-1]){
				vo+=w/15;
			}
		}
		this.drawer.circle(w/9-i*w/50,w/15+vo,s[1][i],w/15*s[0][i]/nor);
		ss+=s[1][i]+": "+s[0][i];
	}
	if (ss!=""){
		document.getElementById("scores").innerHTML="Current score is "+ss;
	}
};
Common.prototype.clickEvent = function (e) {
	var mouseX = e.pageX;
	var mouseY = e.pageY;
	var localX = mouseX - this.drawer.canvasOriginX;
	var localY = mouseY - this.drawer.canvasOriginY;
	for (var key in this.map){
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
	}
};
Common.prototype.spreadInfluenceOne = function(move,col){
	if (move==="pass"){
		return 0;
	}
	var visited=[move];
	var fringe=[move];
	for (var i=0;i<this.ir;i++){
		if (i==0) {
			this.influence[move][col]+=1;
		} else {
			var nfringe=[];
			for (var k=0;k<fringe.length;k++){
				//if (this.influence[fringe[k]]) { 
				//	this.influence[fringe[k]][col]+=1/(i+1); 
				//} 
				if (i===this.influence_radius-1){ break; }
				//visited.push(fringe[k]);
				var adj=this.core.adjacent(this.core.keytoloc(fringe[k]));
				for (var j=0;j<adj.length;j++){
					var sadj=adj[j].toString();
					if (visited.indexOf(sadj)<0) {
						if (this.influence[sadj]) { this.influence[sadj][col]+=1/(i+1); }
						if (this.map[sadj] === "" || (!this.supersolidity && this.map[sadj] === col)){
							nfringe.push(sadj);
						}
						visited.push(sadj);
					}
				}
			}
			if (nfringe.length==0){ break; }
			fringe=nfringe;
		}
	}
};
Common.prototype.spreadInfluenceAll = function(){
	this.influence=this.core.putboard(this.l,{},{"#f00":0,"#0f0":0,"#00f":0},2);
	var moves=document.getElementById("board_moves").value.split('+');
	for (var mi=1;mi<moves.length;mi++){
		var ma=moves[mi].split(':');
		var move=ma[1];
		var col=ma[0];
		this.spreadInfluenceOne(move,col);
	}
};
Common.prototype.scoreDict = function(){
	/*
	var influence={};
	for (var loc in this.map){
		influence[loc]={};
		for (var move in this.map){
			if (this.map[move] && this.map[move]!="#908" && (this.core.keydistance(loc,move)+1)<=this.ir){
				influence[loc][this.map[move]]?influence[loc][this.map[move]]+=1/(this.core.keydistance(loc,move)+1):
																							influence[loc][this.map[move]]=1/(this.core.keydistance(loc,move)+1);
			}
		}
	}
	*/
	var influence=this.influence;
	var s={};
	var maxinf={};
	for (var l in influence){
		var high=0.01;
		var cols=[];
		for (var m in influence[l]){
			influence[l][m]=this.core.round1000(influence[l][m]);
			if (influence[l][m]>high){
				high=influence[l][m];
				cols=[m];
			} else if (influence[l][m]==high){
				cols.push(m);
			}
		}
		var le=cols.length;
		le==1?maxinf[l]=cols[0]:maxinf[l]="#fff";
		var sadd=1.0;
		if (this.map[l]){
			if (cols.indexOf(this.map[l])<0){
				sadd=2.0;
			} else { sadd=0; }
		}
		for (var c in cols){
			s[cols[c]]?s[cols[c]]+=sadd/le:s[cols[c]]=sadd/le;
			s[cols[c]]=this.core.round1000(s[cols[c]]);
		}
		//if (l=="0,4") console.log(le, ": ", high, " sadd", sadd)
	}
	this.influence=influence;
	this.maxinf=maxinf;
	for (var d in s){
		s[d]+=-this.countMoves(d);
	}
	return s;//,influence,maxinf;
};
Common.prototype.countMoves = function(col){
	var n=0;
	var moves=document.getElementById("board_moves").value.split('+');
	for (var mi in moves){
		var move=moves[mi].split(':');
		if (!col || (move[0]===col && move[1]!=="pass")){
			n+=1;
		}
	}
	return n;
};
Common.prototype.score = function(){
	this.loadMoves();
	this.spreadInfluenceAll();
	var s=this.scoreDict();
	var svals=[];
	var scols=[];
	for (var d in s){
		//svals.push(s[d]-this.countMoves(moves,d));
		svals.push(s[d]);
		scols.push(d);
	}
	var svalsorted=[];
	var scolsorted=[];
	for (var i=0;i<svals.length;i++){
		var im=this.core.indexOfMax(svals);
		svalsorted.push(svals[im]);
		scolsorted.push(scols[im]);
		svals[im]=-1000;
	}
	return [svalsorted,scolsorted];
};
Common.prototype.col = function(){
	return document.getElementById("col").value;
};