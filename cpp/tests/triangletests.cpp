#define BOOST_TEST_MODULE TriangleTests
#include <boost/test/unit_test.hpp>

#include "triangle.h"

BOOST_AUTO_TEST_CASE(test0)
{
    Triangle t1=Triangle(1,2);
    t1.player=1;
    Triangle t2=Triangle(3,2);
    t2.player=2;
    BOOST_CHECK_EQUAL(t1.sameTenantAs(t2), false);

    t2.markedDead=true;
    BOOST_CHECK_EQUAL(t1.sameTenantAs(t2), false);
    t1.player=0;
    BOOST_CHECK_EQUAL(t1.sameTenantAs(t2), true);

    BOOST_CHECK_EQUAL(t1.alive(), false);
    BOOST_CHECK_EQUAL(t2.alive(), false);
}


