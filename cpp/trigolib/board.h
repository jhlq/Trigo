#ifndef BOARD_H
#define BOARD_H

#include <string>
#include <vector>
#include "trianglegrid.h"
#include <array>

struct InfluenceTriangle{
    double border=0;
    double green=0;
    double blue=0;
};

class Board
{
public:
    Board(int sideLength);
    TriangleGrid tg;
    int player;
    void reset();
    int invalidMoveType(int x,int y,int player);
    int invalidMoveType(const Triangle &t);
    bool isValidMove(int x,int y,int player);
    bool isValidMove(const Triangle &t);
    int otherPlayer();
    int otherPlayer(int p);
    void switchPlayer();
    bool placeMove(int x,int y);
    bool placeMove(int x,int y,int player);
    std::vector<Triangle> moves;
    std::string state();
    void placeMoves();
    void undo();
    void pass();
    void score();
    void markDeadStones(int x,int y);
    void markDeadStones(const Triangle &tri);
    void markDeadStones(std::vector<Triangle> c);
    bool tryCaptureCluster(std::vector<Triangle> cluster,int maxit=100);
    void autoMarkDeadStones();
    std::vector<std::string> history;
    int stones[2];
    int captures[2];
    int territory[2];
    double komi;

    std::vector<std::vector<InfluenceTriangle>> influence;
    void initInfluence();
    void resetInfluence();
    void normalizeInfluence();
    void spreadInfluence(Triangle tri,int range=3);
    void spreadInfluence(int range=3);
    std::array<double,2> estimateScore(bool reset=true,int range=3);
private:
    void removeCapturedBy(const Triangle tri);
};

#endif // BOARD_H
