
//Triangle

function Triangle(x,y,player){
    this.x=x;
    this.y=y;
    if (player===undefined){
        player=0;
	}
    this.player=player;
    this.markedDead=false;
};
Triangle.prototype.isPass=function(){
    if (x<0){
        return true;
    }
    return false;
};
Triangle.prototype.alive=function(){
    return player>0 && !markedDead;
};
Triangle.prototype.sameTenantAs=function(t){
    return this.player==t.player || ((this.markedDead||this.player==0)&&(t.markedDead||t.player==0));
};
Triangle.prototype.equals=function(t){
    return this.x == t.x && this.y == t.y;
};

//TriangleGrid

function TriangleGrid(sideLength){
	this.sideLength=sideLength;
	this.triangles=[];
	this.setUpGrid();
};
TriangleGrid.prototype.setUpGrid=function(){
	for (let yt = 0; yt < this.sideLength; yt++) {
		var v=[];
		for (let xt = 0; xt <= 2*this.sideLength-2*yt-2; xt++) {
			v.push(Triangle(xt,yt));
		}
		this.triangles.push(v);
	}
};
TriangleGrid.prototype.get=function(x, y){
	return triangles[y][x];
};
TriangleGrid.prototype.set=function(x, y, player){
	triangles[y][x].player=player;
};
TriangleGrid.prototype.has=function(x, y){
	if (x<0 || y<0 || y>=triangles.length || x>=triangles[y].length){
		return false;
	}
	return true;
};
TriangleGrid.prototype.has=function(t){
	return has(t.x,t.y);
};
TriangleGrid.prototype.nTriangles=function(){ //this should be sideLength^2
	var n=0;
	for(let yi=0; yi<this.triangles.length; yi++) {
		var yv=this.triangles[yi];
		for(let xt in yv) {
			n++;
		}
	}
	return n;
};
TriangleGrid.prototype.adjacent=function(x,y){
	return adjacent(Triangle(x,y));
};
TriangleGrid.prototype.adjacent=function(triangle){
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
TriangleGrid.prototype.adjacentInds=function(triangle){
	var adji=[];
	if (Math.abs(triangle.x%2)==1){
		adji.push(Triangle(triangle.x+1,triangle.y));
		adji.push(Triangle(triangle.x-1,triangle.y+1));
		adji.push(Triangle(triangle.x-1,triangle.y));
	} else {
		adji.push(Triangle(triangle.x+1,triangle.y));
		adji.push(Triangle(triangle.x-1,triangle.y));
		adji.push(Triangle(triangle.x+1,triangle.y-1));
	}
	return adji;
};
TriangleGrid.prototype.adjacentInds=function(group){
	var adjg=[];
	var ng=group.length;
	for (let n=0;n<ng;n++){
		var tri=group[n];
		var adj=adjacentInds(tri);
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
TriangleGrid.prototype.adjacentIndsSpread=function(triangle,spread){
	var adjis=[];
	var adji=adjacentInds(triangle);
	for (let sp=0;sp<spread;sp++){
		for (let ai=0;ai<adji.length;ai++){
			var a=adji[ai]
			if (!(a==triangle)){// && !adjis.includes(a)){
				adjis.push(a);
			}
		}
		if (sp<spread-1){
			adji=adjacentInds(adjis);
		}
	}
	return adjis;
};
TriangleGrid.prototype.adjacent=function(group){
	var adjg=[];
	var ng=group.length;
	for (let n=0;n<ng;n++){
		var tri=group[n];
		var adj=adjacent(tri);
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
TriangleGrid.prototype.adjacentPieces=function(tri){
	var adj=adjacent(tri);
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
TriangleGrid.prototype.adjacentPieces=function(group){
	var adj=adjacent(group);
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
TriangleGrid.prototype.getConnected=function(tri){
	var group=[];
	group.push(tri);
	var recentlyAdded=adjacentPieces(tri);
	while (!recentlyAdded.length==0){
		var rai=recentlyAdded.length;
		for (let i=0;i<rai;i++){
			if (!group.includes(recentlyAdded[i])){
				group.push(recentlyAdded[i]); //better to make Triangle var to avoid multiple indexing?
			}
		}
		recentlyAdded=adjacentPieces(group);
	}
	return group;
};
TriangleGrid.prototype.getConnectedSpace=function(cluster){
	var space=[];
	var adj=adjacent(cluster);
	for (let ai=0;ai<adj.length;ai++){
		var a=adj[ai];
		if (a.player==0 && !space.includes(a)){
			var ls=getConnected(a);
			for (let li=0;li<ls.length;li++){
				space.push(ls[li]);
			}
		}
	}
	return space;
};
TriangleGrid.prototype.getGroup=function(tri){
	if (tri.player==0){
		var v=[];
		return v;
	}
	return getConnected(tri);
};
TriangleGrid.prototype.getCluster=function(group){
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
	var adj=adjacent(group);
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
				var adjc=adjacent(c);
				for (let adjci=0;adjci<adjc.length;adjci++){
					var tri=adjc[adjci];
					var trig=getGroup(tri);
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
		var adjcluster=adjacent(cluster);
		adjempty.clear();
		for (let i=0;i<adjcluster.length;i++){
			var t=adjcluster[i];
			if (!checked.includes(t) && t.player==0){
				adjempty.push(t);
			}
		}
	}
	return cluster;
};
TriangleGrid.prototype.getCluster=function(x,y){
	return getCluster(get(x,y));
};
TriangleGrid.prototype.getCluster=function(tri){
	var g=getGroup(tri);
	return getCluster(g);
};
TriangleGrid.prototype.liberties=function(group){
	var adj=adjacent(group);
	var lib=0;
	for (let i=0;i<adj.length;i++){
		if (!adj[i].alive()){
			lib+=1;
		}
	}
	return lib;
};
TriangleGrid.prototype.liberties=function(tri){
	var group=getGroup(tri);
	return liberties(group);
};
TriangleGrid.prototype.removeGroup=function(group){
	for (let n=0;n<group.length;n++){
		var gt=group[n];
		set(gt.x,gt.y,0);
	}
};
TriangleGrid.prototype.historyString=function(){
	var h="";
	for (let y=0;y<triangles.length;y++){
		for (let x=0;x<triangles[y].length;x++){
			var tri=triangles[y][x];
			h=h+tri.x+","+tri.y+":"+tri.player+";";
		}
	}
	return h;
};
