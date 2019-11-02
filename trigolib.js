'use strict';

var Trigo = {}
	
//Triangle

Trigo.Triangle=function(x,y,player){
    this.x=x;
    this.y=y;
    if (player===undefined){
        player=0;
	}
    this.player=player;
    this.markedDead=false;
};
Trigo.Triangle.prototype.isPass=function(){
    if (this.x<0){
        return true;
    }
    return false;
};
Trigo.Triangle.prototype.alive=function(){
    return this.player>0 && !this.markedDead;
};
Trigo.Triangle.prototype.sameTenantAs=function(t){
    return this.player==t.player || ((this.markedDead||this.player==0)&&(t.markedDead||t.player==0));
};
Trigo.Triangle.prototype.equals=function(t){
    return this.x == t.x && this.y == t.y;
};

//TriangleGrid

Trigo.TriangleGrid=function(sideLength){
	this.sideLength=sideLength;
	this.triangles=[];
	this.setUpGrid();
};
Trigo.TriangleGrid.prototype.setUpGrid=function(){
	for (let yt = 0; yt < this.sideLength; yt++) {
		var v=[];
		for (let xt = 0; xt <= 2*this.sideLength-2*yt-2; xt++) {
			v.push(new Trigo.Triangle(xt,yt));
		}
		this.triangles.push(v);
	}
};
Trigo.TriangleGrid.prototype.get=function(x, y){
	return this.triangles[y][x];
};
Trigo.TriangleGrid.prototype.set=function(x,y,player){
	this.triangles[y][x].player=player;
};
Trigo.TriangleGrid.prototype.has=function(x,y){
	if (y===undefined) return this.has_tri(x);
	if (x<0 || y<0 || y>=this.triangles.length || x>=this.triangles[y].length){
		return false;
	}
	return true;
};
Trigo.TriangleGrid.prototype.has_tri=function(t){
	return this.has(t.x,t.y);
};
Trigo.TriangleGrid.prototype.nTriangles=function(){ //this should be sideLength^2
	var n=0;
	for(let yi=0; yi<this.triangles.length; yi++) {
		var yv=this.triangles[yi];
		for(let xt in yv) {
			n++;
		}
	}
	return n;
};
Trigo.TriangleGrid.prototype.adjacent=function(x,y){
	if (Array.isArray(x)){
		return this.adjacent_arr(x)
	}
	if (y===undefined) return this.adjacent_tri(x);
	return this.adjacent_tri(new Trigo.Triangle(x,y));
};
Trigo.TriangleGrid.prototype.adjacent_tri=function(triangle){
	if (Array.isArray(triangle)){
		return this.adjacent_arr(triangle)
	}
	if (!this.has(triangle)) return [];
	var adj=[];
	var leny=this.triangles.length;//this.sideLength;
	var lenx=this.triangles[triangle.y].length;
	if (triangle.x%2==1){
		if (triangle.x+1<lenx){
			adj.push(this.triangles[triangle.y][triangle.x+1]);
		}
		if (triangle.y+1<leny && triangle.x-1>=0){
			adj.push(this.triangles[triangle.y+1][triangle.x-1]);
		}
		if (triangle.x-1>=0){
			adj.push(this.triangles[triangle.y][triangle.x-1]);
		}
	} else {
		if (triangle.x+1<lenx){
			adj.push(this.triangles[triangle.y][triangle.x+1]);
		}
		if (triangle.x-1>=0){
			adj.push(this.triangles[triangle.y][triangle.x-1]);
		}
		if (triangle.y-1>=0 && triangle.x+1<lenx+2){
			adj.push(this.triangles[triangle.y-1][triangle.x+1]);
		}
	}
	return adj;
};
Trigo.TriangleGrid.prototype.adjacentInds=function(triangle){
	if (Array.isArray(triangle)){
		return this.adjacentInds_arr(triangle)
	}
	var adji=[];
	if (Math.abs(triangle.x%2)==1){
		adji.push(new Triangle(triangle.x+1,triangle.y));
		adji.push(new Triangle(triangle.x-1,triangle.y+1));
		adji.push(new Triangle(triangle.x-1,triangle.y));
	} else {
		adji.push(new Triangle(triangle.x+1,triangle.y));
		adji.push(new Triangle(triangle.x-1,triangle.y));
		adji.push(new Triangle(triangle.x+1,triangle.y-1));
	}
	return adji;
};
Trigo.TriangleGrid.prototype.adjacentInds_arr=function(group){
	var adjg=[];
	var ng=group.length;
	for (let n=0;n<ng;n++){
		var tri=group[n];
		var adj=this.adjacentInds(tri);
		var ladj=adj.length;
		for (let i=0;i<ladj;i++){
			var ttri=adj[i];
			var contains1=group.includes(ttri);
			var contains2=adjg.includes(ttri);
			if (!contains1 && !contains2){
				adjg.push(ttri);
			}
		}
	}
	return adjg;
};
Trigo.TriangleGrid.prototype.adjacentIndsSpread=function(triangle,spread){
	var adjis=[];
	var adji=this.adjacentInds(triangle);
	for (let sp=0;sp<spread;sp++){
		for (let ai=0;ai<adji.length;ai++){
			var a=adji[ai]
			if (!(a==triangle)){// && !adjis.includes(a)){
				adjis.push(a);
			}
		}
		if (sp<spread-1){
			adji=this.adjacentInds(adjis);
		}
	}
	return adjis;
};
Trigo.TriangleGrid.prototype.adjacent_arr=function(group){
	var adjg=[];
	var ng=group.length;
	for (let n=0;n<ng;n++){
		var tri=group[n];
		var adj=this.adjacent_tri(tri);
		var ladj=adj.length;
		for (let i=0;i<ladj;i++){
			var ttri=adj[i];
			var contains1=group.includes(ttri);
			var contains2=adjg.includes(ttri);
			if (!contains1 && !contains2){
				adjg.push(ttri);
			}
		}
	}
	return adjg;
};
Trigo.TriangleGrid.prototype.adjacentPieces=function(tri){
	if (Array.isArray(tri)){
		return this.adjacentPieces_arr(tri)
	}
	var adj=this.adjacent(tri);
	var adjp=[];
	var ladj=adj.length;
	for (let i=0;i<ladj;i++){
		var ttri=adj[i];
		if (ttri.sameTenantAs(tri)){
			adjp.push(ttri);
		}
	}
	return adjp;
};
Trigo.TriangleGrid.prototype.adjacentPieces_arr=function(group){
	var adj=this.adjacent_arr(group);
	var adjp=[];
	var g0=group[0];
	var ladj=adj.length;
	for (let i=0;i<ladj;i++){
		var ttri=adj[i];
		if (ttri.sameTenantAs(g0)){
			adjp.push(ttri);
		}
	}
	return adjp;
};
Trigo.TriangleGrid.prototype.getConnected=function(tri){
	var group=[];
	group.push(tri);
	var recentlyAdded=this.adjacentPieces(tri);
	while (!recentlyAdded.length==0){
		var rai=recentlyAdded.length;
		for (let i=0;i<rai;i++){
			if (!group.includes(recentlyAdded[i])){
				group.push(recentlyAdded[i]); //better to make Triangle var to avoid multiple indexing?
			}
		}
		recentlyAdded=this.adjacentPieces(group);
	}
	return group;
};
Trigo.TriangleGrid.prototype.getConnectedSpace=function(cluster){
	var space=[];
	var adj=this.adjacent_arr(cluster);
	for (let ai=0;ai<adj.length;ai++){
		var a=adj[ai];
		if (a.player==0 && !space.includes(a)){
			var ls=this.getConnected(a);
			for (let li=0;li<ls.length;li++){
				space.push(ls[li]);
			}
		}
	}
	return space;
};
Trigo.TriangleGrid.prototype.getGroup=function(x,y){
	if (y===undefined) return this.getGroup_tri(x);
	return this.getGroup_tri(this.get(x,y));
};
Trigo.TriangleGrid.prototype.getGroup_tri=function(tri){
	if (tri.player==0){
		var v=[];
		return v;
	}
	return this.getConnected(tri);
};
Trigo.TriangleGrid.prototype.getCluster_arr=function(group){
	var cluster=[];
	if (group.length==0){
		return cluster;
	}
	var checked=[];
	var player=group[0].player;
	for (let gi=0;gi<group.length;gi++){
		cluster.push(group[gi]);
		checked.push(group[gi]);
	}
	var adj=this.adjacent(group);
	var adjempty=[];
	for (let ai=0;ai<adj.length;ai++){
		if (adj[ai].player==0){
			adjempty.push(adj[ai]);
		}
	}
	while (!adjempty.length==0){
		for (let aei=0;aei<adjempty.length;aei++){
			if (!checked.includes(adjempty[aei])){
				checked.push(adjempty[aei]);
				var c=this.getConnected(adjempty[aei]);
				for (let ci=0;ci<c.length;ci++){
					if (!checked.includes(c[ci])){
						checked.push(c[ci]);
					}
				}
				var adjc=this.adjacent(c);
				for (let adjci=0;adjci<adjc.length;adjci++){
					var tri=adjc[adjci];
					var trig=this.getGroup(tri);
					for (let ti=0;ti<trig.length;ti++){
						var ttri=trig[ti];
						if (!checked.includes(ttri)){
							checked.push(ttri);
							if (ttri.player==player){
								cluster.push(ttri);
							}
						}
					}
				}
			}
		}
		var adjcluster=this.adjacent(cluster);
		adjempty=[];
		for (let i=0;i<adjcluster.length;i++){
			var t=adjcluster[i];
			if (!checked.includes(t) && t.player==0){
				adjempty.push(t);
			}
		}
	}
	return cluster;
};
Trigo.TriangleGrid.prototype.getCluster=function(x,y){
	if (Array.isArray(x)){
		return this.getCluster_arr(x)
	}
	if (y===undefined) return this.getCluster_tri(x);
	if (!this.has(x,y)) return [];										//added check
	return this.getCluster(this.get(x,y));
};
Trigo.TriangleGrid.prototype.getCluster_tri=function(tri){
	var g=this.getGroup(tri);
	return this.getCluster(g);
};
Trigo.TriangleGrid.prototype.liberties_arr=function(group){
	var adj=this.adjacent(group);
	var lib=0;
	for (let i=0;i<adj.length;i++){
		if (!adj[i].alive()){
			lib+=1;
		}
	}
	return lib;
};
Trigo.TriangleGrid.prototype.libertiesInds=function(group){				//new
	var adj=this.adjacent(group);
	var libinds=[];
	for (let i=0;i<adj.length;i++){
		if (!adj[i].alive()){
			libinds.push(adj[i]);
		}
	}
	return libinds;
};
Trigo.TriangleGrid.prototype.liberties=function(tri){
	if (Array.isArray(tri)){
		return this.liberties_arr(tri)
	}
	var group=this.getGroup(tri);
	return this.liberties_arr(group);
};
Trigo.TriangleGrid.prototype.removeGroup=function(group){
	for (let n=0;n<group.length;n++){
		var gt=group[n];
		this.set(gt.x,gt.y,0);
	}
};
Trigo.TriangleGrid.prototype.historyString=function(){
	var h="";
	for (let y=0;y<this.triangles.length;y++){
		for (let x=0;x<this.triangles[y].length;x++){
			var tri=this.triangles[y][x];
			h=h+tri.x+","+tri.y+":"+tri.player+";";
		}
	}
	return h;
};

