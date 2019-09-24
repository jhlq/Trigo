import java.awt.Color;
import java.awt.Component;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Insets;
import java.awt.Point;
import java.awt.event.MouseEvent;

import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.event.MouseInputListener;

import java.util.ArrayList;
//import javax.swing.JButton;

public class Board {
  private JLabel label;

  private Point clickPoint, cursorPoint;
  
  int player;

  private void buildUI(Container container) {
	 container.setLayout(new BoxLayout(container, BoxLayout.PAGE_AXIS));
	 
	 //JButton buttonPass = new JButton("Pass");

	 CoordinateArea coordinateArea = new CoordinateArea(this);
	 container.add(coordinateArea);

	 label = new JLabel();
	 resetLabel();
	 container.add(label);

	 coordinateArea.setAlignmentX(Component.LEFT_ALIGNMENT);
	 label.setAlignmentX(Component.LEFT_ALIGNMENT); // redundant
  }

  public void updateCursorLocation(int x, int y) {
	 if (x < 0 || y < 0) {
		cursorPoint = null;
		updateLabel();
		return;
	 }

	 if (cursorPoint == null) {
		cursorPoint = new Point();
	 }

	 cursorPoint.x = x;
	 cursorPoint.y = y;
	 updateLabel();
  }

  public void updateClickPoint(Point p) {
	 clickPoint = p;
	 updateLabel();
  }

  public void resetLabel() {
	 cursorPoint = null;
	 updateLabel();
  }

  protected void updateLabel() {
	 String text = "";

	 if ((clickPoint == null) && (cursorPoint == null)) {
		text = "Click or move the cursor within the framed area.";
	 } else {

		if (clickPoint != null) {
		  text += "The last click was at (" + clickPoint.x + ", " + clickPoint.y + "). ";
		}

		if (cursorPoint != null) {
		  text += "The cursor is at (" + cursorPoint.x + ", " + cursorPoint.y + "). ";
		}
	 }

	 label.setText(text);
  }

  public static void main(String[] args) {
	 JFrame frame = new JFrame("Trigo");
	 frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

	 Board controller = new Board();
	 controller.buildUI(frame.getContentPane());

	 frame.pack();
	 frame.setVisible(true);
  }

  public static class CoordinateArea extends JComponent implements MouseInputListener {
	 Point point = null;

	 Board controller;
	 TriangleGrid tg;

	 Dimension preferredSize = new Dimension(700, 600);

	 Color gridColor;

	 public CoordinateArea(Board controller) {
		this.controller = controller;
		this.controller.player=1;
		this.tg=new TriangleGrid();

		// Add a border of 5 pixels at the left and bottom,
		// and 1 pixel at the top and right.
		//setBorder(BorderFactory.createMatteBorder(1, 5, 5, 1, Color.RED));

		addMouseListener(this);
		addMouseMotionListener(this);
		setBackground(Color.WHITE);
		setOpaque(true);
	 }

	 public Dimension getPreferredSize() {
		return preferredSize;
	 }

	 protected void paintComponent(Graphics g) {
		// Paint background if we're opaque.
		if (isOpaque()) {
		  g.setColor(getBackground());
		  g.fillRect(0, 0, getWidth(), getHeight());
		}

		g.setColor(Color.GRAY);
		drawGrid(g);
		/*
		// If user has chosen a point, paint a small dot on top.
		if (point != null) {
		  g.setColor(getForeground());
		  //g.fillRect(point.x - 3, point.y - 3, 7, 7);
		  g.setColor(Color.RED);
		  double ovalSize=tg.gridSpace/2;
		  g.fillOval((int)(point.x-ovalSize/2),(int)(point.y-ovalSize/2), (int)ovalSize, (int)ovalSize);
		}
		*/
		int nclicked=this.tg.clicked.size();
		double ovalSize=tg.gridSpace/2;
		for (int n=0;n<nclicked;n++){
			Triangle tri=this.tg.clicked.get(n);
			if (tri.player==0){
				continue;
			} else if (tri.player==1){
				g.setColor(Color.GREEN);
			} else if (tri.player==2){
				g.setColor(Color.BLUE);
			}
			g.fillOval((int)(tri.pixX-ovalSize/2),(int)(tri.pixY-ovalSize/2), (int)ovalSize, (int)ovalSize);
		}
		if (nclicked>0 && this.tg.clicked.get(nclicked-1).player>0){
			Triangle tri=this.tg.clicked.get(nclicked-1);
			g.setColor(Color.BLACK);
			double ovalSize2=ovalSize/3;
			g.fillOval((int)(tri.pixX-ovalSize2/2),(int)(tri.pixY-ovalSize2/2), (int)ovalSize2, (int)ovalSize2);
		}
	 }

	 private void drawGrid(Graphics g) {
		
		
		int ylen=tg.triangles.size();
		//System.out.println(ylen);
		for (int yt = 0; yt < ylen; yt++){
			int xlen=tg.triangles.get(yt).size();
			for (int xt=0;xt<xlen;xt++){
				Triangle tri=tg.triangles.get(yt).get(xt);
				ArrayList<Triangle> adj=tg.adjacent(tri);
				for (int a=0;a<adj.size();a++){
					g.drawLine(tri.pixX,tri.pixY,adj.get(a).pixX,adj.get(a).pixY);
				}
			}
		}
	 }

	 // Methods required by the MouseInputListener interface.
	 public void mouseClicked(MouseEvent e) {
		int x = e.getX();
		int y = e.getY();
		if (point == null) {
		  point = new Point(x, y);
		} else {
		  point.x = x;
		  point.y = y;
		}
		controller.updateClickPoint(point);
		int leny=this.tg.triangles.size();
		boolean breakLoop=false;
		for (int yt=0;yt<leny;yt++){
			int lenx=this.tg.triangles.get(yt).size();
			for (int xt=0;xt<lenx;xt++){
				Triangle tri=this.tg.triangles.get(yt).get(xt);
				double distance=Math.sqrt(Math.pow(tri.pixX-x,2)+Math.pow(tri.pixY-y,2));
				if (distance<this.tg.gridSpace/3 && tri.player==0){
					tri.player=this.controller.player;
					if (this.controller.player==1){
						this.controller.player=2;
					} else {
						this.controller.player=1;
					}
					this.tg.clicked.add(tri);
					ArrayList<Triangle> adj=tg.adjacent(tri);
					for (int a=0;a<adj.size();a++){
						ArrayList<Triangle> g=tg.getGroup(adj.get(a));
						if (tg.liberties(g)==0){
							tg.removeGroup(g);
						}
					}
					ArrayList<Triangle> group=tg.getGroup(tri);
					if (tg.liberties(group)==0){
						tg.removeGroup(group);
					}
					breakLoop=true;
					break;
				}
			}
			if (breakLoop){
				break;
			}
		}
		repaint();
	 }

	 public void mouseMoved(MouseEvent e) {
		controller.updateCursorLocation(e.getX(), e.getY());
	 }

	 public void mouseExited(MouseEvent e) {
		controller.resetLabel();
	 }

	 public void mouseReleased(MouseEvent e) {
	 }

	 public void mouseEntered(MouseEvent e) {
	 }

	 public void mousePressed(MouseEvent e) {
	 }

	 public void mouseDragged(MouseEvent e) {
	 }
  }
}
