#include "board.h"
#include "util.h"

#include <stdlib.h>     /* srand, rand */
#include <time.h>       /* time */

#include <math.h>
#include <boost/algorithm/string.hpp>

Board::Board(int sideLength) : tg(sideLength)
{
    //tg=TriangleGrid(sideLength);
    player=1;
    stones[0]=0;
    stones[1]=0;
    captures[0]=0;
    captures[1]=0;
    territory[0]=0;
    territory[1]=0;
    komi=7;
}
void Board::reset(){
    tg=TriangleGrid(tg.sideLength);
    player=1;
    history.clear();
    moves.clear();
    stones[0]=0;
    stones[1]=0;
    captures[0]=0;
    captures[1]=0;
    territory[0]=0;
    territory[1]=0;
}
void Board::removeCapturedBy(const Triangle tri){
    //Triangle tri=tg.get(x,y);
    std::vector<Triangle> adj=tg.adjacent(tri);
    for (int a=0;a<adj.size();a++){
        int ap=adj[a].player;
        if (adj[a].alive()&&ap!=tri.player){
            std::vector<Triangle> g=tg.getGroup(adj[a]);
            if (tg.liberties(g)==0){
                tg.removeGroup(g);
                stones[ap-1]-=g.size();
                captures[tri.player-1]+=g.size();
            }
        }
    }
}
int Board::invalidMoveType(int x,int y,int player){
    Triangle t=Triangle(x,y,player);
    return invalidMoveType(t);
}
int Board::invalidMoveType(const Triangle &t){
    if (!tg.has(t.x,t.y)){
        return 4;
    }
    if (tg.get(t.x,t.y).player!=0){
        return 1;
    }
    Board bc=Board(*this);
    bc.tg.set(t.x,t.y,t.player);
    Triangle tri=bc.tg.get(t.x,t.y);
    //bc.removeCapturedBy(tri);
    std::vector<Triangle> adj=bc.tg.adjacent(tri);
    for (int a=0;a<adj.size();a++){
            if (adj[a].alive()&&adj[a].player!=tri.player){
            std::vector<Triangle> g=bc.tg.getGroup(adj[a]);
            if (bc.tg.liberties(g)==0){
                bc.tg.removeGroup(g);
            }
        }
    }
    std::vector<Triangle> group=bc.tg.getGroup(tri);
    if (bc.tg.liberties(group)==0){
        return 2;
    }
    std::string h=bc.tg.historyString();
    if (contains(this->history,h)){
        return 3;
    }
    return 0;
}
bool Board::isValidMove(int x,int y,int player){
    Triangle t=Triangle(x,y,player);
    return isValidMove(t);
}
bool Board::isValidMove(const Triangle &t){
    if (invalidMoveType(t)>0){
        return false;
    }
    return true;
}
int Board::otherPlayer(){
    if (player==1){
        return 2;
    } else {
        return 1;
    }
}
int Board::otherPlayer(int p){
    if (p==1){
        return 2;
    } else {
        return 1;
    }
}
void Board::switchPlayer(){
    player=otherPlayer();
}
bool Board::placeMove(int x,int y){
    bool b=placeMove(x,y,player);
    if (b) {
        switchPlayer();
    }
    return b;
}
bool Board::placeMove(int x,int y,int p){
    if (x<0){ //pass
        moves.push_back(Triangle(x,y,p));
        return true;
    }
    if (!isValidMove(x,y,p)){
        return false;
    }
    tg.set(x,y,p);
    Triangle tri=tg.get(x,y);
    removeCapturedBy(tri);
    /*std::vector<Triangle> adj=tg.adjacent(tri);
    for (int a=0;a<adj.size();a++){
            if (adj[a].alive()&&adj[a].player!=tri.player){
            std::vector<Triangle> g=tg.getGroup(adj[a]); //put this in a function?
            if (tg.liberties(g)==0){
                captures[p-1]+=g.size();
                tg.removeGroup(g,tri);
            }
        }
    }*/
    history.push_back(tg.historyString());
    //moves.push_back(tri);
    moves.push_back(Triangle(x,y,p));
    stones[p-1]+=1;
    return true;
}
std::string Board::state(){
    std::string s=std::to_string(tg.sideLength)+";";
    for (Triangle move : moves){
        s+=std::to_string(move.x)+","+std::to_string(move.y)+":"+std::to_string(move.player)+";";
    }
    return s;
}
void Board::placeMoves(){
    std::vector<Triangle> m=moves;
    int p=player;
    reset();
    for (Triangle move : m){
        placeMove(move.x,move.y,move.player);
    }
    player=p;
}
void Board::undo(){
    if (!moves.empty()){
        if (!moves.back().isPass()){
            history.pop_back();
        }
        moves.pop_back();
        switchPlayer();
        placeMoves();
    }
}
void Board::pass(){
    moves.push_back(Triangle(-1,-1,player));
    switchPlayer();
}

