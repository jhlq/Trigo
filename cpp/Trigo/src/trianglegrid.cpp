#include "trianglegrid.h"
#include "util.h"
#include <algorithm>

TriangleGrid::TriangleGrid(int sideLength)
{
    this->sideLength=sideLength;
    this->setUpGrid();
}
void TriangleGrid::setUpGrid(){
    for (int yt = 0; yt < sideLength; yt++) {
        std::vector<Triangle> v;
        for (int xt = 0; xt <= 2*sideLength-2*yt-2; xt++) {
            v.push_back(Triangle(xt,yt));
        }
        this->triangles.push_back(v);
    }
}
Triangle TriangleGrid::get(int x, int y){
    return triangles[y][x];
}
void TriangleGrid::set(int x, int y, int player){
    //triangles[y][x].prevPlayer=triangles[y][x].player;
    triangles[y][x].player=player;
}
bool TriangleGrid::has(int x, int y){
    if (y>=triangles.size() || x>=triangles[y].size()){
        return false;
    }
    return true;
}
int TriangleGrid::nTriangles(){ //this should be sideLength^2
    int n=0;
    for(std::vector<Triangle> yv : this->triangles) {
        for(Triangle xt : yv) {
            n++;
        }
    }
    return n;
}
std::vector<Triangle> TriangleGrid::adjacent(int x,int y){
    return adjacent(Triangle(x,y));
}
std::vector<Triangle> TriangleGrid::adjacent(const Triangle &triangle){
    std::vector<Triangle> adj;
    int leny=this->sideLength; //this->triangles.size();
    int lenx=this->triangles[triangle.y].size();
    if (triangle.x%2==1){
        if (triangle.x+1<lenx){
            adj.push_back(this->triangles[triangle.y][triangle.x+1]);
        }
        if (triangle.x-1>=0){
            adj.push_back(this->triangles[triangle.y][triangle.x-1]);
        }
        if (triangle.y+1<leny && triangle.x-1>=0){
            adj.push_back(this->triangles[triangle.y+1][triangle.x-1]);
        }
    } else {
        if (triangle.x+1<lenx){
            adj.push_back(this->triangles[triangle.y][triangle.x+1]);
        }
        if (triangle.x-1>=0){
            adj.push_back(this->triangles[triangle.y][triangle.x-1]);
        }
        if (triangle.y-1>=0 && triangle.x+1<lenx+2){
            adj.push_back(this->triangles[triangle.y-1][triangle.x+1]);
        }
    }
    return adj;
}
std::vector<Triangle> TriangleGrid::adjacent(const std::vector<Triangle> &group){
    std::vector<Triangle> adjg;
    int ng=group.size();
    for (int n=0;n<ng;n++){
        Triangle tri=group[n];
        std::vector<Triangle> adj=adjacent(tri);
        int ladj=adj.size();
        for (int i=0;i<ladj;i++){
            Triangle ttri=adj[i];
            //bool contains1=!(std::find(group.begin(), group.end(), ttri) == group.end());
            bool contains1=contains(group,ttri);
            //bool contains2=!(std::find(adjg.begin(), adjg.end(), ttri) == adjg.end());
            bool contains2=contains(adjg,ttri);
            if (!contains1 && !contains2){
                adjg.push_back(ttri);
            }
        }
    }
    return adjg;
}
std::vector<Triangle> TriangleGrid::adjacentPieces(const Triangle &tri){
    std::vector<Triangle> adj=adjacent(tri);
    std::vector<Triangle> adjp;
    int ladj=adj.size();
    for (int i=0;i<ladj;i++){
        Triangle ttri=adj[i];
        if (ttri.sameTenantAs(tri)){
            adjp.push_back(ttri);
        }
    }
    return adjp;
}
std::vector<Triangle> TriangleGrid::adjacentPieces(const std::vector<Triangle> &group){
    std::vector<Triangle> adj=adjacent(group);
    std::vector<Triangle> adjp;
    Triangle g0=group[0];
    int ladj=adj.size();
    for (int i=0;i<ladj;i++){
        Triangle ttri=adj[i];
        if (ttri.sameTenantAs(g0)){
            adjp.push_back(ttri);
        }
    }
    return adjp;
}
std::vector<Triangle> TriangleGrid::getConnected(const Triangle &tri){
    std::vector<Triangle> group;
    group.push_back(tri);
    std::vector<Triangle> recentlyAdded=adjacentPieces(tri);
    while (!recentlyAdded.empty()){
        int rai=recentlyAdded.size();
        for (int i=0;i<rai;i++){
            if (!contains(group,recentlyAdded[i])){
                group.push_back(recentlyAdded[i]); //better to make Triangle var to avoid multiple indexing?
            }
        }
        recentlyAdded=adjacentPieces(group);
    }
    return group;
}
std::vector<Triangle> TriangleGrid::getConnectedSpace(std::vector<Triangle> cluster){
    //std::vector<Triangle> checked;
    std::vector<Triangle> space;
    std::vector<Triangle> adj=adjacent(cluster);
    for (Triangle a:adj){
        if (a.player==0 && !contains(space,a)){
            std::vector<Triangle> ls=getConnected(a);
            for (Triangle l:ls){
                space.push_back(l);
            }
        }
    }
    return space;
}
std::vector<Triangle> TriangleGrid::getGroup(const Triangle &tri){
    if (tri.player==0){
        std::vector<Triangle> v;
        return v;
    }
    return getConnected(tri);
}
std::vector<Triangle> TriangleGrid::getCluster(const std::vector<Triangle> &group){
    std::vector<Triangle> cluster;
    if (group.empty()){
        return cluster;
    }
    std::vector<Triangle> checked;
    int player=group[0].player;
    for (int gi=0;gi<group.size();gi++){
        cluster.push_back(group[gi]);
        checked.push_back(group[gi]);
    }
    std::vector<Triangle> adj=adjacent(group);
    std::vector<Triangle> adjempty;
    for (int ai=0;ai<adj.size();ai++){
        if (adj[ai].player==0){
            adjempty.push_back(adj[ai]);
        }
    }
    while (!adjempty.empty()){
        for (int aei=0;aei<adjempty.size();aei++){
            if (!contains(checked,adjempty[aei])){
                checked.push_back(adjempty[aei]);
                std::vector<Triangle> c=getConnected(adjempty[aei]);
                for (int ci=0;ci<c.size();ci++){
                    if (!contains(checked,c[ci])){
                        checked.push_back(c[ci]);
                    }
                }
                std::vector<Triangle> adjc=adjacent(c);
                for (int adjci=0;adjci<adjc.size();adjci++){
                    Triangle tri=adjc[adjci];
                    std::vector<Triangle> trig=getGroup(tri);
                    for (int ti=0;ti<trig.size();ti++){
                        Triangle ttri=trig[ti];
                        if (!contains(checked,ttri)){
                            checked.push_back(ttri);
                            if (ttri.player==player){
                                cluster.push_back(ttri);
                            }
                        }
                    }
                }
            }
        }
        std::vector<Triangle> adjcluster=adjacent(cluster);
        adjempty.clear();
        for (int i=0;i<adjcluster.size();i++){
            Triangle t=adjcluster[i];
            if (!contains(checked,t) && t.player==0){
                adjempty.push_back(t);
            }
        }
    }
    return cluster;
}
std::vector<Triangle> TriangleGrid::getCluster(int x,int y){
    return getCluster(get(x,y));
}
std::vector<Triangle> TriangleGrid::getCluster(const Triangle &tri){
    std::vector<Triangle> g=getGroup(tri);
    return getCluster(g);
}
int TriangleGrid::liberties(const std::vector<Triangle> &group){
    std::vector<Triangle> adj=adjacent(group);
    int lib=0;
    for (int i=0;i<adj.size();i++){
        if (!adj[i].alive()){
            lib+=1;
        }
    }
    return lib;
}
int TriangleGrid::liberties(const Triangle &tri){
    std::vector<Triangle> group=getGroup(tri);
    return liberties(group);
}
//void TriangleGrid::addCaptured(int x, int y, Triangle &captured){
//    triangles[y][x].captured.push_back(captured);
//}
void TriangleGrid::removeGroup(std::vector<Triangle> &group){
    for (int n=0;n<group.size();n++){
        //group[n].prevPlayer=group[n].player; //remove multiple indexing? Currently supports removing a mixed group...
        //group[n].player=0;
        Triangle gt=group[n];
        //Triangle t=get(gt.x,gt.y);
        //t.prevPlayer=gt.player;
        //t.player=0;
        set(gt.x,gt.y,0);
        //capturer.captured.push_back(group[n]);
        //Triangle ct=get(gt.x,gt.y);
        //addCaptured(capturer.x,capturer.y,ct);
    }
}
std::string TriangleGrid::historyString(){
    std::string h="";
    for (int y=0;y<triangles.size();y++){
        for (int x=0;x<triangles[y].size();x++){
            Triangle tri=triangles[y][x];
            h=h+std::to_string(tri.x)+","+std::to_string(tri.y)+":"+std::to_string(tri.player)+";";
        }
    }
    return h;
}
