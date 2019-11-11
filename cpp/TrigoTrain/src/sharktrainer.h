#ifndef SHARKTRAINER_H
#define SHARKTRAINER_H
#include <string>
#include <memory>

//#include <shark/Data/Csv.h>
//#include <shark/Algorithms/GradientDescent/CG.h>
#include <shark/Models/ConcatenatedModel.h>
//#include <shark/ObjectiveFunctions/ErrorFunction.h>
//#include <shark/ObjectiveFunctions/Loss/SquaredLoss.h>
#include <shark/Models/LinearModel.h>
#include <shark/Models/NeuronLayers.h>
using namespace shark;

class Board;
class Triangle;

typedef LinearModel<RealVector, FastSigmoidNeuron> DenseLayer;

class SharkTrainer
{
public:
    SharkTrainer();
    RealVector makeEvalVector(Board board,Triangle move);
    Board loadGame(std::string movesstring);
    void makeData(std::string inputfile);
    void makeSimulationsData(std::string inputfile);
    RegressionDataset loadData(const std::string& dataFile,const std::string& labelFile);
    RegressionDataset examplesdataset;
    RegressionDataset simulationsdataset;
    void start();
    ConcatenatedModel<RealVector> model;
    void makeModel();
    void trainModel(RegressionDataset dataset);
    void init();
    double evaluateMove(Board b,Triangle move);
    bool placeMove(Board &b);



    //DenseLayer layer1;
    //DenseLayer layer2;
    //LinearModel<RealVector> output;

    std::vector<std::shared_ptr<AbstractModel<RealVector,RealVector,RealVector>>> layers;

};

#endif // SHARKTRAINER_H
