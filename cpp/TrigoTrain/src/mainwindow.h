#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>

#include "sharktrainer.h"


class DiagramScene;
class NewGameDialog;
class ScreenBoard;
//class SharkTrainer;

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();
    //double unitSize;
    SharkTrainer st;

private:
    Ui::MainWindow *ui;

private slots:
    void addCircle(int x,int y,int player);
    void addCircle(int x,int y,double sizemod,double r,double g,double b, double o);
    void drawGrid();
    void placeMoves();
    void updatescore();
    void newGameButtonClicked();
    void makeNewGame(int sideLength,int unitSize);
    void letAIPlay();
    void saveTrainingExample();
    void evaluateMove();
    void plotAllEvaluations();
    void trainOnExamples();
    void trainOnSimulations();
    void testModel();
    void saveModel();
    void reinitializest();

private:
    DiagramScene *diagramScene;
    ScreenBoard *screenboard;
    NewGameDialog *newGameDialog;

};

#endif // MAINWINDOW_H
