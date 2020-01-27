#ifndef SHARKTRAINER_H
#define SHARKTRAINER_H
#include <string>
#include <memory>

#include <shark/Models/ConcatenatedModel.h>
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
    bool makeSimulationsData(std::string inputfile);
    RegressionDataset loadData(const std::string& dataFile,const std::string& labelFile);
    RegressionDataset examplesdataset;
    RegressionDataset simulationsdataset;
    RegressionDataset testdataset;
    void start();
    ConcatenatedModel<RealVector> model;
    void makeModel();
    void trainModel(RegressionDataset dataset, int iterations=100, double learningrate=0.001);
    void testModel();
    void saveModel();
    bool loadModel();
    void init();
    double evaluateMove(Board b,Triangle move);
    bool placeMove(Board &b);



    //DenseLayer layer1;
    //DenseLayer layer2;
    //LinearModel<RealVector> output;

    std::vector<std::shared_ptr<AbstractModel<RealVector,RealVector,RealVector>>> layers;

};

#endif // SHARKTRAINER_H
