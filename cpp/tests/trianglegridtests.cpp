#define BOOST_TEST_MODULE TriangleGridTests
#include <boost/test/unit_test.hpp>
#include <cmath>
#include <vector>

#include "trianglegrid.h"

BOOST_AUTO_TEST_CASE(test0)
{
    int sideLength=7;
    TriangleGrid tg(sideLength);
    int ntriangles=tg.nTriangles();
    BOOST_CHECK_EQUAL(pow(sideLength,2),ntriangles);
}

BOOST_AUTO_TEST_CASE(test1)
{
    int sideLength=7;
    TriangleGrid tg(sideLength);
    Triangle t=tg.get(0,0);
    std::vector<Triangle> v=tg.adjacent(t);
    BOOST_CHECK_EQUAL(v.size(),1);
    t=tg.get(0,1);
    v=tg.adjacent(t);
    BOOST_CHECK_EQUAL(v.size(),2);
    t=tg.get(1,0);
    v=tg.adjacent(t);
    BOOST_CHECK_EQUAL(v.size(),3);
    BOOST_CHECK_EQUAL(tg.has(0,sideLength-1),true);
    BOOST_CHECK_EQUAL(tg.has(0,sideLength),false);
    BOOST_CHECK_EQUAL(tg.has(2*sideLength-2,0),true);
    BOOST_CHECK_EQUAL(tg.has(2*sideLength-1,0),false);
}
BOOST_AUTO_TEST_CASE(test2)
{
    int sideLength=7;
    TriangleGrid tg(sideLength);
    Triangle t=tg.get(0,0);
    std::vector<Triangle> v=tg.adjacent(t);
    std::vector<Triangle> v2=tg.adjacent(v);
    BOOST_CHECK_EQUAL(v2.size(),3);
    t=tg.get(0,1);
    v=tg.adjacent(t);
    v2=tg.adjacent(v);
    BOOST_CHECK_EQUAL(v2.size(),5);
    t=tg.get(1,0);
    v=tg.adjacent(t);
    v2=tg.adjacent(v);
    BOOST_CHECK_EQUAL(v2.size(),3);
}
BOOST_AUTO_TEST_CASE(test3)
{
    int sideLength=7;
    TriangleGrid tg(sideLength);
    tg.set(0,0,1);
    tg.set(1,0,1);
    tg.set(2,0,1);
    tg.set(0,1,1);
    Triangle t=tg.get(1,0);
    std::vector<Triangle> v=tg.adjacentPieces(t);
    BOOST_CHECK_EQUAL(v.size(),3);
    v=tg.adjacentPieces(v);
    BOOST_CHECK_EQUAL(v.size(),1);
}
BOOST_AUTO_TEST_CASE(test4)
{
    int sideLength=7;
    TriangleGrid tg(sideLength);
    Triangle t=tg.get(0,0);
    std::vector<Triangle> v=tg.getConnected(t);
    BOOST_CHECK_EQUAL(v.size(),sideLength*sideLength);
}
BOOST_AUTO_TEST_CASE(test5)
{
    int sideLength=7;
    TriangleGrid tg(sideLength);
    tg.set(0,0,1);
    tg.set(1,0,1);
    tg.set(2,0,1);
    tg.set(0,1,1);
    Triangle t=tg.get(1,0);
    std::vector<Triangle> v=tg.getGroup(t);
    BOOST_CHECK_EQUAL(v.size(),4);
}
BOOST_AUTO_TEST_CASE(test6)
{
    int sideLength=7;
    TriangleGrid tg(sideLength);
    tg.set(0,0,1);
    tg.set(5,0,1);
    tg.set(0,5,1);
    Triangle t=tg.get(0,0);
    std::vector<Triangle> v=tg.getCluster(t);
    BOOST_CHECK_EQUAL(v.size(),3);
}
BOOST_AUTO_TEST_CASE(test7)
{
    int sideLength=7;
    TriangleGrid tg(sideLength);
    tg.set(0,0,1);
    tg.set(4,0,1);
    tg.set(1,3,1);
    Triangle t=tg.get(0,0);
    BOOST_CHECK_EQUAL(tg.liberties(t),1);
    t=tg.get(4,0);
    BOOST_CHECK_EQUAL(tg.liberties(t),2);
    t=tg.get(1,3);
    BOOST_CHECK_EQUAL(tg.liberties(t),3);
    tg.set(2,3,1);
    std::vector<Triangle> v=tg.getGroup(t);
    BOOST_CHECK_EQUAL(v.size(),2);
    BOOST_CHECK_EQUAL(tg.adjacent(v).size(),4);
    BOOST_CHECK_EQUAL(tg.liberties(v),4);
    //Triangle capturer=Triangle(1,0);
    tg.removeGroup(v);
    BOOST_CHECK_EQUAL(tg.get(1,5).player,0);
}
BOOST_AUTO_TEST_CASE(testspread)
{
    int sideLength=9;
    TriangleGrid tg(sideLength);
    std::vector<Triangle> sp=tg.adjacentIndsSpread(Triangle(0,0),1);
    BOOST_CHECK_EQUAL(sp.size(),3);
    sp=tg.adjacentIndsSpread(Triangle(0,0),2);
    BOOST_CHECK_EQUAL(sp.size(),9);
    sp=tg.adjacentIndsSpread(Triangle(0,0),3);
    BOOST_CHECK_EQUAL(sp.size(),18);
    sp=tg.adjacentIndsSpread(Triangle(0,0),4);
    BOOST_CHECK_EQUAL(sp.size(),30);
    sp=tg.adjacentIndsSpread(Triangle(0,0),5);
    BOOST_CHECK_EQUAL(sp.size(),45);
    sp=tg.adjacentIndsSpread(Triangle(1,0),1);
    BOOST_CHECK_EQUAL(sp.size(),3);
    sp=tg.adjacentIndsSpread(Triangle(1,0),2);
    BOOST_CHECK_EQUAL(sp.size(),9);
    sp=tg.adjacentIndsSpread(Triangle(1,0),3);
    BOOST_CHECK_EQUAL(sp.size(),18);
    sp=tg.adjacentIndsSpread(Triangle(1,0),4);
    BOOST_CHECK_EQUAL(sp.size(),30);
    sp=tg.adjacentIndsSpread(Triangle(1,0),5);
    BOOST_CHECK_EQUAL(sp.size(),45);
}
