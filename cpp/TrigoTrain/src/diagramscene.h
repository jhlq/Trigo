#ifndef DIAGRAMSCENE_H
#define DIAGRAMSCENE_H

#include <QObject>
#include <QGraphicsScene>


class DiagramScene : public QGraphicsScene
{
    Q_OBJECT

public:
    DiagramScene(QObject *parent = 0);

signals:
    //void itemMoved(DiagramItem *movedItem, const QPointF &movedFromPosition);
    void released(int x,int y);

protected:
    //void mousePressEvent(QGraphicsSceneMouseEvent *event) Q_DECL_OVERRIDE;
    void mouseReleaseEvent(QGraphicsSceneMouseEvent *event) Q_DECL_OVERRIDE;

};

#endif // DIAGRAMSCENE_H
