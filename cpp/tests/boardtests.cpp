#define BOOST_TEST_MODULE BoardTests
#include <boost/test/unit_test.hpp>

#include "board.h"

BOOST_AUTO_TEST_CASE(test0)
{
    Board board=Board(7);
    Triangle t=Triangle(1,1,1);
    BOOST_CHECK_EQUAL(board.isValidMove(t),true);
    t=Triangle(1,6,1);
    BOOST_CHECK_EQUAL(board.isValidMove(t),false);
    board.tg.set(1,0,2);
    t=Triangle(0,0,1);
    BOOST_CHECK_EQUAL(board.isValidMove(t),false);
}
BOOST_AUTO_TEST_CASE(test1)
{
    Board board=Board(7);
    Board bc=Board(board);
    bc.tg.set(0,0,1);
    BOOST_CHECK_EQUAL(board.tg.get(0,0).player,0);
}
BOOST_AUTO_TEST_CASE(test2)
{
    Board board=Board(7);
    bool b1=board.placeMove(1,0,1);
    bool b2=board.placeMove(0,0,2);
    BOOST_CHECK_EQUAL(b1,true);
    BOOST_CHECK_EQUAL(b2,false);
    BOOST_CHECK_EQUAL(board.tg.get(0,0).player,0);
}
BOOST_AUTO_TEST_CASE(test3)
{
    Board board=Board(7);
    board.placeMove(3,3);
    board.placeMove(4,3);
    board.placeMove(2,3);
    BOOST_CHECK_EQUAL(board.tg.get(3,3).player,1);
    BOOST_CHECK_EQUAL(board.tg.get(4,3).player,2);
    BOOST_CHECK_EQUAL(board.tg.get(2,3).player,1);
    Triangle t=board.tg.get(4,3);
    BOOST_CHECK_EQUAL(board.tg.liberties(t),2);
    t=board.tg.get(2,3);
    std::vector<Triangle> g=board.tg.getGroup(t);
    BOOST_CHECK_EQUAL(g.size(),2);
    BOOST_CHECK_EQUAL(board.tg.liberties(g),3);
}
BOOST_AUTO_TEST_CASE(test4)
{
    Board board=Board(7);
    board.placeMove(3,3,1);
    Triangle t=board.tg.get(3,3);
    BOOST_CHECK_EQUAL(board.tg.liberties(t),3);
    board.placeMove(4,3,2);
    BOOST_CHECK_EQUAL(board.tg.liberties(t),2);
    board.placeMove(2,3,2);
    BOOST_CHECK_EQUAL(board.tg.liberties(t),1);
    board.placeMove(2,4,2);
    BOOST_CHECK_EQUAL(board.tg.get(3,3).player,0);
    //BOOST_CHECK_EQUAL(board.tg.get(3,3).prevPlayer,1);
    //BOOST_CHECK_EQUAL(board.tg.get(2,4).captured.size(),1);
    BOOST_CHECK_EQUAL(board.captures[1],1);
    BOOST_CHECK_EQUAL(board.stones[1],3);
    BOOST_CHECK_EQUAL(board.stones[0],0);
}
BOOST_AUTO_TEST_CASE(testko)
{
    Board board=Board(7);
    board.placeMove(2,1);
    board.placeMove(1,0);
    board.placeMove(0,2);
    board.placeMove(1,1);
    board.placeMove(0,1);
    bool b=board.placeMove(1,1);
    BOOST_CHECK_EQUAL(b,false);
    BOOST_CHECK_EQUAL(board.tg.get(1,1).player,0);
}
BOOST_AUTO_TEST_CASE(testundo)
{
    Board board=Board(7);
    board.placeMove(2,1);
    board.undo();
    BOOST_CHECK_EQUAL(board.tg.get(2,1).player,0);
    BOOST_CHECK_EQUAL(board.player,1);
    board.placeMove(3,0);
    board.placeMove(4,0);
    board.placeMove(5,0);
    BOOST_CHECK_EQUAL(board.tg.get(4,0).player,0);
    BOOST_CHECK_EQUAL(board.stones[1],0);
    BOOST_CHECK_EQUAL(board.stones[0],2);
    board.undo();
    BOOST_CHECK_EQUAL(board.tg.get(4,0).player,2);
    BOOST_CHECK_EQUAL(board.stones[1],1);
    BOOST_CHECK_EQUAL(board.stones[0],1);
}
BOOST_AUTO_TEST_CASE(testscore)
{
    Board board=Board(7);
    board.placeMove(1,0);
    BOOST_CHECK_EQUAL(board.stones[0],1);
    board.placeMove(3,3);
    BOOST_CHECK_EQUAL(board.stones[1],1);
    board.score();
    BOOST_CHECK_EQUAL(board.territory[0],1);
    board.placeMove(0,6);
    board.placeMove(1,5);
    BOOST_CHECK_EQUAL(board.captures[1],1);
}
BOOST_AUTO_TEST_CASE(testmark)
{
    Board board=Board(7);
    board.placeMove(1,0);
    board.placeMove(3,3);
    board.placeMove(4,4);
    BOOST_CHECK_EQUAL(board.stones[0],2);
    board.markDeadStones(1,0);
    BOOST_CHECK_EQUAL(board.stones[0],0);
    BOOST_CHECK_EQUAL(board.captures[1],2);
    board.markDeadStones(1,0);
    BOOST_CHECK_EQUAL(board.stones[0],2);
    BOOST_CHECK_EQUAL(board.captures[1],0);
    board.markDeadStones(3,3);
    BOOST_CHECK_EQUAL(board.stones[1],0);
    BOOST_CHECK_EQUAL(board.captures[0],1);
    board.markDeadStones(1,0);
    BOOST_CHECK_EQUAL(board.stones[0],0);
    BOOST_CHECK_EQUAL(board.captures[1],2);
    board.markDeadStones(1,0);
    BOOST_CHECK_EQUAL(board.stones[1],0);
    BOOST_CHECK_EQUAL(board.captures[0],1);
    board.markDeadStones(3,3);
    BOOST_CHECK_EQUAL(board.stones[0],2);
    BOOST_CHECK_EQUAL(board.captures[1],0);
    BOOST_CHECK_EQUAL(board.stones[1],1);
    BOOST_CHECK_EQUAL(board.captures[0],0);
}
BOOST_AUTO_TEST_CASE(teststate)
{
    Board board=Board(7);
    board.placeMove(1,0);
    std::string s=board.state();
    BOOST_CHECK_EQUAL(s,"7;1,0,1;");
}
BOOST_AUTO_TEST_CASE(testcluster)
{
    Board board=Board(9);
    board.placeMove(2,1);
    board.placeMove(5,5);
    board.placeMove(4,1);
    std::vector<Triangle> c=board.tg.getCluster(2,1);
    int l=board.tg.liberties(c);
    BOOST_CHECK_EQUAL(l,5);
}