void Board::score(){
    std::vector<Triangle> checked;
    int scores[2]={0,0};
    for (int y=0;y<tg.triangles.size();y++){
        for (int x=0;x<tg.triangles[y].size();x++){
            Triangle tri=tg.triangles[y][x];
            if ((tri.player==0||tri.markedDead) && !contains(checked,tri)){
                std::vector<Triangle> c=tg.getConnected(tri);
                for (int ci=0;ci<c.size();ci++){
                    checked.push_back(c[ci]);
                }
                std::vector<Triangle> adj=tg.adjacent(c);
                int p=adj[0].player;
                if (!adj.empty() && p>0){
                    bool oneplayer=true;
                    for (int adji=0;adji<adj.size();adji++){
                        if (adj[adji].player!=p){
                            oneplayer=false;
                            break;
                        }
                    }
                    if (oneplayer){
                        scores[p-1]+=c.size();
                    }

                }
            }

        }
    }
    territory[0]=scores[0];
    territory[1]=scores[1];
}
void Board::markDeadStones(int x,int y){
    markDeadStones(tg.get(x,y));
}
void Board::markDeadStones(const Triangle &tri){
    std::vector<Triangle> c=tg.getCluster(tri);
    markDeadStones(c);
}
void Board::markDeadStones(std::vector<Triangle> c){
    Triangle tri=c[0];
    if (c.empty()) return;
    bool flipto=!(tri.markedDead);
    int a=-1;
    if (flipto){
        a=1;
    }
    for (int i=0;i<c.size();i++){
        Triangle t=c[i];
        if (t.player==tri.player && t.markedDead!=flipto){
            tg.triangles[t.y][t.x].markedDead=flipto;
            stones[t.player-1]-=a;
            captures[otherPlayer(t.player)-1]+=a;
        }
    }
}
//#include <iostream>
bool Board::tryCaptureCluster(std::vector<Triangle> cluster, int maxit){
    std::vector<Triangle> space=tg.getConnectedSpace(cluster);
    if (space.size()>tg.sideLength*tg.sideLength/5) return false;
    Triangle c0=cluster[0];
    int totalstones=stones[c0.player-1];
    int clusterstones=cluster.size();
    double stonelimit=(double)totalstones-(double)clusterstones*0.7;
    srand(time(NULL));
    int nwin=0;
    for (int i=0;i<maxit;i++){
        Board bc(*this);
        std::vector<Triangle> cc=bc.tg.getCluster(c0.x,c0.y);
        space=tg.getConnectedSpace(cc);
        int ss=space.size();
        for (int si=0;si<ss*3;si++){
            int r=rand() % space.size();
            Triangle rt=space[r];
            bool placedmove;
            std::vector<Triangle> adjrt=bc.tg.adjacent(rt);
            bool adjacentallsame=true;
            for (Triangle a:adjrt){
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
                if ((double)bc.stones[c0.player-1]<stonelimit){
                    nwin++;
                    break;
                }
                space.erase(space.begin()+r);
                if (space.size()==0) break;
            } else {
                bc.switchPlayer();
            }
        }
    }
    if ((double)nwin/(double)maxit>0.5) return true;
    return false;
}
void Board::autoMarkDeadStones(){
    std::vector<Triangle> tried;
    std::vector<std::vector<Triangle>> tobemarked;
    for (Triangle m:moves){
        if (!contains(tried,m)){
            std::vector<Triangle> c=tg.getCluster(m);
            bool success=tryCaptureCluster(c);
            if (success){
                //markDeadStones(c);
                tobemarked.push_back(c);
            }
            for (Triangle ct:c){
                tried.push_back(ct);
            }
        }
    }
    for (auto cluster:tobemarked){
        markDeadStones(cluster);
    }
}


