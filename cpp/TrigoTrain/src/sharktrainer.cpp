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
Board SharkTrainer::loadGame(std::string movesstring){		//should be moved to trigolib. Moved, deprecated
	std::setlocale(LC_ALL, "C"); // C uses "." as decimal-point separator
	std::vector<Triangle> moves;
	std::vector<std::string> strs;
	boost::split(strs,movesstring,boost::is_any_of(";"));
	int sideLength=std::stoi(strs[0]);
	for (std::size_t i = 1; i < strs.size()-1; i++){
		std::vector<std::string> strs2;
		boost::split(strs2,strs[i],boost::is_any_of(":"));
		std::vector<std::string> loc;
		boost::split(loc,strs2[0],boost::is_any_of(","));
		if (loc.size()<2){
			continue;
		}
		Triangle t=Triangle(std::stoi(loc[0]),std::stoi(loc[1]),std::stoi(strs2[1]));
		moves.push_back(t);
	}
	Board board(sideLength);
	board.moves=moves;
	board.player=board.otherPlayer(board.moves.back().player);
	board.placeMoves();
	return board;
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
            //std::vector<Triangle> moves;
            double target;
            std::vector<std::string> strs;
            boost::split(strs,line,boost::is_any_of(";"));
            //int sideLength=std::stoi(strs[0]);
            target=std::stod(strs[strs.size()-2]);
            //labels.push_back(target);
            /*for (std::size_t i = 1; i < strs.size()-2; i++){
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
            board.placeMoves();*/
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
void SharkTrainer::makeSimulationsData(std::string inputfile){
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
            std::cout<<++lineit<<std::endl;
            //if (lineit>1) break;
            Board b=loadGame(line);
            b.spreadInfluence();
            int nm=b.moves.size();
            for (int i=0;i<nm;i++){
				Triangle markedmove=b.moves.back();
				b.undo();
                if (i<3 && markedmove.isPass()){
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
                } else {
					b.spreadInfluence();
                    target=0.5;
                    arrays.push_back(makeEvalVector(b,markedmove));
                    labels.push_back(target);
                }
			}
        }
        file.close();
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
void SharkTrainer::trainModel(RegressionDataset dataset){
    std::cout<<"Training model..."<<std::endl;
    SquaredLoss<> loss;
    ErrorFunction<> errorFunction(dataset, &model, &loss, true);//enable minibatch training
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
    srand(time(NULL)); //for random moves
	std::ifstream f("trainingData.txt");
    if (!(f.good())){
		std::cout<<"No training data found. Copy the file trainingData.txt into your build directory or save some example moves and reinitialize."<<std::endl;
	} else {
        std::cout<<"Compiling examples..."<<std::endl;
        makeData("trainingData.txt");   //Change to ../trainingData.txt? Saving moves saves to build, which seems proper
        examplesdataset=loadData("inputs.csv","labels.csv");
		makeModel();
        trainModel(examplesdataset);
        //std::cout<<"Compiling simulations..."<<std::endl;
        //makeSimulationsData("../../../data/simulations.txt");
        std::ifstream f2("simulationsinputs.csv");
        if (f.good()){
            std::cout<<"Loading simulations..."<<std::endl;
            simulationsdataset=loadData("simulationsinputs.csv","simulationslabels.csv");
            trainModel(simulationsdataset);
        }
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
double SharkTrainer::evaluateMove(Board b,Triangle move){ //remember to spread influence with board first
    RealVector rv=makeEvalVector(b,move);
    return model(rv)[0];
}
/*bool SharkTrainer::isEye(Board b,Triangle move){
    auto adj=b.tg.adjacent(move);
    bool adjallsame=true;
    for (auto a:adj){
        //if (!move.sameTenantAs(a)){
        if (move.player!=a.player){
            adjallsame=false;
            break;
        }
    }
    if (adjallsame){
        auto adjg=b.tg.getGroup(adj[0]);
        bool adjconnected=true;
        for (int adji=1;adji<adj.size();adji++){
            if (!contains(adjg,adj[adji])){
                adjconnected=false;
                break;
            }
        }
        if (adjconnected) return true;
    }
    return false;
}*/
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
