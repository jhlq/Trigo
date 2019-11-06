#include <QApplication>
#include "mainwindow.h"


int main(int argc, char *argv[]){
	
    //SharkTrainer st;
    //st.makeData(9,"trainingData.txt","");
    //SharkTrainer::makeData(9,"trainingData.txt","");
    //st.start();

	QApplication a(argc, argv);
	MainWindow w;

    w.st.init();

	w.show();
	return a.exec();
}

