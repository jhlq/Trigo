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
RealVector SharkTrainer::makeEvalVector(Board board,Triangle move){
    //assumes board.spreadInfluence() has been called
    std::vector<Triangle> inds=board.tg.adjacentIndsSpread(move,5);
    int inputlength=inds.size()*7+2;
    RealVector input(inputlength,0);
    if (move.isPass()) return input;
    if (board.player==1){
        input[0]=board.influence[move.y][move.x].green;
        input[1]=board.influence[move.y][move.x].blue;
    } else if (board.player==2){
        input[0]=board.influence[move.y][move.x].blue;
        input[1]=board.influence[move.y][move.x].green;
    }
    int n=2;
    bool hasKO=false; //board.hasKO()? must factor in value of KO..
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
            if (board.player==1){
                input[n+4]=board.influence[t.y][t.x].green;
                input[n+5]=board.influence[t.y][t.x].blue;
            } else if (board.player==2){
                input[n+4]=board.influence[t.y][t.x].blue;
                input[n+5]=board.influence[t.y][t.x].green;
            }
        } else {
            input[n+6]=1;
        }
        n+=7;
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
            double target;
            std::vector<std::string> strs;
            boost::split(strs,line,boost::is_any_of(";"));
            target=std::stod(strs[strs.size()-2]);
            Board board(0);
            board.loadGame(line);
            Triangle markedmove=board.moves.back();
            board.undo();
            board.spreadInfluence();
            if (markedmove.isPass() && target>0){
                target=-target;
                for (int yi=0;yi<board.tg.triangles.size();yi++){
                    for (int xi=0;xi<board.tg.triangles[yi].size();xi++){
                        Triangle move(xi,yi,markedmove.player);
                        if (board.isValidMove(move)){
                            arrays.push_back(makeEvalVector(board,move));
                            labels.push_back(target);
                        }
                    }
                }
            } else {
                arrays.push_back(makeEvalVector(board,markedmove));
                labels.push_back(target);
            }
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
bool SharkTrainer::makeSimulationsData(std::string inputfile){
    std::ifstream file;
    file.open (inputfile);
    std::string line;
    std::vector< RealVector > arrays;
    std::vector<double> labels;
    //std::setlocale(LC_ALL, "C"); // C uses "." as decimal-point separator //handled in loadGame
    int lineit=0;
    if (file.is_open()){
        double target;
        while (getline(file,line)){
            //std::cout<<++lineit<<std::endl;
            Board b(0);
            b.loadGame(line);
            int nm=b.moves.size();
            for (int i=0;i<nm;i++){
				Triangle markedmove=b.moves.back();
				b.undo();
                if (markedmove.isPass()){
                    if (i<3){
                        b.spreadInfluence();
                        target=-0.5;
                        for (int yi=0;yi<b.tg.triangles.size();yi++){
                            for (int xi=0;xi<b.tg.triangles[yi].size();xi++){
                                Triangle move(xi,yi,markedmove.player);
                                if (b.isValidMove(move)){
                                    arrays.push_back(makeEvalVector(b,move));
                                    labels.push_back(target);
                                }
                            }
                        }
                    }
                } else {
                    b.spreadInfluence();
                    target=0.5;
                    arrays.push_back(makeEvalVector(b,markedmove));
                    labels.push_back(target);
                }
			}
        }
        file.close();
    } else {
		return false;
	}
    if (labels.size()>0){
        std::ofstream inputsfile;
        std::ofstream labelsfile;
        inputsfile.open("simulationsinputs.csv");
        labelsfile.open("simulationslabels.csv");
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
    return true;
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
        auto _dataset=RegressionDataset(inputs,labels);
        return _dataset;
}
void SharkTrainer::makeModel(){
    int hidden1=examplesdataset.inputShape().numElements()/2;
    int hidden2=hidden1/3;
    int hidden3=9;
    auto l1=std::make_shared<DenseLayer>(examplesdataset.inputShape(),hidden1,true);
    auto l2=std::make_shared<DenseLayer>(l1->outputShape(),hidden2,true);
    auto l3=std::make_shared<DenseLayer>(l2->outputShape(),hidden3,true);
    auto o=std::make_shared<LinearModel<RealVector>>(l3->outputShape(),1);
    layers.push_back(l1);
    layers.push_back(l2);
    layers.push_back(l3);
    layers.push_back(o);
    model=*l1>>*l2>>*l3>>*o;
    initRandomNormal(model,0.001);
}
void SharkTrainer::trainModel(RegressionDataset dataset, int iterations,double learningrate){
    std::cout<<"Training model..."<<std::endl;
    SquaredLoss<> loss;
    ErrorFunction<> errorFunction(dataset, &model, &loss, true);//enable minibatch training
    //CG<> optimizer;
    Adam<> optimizer;
    optimizer.setEta(learningrate);//learning rate of the algorithm
    errorFunction.init();
    optimizer.init(errorFunction);
    for(int i = 0; i < iterations; ++i)
    {
            optimizer.step(errorFunction);
            std::cout<<i<<" "<<optimizer.solution().value<<std::endl;
    }
    model.setParameterVector(optimizer.solution().point);
}
void SharkTrainer::init(){
    srand(time(NULL)); //for random moves
	std::ifstream f("trainingData.txt");
    if (!(f.good())){
		std::cout<<"No training data found. Copy the file trainingData.txt into your build directory or save some example moves and reinitialize."<<std::endl;
	} else {
        std::cout<<"Compiling examples..."<<std::endl;
        makeData("trainingData.txt");   //Change to ../trainingData.txt? Saving moves saves to build, which seems proper
        examplesdataset=loadData("inputs.csv","labels.csv");
		makeModel();
        loadModel();
        trainModel(examplesdataset);
        std::cout<<"Compiling simulations..."<<std::endl;
        bool made=makeSimulationsData("../../../data/simulations.txt");
        if (!made){
			std::cout<<"No simulations found, run generateTrainingData.js with node."<<std::endl;
		} else {
            std::cout<<"Loading simulations... ";
            simulationsdataset=loadData("simulationsinputs.csv","simulationslabels.csv");
            testdataset=splitAtElement(simulationsdataset,static_cast<std::size_t>(0.9*simulationsdataset.numberOfElements()));
            std::cout<<"Done."<<std::endl;
            //trainModel(simulationsdataset);
        }
	}
}
void SharkTrainer::testModel(){
    SquaredLoss<> loss;
    Data<RealVector> expredictions = model(examplesdataset.inputs());
    double extestError = loss.eval(examplesdataset.labels(),expredictions);
    std::cout<<"Examples test error: "<<extestError<<std::endl;
    Data<RealVector> predictions = model(testdataset.inputs());
    double testError = loss.eval(testdataset.labels(),predictions);
    std::cout<<"Simulations test error: "<<testError<<std::endl;
}
void SharkTrainer::saveModel(){
    std::ofstream ofs("ann.model");
    boost::archive::polymorphic_text_oarchive oa(ofs);
    model.write(oa);
    ofs.close();
}
bool SharkTrainer::loadModel(){
    std::ifstream ifs("ann.model");
    if (!ifs.good()) return false;
    boost::archive::polymorphic_text_iarchive ia(ifs);
    model.read(ia);
    ifs.close();
    return true;
}

double SharkTrainer::evaluateMove(Board b,Triangle move){ //remember to spread influence with board first
    RealVector rv=makeEvalVector(b,move);
    return model(rv)[0];
}
bool SharkTrainer::placeMove(Board &b){
    std::vector<Triangle> m2c;
    b.spreadInfluence();
    for (int yi=0;yi<b.tg.triangles.size();yi++){
        for (int xi=0;xi<b.tg.triangles[yi].size();xi++){
            Triangle m(xi,yi,b.player);
            if (b.isValidMove(m) && !b.isEye(m)){
                double ev=evaluateMove(b,m);
                if (ev>=0.1){
                    int n=ev*10;
                    for (int i=0;i<n;i++){
                        m2c.push_back(m);
                    }
                }
            }
        }
    }
    if (m2c.empty()){
        b.placeMove(-1,-1);
        return false;
    }
    int r=rand()%m2c.size();
    return b.placeMove(m2c[r].x,m2c[r].y);
}
