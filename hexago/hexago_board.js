function Board(drawAreaID,l,ir,supersolidity){
	this.common=new Common(drawAreaID,l,ir,supersolidity);
	this.core=new Core();
	/*this.l=l;
	this.ir=ir || l;
	this.common.map=this.common.core.newBoard(l);
	this.obstructions={};
	this.drawer=new CanvasDrawer(drawAreaID,l);
	this.drawer.canvas.addEventListener("mousedown", this.clickEvent.bind(this), false);
	this.loadMoves();
	this.setScore();*/
}
/*
Board.prototype.drawAll=function(){
	this.drawer.grid();
	this.drawer.map({},this.obstructions);
	this.setScore();
	this.loadMoves();
	this.drawer.xylines();
	this.drawer.influence(this.common.maxinf);
};
Board.prototype.moves = function(col){
  var m=document.getElementById("board_moves").value.split('+');
  var mo=[];
  for (var i=0;i<m.length;i++){
    var move=m[i].split(':');
    if (move[1]!=="pass" && (!col || col===move[0])){
      mo.push(move);
    }
  }
  return mo;
};
Board.prototype.loadMoves = function(){
	var moves=this.moves();
	var lastmove=moves[moves.length-1];//.split(':');
	for (var m in this.common.map){
		this.common.map[m]="";
	}
	for (var move in moves){
		var ma=moves[move];//.split(':');
		if (ma[0]=="#909"){
			delete(this.common.map[ma[1]]);
			this.obstructions[ma[1]]="#909";
		} else if (this.common.map[ma[1]]=="") {
			this.common.map[ma[1]]=ma[0];
		}
	}
	this.drawer.map(this.common.map);
	this.drawer.circleKey(lastmove[1],"#000",this.drawer.d/6);
};
*/
Board.prototype.cols = function(){
  var cele=document.getElementById("board_cols")||document.getElementById("col");
	var c=cele.value;
	return c.split(',');
};
Board.prototype.col = function(){
	var c=this.cols();
	return c[0];//document.getElementById("col").value;
};
/*
Board.prototype.setScore=function(){
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
Board.prototype.clickEvent = function (e) {
	var mouseX = e.pageX;
	var mouseY = e.pageY;
	var localX = mouseX - this.drawer.canvasOriginX;
	var localY = mouseY - this.drawer.canvasOriginY;
	for (var key in this.common.map){
		var xy=key.split(',');
		var x=this.drawer.x0+parseInt(xy[0],10)*this.drawer.d+parseInt(xy[1],10)*this.drawer.yvec[0];
		var y=this.drawer.y0-parseInt(xy[1],10)*this.drawer.yvec[1];
		if (this.common.core.distance(localX,localY,x,y)<this.drawer.d/2 && document.getElementById("x")){
			document.getElementById("x").value=xy[0];
			document.getElementById("y").value=xy[1];
			this.drawAll();
			this.drawer.circle(x,y,this.col());
			break;
		}
	}
};*/

