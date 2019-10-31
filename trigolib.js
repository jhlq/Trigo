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
    if (x<0){
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
	return this.adjacent(new Trigo.Triangle(x,y));
};
Trigo.TriangleGrid.prototype.adjacent_tri=function(triangle){
	if (Array.isArray(triangle)){
		return this.adjacent_arr(triangle)
	}
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
Trigo.TriangleGrid.prototype.getGroup=function(tri){
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
				var c=getConnected(adjempty[aei]);
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
	if (y===undefined) return getCluster_tri(x);
	return this.getCluster(get(x,y));
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
Trigo.TriangleGrid.prototype.liberties=function(tri){
	if (Array.isArray(tri)){
		return this.liberties_arr(tri)
	}
	var group=this.getGroup(tri);
	return this.liberties(group);
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
};
Trigo.Board.prototype.copy=function(){
	var bc=new Trigo.Board(this.tg.sideLength);
	for (let i=0;i<this.moves.length;i++){
		var m=this.moves[i];
		bc.moves.push(new Trigo.Triangle(m.x,m.y,m.player));
	}
	bc.placeMoves();
	bc.player=this.player; //in case of custom placed moves
	return bc;
};
Trigo.Board.prototype.reset=function(){
	this.tg=new Trigo.TriangleGrid(this.tg.sideLength);					//this may be called unnecessarily, add boolean reset?
	this.history=[];
	this.moves=[];
	this.player=1;
	this.stones=[0,0];
	this.captures=[0,0];
	this.territory=[0,0];
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
	var t=new Triangle(x,y,player);
	return invalidMoveType(t);
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
		return 2;
	}
	var h=bc.tg.historyString();
	if (this.history.includes(h)){
		return 3;
	}
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
Trigo.Board.prototype.otherPlayer=function(){
	if (this.player==1){
		return 2;
	} else {
		return 1;
	}
};
Trigo.Board.prototype.otherPlayer=function(p){
	if (p==1){
		return 2;
	} else {
		return 1;
	}
};
Trigo.Board.prototype.switchPlayer=function(){
	this.player=otherPlayer();
};
Trigo.Board.prototype.placeMove=function(x,y){
	var b=placeMove(x,y,player);
	if (b) {
		this.switchPlayer();
	}
	return b;
};
Trigo.Board.prototype.placeMove=function(x,y,p){
	if (x<0){ //pass
		this.moves.push(new Triangle(x,y,p));
		return true;
	}
	if (!this.isValidMove(x,y,p)){
		return false;
	}
	this.tg.set(x,y,p);
	var tri=this.tg.get(x,y);
	this.removeCapturedBy(tri);
	this.history.push(this.tg.historyString());
	this.moves.push(tri);
	this.stones[p-1]+=1;
	return true;
};
Trigo.Board.prototype.state=function(){
	var s=this.tg.sideLength+";";
	for (let movei=0;move<this.moves.length;move++){
		move=this.moves[movei];
		s+=move.x+","+move.y+","+move.player+";";
	}
	return s;
};
Trigo.Board.prototype.placeMoves=function(){
	var m=this.moves;
	var p=this.player;
	this.reset();
	for (let movei=0;movei<m.length;movei++){
		move=m[movei];
		this.placeMove(move.x,move.y,move.player);
	}
	this.player=p;
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
	this.moves.push(new Triangle(-1,-1,this.player));
	this.switchPlayer();
};

Trigo.Board.prototype.score=function(){
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
				var adj=tg.adjacent(c);
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
	this.markDeadStones(this.tg.get(x,y));
};
Trigo.Board.prototype.markDeadStones=function(tri){
	var c=this.tg.getCluster(tri);
	this.markDeadStones(c);
};
Trigo.Board.prototype.markDeadStones=function(c){
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
			this.this.tg.triangles[t.y][t.x].markedDead=flipto;
			this.stones[t.player-1]-=a;
			this.captures[otherPlayer(t.player)-1]+=a;
		}
	}
};
Trigo.Board.prototype.tryCaptureCluster=function(cluster,maxit){
	var space=this.tg.getConnectedSpace(cluster);
	if (space.length>this.tg.sideLength*this.tg.sideLength/5) return false;
	var c0=cluster[0];
	var totalstones=this.stones[c0.player-1];
	var clusterstones=cluster.length;
	var stonelimit=totalstones-clusterstones*0.7;
	//srand(time(NULL));
	var nwin=0;
	for (let i=0;i<maxit;i++){
		var bc=this.copy();
		var cc=bc.tg.getCluster(c0.x,c0.y);
		space=this.tg.getConnectedSpace(cc);
		var ss=space.length;
		for (let si=0;si<ss*3;si++){
			//var r=rand() % space.length;
			var r=Math.floor(Math.random()*space.length);
			var rt=space[r];
			var placedmove;
			var adjrt=bc.tg.adjacent(rt);
			var adjacentallsame=true;
			for (let ai=0;a<adjrt.length;a++){
				a=adjrt[ai];
				if (a.player!=bc.player){
					adjacentallsame=false;
				}
			}
			if (adjacentallsame){
				placedmove=false;
			} else {
				placedmove=bc.placeMove(rt.x,rt.y);
			}
			if (placedmove){
				if (bc.stones[c0.player-1]<stonelimit){
					nwin++;
					break;
				}
				space.splice(r,1);
				if (space.length==0) break;
			} else {
				bc.switchPlayer();
			}
		}
	}
	if (nwin/maxit>0.5) return true;
	return false;
};
Trigo.Board.prototype.autoMarkDeadStones=function(){
	var tried=[];
	var tobemarked=[];
	for (let mi=0;m<this.moves.length;m++){
		m=this.moves[mi];
		if (!tried.includes(m)){
			var c=this.tg.getCluster(m);
			var success=this.tryCaptureCluster(c);
			if (success){
				//markDeadStones(c);
				tobemarked.push(c);
			}
			for (let cti=0;ct<c.length;ct++){
				ct=c[cti];
				tried.push(ct);
			}
		}
	}
	for (let clusteri=0;cluster<tobemarked.length;cluster++){
		cluster=tobemarked[clusteri];
		this.markDeadStones(cluster);
	}
};
