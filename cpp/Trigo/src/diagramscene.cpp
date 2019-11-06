#include <QtWidgets>

#include "diagramscene.h"

DiagramScene::DiagramScene(QObject *parent) : QGraphicsScene(parent)
{

}

void DiagramScene::mouseReleaseEvent(QGraphicsSceneMouseEvent *event)
{
    if (event->button() == Qt::LeftButton) {
        int x=event->buttonDownScenePos(Qt::LeftButton).x();
        int y=event->buttonDownScenePos(Qt::LeftButton).y();
        int xnow=event->scenePos().x();
        int ynow=event->scenePos().y();
        int d=(xnow-x)*(xnow-x)+(ynow-y)*(ynow-y);
        if (d<50){
            emit released(x,y);
        }
    }
    QGraphicsScene::mouseReleaseEvent(event);
}
