#ifndef TRIANGLEGRID_H
#define TRIANGLEGRID_H

#include <vector>
#include <string>
#include "triangle.h"

class TriangleGrid
{
public:
    std::vector<std::vector<Triangle>> triangles; //change this to 1D array for performance? Nah, iterating over it is performed in various places
    TriangleGrid(int sideLength);
    Triangle get(int x,int y);
    void set(int x,int y,int player);
    bool has(int x,int y);
    int sideLength;
    void setUpGrid();
    int nTriangles();
    std::vector<Triangle> adjacent(int x,int y);
    std::vector<Triangle> adjacent(const Triangle &triangle);
    std::vector<Triangle> adjacent(const std::vector<Triangle> &group);
    std::vector<Triangle> adjacentPieces(const Triangle &tri);
    std::vector<Triangle> adjacentPieces(const std::vector<Triangle> &group);
    std::vector<Triangle> getConnected(const Triangle &tri);
    std::vector<Triangle> getConnectedSpace(std::vector<Triangle> cluster);
    std::vector<Triangle> getGroup(const Triangle &tri);
    std::vector<Triangle> getCluster(const std::vector<Triangle> &group);
    std::vector<Triangle> getCluster(int x,int y);
    std::vector<Triangle> getCluster(const Triangle &tri);
    int liberties(const std::vector<Triangle> &group);
    int liberties(const Triangle &tri);
    void removeGroup(std::vector<Triangle> &group);
    std::string historyString();
};

#endif // TRIANGLEGRID_H