//Board

Trigo.Board=function(sideLength){
	this.tg=new Trigo.TriangleGrid(sideLength);
	this.history=[];
	this.moves=[];
	this.player=1;
	this.stones=[0,0];
	this.captures=[0,0];
	this.territory=[0,0]; //call score() to update
	
	this.influence=[];													//new
	//this.initInfluence();
};
Trigo.Board.prototype.copy=function(){
	var bc=new Trigo.Board(this.tg.sideLength);
	for (let i=0;i<this.moves.length;i++){
		var m=this.moves[i];
		var nt=new Trigo.Triangle(m.x,m.y,m.player);
		if (!m.isPass() && this.tg.get(m.x,m.y).player==m.player){
			bc.tg.triangles[nt.y][nt.x]=nt;
		}
		bc.moves.push(new Trigo.Triangle(nt.x,nt.y,nt.player));
	}
	//bc.placeMoves(true);												//setting this to false causes too many recursions... Too many recursions also if true, place moves calls copy which calls place moves... Maybe the speedup made it too many function calls per second
	/*this.tg.set(x,y,p);		this is how placeMove links the triangles, caused quite a hassle when the triangle in moves wasn't equal... 
	var tri=this.tg.get(x,y);	shouldn't be this way though, overrides player info in moves
	this.moves.push(tri);*/
	/*for (let yi=0;yi<this.tg.triangles.length;yi++){		no longer needed, yay unexpected benefit
		for (let xi=0;xi<this.tg.triangles[yi].length;xi++){	or is this better?
			var ot=this.tg.triangles[yi][xi];
			bc.tg.triangles[yi][xi].player=ot.player;
			bc.tg.triangles[yi][xi].markedDead=ot.markedDead;
		}
	}*/
	for (let hi=0;hi<this.history.length;hi++){
		bc.history.push(this.history[hi]);
	}
	bc.player=this.player;
	bc.stones[0]=this.stones[0];
	bc.stones[1]=this.stones[1];
	bc.captures[0]=this.captures[0];
	bc.captures[1]=this.captures[1];
	return bc;
};
Trigo.Board.prototype.reset=function(){
	this.tg=new Trigo.TriangleGrid(this.tg.sideLength);					//this may be called unnecessarily in placeMoves, add boolean reset? Done. See problem above... Too many recursions why?
	this.history=[];
	this.moves=[];
	this.player=1;
	this.stones=[0,0];
	this.captures=[0,0];
	this.territory=[0,0];
	this.influence=[];
};
Trigo.Board.prototype.removeCapturedBy=function(tri){
	//Triangle tri=tg.get(x,y);
	var adj=this.tg.adjacent(tri);
	for (let a=0;a<adj.length;a++){
		var ap=adj[a].player;
		if (adj[a].alive()&&ap!=tri.player){
			var g=this.tg.getGroup(adj[a]);
			if (this.tg.liberties(g)==0){
				this.tg.removeGroup(g);
				this.stones[ap-1]-=g.length;
				this.captures[tri.player-1]+=g.length;
			}
		}
	}
};
Trigo.Board.prototype.invalidMoveType=function(x,y,player){
	if (y===undefined) return this.invalidMoveType_tri(x);
	var t=new Trigo.Triangle(x,y,player);
	return this.invalidMoveType(t);
};
Trigo.Board.prototype.invalidMoveType_tri=function(t){
	if (!this.tg.has(t.x,t.y)){
		return 4;
	}
	if (this.tg.get(t.x,t.y).player!=0){
		return 1;
	}
	//Board bc=Board(*this);
	var bc=this.copy(); //JSON.parse(JSON.stringify(this)); //JSON misses functions etc
	bc.tg.set(t.x,t.y,t.player);
	var tri=bc.tg.get(t.x,t.y);
	//bc.removeCapturedBy(tri);
	var adj=bc.tg.adjacent(tri);
	for (let a=0;a<adj.length;a++){
			if (adj[a].alive()&&adj[a].player!=tri.player){
			var g=bc.tg.getGroup(adj[a]);
			if (bc.tg.liberties(g)==0){
				bc.tg.removeGroup(g);
			}
		}
	}
	var group=bc.tg.getGroup(tri);
	if (bc.tg.liberties(group)==0){
		bc=null;
		return 2;
	}
	var h=bc.tg.historyString();
	if (this.history.includes(h)){
		bc=null;
		return 3;
	}
	bc=null;
	return 0;
};
Trigo.Board.prototype.isValidMove=function(x,y,player){
	if (y===undefined) return this.isValidMove_tri(x);
	var t=new Trigo.Triangle(x,y,player);
	return this.isValidMove_tri(t);
};
Trigo.Board.prototype.isValidMove_tri=function(t){
	if (this.invalidMoveType_tri(t)>0){
		return false;
	}
	return true;
};
/*Trigo.Board.prototype.otherPlayer=function(){
	if (this.player==1){
		return 2;
	} else {
		return 1;
	}
};*/
Trigo.Board.prototype.otherPlayer=function(p){
	if (p===undefined) p=this.player;
	if (p==1){
		return 2;
	} else {
		return 1;
	}
};
Trigo.Board.prototype.switchPlayer=function(){
	this.player=this.otherPlayer();
};
Trigo.Board.prototype.placeMove=function(x,y){							//add _tri version? Ambiguous if we want board.player ot tri.player... 
	var p=this.player;
	var xt=x;
	var yt=y;
	if (y===undefined){
		xt=x.x;
		yt=x.y;
		if (x.player>0) p=x.player;
	}
	var b=this.placeCustomMove(xt,yt,p);
	if (b) {
		this.switchPlayer();
	}
	return b;
};
Trigo.Board.prototype.placeCustomMove=function(x,y,p){
	if (x<0){ //pass
		this.moves.push(new Trigo.Triangle(x,y,p));
		return true;
	}
	if (!this.isValidMove(x,y,p)){
		return false;
	}
	this.tg.set(x,y,p);
	var tri=this.tg.get(x,y);
	this.removeCapturedBy(tri);
	this.history.push(this.tg.historyString());
	this.moves.push(new Trigo.Triangle(tri.x,tri.y,tri.player));
	this.stones[p-1]+=1;
	return true;
};
Trigo.Board.prototype.placeMoveCountCaptures=function(x,y){
	var s=this.stones[this.otherPlayer()-1];
	var placed=this.placeMove(x,y);
	if (!placed) return -1;
	var captures=s-this.stones[this.player-1];
	return captures;
};
Trigo.Board.prototype.state=function(){
	var s=this.tg.sideLength+";";
	for (let movei=0;movei<this.moves.length;movei++){
		var move=this.moves[movei];
		s+=move.x+","+move.y+":"+move.player+";";						//changed , to :
	}
	return s;
};
Trigo.Board.prototype.placeMoves=function(reset){
	if (reset===undefined) reset=true;									//doesn't seem necessary?
	var m=this.moves;
	//var p=this.player; //why unused? Better to have the player default to next after last move
	if (reset) this.reset();											//add conditional reset? If tg doesn't need to be reinitialized, when board was just created. Yea
	for (let movei=0;movei<m.length;movei++){
		var move=m[movei];
		this.placeMove(new Trigo.Triangle(move.x,move.y,move.player));	//why isn't it possible to undo after placeCustomMove here?
		//this.placeCustomMove(move.x,move.y,move.player);				//because the triangle in moves is linked to the trianglegrid, player info is overwritten... In C++ this is not a problem because the == operator is overloaded, array.includes is dependant on linking
	}
	if (this.moves.length>0){
		this.player=this.otherPlayer(this.moves[this.moves.length-1].player);
	}
};
Trigo.Board.prototype.undo=function(){
	if (!this.moves.length==0){
		if (!this.moves[this.moves.length-1].isPass()){
			this.history.pop();
		}
		this.moves.pop();
		this.switchPlayer();
		this.placeMoves();
	}
};
Trigo.Board.prototype.pass=function(){
	this.moves.push(new Trigo.Triangle(-1,-1,this.player));
	this.switchPlayer();
};

