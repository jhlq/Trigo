#include "triangle.h"

Triangle::Triangle(int x,int y)
{
    this->x=x;
    this->y=y;
    this->player=0;
    this->markedDead=false;
}
Triangle::Triangle(int x,int y,int player)
{
    this->x=x;
    this->y=y;
    this->player=player;
    this->markedDead=false;
}
bool Triangle::isPass(){
    if (x<0){
        return true;
    }
    return false;
}
bool Triangle::alive(){
    return player>0 && !markedDead;
}
bool Triangle::sameTenantAs(const Triangle &t){
    //return this->player==t.player || ((this->markedDead||this->player==0)&&(t.markedDead||t.player==0));
    return (this->player==t.player&&!this->markedDead&&!t.markedDead) || ((this->markedDead||this->player==0)&&(t.markedDead||t.player==0));
}

bool Triangle::operator==(const Triangle& t)
{
    return this->x == t.x && this->y == t.y;
}
