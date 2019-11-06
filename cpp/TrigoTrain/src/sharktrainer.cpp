#include "sharktrainer.h"
#include <sstream>
#include <vector>
#include <fstream>
#include "board.h"
#include <iostream>
#include <boost/filesystem.hpp>

#include <boost/algorithm/string.hpp>

#include <clocale>  // std::setlocate

#include <shark/ObjectiveFunctions/ErrorFunction.h>//error function, allows for minibatch training
#include <shark/ObjectiveFunctions/Loss/SquaredLoss.h>
#include <shark/Algorithms/GradientDescent/Adam.h> //optimizer: simple gradient descent.
#include <shark/Data/Csv.h>
using namespace shark;

SharkTrainer::SharkTrainer()
{

}
/*RealVector SharkTrainer::makeEvalVector_old(Board board,Triangle move){
    int inputlength=board.tg.sideLength*board.tg.sideLength*6+3;
    RealVector input(inputlength,0);
    int n=0;
    bool hasKO=false;
    for (int yi=0;yi<board.tg.triangles.size();yi++){
        for (int xi=0;xi<board.tg.triangles[yi].size();xi++){
            Triangle t=board.tg.get(xi,yi);
            if (t==move){
                input[n]=1;
            } else if (t.player>0){
                if (t.player==move.player){
                    input[n+1]=1;
                } else {
                    input[n+2]=1;
                }
                //input[n+t.player]=1;
            } else {
                int imt=board.invalidMoveType(t.x,t.y,move.player);
                if (imt>1){
                    input[n+imt+1]=1;
                    if (imt==3){
                        hasKO=true;
                    }
                }
            }
            n+=6;
        }
    }
    if (hasKO){
        input[n]=1;
    }
    if (move.player==2){
        input[n+1]=1;
    }
    if (move.isPass()){
        input[n+2]=1;
    }
    return input;
}*/
RealVector SharkTrainer::makeEvalVector(Board board,Triangle move){
    std::vector<Triangle> inds=board.tg.adjacentIndsSpread(move,3);
    int inputlength=inds.size()*5;
    RealVector input(inputlength,0);
    int n=0;
    bool hasKO=false; //board.hasKO()?
    for (Triangle i:inds){
        if (board.tg.has(i)){
            Triangle t=board.tg.get(i.x,i.y);
            if (t.player>0){
                if (t.player==move.player){
                    input[n]=1;
                } else {
                    input[n+1]=1;
                }
            } else {
                int imt=board.invalidMoveType(t.x,t.y,move.player); //add imt for other player?
                if (imt>1){
                    input[n+imt]=1;
                    if (imt==3){
                        hasKO=true;
                    }
                }
            }
        } else {
            input[n+4]=1;
        }
        n+=5;
    }
    /*
    if (hasKO){
        input[n]=1;
    }
    if (move.player==2){
        input[n+1]=1;
    }
    if (move.isPass()){
        input[n+2]=1;
    }*/
    return input;
}
void SharkTrainer::makeData(std::string inputfile){
    std::ifstream file;
    file.open (inputfile);
    std::string line;
    std::vector< RealVector > arrays;
    std::vector<double> labels;
    std::setlocale(LC_ALL, "C"); // C uses "." as decimal-point separator
    if (file.is_open()){
        while (getline(file,line)){
            std::vector<Triangle> moves;
            double target;
            std::vector<std::string> strs;
            boost::split(strs,line,boost::is_any_of(";"));
            int sideLength=std::stoi(strs[0]);
            target=std::stod(strs[strs.size()-2]);
            labels.push_back(target);
            for (std::size_t i = 1; i < strs.size()-2; i++){
                std::vector<std::string> strs2;
                boost::split(strs2,strs[i],boost::is_any_of(","));
                Triangle t=Triangle(std::stoi(strs2[0]),std::stoi(strs2[1]),std::stoi(strs2[2]));
                moves.push_back(t);
            }
            Triangle markedmove=moves.back();
            moves.pop_back();
            Board board(sideLength);
            board.moves=moves;
            board.player=markedmove.player;
            board.placeMoves();
            arrays.push_back(makeEvalVector(board,markedmove));
        }
        file.close();
    }
    if (labels.size()>0){
        std::ofstream inputsfile;
        std::ofstream labelsfile;
        inputsfile.open("inputs.csv");
        labelsfile.open("labels.csv");
        labelsfile<<labels[0];
        for (int i=1;i<labels.size();i++){
            labelsfile<<"\n"<<labels[i];
        }
        //int inp [inputlength]=*(arrays[0]); //this got complicated and buggy...
        inputsfile<<arrays[0][0];
        int inputlength=arrays[0].size();
        for (int n=1;n<inputlength;n++){
            inputsfile<<","<<arrays[0][n];
        }
        for (int ai=1;ai<arrays.size();ai++){
            inputsfile<<"\n"<<arrays[ai][0];
            for (int n=1;n<inputlength;n++){
                inputsfile<<","<<arrays[ai][n];
            }
        }
        inputsfile.close();
        labelsfile.close();
    }
}
RegressionDataset SharkTrainer::loadData(const std::string& dataFile,const std::string& labelFile){
        //we first load two separate data files for the training inputs and the labels of the data point
        Data<RealVector> inputs;
        Data<RealVector> labels;
        try {
                importCSV(inputs, dataFile);
                importCSV(labels, labelFile);
        } catch (Exception exc) {
            boost::filesystem::path current_working_dir=boost::filesystem::current_path();
            std::cerr << "Unable to open file " <<  dataFile << " and/or " << labelFile <<
                             ". Check paths! Current dir is " << current_working_dir << " Exception: " <<exc.what()<< std::endl;
            exit(EXIT_FAILURE);
        }
        dataset=RegressionDataset(inputs,labels);
        return dataset;
}
void SharkTrainer::makeModel(){
    int hidden1=700;
    int hidden2=500;
    int hidden3=300;
    auto l1=std::make_shared<DenseLayer>(dataset.inputShape(),hidden1,true);
    auto l2=std::make_shared<DenseLayer>(l1->outputShape(),hidden2);
    auto l3=std::make_shared<DenseLayer>(l2->outputShape(),hidden3);
    auto o=std::make_shared<LinearModel<RealVector>>(l3->outputShape(),1);
    layers.push_back(l1);
    layers.push_back(l2);
    layers.push_back(l3);
    layers.push_back(o);
    model=*l1>>*l2>>*l3>>*o;
    initRandomNormal(model,0.001);
}
void SharkTrainer::trainModel(){
    SquaredLoss<> loss;
    ErrorFunction<> errorFunction(dataset, &model, &loss);//, true);//enable minibatch training
    //CG<> optimizer;
    Adam<> optimizer;
    optimizer.setEta(0.001);//learning rate of the algorithm
    errorFunction.init();
    optimizer.init(errorFunction);
    for(int i = 0; i < 100; ++i)
    {
            optimizer.step(errorFunction);
            std::cout<<i<<" "<<optimizer.solution().value<<std::endl;
    }
    model.setParameterVector(optimizer.solution().point);
}
void SharkTrainer::init(){
	std::ifstream f("trainingData.txt");
    if (!(f.good())){
		std::cout<<"No training data found. Copy the file trainingData.txt into your build directory or save some example moves and reinitialize."<<std::endl;
	} else {
		makeData("trainingData.txt");
		loadData("inputs.csv","labels.csv");
		makeModel();
		trainModel();
	}
}
void SharkTrainer::start(){
    /*
    SharkTrainer st;
    st.loadData("inputs.csv","labels.csv");
    std::cout<<"Loaded data."<<std::endl;
    st.makeModel();
    std::cout<<"Made model."<<std::endl;
    RealVector initpass({0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1});
    RealVector eval1=st.model(initpass);
    std::cout<<"Model eval: "<<eval1<<std::endl;
    //std::cout<<"Data: "<<st.dataset<<std::endl;
    st.trainModel();
    std::cout<<"Trained."<<std::endl;
    //RealVector initpass({0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1});
    //RealVector eval=st.model(initpass);
    RealVector eval=st.model(initpass);
    std::cout<<"Pass first? "<<eval<<std::endl;
    Board b(9);
    b.placeMove(3,3);
    RealVector p2=makeEvalVector(b,Triangle(-1,-1,2));
    eval=st.model(p2);
    std::cout<<"Pass second? "<<eval<<std::endl;
    */
}
double SharkTrainer::evaluateMove(Board b,Triangle move){
    RealVector rv=makeEvalVector(b,move);
    return model(rv)[0];
}