Trigo.Board.prototype.score=function(){
	if (this.moves.length==0) return;
	var checked=[];
	var scores=[0,0];
	for (let y=0;y<this.tg.triangles.length;y++){
		for (let x=0;x<this.tg.triangles[y].length;x++){
			var tri=this.tg.triangles[y][x];
			if ((tri.player==0||tri.markedDead) && !checked.includes(tri)){
				var c=this.tg.getConnected(tri);
				for (let ci=0;ci<c.length;ci++){
					checked.push(c[ci]);
				}
				var adj=this.tg.adjacent(c);
				var p=adj[0].player;
				if (!adj.length==0 && p>0){
					var oneplayer=true;
					for (let adji=0;adji<adj.length;adji++){
						if (adj[adji].player!=p){
							oneplayer=false;
							break;
						}
					}
					if (oneplayer){
						scores[p-1]+=c.length;
					}

				}
			}
		}
	}
	this.territory[0]=scores[0];
	this.territory[1]=scores[1];
};
Trigo.Board.prototype.markDeadStones=function(x,y){
	if (Array.isArray(x)){
		return this.markDeadStones_arr(x)
	}
	if (y===undefined) return this.markDeadStones_tri(x);
	this.markDeadStones(this.tg.get(x,y));
};
Trigo.Board.prototype.markDeadStones_tri=function(tri){	
	var c=this.tg.getCluster(tri);
	this.markDeadStones(c);
};
Trigo.Board.prototype.markDeadStones_arr=function(c){
	var tri=c[0];
	if (c.length==0) return;
	var flipto=!(tri.markedDead);
	var a=-1;
	if (flipto){
		a=1;
	}
	for (let i=0;i<c.length;i++){
		var t=c[i];
		if (t.player==tri.player && t.markedDead!=flipto){
			this.tg.triangles[t.y][t.x].markedDead=flipto;
			this.stones[t.player-1]-=a;
			this.captures[this.otherPlayer(t.player)-1]+=a;
		}
	}
};
/*
Trigo.Board.prototype.validMovesInSpace=function(space){				//added. Sloooow...
	var vm=0;
	for (let si=0;si<space.length;si++){
		var t=space[si];
		if (this.isValidMove(t.x,t.y,1) || this.isValidMove(t.x,t.y,2)) vm+=1;
	}
	return vm;
};
Trigo.Board.prototype.twoSuicideMovesInSpace=function(space,player){	//added, must connect all danglers first
	var sm=0;
	for (let si=0;si<space.length;si++){
		var t=space[si];
		if (this.invalidMoveType(t.x,t.y,player)==2) sm+=1;
		if (sm>=2) return true;
	}
	return false;
};*/
Trigo.Board.prototype.surrounds=function(cluster){						//efficient
	var checked=[];
	var surrounded=[];
	//for (let y=0;y<this.tg.triangles.length;y++){
	//	for (let x=0;x<this.tg.triangles[y].length;x++){
	var adjc=this.tg.adjacent(cluster);
	for (let adjci=0;adjci<adjc.length;adjci++){
		var tri=adjc[adjci];
		if ((tri.player==0||tri.markedDead) && !checked.includes(tri)){
			var c=this.tg.getConnected(tri);
			for (let ci=0;ci<c.length;ci++){
				checked.push(c[ci]);
			}
			var adj=this.tg.adjacent(c);
			var p=adj[0].player;
			if (!adj.length==0 && p>0){
				var oneplayer=true;
				for (let adji=0;adji<adj.length;adji++){
					if (adj[adji].player!=p){
						oneplayer=false;
						break;
					}
				}
				if (oneplayer){
					for (let ci=0;ci<c.length;ci++){
						surrounded.push(c[ci]);
					}
				}
			}
		}
	}
	return surrounded;
};
Trigo.Board.prototype.tryCaptureCluster=function(cluster,maxit){
	if (cluster.length==0) return false;								//added checks
	var surrounded=this.surrounds(cluster);
	if (surrounded.length>5) return false;
	if (maxit===undefined) maxit=10;
	var space=this.tg.getConnectedSpace(cluster);
	if (space.length>this.tg.sideLength*this.tg.sideLength/5) return false;
	var c0=cluster[0];
	//connect danglers
	//if (this.twoSuicideMovesInSpace(space,this.otherPlayer(c0.player))) return false;
	var totalstones=this.stones[c0.player-1];
	var clusterstones=cluster.length;
	var stonelimit=totalstones-clusterstones*0.7;
	//srand(time(NULL));
	var nwin=0;
	var stonechange=0;
	for (let i=0;i<maxit;i++){
		var stonescaptured=0;
		var bc=this.copy();
		var cc=bc.tg.getCluster(c0.x,c0.y);
		space=bc.tg.getConnectedSpace(cc);								//changed this to bc
		var ss=space.length;
		for (let si=0;si<ss*3;si++){
			if (si>0 && stonechange!=0){
				if (stonescaptured>clusterstones){
					nwin++;
					break;
				}
				for (let ci=0;ci<cc.length;ci++){						//update space, only if captures happened
					if (cc[ci].player==c0.player){
						cc=bc.tg.getCluster(cc[ci].x,cc[ci].y);
						space=bc.tg.getConnectedSpace(cc);
						break;
					}
				}
			}
			stonechange=0; //this didn't change much... Better!
			//if (bc.validMovesInSpace(space)==0) break;				//is there a better way? This was very slow
			var r=Math.floor(Math.random()*space.length);
			var rt=space[r];
			var placedmove;
			var adjrt=bc.tg.adjacent(rt);
			var adjacentallsame=true;
			for (let ai=0;ai<adjrt.length;ai++){
				var a=adjrt[ai];
				if (a.player!=bc.player){
					adjacentallsame=false;
				}
			}
			if (adjacentallsame){
				placedmove=false;
			} else {
				var currentstones=bc.stones[bc.otherPlayer()-1];				//added
				placedmove=bc.placeMove(rt.x,rt.y);
				if (placedmove){
					stonechange=currentstones-bc.stones[bc.player-1];
					if (stonechange>0 && bc.player==c0.player){
						stonescaptured+=stonechange;					//placeMoveCountCaptures -> -1=didn't place
					}
				}
			}
			if (placedmove){
				if (bc.stones[c0.player-1]<stonelimit){
					nwin++;
					break;
				}
				//space.splice(r,1);
				//if (space.length==0) break;							//modified
			} else {
				bc.switchPlayer();
			}
		}
		//console.log(nwin/(i+1));
	}
	if (nwin/maxit>0.5) return true;
	return false;
};
Trigo.Board.prototype.autoMarkDeadStones=function(){
	var tried=[];
	var tobemarked=[];
	//for (let mi=0;mi<this.moves.length;mi++){							//changed, iterating over moves caused linking troubles and in endgame number of moves is comparable to number of triangles
	//	var m=this.moves[mi];
	//	if (!tried.includes(m) && !m.isPass()){
	for (let yi=0;yi<this.tg.triangles.length;yi++){
		for (let xi=0;xi<this.tg.triangles[yi].length;xi++){
			var t=this.tg.get(xi,yi);
			if (t.alive() && !tried.includes(t)){
				var c=this.tg.getCluster(t);
				var success=this.tryCaptureCluster(c);
				if (success){
					tobemarked.push(c);
				}
				for (let cti=0;cti<c.length;cti++){
					var ct=c[cti];
					tried.push(ct);
				}
			}
		}
	}
	for (let clusteri=0;clusteri<tobemarked.length;clusteri++){
		var cluster=tobemarked[clusteri];
		this.markDeadStones(cluster);
	}
};

