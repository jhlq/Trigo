#include "mainwindow.h"
#include "ui_mainwindow.h"

#include "diagramscene.h"
#include "screenboard.h"
#include "newgamedialog.h"
#include <QGraphicsItem>

//#include <iostream>

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    screenboard=new ScreenBoard(9,30);
    diagramScene = new DiagramScene();
    diagramScene->setSceneRect(QRect(0, 0, 700, 600));

    //connect all screenboard, remember to add changes in makeNewGame also
    connect(diagramScene, SIGNAL(released(int,int)),this->screenboard,SLOT(clickevent(int,int)));
    connect(screenboard, SIGNAL(modifiedmoves()),this,SLOT(placemoves()));
    connect(screenboard, SIGNAL(modifiedscore()),this,SLOT(updatescore()));
    QPushButton *undoButton=this->findChild<QPushButton*>("undoButton");
    connect(undoButton, SIGNAL(clicked()),screenboard,SLOT(undo()));
    QPushButton *passButton=this->findChild<QPushButton*>("passButton");
    connect(passButton, SIGNAL(clicked()),screenboard,SLOT(pass()));
    QPushButton *scoreButton=this->findChild<QPushButton*>("scoreButton");
    connect(scoreButton, SIGNAL(clicked()),screenboard,SLOT(score()));
    QPushButton *amButton=this->findChild<QPushButton*>("autoMarkButton");
    connect(amButton, SIGNAL(clicked()),screenboard,SLOT(autoMark()));


    QPushButton *ngButton=this->findChild<QPushButton*>("newGameButton");
    connect(ngButton, SIGNAL(clicked()),this,SLOT(newGameButtonClicked()));


    QGraphicsView *view=this->findChild<QGraphicsView*>("graphicsView");
    view->setScene(diagramScene);
    drawGrid();

}

MainWindow::~MainWindow()
{
    delete ui;
}
void MainWindow::addCircle(int x,int y,int player)
{
    QGraphicsEllipseItem *circle=new QGraphicsEllipseItem();
    double us=screenboard->unitSize;
    circle->setRect(x-us/2,y-us/2,us,us);
    if (player==1){
        circle->setBrush(Qt::green);
    } else if (player==2){
        circle->setBrush(Qt::blue);
    } else {
        circle->setBrush(Qt::red);
    }
    diagramScene->addItem(circle);
}
void MainWindow::drawGrid(){
    int ylen=screenboard->triangles.size();
    for (int yt = 0; yt < ylen; yt++){
        int xlen=screenboard->triangles[yt].size();
        for (int xt=0;xt<xlen;xt++){
            ScreenTriangle tri=screenboard->triangles[yt][xt];
            std::vector<Triangle> adj=screenboard->board.tg.adjacent(tri.x,tri.y);
            for (int a=0;a<adj.size();a++){
                //g.drawLine(tri.pixX,tri.pixY,adj.get(a).pixX,adj.get(a).pixY);
                ScreenTriangle adja=screenboard->triangles[adj[a].y][adj[a].x];
                QGraphicsLineItem *l=new QGraphicsLineItem(tri.pixX,tri.pixY,adja.pixX,adja.pixY);
                diagramScene->addItem(l);
            }
        }
    }
}
void MainWindow::updatescore(){
    std::string s="Green: "+std::to_string(screenboard->board.stones[0])+" stones, "+
            std::to_string(screenboard->board.captures[0])+" captures and "+
            std::to_string(screenboard->board.territory[0])+" territory.\n";
    s+="Blue: "+std::to_string(screenboard->board.stones[1])+" stones, "+
            std::to_string(screenboard->board.captures[1])+" captures and "+
            std::to_string(screenboard->board.territory[1])+" territory.\n";
    QLabel *scorelabel=this->findChild<QLabel*>("scoreLabel");
    scorelabel->setText(QString::fromStdString(s));
}
void MainWindow::placemoves(){
    diagramScene->clear();
    drawGrid();
    int ylen=screenboard->triangles.size();
    for (int yt = 0; yt < ylen; yt++){
        int xlen=screenboard->triangles[yt].size();
        for (int xt=0;xt<xlen;xt++){
            ScreenTriangle tri=screenboard->triangles[yt][xt];
            Triangle t=screenboard->board.tg.get(tri.x,tri.y);
            if (t.player>0){
                addCircle(tri.pixX,tri.pixY,t.player);
                if (t.markedDead){
                    QGraphicsEllipseItem *circle=new QGraphicsEllipseItem();
                    double s=screenboard->unitSize/2;
                    circle->setRect(tri.pixX-s/2,tri.pixY-s/2,s,s);
                    circle->setBrush(QColor::fromRgbF(1, 0, 0, 1));
                    diagramScene->addItem(circle);
                }
            }
        }
    }
    if (!screenboard->board.moves.empty()){
        Triangle t=screenboard->board.moves.back();//[screenboard->board.moves.size()-1];
        if (!t.isPass()){
            QGraphicsEllipseItem *circle=new QGraphicsEllipseItem();
            double s=screenboard->unitSize/3;
            ScreenTriangle st=screenboard->triangles[t.y][t.x];
            circle->setRect(st.pixX-s/2,st.pixY-s/2,s,s);
            circle->setBrush(QColor::fromRgbF(1, 1, 1, 1)); //QColor::fromRgbF(0, 1, 0, 1)
            diagramScene->addItem(circle);
            //std::cout<<screenboard->board.tg.getConnectedSpace(screenboard->board.tg.getCluster(t)).size()<<std::endl;
        }
    }

    updatescore();
}
void MainWindow::newGameButtonClicked(){
    newGameDialog = new NewGameDialog(this);
    connect(newGameDialog, SIGNAL(makenewgame(int,int)),this,SLOT(makeNewGame(int,int)));
    newGameDialog->show();
}
void MainWindow::makeNewGame(int sideLength,int unitSize){
    delete screenboard;
    screenboard=new ScreenBoard(sideLength,unitSize);
    connect(diagramScene, SIGNAL(released(int,int)),this->screenboard,SLOT(clickevent(int,int)));
    connect(screenboard, SIGNAL(modifiedmoves()),this,SLOT(placemoves()));
    connect(screenboard, SIGNAL(modifiedscore()),this,SLOT(updatescore()));
    QPushButton *undoButton=this->findChild<QPushButton*>("undoButton");
    connect(undoButton, SIGNAL(clicked()),screenboard,SLOT(undo()));
    QPushButton *passButton=this->findChild<QPushButton*>("passButton");
    connect(passButton, SIGNAL(clicked()),screenboard,SLOT(pass()));
    QPushButton *scoreButton=this->findChild<QPushButton*>("scoreButton");
    connect(scoreButton, SIGNAL(clicked()),screenboard,SLOT(score()));
    QPushButton *amButton=this->findChild<QPushButton*>("autoMarkButton");
    connect(amButton, SIGNAL(clicked()),screenboard,SLOT(autoMark()));
    diagramScene->clear();
    drawGrid();
    updatescore();
}
