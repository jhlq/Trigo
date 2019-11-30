//'use strict'; //didn't play well with node...

var Trigo = {};
	
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
Trigo.Triangle.prototype.sameTenantAs=function(t){ //rewrite with ifs?	Fixed bug. Propagated to cpp
    return (this.player==t.player&&!this.markedDead&&!t.markedDead) || ((this.markedDead||this.player==0)&&(t.markedDead||t.player==0));
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
	if (this.triangles.length!=0) this.triangles=[];					//added check. Propagated
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
	if (t===undefined) return false;
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
		return this.adjacent_arr(x);
	}
	if (y===undefined) return this.adjacent_tri(x);
	return this.adjacent_tri(this.get(x,y));
};
Trigo.TriangleGrid.prototype.adjacent_tri=function(triangle){
	if (Array.isArray(triangle)){
		return this.adjacent_arr(triangle);
	}
	if (!this.has(triangle)) return [];
	var adj=[];
	var leny=this.triangles.length;//this.sideLength; //faster but... is there a downside?
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
Trigo.TriangleGrid.prototype.adjacentInds=function(triangle){			//supports negative indices
	if (Array.isArray(triangle)){
		return this.adjacentInds_arr(triangle);
	}
	var adji=[];
	if (Math.abs(triangle.x%2)==1){
		adji.push(new Trigo.Triangle(triangle.x+1,triangle.y));				//this should maybe return tuples
		adji.push(new Trigo.Triangle(triangle.x-1,triangle.y+1));
		adji.push(new Trigo.Triangle(triangle.x-1,triangle.y));
	} else {
		adji.push(new Trigo.Triangle(triangle.x+1,triangle.y));
		adji.push(new Trigo.Triangle(triangle.x-1,triangle.y));
		adji.push(new Trigo.Triangle(triangle.x+1,triangle.y-1));
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
			var a=adji[ai];
			if (!(a==triangle)){
				adjis.push(a);
			}
		}
		if (sp<spread-1){
			adji=this.adjacentInds(adjis);
		}
	}
	return adjis;
};
Trigo.TriangleGrid.prototype.adjacentPieces=function(tri){
	if (Array.isArray(tri)){
		return this.adjacentPieces_arr(tri);
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
	var recentlyAdded=this.adjacentPieces(tri);	//why is this used also for empty space? Good question...
	while (!(recentlyAdded.length==0)){
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
	while (!(adjempty.length==0)){
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
		return this.getCluster_arr(x);
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
		return this.liberties_arr(tri);
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
	this.komi=7;
	this.ruleset="hybrid" //supports "japanese" and "chinese"
};
Trigo.Board.prototype.copy=function(){
	var bc=new Trigo.Board(this.tg.sideLength);
	for (let i=0;i<this.moves.length;i++){
		var m=this.moves[i];
		var nt=new Trigo.Triangle(m.x,m.y,m.player);
		if (!m.isPass() && this.tg.get(m.x,m.y).player==m.player){
			bc.tg.triangles[nt.y][nt.x]=nt;
			bc.tg.triangles[nt.y][nt.x].markedDead=this.tg.triangles[nt.y][nt.x].markedDead;
		}
		bc.moves.push(new Trigo.Triangle(nt.x,nt.y,nt.player));
	}
	for (let hi=0;hi<this.history.length;hi++){
		bc.history.push(this.history[hi]);
	}
	bc.player=this.player;
	bc.stones[0]=this.stones[0];
	bc.stones[1]=this.stones[1];
	bc.captures[0]=this.captures[0];
	bc.captures[1]=this.captures[1];
	bc.komi=this.komi;
	return bc;
};
Trigo.Board.prototype.reset=function(){
	this.tg.setUpGrid();
	this.history=[];
	this.moves=[];
	this.player=1;
	this.stones=[0,0];
	this.captures=[0,0];
	this.territory=[0,0];
	this.influence=[];
};
Trigo.Board.prototype.removeCapturedBy=function(tri){
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
Trigo.Board.prototype.invalidMoveType=function(x,y,player){				//rewrite to avoid Triangle conversion?
	if (y===undefined) return this.invalidMoveType_tri(x);
	var t=new Trigo.Triangle(x,y,player);
	return this.invalidMoveType_tri(t);
};
Trigo.Board.prototype.invalidMoveType_tri=function(t){
	if (!this.tg.has(t.x,t.y)){
		return 4;
	}
	if (this.tg.get(t.x,t.y).player!=0){
		return 1;
	}
	var bc=this.copy();
	bc.tg.set(t.x,t.y,t.player);
	var tri=bc.tg.get(t.x,t.y);
	bc.removeCapturedBy(tri);
	var group=bc.tg.getGroup(tri);
	if (bc.tg.liberties(group)==0){
		bc=null; //not necessary?
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
Trigo.Board.prototype.placeMove=function(x,y){							//add _tri version? Ambiguous if we want board.player or tri.player... 
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
	if (reset===undefined) reset=true;									//doesn't seem necessary? Why not?
	var m=this.moves;
	//var p=this.player; //why unused? Better to have the player default to next after last move
	if (reset) this.reset();											//add conditional reset? If tg doesn't need to be reinitialized, when board was just created. Yea
	for (let movei=0;movei<m.length;movei++){
		var move=m[movei];
		//this.placeMove(new Trigo.Triangle(move.x,move.y,move.player));	//why isn't it possible to undo after placeCustomMove here?
		this.placeCustomMove(move.x,move.y,move.player);				//because the triangle in moves is linked to the trianglegrid, player info is overwritten... In C++ this is not a problem because the == operator is overloaded, array.includes is dependant on linking
	}
	if (this.moves.length>0){
		this.player=this.otherPlayer(this.moves[this.moves.length-1].player);
	}
};
Trigo.Board.prototype.undo=function(){
	if (!(this.moves.length==0)){
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
	if (this.moves.length==0) return [0,this.komi];
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
				if (!(adj.length==0) && p>0){
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
	if (this.ruleset=="hybrid" || this.ruleset=="chinese"){
		scores[0]+=this.stones[0];
		scores[1]+=this.stones[1];
	}
	if (this.ruleset=="hybrid" || this.ruleset=="japanese"){
		scores[0]+=this.captures[0];
		scores[1]+=this.captures[1];
	}
	scores[1]+=this.komi;
	return scores;
};
Trigo.Board.prototype.markDeadStones=function(x,y){
	if (Array.isArray(x)){
		return this.markDeadStones_arr(x);
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
Trigo.Board.prototype.unmarkDeadStones=function(){
	for (let yi=0;yi<this.tg.triangles.length;yi++){
		for (let xi=0;xi<this.tg.triangles[yi].length;xi++){
			this.tg.triangles[yi][xi].markedDead=false;
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
			if (!(adj.length==0) && p>0){
				var oneplayer=true;
				for (let adji=0;adji<adj.length;adji++){
					if (adj[adji].player!=p){
						oneplayer=false;
						break;
					}
				}
				if (oneplayer){
					for (let ci2=0;ci2<c.length;ci2++){
						surrounded.push(c[ci2]);
					}
				}
			}
		}
	}
	return surrounded;
};
Trigo.Board.prototype.tryCaptureCluster=function(cluster,maxit){ //how to connect danglers? AI.markDeadByPlaying
	if (cluster.length==0) return false;								//added checks
	var surrounded=this.surrounds(cluster);
	if (surrounded.length>5) return false;
	if (maxit===undefined) maxit=10;
	var space=this.tg.getConnectedSpace(cluster);
	if (space.length>this.tg.sideLength*this.tg.sideLength/5) return false;
	var c0=cluster[0];
	/*if (c0.x==14&&c0.y==0){
		var verb=true;
		var s="";
	}*/
	//connect danglers
	//if (this.twoSuicideMovesInSpace(space,this.otherPlayer(c0.player))) return false;
	var totalstones=this.stones[c0.player-1];
	//if (verb) console.log(totalstones);
	var clusterstones=cluster.length;
	var stonelimit=totalstones-clusterstones*0.7;
	var nwin=0;
	var stonechange=0;
	for (let i=0;i<maxit;i++){
		var stonescaptured=0;
		var bc=this.copy();
		var cc=bc.tg.getCluster(c0.x,c0.y);
		space=bc.tg.getConnectedSpace(cc);								//changed this to bc
		var ss=space.length;
		//console.log("ss: "+ss);
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
					//s+=rt.x+","+rt.y+"   ";
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
				space.splice(r,1);
				if (space.length==0) break;								//modified, this should be improved somehow, space can't be 0... something got captured
			} else {
//				s+="nope "+rt.x+","+rt.y+"   ";
				bc.switchPlayer();
			}
		}
/*		if (verb){
			console.log(s);
			s="";
			console.log(nwin/(i+1));
		}*/
	}
	if (nwin/maxit>0.5) return true;
	return false;
};
Trigo.Board.prototype.autoMarkDeadStones=function(){
	var tried=[];
	var tobemarked=[];
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

Trigo.InfluenceTriangle=function(){
	//this.x=x;	//remove indices?
	//this.y=y; //haven't used em yet
	this.border=0;
	this.green=0;
	this.blue=0;
};
Trigo.Board.prototype.initInfluence=function(){
	for (let y=0;y<this.tg.triangles.length;y++){
		var v=[];
		for (let x=0;x<this.tg.triangles[y].length;x++){
			var vt=new Trigo.InfluenceTriangle();
			if (y==0 || x<2 || x>(this.tg.triangles[y].length-3)) vt.border=1;	//add decreasing border influence
			v.push(vt);
		}
		this.influence.push(v);
	}
};
Trigo.Board.prototype.resetInfluence=function(){
	if (this.influence.length==0){										//interesting topic, what are the performance gains of forcing the caller to keep track of initialization?
		this.initInfluence();
	} else {
		for (let y=0;y<this.influence.length;y++){
			for (let x=0;x<this.influence[y].length;x++){
				this.influence[y][x].green=0;
				this.influence[y][x].blue=0;
			}
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
Trigo.Board.prototype.spreadInfluence_tri=function(tri,range,tunneling){//something is wrong with tunneling. No?
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
	this.resetInfluence();
	if (range===undefined) range=3;
	if (tunneling===undefined) tunneling=false;
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
Trigo.Board.prototype.estimateScore=function(reset,range,tunneling){
	//todo: symbiosis mode, more equal points=higher score
	if (reset===undefined) reset=true;
	if (range===undefined) range=3;
	if (tunneling===undefined) tunneling=false;
	var green=this.captures[0];//+this.stones[0];	//hybrid rules, both stones and captures give points
	var blue=this.captures[1]+this.komi;//+this.stones[1]; //stones are counted from influence
	if (reset){
		this.spreadInfluence(range,tunneling);
	}
	for (let y=0;y<this.influence.length;y++){
		for (let x=0;x<this.influence[y].length;x++){
			var it=this.influence[y][x];
			var infl=it.green-it.blue;
			if (infl>0){
				if (it.blue>0.3){
					green+=0.5;
				} else {
					green++;
				}
			} else if (infl<0){
				if (it.green>0.3){
					blue+=0.5;
				} else {
					blue++;
				}
			}
		}
	}
	return [green,blue];
};
Trigo.Board.prototype.loadGame=function(movesstring){
	var arr=movesstring.split(';');
	var sl=parseInt(arr[0]);
	if (sl>0 && sl!=this.tg.sideLength){
		this.tg.sideLength=sl;
	} 
	this.moves=[];
	for (let arri=1;arri<arr.length-1;arri++){
		var ma=arr[arri].split(':');
		var loc=ma[0].split(',');
		if (loc.length<2) continue;										//enables commenting like note:comment
		var tri=new Trigo.Triangle(parseInt(loc[0]),parseInt(loc[1]),parseInt(ma[1]));
		this.moves.push(tri);
	}
	this.placeMoves();
};

//AI

Trigo.AI=function(board){
	this.board=board;
	this.estimates=[]; //form moveindex=score, (negative for blue lead). Use case is making simulation data for neural networks.
};
Trigo.AI.prototype.findFromInfluence=function(){
	var moves=[];
	for (let y=0;y<this.board.influence.length;y++){
		for (let x=0;x<this.board.influence[y].length;x++){
			if (this.board.tg.get(x,y).player!=0) continue;					//no support for marked dead stones!
			var it=this.board.influence[y][x];
			var infl=0;	//lint complained that var infl var declared twice in mutually exclusive if-else branches
			if (it.green==0 && it.blue==0){
				if (it.border<0.5) moves.push(this.board.tg.get(x,y));
			} else if (this.board.player==1){
				infl=it.green-it.blue;
				if (infl<0.5 && it.green>0 && it.blue>0){
					moves.push(this.board.tg.get(x,y)); //reduction
				} else if (infl<0.4 && infl>0){
					moves.push(this.board.tg.get(x,y)); //edge
				}
			} else if (this.board.player==2){
				infl=it.blue-it.green;
				if (infl<0.5 && it.blue>0 && it.green>0){
					moves.push(this.board.tg.get(x,y)); //reduction
				} else if (infl<0.4 && infl>0){
					moves.push(this.board.tg.get(x,y)); //edge
				}
			}
		}
	}
	return moves;
};
Trigo.AI.prototype.findLibertyShortages=function(){
	var checked=[];
	var capturing=[];
	var ataris=[];
	//another for 3 libs?
	for (let mi=0;mi<this.board.moves.length;mi++){
		if (this.board.moves[mi].isPass()) continue;
		var t=this.board.tg.get(this.board.moves[mi].x,this.board.moves[mi].y);
		if (!checked.includes(t)){
			var group=this.board.tg.getGroup(t);
			var libinds=this.board.tg.libertiesInds(group);
			if (libinds.length==1){
				capturing.push(libinds[0]);
			} else if (libinds.length==2){
				ataris.push(libinds[0]);
				ataris.push(libinds[1]);
			}
			for (let gi=0;gi<group.length;gi++){
				checked.push(group[gi]);
			}
		}
	}
	return [capturing,ataris];
};
Trigo.AI.prototype.findCapturing=function(){
	var checked=[];
	var capturing=[];
	for (let mi=0;mi<this.board.moves.length;mi++){
		if (this.board.moves[mi].isPass()) continue;
		var t=this.board.tg.get(this.board.moves[mi].x,this.board.moves[mi].y);
		if (!checked.includes(t)){
			var group=this.board.tg.getGroup(t);
			var libinds=this.board.tg.libertiesInds(group);
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
Trigo.AI.prototype.canBeCaptured=function(x,y){						//this will be useful
	var bc=this.board.copy();
	var captures=bc.placeMoveCountCaptures(x,y);
	if (captures<0) return true; //suicide/invalid
	if (captures<1 && bc.tg.liberties_arr(bc.tg.getGroup(x,y))==1) return true;
	return false; //add code for ladders/nets
};
Trigo.AI.prototype.canCapture=function(x,y){
	var bc=this.board.copy();
	bc.placeMove(-1,-1); //pass
	var captures=bc.placeMoveCountCaptures(x,y);
	if (captures<0) return true; //suicide/invalid
	if (captures<1 && bc.tg.liberties_arr(bc.tg.getGroup(x,y))==1) return true;
	return false;
};
Trigo.AI.prototype.indexOfMax=function(arr){												//util
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
    return maxIndex; //get all inds, randomize pick. Deterministic is better for debugging
};
Trigo.AI.prototype.indicesOfMax=function(arr){												//util
    if (arr.length === 0) {
        return [];
    }
    var max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    var maxIndices=[];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == max) {
            maxIndices.push(i);
        }
    }
    
    return maxIndices; 
};
Trigo.AI.prototype.markDeadByPlaying=function(){
	var bc=this.board.copy();
	var ob=this.board;
	this.board=bc;
	this.playGame();
	for (let y=0;y<this.board.tg.triangles.length;y++){
		for (let x=0;x<this.board.tg.triangles[y].length;x++){
			if (ob.tg.get(x,y).player>0 && this.board.tg.get(x,y).player!=ob.tg.get(x,y).player){
				ob.tg.triangles[y][x].markedDead=true;
			}
		}
	}
	this.board=ob;
};
Trigo.AI.prototype.placeSmartMove=function(markdead,dontmarkdead,thinklong,reset){
	if (this.board.moves.length<1){
		for (let i=0;i<30;i++){
			var ry=Math.floor(Math.random()*(this.board.tg.sideLength-3))+1;
			var xmax=this.board.tg.triangles[ry].length;
			var rx=Math.floor(Math.random()*(xmax-4))+2;
			if (this.board.placeMove(rx,ry)) return;
		}
	}
	if (thinklong!=true) thinklong=false;
	if (reset===undefined) reset=true;	
	var board=this.board;
	if (markdead){
		this.board=board.copy();
		this.markDeadByPlaying();
	}
	if (reset){
		this.board.spreadInfluence(3,false);
	}
	var short=this.findLibertyShortages();
	var moves2consider=[];
	var inflm=this.findFromInfluence();
	var moves2consider0=inflm.concat(short[0]);
	for (let si=0;si<short[1].length;si++){
		var sm=short[1][si];
		if (!this.canCapture(sm.x,sm.y)){
			moves2consider0.push(sm);
		}
	}
	for (let m2c0i=0;m2c0i<moves2consider0.length;m2c0i++){
		var m=moves2consider0[m2c0i];
		if (!moves2consider.includes(m) && !this.canBeCaptured(m.x,m.y)){	//add check for KO
			moves2consider.push(m);
		}
	}
	if (moves2consider.length==0){ 
		if (markdead || dontmarkdead){
			this.board=board;
			this.board.placeMove(-1,-1);
		} else {
			this.placeSmartMove(true);
		}
		return;
	}
	var se=this.board.estimateScore();
	this.estimates.push([this.board.moves.length-1,se[0]-se[1]]);
	var locvalues=[];
	var player=this.board.player;
	if (thinklong){
		var aic=new Trigo.AI(this.board.copy());
		aic.board.placeMove(-1,-1)
		console.log("Computing baseline.");
		var r=aic.playGame();
		var baseline=r[1][player-1]-r[1][this.board.otherPlayer(player)-1];
		console.log(baseline);
		for (let m2ci=0;m2ci<moves2consider.length;m2ci++){
			console.log("Evaluating move "+m2ci+" of "+moves2consider.length);
			aic=new Trigo.AI(this.board.copy());
			var placedmove=aic.board.placeMove(moves2consider[m2ci]);
			if (!placedmove){
				locvalues.push(-1);
			} else {
				r=aic.playGame();
				var res=r[1][player-1]-r[1][this.board.otherPlayer(player)-1];
				console.log(res);
				locvalues.push(res-baseline);
			}
		}
	} else {
		var bc=this.board.copy();
		for (let m2ci=0;m2ci<moves2consider.length;m2ci++){
			var placedmove=bc.placeMove(moves2consider[m2ci]);
			if (!placedmove){
				locvalues.push(-1);
			} else {
				var se2=bc.estimateScore();
				var locvalue=se2[player-1]-se[player-1]+se[this.board.otherPlayer(player)-1]-se2[this.board.otherPlayer(player)-1];
				bc=this.board.copy();
				var pcm=bc.placeCustomMove(moves2consider[m2ci].x,moves2consider[m2ci].y,this.board.otherPlayer(player));
				if (pcm){
					var se3=bc.estimateScore();
					locvalue+=se3[this.board.otherPlayer(player)-1]-se[this.board.otherPlayer(player)-1]+se[player-1]-se3[player-1];
					bc=this.board.copy(); //this isn't necessary on last iteration...
				}
				locvalues.push(locvalue);
			}
		}
	}
	if (markdead){
		for (let m2ci=0;m2ci<moves2consider.length;m2ci++){
			var t=moves2consider[m2ci];
			this.board=board;
			if (this.canBeCaptured(t.x,t.y)){
				locvalues[m2ci]=-1;
				continue;
			}
			this.board=board.copy();
			this.board.placeMove(t);
			this.markDeadByPlaying();
			if (this.board.tg.get(t.x,t.y).markedDead==true){
				locvalues[m2ci]=-1;
			}
		}
		this.board=board;
	}
	//var mi=this.indexOfMax(locvalues); //if need be deterministic
	var ma=this.indicesOfMax(locvalues);
	if (ma.length==0){ 
		this.board.placeMove(-1,-1);
		return;
	}
	var mi=ma[Math.floor(Math.random()*(ma.length))];
	if (mi==-1 || locvalues[mi]<0){ 
		this.board.placeMove(-1,-1);
	} else {
		this.board.placeMove(moves2consider[mi]);
	}
};
Trigo.AI.prototype.playGame=function(){
	for (let mi=0;mi<this.board.tg.sideLength*this.board.tg.sideLength*10;mi++){	//avoid while loop
		this.placeSmartMove(false,true);
		var nm=this.board.moves.length;
		if (this.board.moves[nm-1].isPass() && this.board.moves[nm-2].isPass()){
			break;
		}
	}
	return [this.board.state(),this.board.score()];
};
Trigo.AI.prototype.playNGames=function(n,makestring){
	var resultsum=0;
	var games="";
	for (let ni=0;ni<n;ni++){
		if (ni%5==0) console.log(ni);
		var aic=new Trigo.AI(this.board.copy());
		var r=aic.playGame();
		var result=r[1][0]-r[1][1];
		resultsum+=result;
		if (makestring){
			var ses=";estimates:";
			for (let esi=0;esi<aic.estimates.length;esi++){
				ses+=aic.estimates[esi][0]+"="+aic.estimates[esi][1];
				if (esi<aic.estimates.length-1) ses+=",";
			}
			games+=r[0]+"result:"+result+ses+";\n";
		}
	}
	return [resultsum/n,games];
};
