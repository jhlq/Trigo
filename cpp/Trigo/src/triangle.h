#ifndef TRIANGLE_H
#define TRIANGLE_H


class Triangle
{
public:
    Triangle(int x,int y);
    Triangle(int x,int y,int player);
    int x;
    int y;
    int player;
    bool markedDead;

    bool alive();
    bool isPass();
    bool sameTenantAs(const Triangle &t);
    bool operator==(const Triangle& t);
};

#endif // TRIANGLE_H
