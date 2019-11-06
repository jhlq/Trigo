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
    void makeData(std::string inputfile);
    RegressionDataset loadData(const std::string& dataFile,const std::string& labelFile);
    RegressionDataset dataset;
    void start();
    ConcatenatedModel<RealVector> model;
    void makeModel();
    void trainModel();
    void init();
    double evaluateMove(Board b,Triangle move);



    //DenseLayer layer1;
    //DenseLayer layer2;
    //LinearModel<RealVector> output;

    std::vector<std::shared_ptr<AbstractModel<RealVector,RealVector,RealVector>>> layers;

};

#endif // SHARKTRAINER_H