Board.prototype.submit = function(){
	var x = document.getElementById("x").value;
	var y = document.getElementById("y").value;
	if (this.common.map[[x,y]]){
		alert(x+", "+y+" is already occupied by "+this.common.map[[x,y]]);
		return 0;
	}
	var locstr=x+','+y;
	if (x==="0" && y==="0"){
	  locstr="pass";
	} else if (typeof(this.common.map[[x,y]])!=='undefined'){
		this.common.map[[x,y]]=this.col();
	}
	var cols=document.getElementById("board_cols").value.split(',');
	var c=cols.shift();
	document.getElementById("board_moves").value+='+'+c+':'+locstr;
	cols.push(c);
	document.getElementById("board_cols").value=cols.join();
	document.getElementById("col").value=cols[0];
	this.common.drawAll();
};
/*
Board.prototype.spreadInfluenceOne = function(move,col){
  if (move==="pass"){
    return 0;
  }
	var visited=[move];
	var fringe=[move];
	for (var i=0;i<this.ir;i++){
		if (i==0) {
			this.common.influence[move][col]+=1;
		} else {
			var nfringe=[];
			for (var k=0;k<fringe.length;k++){
				//if (this.common.influence[fringe[k]]) { 
				//	this.common.influence[fringe[k]][col]+=1/(i+1); 
				//} 
				if (i==this.common.influence_radius-1){ break; }
				//visited.push(fringe[k]);
				var adj=this.common.core.adjacent(this.common.core.keytoloc(fringe[k]));
				for (var j=0;j<adj.length;j++){
					var sadj=adj[j].toString();
					if (visited.indexOf(sadj)<0) {
						if (this.common.influence[sadj]) { this.common.influence[sadj][col]+=1/(i+1); }
						if (this.common.map[sadj] == col || this.common.map[sadj] == ""){
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
Board.prototype.spreadInfluenceAll = function(){
	this.common.influence=this.common.core.putboard(this.l,{},{"#f00":0,"#0f0":0,"#00f":0},2);
	var moves=document.getElementById("board_moves").value.split('+');
	for (var mi=1;mi<moves.length;mi++){
		var ma=moves[mi].split(':');
		var move=ma[1];
		var col=ma[0];
		this.common.spreadInfluenceOne(move,col);
	}
};
Board.prototype.scoreDict = function(){

	var influence=this.common.influence;
	var s={};
	var maxinf={};
	for (var l in influence){
		var high=0.01;
		var cols=[];
		for (var m in influence[l]){
			influence[l][m]=this.common.core.round1000(influence[l][m]);
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
		if (this.common.map[l] && cols.indexOf(this.common.map[l])<0){
			sadd=2.0;
		}
		for (var c in cols){
			s[cols[c]]?s[cols[c]]+=sadd/le:s[cols[c]]=sadd/le;
			s[cols[c]]=this.common.core.round1000(s[cols[c]]);
		}
		//if (l=="0,4") console.log(le, ": ", high, " sadd", sadd)
	}
	this.common.influence=influence;
	this.common.maxinf=maxinf;
	return s;//,influence,maxinf;
};
Board.prototype.countMoves = function(moves,col){
	var n=0;
	for (var mi in moves){
	  var move=moves[mi].split(':');
		if (move[0]===col && move[1]!=="pass"){
			n+=1;
		}
	}
	return n;
};
Board.prototype.score = function(){
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
		var im=this.common.core.indexOfMax(svals);
		svalsorted.push(svals[im]);
		scolsorted.push(scols[im]);
		svals[im]=-1;
	}
	return [svalsorted,scolsorted];
};
*/
Board.prototype.letAIplay = function(){
	if (this.l>=15){
		var really=confirm("Letting the AI play on large boards can take a long time, really continue?");
		if (!really){
			return 0;
		}
	}
	var col=this.col();
	//var l=this.common.core.AI(this.common.map,this.moves(),col);
	/*
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
  	  var adj=this.common.core.adjacent(this.common.core.keytoloc(locc[1]));
  	  for (var locai=0;locai<adj.length;locai++){
  	    var loc=adj[locai].toString();
  	    //console.log(loc);
  	 	  if (this.common.map[loc]==""){
    			//console.log(this.score(this.common.map)[0])
    			this.common.map[loc]=col;
    			this.spreadInfluenceOne(loc,col);
    			//console.log(2,this.score(this.common.map)[0])
    			var dict=this.scoreDict();
    			var s=dict[col];
    			if (s<startscore+1){
    				this.common.map[loc]="";
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
    			if (this.cols().length>2){
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
    			this.common.map[loc]="";
    			nit+=1;
    			if (nit>maxit){
    				break;
    			}
    			this.spreadInfluenceAll();
  	 	  }
	 	  }
		}
	}
	//if (bestloc=="0,0"){
	//	document.getElementById("Board_pass_move").checked=true;
	//}
	//if (bests>0){
	*/
	var cbestloc=this.common.AImove(col,this.cols().length);
	
		var l=this.common.core.keytoloc(cbestloc);
		document.getElementById("x").value=l[0];
		document.getElementById("y").value=l[1];
		this.common.drawAll();
		this.common.drawer.circleAt(l[0],l[1],this.col());
		this.submit();
	//} else {
	if (cbestloc==="0,0"){
		alert("The AI passes with "+col);
	}
};