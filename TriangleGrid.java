import java.util.ArrayList;

public class TriangleGrid {
	ArrayList<ArrayList<Triangle>> triangles;
	ArrayList<Triangle> clicked;
	int offsetX;
	int offsetY;
	int gridSpace;
	int sideLength;
	public TriangleGrid(){
		this.clicked=new ArrayList<Triangle>();
		this.offsetX=50;
		this.offsetY=50;
		this.sideLength=12;
		this.gridSpace=600/this.sideLength;
		this.setUpGrid();
	}
	public Triangle makeTriangle(int x,int y){
		int ox=offsetX;
		int oy=offsetY;
		int remainder=x%2;
		int ex=x-remainder;
		double degrees = 30.0;
		double radians = Math.toRadians(degrees);
		double c=gridSpace/(2*Math.cos(radians));
		double h=Math.sqrt(Math.pow(c,2)-Math.pow(gridSpace/2,2));
		if (remainder==1){
			ox+=gridSpace/2+(x/2)*gridSpace+(gridSpace/2)*y;
			oy+=h+(c+h)*y;
		} else {
			ox+=(ex/2)*gridSpace+y*(gridSpace/2);
			oy+=(c+h)*y;
		}
		return new Triangle(x,y,ox,oy);
	}
	public void setUpGrid(){
		this.triangles=new ArrayList<ArrayList<Triangle>>();
		this.clicked=new ArrayList<Triangle>();
		for (int yt = 0; yt < sideLength; yt++) {
			this.triangles.add(new ArrayList<Triangle>());
			for (int xt = 0; xt <= 2*sideLength-2*yt-2; xt++) {
				this.triangles.get(yt).add(makeTriangle(xt,yt));
			}
		}
	}
	public ArrayList<Triangle> adjacent(Triangle triangle){
		ArrayList<Triangle> adj=new ArrayList<Triangle>();
		int leny=this.triangles.size();
		int lenx=this.triangles.get(triangle.y).size();
		if (triangle.x%2==1){
			if (triangle.x+1<lenx){
				adj.add(this.triangles.get(triangle.y).get(triangle.x+1));
			}
			if (triangle.x-1>=0){
				adj.add(this.triangles.get(triangle.y).get(triangle.x-1));
			}
			if (triangle.y+1<leny && triangle.x-1>=0){
				adj.add(this.triangles.get(triangle.y+1).get(triangle.x-1));
			}
		} else {
			if (triangle.x+1<lenx){
				adj.add(this.triangles.get(triangle.y).get(triangle.x+1));
			}
			if (triangle.x-1>=0){
				adj.add(this.triangles.get(triangle.y).get(triangle.x-1));
			}
			if (triangle.y-1>=0 && triangle.x+1<lenx+2){
				adj.add(this.triangles.get(triangle.y-1).get(triangle.x+1));
			}
		}
		return adj;
	}
	public ArrayList<Triangle> adjacent(ArrayList<Triangle> group){
		ArrayList<Triangle> adjg=new ArrayList<Triangle>();
		int ng=group.size();
		for (int n=0;n<ng;n++){
			Triangle tri=group.get(n);
			ArrayList<Triangle> adj=adjacent(tri);
			int ladj=adj.size();
			for (int i=0;i<ladj;i++){
				Triangle ttri=adj.get(i);
				if (!group.contains(ttri) && !adjg.contains(ttri)){
					adjg.add(ttri);
				}
			}
		}
		return adjg;
	}
	public ArrayList<Triangle> adjacentPieces(Triangle tri){
		ArrayList<Triangle> adj=adjacent(tri);
		ArrayList<Triangle> adjp=new ArrayList<Triangle>();
		int ladj=adj.size();
		for (int i=0;i<ladj;i++){
			Triangle ttri=adj.get(i);
			if (ttri.sameAs(tri)){
				adjp.add(ttri);
			}
		}
		return adjp;
	}
	public ArrayList<Triangle> adjacentPieces(ArrayList<Triangle> group){
		ArrayList<Triangle> adj=adjacent(group);
		ArrayList<Triangle> adjp=new ArrayList<Triangle>();
		//int groupplayer=group.get(0).player;
		Triangle g0=group.get(0);
		int ladj=adj.size();
		for (int i=0;i<ladj;i++){
			Triangle ttri=adj.get(i);
			if (ttri.sameAs(g0)){
				adjp.add(ttri);
			}
		}
		return adjp;
	}
	public ArrayList<Triangle> getConnected(Triangle tri){
		ArrayList<Triangle> group=new ArrayList<Triangle>();
		group.add(tri);
		ArrayList<Triangle> recentlyAdded=adjacentPieces(tri);
		while (!recentlyAdded.isEmpty()){
			int rai=recentlyAdded.size();
			for (int i=0;i<rai;i++){
				if (!group.contains(recentlyAdded.get(i))){
					group.add(recentlyAdded.get(i));
				}
			}
			recentlyAdded=adjacentPieces(group);
		}
		return group;
	}
	public ArrayList<Triangle> getGroup(Triangle tri){
		if (tri.player==0){
			return new ArrayList<Triangle>();
		}
		return getConnected(tri);
	}
	public ArrayList<Triangle> getCluster(ArrayList<Triangle> group){
		ArrayList<Triangle> cluster=new ArrayList<Triangle>();
		if (group.isEmpty()){
			return cluster;
		}
		ArrayList<Triangle> checked=new ArrayList<Triangle>();
		int player=group.get(0).player;
		for (int gi=0;gi<group.size();gi++){
			cluster.add(group.get(gi));
			checked.add(group.get(gi));
		}
		ArrayList<Triangle> adj=adjacent(group);
		ArrayList<Triangle> adjempty=new ArrayList<Triangle>();
		for (int ai=0;ai<adj.size();ai++){
			//checked.add(adj.get(ai));
			if (adj.get(ai).player==0){
				adjempty.add(adj.get(ai));
			}
		}
		while (!adjempty.isEmpty()){
			for (int aei=0;aei<adjempty.size();aei++){
				if (!checked.contains(adjempty.get(aei))){
					checked.add(adjempty.get(aei));
					ArrayList<Triangle> c=getConnected(adjempty.get(aei));
					for (int ci=0;ci<c.size();ci++){
						if (!checked.contains(c.get(ci))){
							checked.add(c.get(ci));
						}
					}
					ArrayList<Triangle> adjc=adjacent(c);
					for (int adjci=0;adjci<adjc.size();adjci++){
						Triangle tri=adjc.get(adjci);
						ArrayList<Triangle> trig=getGroup(tri);
						for (int ti=0;ti<trig.size();ti++){
							Triangle ttri=trig.get(ti);
							if (!checked.contains(ttri)){
								checked.add(ttri);
								if (ttri.player==player){
									cluster.add(ttri);
								}
							}
						}
					}
				}
			}
			ArrayList<Triangle> adjcluster=adjacent(cluster);
			adjempty=new ArrayList<Triangle>();
			for (int i=0;i<adjcluster.size();i++){
				Triangle t=adjcluster.get(i);
				if (!checked.contains(t) && t.player==0){
					adjempty.add(t);
				}
			}
		}
		return cluster;
	}
	public ArrayList<Triangle> getCluster(Triangle tri){
		return getCluster(getGroup(tri));
	}
	public int liberties(ArrayList<Triangle> group){
		ArrayList<Triangle> adj=adjacent(group);
		int lib=0;
		for (int i=0;i<adj.size();i++){
			if (adj.get(i).player==0){
				lib+=1;
			}
		}
		return lib;
	}
	public int liberties(Triangle tri){
		ArrayList<Triangle> group=getGroup(tri);
		return liberties(group);
	}
	public void removeGroup(ArrayList<Triangle> group,Triangle capturer){
		for (int n=0;n<group.size();n++){
			group.get(n).prevPlayer=group.get(n).player;
			group.get(n).player=0;
			capturer.captured.add(group.get(n));
		}
	}
	public static void main(String[] args) {
		TriangleGrid tg=new TriangleGrid();
		Triangle triangle=new Triangle(1,2,3,4);
		tg.getGroup(triangle);
		//System.out.println(tg.triangles.size());
		//System.out.println(tg.adjacent(new Triangle(0,0,0,0)));
	}
}
