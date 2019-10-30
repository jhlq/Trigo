function Game(drawAreaID,l,ir){
	this.core=new Core();
	this.l=l;
	this.ir=ir || 3*l;
	this.map=this.core.newBoard(l);
	this.obstructions={};
	this.drawer=new CanvasDrawer(drawAreaID,l);
	this.drawer.canvas.addEventListener("mousedown", this.clickEvent.bind(this), false);
	this.loadMoves();
	this.setScore();
}
Game.prototype.drawAll=function(){
	this.drawer.grid();
	this.drawer.map({},this.obstructions);
	this.setScore();
	this.loadMoves();
	this.drawer.xylines();
	this.drawer.influence(this.maxinf);
};
Game.prototype.loadMoves = function(){
	var moves=document.getElementById("board_moves").value.split('+');
	var lastmove=moves[moves.length-1].split(':');
	for (var m in this.map){
		this.map[m]="";
	}
	for (var move in moves){
		var ma=moves[move].split(':');
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
Game.prototype.col = function(){
	var cele=document.getElementById("col");
	var c=cele.value;
	//c=c.split(',');
	return c;//[0];//document.getElementById("col").value;
};
Game.prototype.setScore=function(){
	var s=this.score();
  var ss="";
	var w=this.drawer.canvas.width;
	var vo=0;
	for (var i=0;i<s[0].length;i++){
		if (i!=0){
			ss+=", ";
			if (s[0][i]!=s[0][i-1]){
				vo+=w/15;
			}
		}
		this.drawer.circle(w/9-i*w/50,w/15+vo,s[1][i],w/15*s[0][i]/s[0][0]);
		ss+=s[1][i]+": "+s[0][i];
	}
	if (ss!=""){
		document.getElementById("scores").innerHTML="Current score is "+ss;
	}
};
Game.prototype.clickEvent = function (e) {
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
};

Game.prototype.submit = function(){
	var x = document.getElementById("x").value;
	var y = document.getElementById("y").value;
	if (this.map[[x,y]]){
		alert("("+x+","+y+") is already occupied by "+this.map[[x,y]]);
		return 0;
	}
	if (typeof(this.map[[x,y]])==='undefined'){
		alert("("+x+","+y+") is an inaccessible location.");
		return 0;	
	}
	$("#locform").submit();
	return true;
};
Game.prototype.spreadInfluenceOne = function(move,col){
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
				if (i==this.influence_radius-1){ break; }
				//visited.push(fringe[k]);
				var adj=this.core.adjacent(this.core.keytoloc(fringe[k]));
				for (var j=0;j<adj.length;j++){
					var sadj=adj[j].toString();
					if (visited.indexOf(sadj)<0) {
						if (this.influence[sadj]) { this.influence[sadj][col]+=1/(i+1); }
						if (this.map[sadj] == col || this.map[sadj] == ""){
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
Game.prototype.spreadInfluenceAll = function(){
	this.influence=this.core.putboard(this.l,{},{"#f00":0,"#0f0":0,"#00f":0},2);
	var moves=document.getElementById("board_moves").value.split('+');
	for (var mi=1;mi<moves.length;mi++){
		var ma=moves[mi].split(':');
		var move=ma[1];
		var col=ma[0];
		this.spreadInfluenceOne(move,col);
	}
};
Game.prototype.scoreDict = function(){
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
		if (this.map[l] && cols.indexOf(this.map[l])<0){
			sadd=2.0;
		}
		for (var c in cols){
			s[cols[c]]?s[cols[c]]+=sadd/le:s[cols[c]]=sadd/le;
			s[cols[c]]=this.core.round1000(s[cols[c]]);
		}
		//if (l=="0,4") console.log(le, ": ", high, " sadd", sadd)
	}
	this.influence=influence;
	this.maxinf=maxinf;
	return s;//,influence,maxinf;
};
Game.prototype.countMoves = function(moves,col){
	var n=0;
	for (var mi in moves){
		if (moves[mi].split(':')[0]==col){
			n+=1;
		}
	}
	return n;
};
Game.prototype.score = function(){
	this.spreadInfluenceAll();
	var s=this.scoreDict();
	var svals=[];
	var scols=[];
	var moves=document.getElementById("board_moves").value.split('+');
	for (var d in s){
		svals.push(s[d]-this.countMoves(moves,d));
		scols.push(d);
	}
	var svalsorted=[];
	var scolsorted=[];
	for (var i=0;i<svals.length;i++){
		var im=this.core.indexOfMax(svals);
		svalsorted.push(svals[im]);
		scolsorted.push(scols[im]);
		svals[im]=-1;
	}
	return [svalsorted,scolsorted];
};
Game.prototype.letAIplay = function(){
	if (this.l>=15){
		var really=confirm("Letting the AI play on large boards can take a long time, really continue?");
		if (!really){
			return 0;
		}
	}
	var col=this.col();
	var bests=-1000;
	var startscore=this.scoreDict()[col];
	var bestloc="0,0";
	var maxit=90;
	var nit=0;
	for (var loc in this.map){
		if (this.map[loc]==""){
			//console.log(this.score(this.map)[0])
			this.map[loc]=col;
			this.spreadInfluenceOne(loc,col);
			//console.log(2,this.score(this.map)[0])
			var dict=this.scoreDict();
			var s=dict[col];
			if (s<startscore+3){
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
			var scalefac=this.l*this.l*9;
			var inequality=lowest-highest;
			var equalizer=1;
			var scomb=Math.tanh(s/scalefac)+Math.tanh(equalizer*inequality/scalefac);
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
	if (bestloc=="0,0"){
		document.getElementById("game_pass_move").checked=true;
	}
	//if (bests>0){
		var l=this.core.keytoloc(bestloc);
		document.getElementById("x").value=l[0];
		document.getElementById("y").value=l[1];
		this.drawAll();
		this.drawer.circleAt(l[0],l[1],this.col());
	//} else {
	//	alert("The AI passes.");
	//}
};