void Board::initInfluence(){
    for (int y=0;y<this->tg.triangles.size();y++){
        std::vector<InfluenceTriangle> v;
        for (int x=0;x<this->tg.triangles[y].size();x++){
            InfluenceTriangle vt;
            if (y==0 || x<2 || x>(this->tg.triangles[y].size()-3)) vt.border=1;	//add decreasing border influence
            v.push_back(vt);
        }
        this->influence.push_back(v);
    }
}
void Board::resetInfluence(){
    if (this->influence.empty()){										//interesting topic, what are the performance gains of forcing the caller to keep track of initialization?
        this->initInfluence();
    } else {
        for (int y=0;y<this->influence.size();y++){
            for (int x=0;x<this->influence[y].size();x++){
                this->influence[y][x].green=0;
                this->influence[y][x].blue=0;
            }
        }
    }
}
void Board::normalizeInfluence(){
    for (int y=0;y<this->influence.size();y++){
        for (int x=0;x<this->influence[y].size();x++){
            this->influence[y][x].green=tanh(this->influence[y][x].green);
            this->influence[y][x].blue=tanh(this->influence[y][x].blue);
        }
    }
}
void Board::spreadInfluence(Triangle tri,int range){
    if (tri.isPass()) return;
    std::vector<Triangle> visited;
    std::vector<Triangle> fringe;
    fringe.push_back(tri);
    int _player=tri.player;
    for (int r=0;r<=range;r++){
        std::vector<Triangle> newfringe;
        for (int fi=0;fi<fringe.size();fi++){
            Triangle t=fringe[fi];
            if (_player==1){
                this->influence[t.y][t.x].green+=(double)1/(r+1);
            } else if (_player==2){
                this->influence[t.y][t.x].blue+=(double)1/(r+1);
            }
            auto adj=this->tg.adjacent(t);
            for (int adji=0;adji<adj.size();adji++){
                Triangle at=adj[adji];
                if (!contains(visited,at)){
                    if (at.alive() && at.player!=_player){
                        //tunnel
                    } else {
                        newfringe.push_back(at);
                    }
                }
            }
            visited.push_back(t);
        }
        fringe=newfringe;
    }
}
void Board::spreadInfluence(int range){
    this->resetInfluence();
    for (int y=0;y<this->tg.triangles.size();y++){
        for (int x=0;x<this->tg.triangles[y].size();x++){
            Triangle t=this->tg.triangles[y][x];
            if (t.alive()){
                this->spreadInfluence(t,range);
            }
        }
    }
    this->normalizeInfluence();
}
std::array<double,2> Board::estimateScore(bool reset,int range){
    double green=this->captures[0];//+this->stones[0];	//hybrid rules, both stones and captures give points
    double blue=this->captures[1]+this->komi;//+this->stones[1]; //stones are counted from influence
    if (reset){
        this->spreadInfluence(range);
    }
    for (int y=0;y<this->influence.size();y++){
        for (int x=0;x<this->influence[y].size();x++){
            auto it=this->influence[y][x];
            double infl=it.green-it.blue;
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
    std::array<double,2> _a={green,blue};
    return _a;
}
std::vector<std::vector<std::string>> Board::loadGame(std::string movesstring){
    std::setlocale(LC_ALL, "C"); // C uses "." as decimal-point separator
    std::vector<Triangle> _moves;
    std::vector<std::string> strs;
    std::vector<std::vector<std::string>> remainder;
    boost::split(strs,movesstring,boost::is_any_of(";"));
    int sideLength=std::stoi(strs[0]);
    for (std::size_t i = 1; i < strs.size()-1; i++){
        std::vector<std::string> strs2;
        boost::split(strs2,strs[i],boost::is_any_of(":"));
        std::vector<std::string> loc;
        boost::split(loc,strs2[0],boost::is_any_of(","));
        if (loc.size()<2){
            //std::array<std::string,2> a={strs2[0],strs2[1]}
            remainder.push_back(strs2);
            continue;
        }
        Triangle t=Triangle(std::stoi(loc[0]),std::stoi(loc[1]),std::stoi(strs2[1]));
        _moves.push_back(t);
    }
    //Board board(sideLength);
    tg.sideLength=sideLength;
    reset();
    moves=_moves;
    player=otherPlayer(moves.back().player);
    placeMoves();
    return remainder;
}
bool Board::isEye(Triangle loc){
    if (tg.get(loc.x,loc.y).alive()) return false;
    auto adj=tg.adjacent(loc);
    bool adjallsame=true;
    for (auto a:adj){
        //if (!move.sameTenantAs(a)){
        if (player!=a.player){
            adjallsame=false;
            break;
        }
    }
    if (adjallsame){
        auto adjg=tg.getGroup(adj[0]);
        bool adjconnected=true;
        for (int adji=1;adji<adj.size();adji++){
            if (!contains(adjg,adj[adji])){
                adjconnected=false;
                break;
            }
        }
        if (adjconnected) return true;
    }
    return false;
}
bool Board::placeRandomMove(){
    std::vector<Triangle> m2c;
    for (int yi=0;yi<tg.triangles.size();yi++){
        for (int xi=0;xi<tg.triangles[yi].size();xi++){
            Triangle m(xi,yi,player);
            if (isValidMove(m) && !isEye(m)){
                m2c.push_back(m);
            }
        }
    }
    if (m2c.empty()){
        placeMove(-1,-1);
        return false;
    }
    int r=rand()%m2c.size();
    return placeMove(m2c[r].x,m2c[r].y);
}
void Board::playRandomToEnd(){
    bool ppm=true;
    bool pm=true;
    for (int i=0;i<tg.sideLength*tg.sideLength*tg.sideLength;i++){
        pm=placeRandomMove();
        if (!ppm && !pm) return;
        ppm=pm;
    }
}
