#include "screenboard.h"
#include <math.h>
#include <iostream>

#define PI 3.14159265

ScreenBoard::ScreenBoard(int sideLength, int _unitSize, int _offsetX, int _offsetY)
    : board(sideLength)
{
    unitSize=_unitSize;
    offsetX=_offsetX;
    offsetY=_offsetY;  
    setUpGrid();
}

ScreenTriangle ScreenBoard::makeTriangle(int x,int y){
    double ox=offsetX;
    double oy=offsetY;
    int remainder=x%2;
    int ex=x-remainder;
    if (remainder==1){ //this is off...
        ox+=l/2+(x/2)*l+(l/2)*y;
        oy+=h+(unitSize+h)*y;
    } else {
        ox+=(ex/2)*l+y*(l/2);
        oy+=(unitSize+h)*y;
    }
    return ScreenTriangle(x,y,ox,oy);
}
void ScreenBoard::setUpGrid(){
    h=unitSize*cos(PI/3);
    l=2*unitSize*cos(PI/6);
    int sideLength=board.tg.sideLength;
    triangles.clear();
    for (int yt = 0; yt < sideLength; yt++) {
        std::vector<ScreenTriangle> v;
        for (int xt = 0; xt <= 2*sideLength-2*yt-2; xt++) {
            v.push_back(makeTriangle(xt,yt));
        }
        triangles.push_back(v);
    }
}
void ScreenBoard::clickevent(int pixX, int pixY){
    int leny=triangles.size();
    bool breakLoop=false;
    for (int yt=0;yt<leny;yt++){
        int lenx=triangles[yt].size();
        for (int xt=0;xt<lenx;xt++){
            ScreenTriangle tri=triangles[yt][xt];
            double distance=sqrt(pow(tri.pixX-pixX,2)+pow(tri.pixY-pixY,2));
            if (distance<unitSize/2){
                breakLoop=true;
                if (board.tg.get(tri.x,tri.y).player==0){
                    bool success=board.placeMove(tri.x,tri.y);
                    if (success){
                        emit modifiedmoves();
                    }
                    break;
                } else {
                    board.markDeadStones(tri.x,tri.y);
                    emit modifiedmoves();
                }
            }
        }
        if (breakLoop){
            break;
        }
    }
}
void ScreenBoard::undo(){
    if (!board.moves.empty()){
        board.undo();
        emit modifiedmoves();
    }
}
void ScreenBoard::pass(){
    board.pass();
    emit modifiedmoves();
}
void ScreenBoard::score(){
    board.score();
    emit modifiedscore();
}
void ScreenBoard::estimatescore(){
    auto r=board.estimateScore();
    board.territory[0]=r[0];    //workaround to display scoreestimate...
    board.territory[1]=r[1];
    emit modifiedscore();
}
void ScreenBoard::autoMark(){
    board.autoMarkDeadStones();
    emit modifiedmoves();
}
void ScreenBoard::random(){
    //board.playRandomToEnd();
    //emit modifiedmoves();
    double scoresum=0;
    for (int i=0;i<100;i++){
        Board bc(board);
        bc.playRandomToEnd();
        bc.score();
        double score=bc.captures[0]+bc.stones[0]+bc.territory[0]-(bc.captures[1]+bc.stones[1]+bc.territory[1]+bc.komi);
        std::cout<<i<<": "<<score<<std::endl;
        scoresum+=score;
    }
    std::cout<<scoresum/100<<std::endl;
}
