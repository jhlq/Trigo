find_package (Boost COMPONENTS system filesystem unit_test_framework REQUIRED)
include_directories (../trigolib
                     ${Boost_INCLUDE_DIRS}
                     )
add_definitions (-DBOOST_TEST_DYN_LINK)

file(GLOB TEST_SRCS RELATIVE ${CMAKE_CURRENT_SOURCE_DIR} *.cpp)

#Run through each source
set(outputDir ${CMAKE_CURRENT_BINARY_DIR})
#set(outputDir ${CMAKE_CURRENT_SOURCE_DIR})
foreach(testSrc ${TEST_SRCS})
       #Extract the filename without an extension (NAME_WE)
       get_filename_component(testName ${testSrc} NAME_WE)

       #Add compile target
       add_executable(${testName} ${testSrc})

       #link to Boost libraries AND your targets and dependencies
       target_link_libraries(${testName} ${Boost_LIBRARIES} trigolib)

       #I like to move testing binaries into a testBin directory

       set_target_properties(${testName} PROPERTIES
           RUNTIME_OUTPUT_DIRECTORY  ${outputDir}/testBin)

       #Finally add it to test execution -
       #Notice the WORKING_DIRECTORY and COMMAND
       add_test(NAME ${testName}
                WORKING_DIRECTORY ${outputDir}/testBin
                COMMAND ${outputDir}/testBin/${testName} )
endforeach(testSrc)