//New functions

Trigo.InfluenceTriangle=function(x,y){
	this.x=x;	//remove indices?
	this.y=y;
	//this.border=0;
	this.green=0;
	this.blue=0;
};
Trigo.Board.prototype.initInfluence=function(){
	for (let y=0;y<this.tg.triangles.length;y++){
		var v=[];
		for (let x=0;x<this.tg.triangles[y].length;x++){
			var tri=this.tg.triangles[y][x];
			v.push(new Trigo.InfluenceTriangle(tri.x,tri.y));
		}
		this.influence.push(v);
	}
};
Trigo.Board.prototype.resetInfluence=function(){
	for (let y=0;y<this.influence.length;y++){
		for (let x=0;x<this.influence[y].length;x++){
			this.influence[y][x].green=0;
			this.influence[y][x].blue=0;
		}
	}
};
Trigo.Board.prototype.normalizeInfluence=function(){
	for (let y=0;y<this.influence.length;y++){
		for (let x=0;x<this.influence[y].length;x++){
			this.influence[y][x].green=Math.tanh(this.influence[y][x].green);
			this.influence[y][x].blue=Math.tanh(this.influence[y][x].blue);
		}
	}
};
Trigo.Board.prototype.spreadInfluence_tri=function(tri,range,tunneling){//something is wrong with tunneling
	if (tri.isPass()) return;
	var visited=[];
	var fringe=[[tri,false]]; //bool: tunnelled
	var player=tri.player;
	for (let r=0;r<=range;r++){
		var newfringe=[];
		for (let fi=0;fi<fringe.length;fi++){
			var t=fringe[fi][0];
			var tunnelled=fringe[fi][1];
			var ra=1;
			if (tunnelled) ra+=1;
			if (player==1){
				this.influence[t.y][t.x].green+=1/(r+ra);
			} else if (player==2){
				this.influence[t.y][t.x].blue+=1/(r+ra);
			}
			var adj=this.tg.adjacent(t);
			for (let adji=0;adji<adj.length;adji++){
				var at=adj[adji];
				if (!visited.includes(at)){
					if (at.alive() && at.player!=player){
						if (tunneling && !tunnelled){
							tunnelled=true;
							newfringe.push([at,tunnelled]);
						}
					} else {
						newfringe.push([at,tunnelled]);
					}
				}
			}
			visited.push(t);
		}
		fringe=newfringe;
	}
};
Trigo.Board.prototype.spreadInfluence=function(range,tunneling){
	if (this.influence.length==0) this.initInfluence();
	//for (let mi=0;mi<this.moves.length;mi++){							//this is problematic, we need the move to be linked to tg but then player info is overwritten...
	//	var t=this.tg.get(this.moves[mi].x,this.moves[mi].y);			//also this will spread double influence from recaptured moves...
	//	if (this.moves[mi].alive()){
	for (let y=0;y<this.tg.triangles.length;y++){
		for (let x=0;x<this.tg.triangles[y].length;x++){
			var t=this.tg.triangles[y][x];
			if (t.alive()){
				this.spreadInfluence_tri(t,range,tunneling);
			}
		}
	}
	this.normalizeInfluence();
};
Trigo.Board.prototype.estimateScore=function(reset){
	//todo: symbiosis mode, more equal points=higher score
	if (reset===undefined) reset=true;
	var green=0;
	var blue=0; //komi?
	if (reset){
		this.resetInfluence();
		this.spreadInfluence(5,true);
	}
	for (let y=0;y<this.influence.length;y++){
		for (let x=0;x<this.influence[y].length;x++){
			var it=this.influence[y][x];
			var infl=it.green-it.blue;
			if (infl>0){
				green++;
			} else if (infl<0){
				blue++;
			}
		}
	}
	return [green,blue];
};
Trigo.Board.prototype.findEdge=function(player){
	var edge=[];
	for (let y=0;y<this.influence.length;y++){
		for (let x=0;x<this.influence[y].length;x++){
			if (this.tg.get(x,y).player!=0) continue;					//no support for marked dead stones!
			var it=this.influence[y][x];
			if (player==1){
				var infl=it.green-it.blue;
				if (infl<0.5 && infl>0 && it.green>0) edge.push(new Trigo.Triangle(x,y,player));
			} else if (player==2){
				var infl=it.blue-it.green;
				if (infl<0.5 && infl>0 && it.blue>0) edge.push(new Trigo.Triangle(x,y,player));
			}
		}
	}
	return edge;
};
Trigo.Board.prototype.findCapturable=function(){
	var checked=[];
	var capturing=[];
	for (let mi=0;mi<this.moves.length;mi++){
		var t=this.tg.get(this.moves[mi].x,this.moves[mi].y);
		if (!checked.includes(t)){
			var group=this.tg.getGroup(t);
			var libinds=this.tg.libertiesInds(group);
			if (libinds.length==1){
				capturing.push(libinds[0]);
			}
			for (let gi=0;gi<group.length;gi++){
				checked.push(group[gi]);
			}
		}
	}
	return capturing;
};
Trigo.Board.prototype.canBeCaptured=function(x,y){						//this will be useful
	//must take KOs etc into account. Why is it called 4 times? Fixed, another linking problem
	var bc=this.copy();
	var captures=bc.placeMoveCountCaptures(x,y);
	if (captures<0) return true; //suicide/invalid
	if (captures<1 && bc.tg.liberties_arr(bc.tg.getGroup(x,y))==1) return true;
	return false; //add code for ladders/nets
};
function indexOfMax(arr) {												//util
    if (arr.length === 0) {
        return -1;
    }
    var max = arr[0];
    var maxIndex = 0;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }
    return maxIndex; //get all inds, randomize pick
};
Trigo.Board.prototype.placeSmartMove=function(reset){
	if (this.moves.length<2){
		for (let i=0;i<30;i++){
			var ry=Math.floor(Math.random()*(this.tg.sideLength-3))+1;
			var xmax=this.tg.triangles[ry].length;
			var rx=Math.floor(Math.random()*(xmax-4))+2;
			if (this.placeMove(rx,ry)) return;
		}
	}
	if (reset===undefined) reset=true;	//resets anyhow in estimatescore
	if (reset){
		this.resetInfluence();
		this.spreadInfluence(3,true);
	}
	var edge=this.findEdge(this.player);
	var capturing=this.findCapturable();
	var moves2consider0=edge.concat(capturing);
	var moves2consider=[];
	for (let m2c0i=0;m2c0i<moves2consider0.length;m2c0i++){
		var m=moves2consider0[m2c0i];
		if (!this.canBeCaptured(m.x,m.y)){
			moves2consider.push(m);
		}
	}
	var se=this.estimateScore()[this.player-1];
	var diffs=[];
	var bc=this.copy();
	for (let m2ci=0;m2ci<moves2consider.length;m2ci++){
		if (m2ci>0) bc.undo();
		var placedmove=bc.placeMove(moves2consider[m2ci]);
		if (!placedmove){
			diffs.push(-1)
			bc.placeMove(-1,-1);
		} else {
			diffs.push(bc.estimateScore()[this.player-1]-se);
		}
	}
	var mi=indexOfMax(diffs);
	if (mi==-1 || diffs[mi]<0){ 
		this.placeMove(-1,-1);
	} else {
		this.placeMove(moves2consider[mi]);
	}
};
