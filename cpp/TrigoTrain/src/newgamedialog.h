#ifndef NEWGAMEDIALOG_H
#define NEWGAMEDIALOG_H

#include <QDialog>

namespace Ui {
class NewGameDialog;
}

class NewGameDialog : public QDialog
{
    Q_OBJECT

public:
    explicit NewGameDialog(QWidget *parent = 0);
    ~NewGameDialog();

private slots:
    void on_buttonBox_accepted();
signals:
    void makenewgame(int sideLength,int unitSize);

private:
    Ui::NewGameDialog *ui;
};

#endif // NEWGAMEDIALOG_H
