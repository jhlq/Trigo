#include "util.h"
//#include "triangle.h"

#include <algorithm>
/*
template<class C, class T>
bool contains(const C& v, const T& x) -> decltype(end(v), true)
{
    return end(v) != std::find(begin(v), end(v), x);
}
*/
template <typename T>
bool contains(std::vector<T> v,T t){
    return end(v) != std::find(begin(v), end(v), t);
}
