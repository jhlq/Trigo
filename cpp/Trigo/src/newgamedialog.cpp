#include "newgamedialog.h"
#include "ui_newgamedialog.h"

NewGameDialog::NewGameDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NewGameDialog)
{
    ui->setupUi(this);
}

NewGameDialog::~NewGameDialog()
{
    delete ui;
}

void NewGameDialog::on_buttonBox_accepted()
{
    int sl=ui->spinBox->value();
    int us=ui->spinBoxUnit->value();
    emit makenewgame(sl,us);
}
