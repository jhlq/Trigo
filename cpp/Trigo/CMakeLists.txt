cmake_minimum_required(VERSION 3.0.0 FATAL_ERROR)
project(Trigo)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Qt5 COMPONENTS REQUIRED Core Gui Widgets)

set(CMAKE_INCLUDE_CURRENT_DIR ON)

enable_testing ()
add_subdirectory (../tests tests)
add_subdirectory (src) 
add_subdirectory (../trigolib lib) 

