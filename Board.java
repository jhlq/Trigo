import java.awt.Color;
import java.awt.Component;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Insets;
import java.awt.Point;
import java.awt.event.MouseEvent;
/*
import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
*/
import javax.swing.event.MouseInputListener;


import java.util.ArrayList;
import javax.swing.JButton;
import java.awt.event.*;  
import javax.swing.*; 
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridBagLayout;

public class Board {
	private JLabel label;

	private Point clickPoint, cursorPoint;
	TriangleGrid tg;
  
	int player;
	ArrayList<Triangle> capturesGreen=new ArrayList<Triangle>();
	ArrayList<Triangle> capturesBlue=new ArrayList<Triangle>();
	JLabel scoreGreen;
	JLabel scoreBlue;
	int greenCaptures;
	int blueCaptures;
  
  public int otherPlayer(){
	  if (player==1){
		  return 2;
	  } else {
		  return 1;
	  }
  }
  public void switchPlayer(){
	  this.player=otherPlayer();
  }

  private void buildUI(Container container) {
	//container.setLayout(new BoxLayout(container, BoxLayout.PAGE_AXIS));
	container.setLayout(new BorderLayout(2, 2));
	JButton buttonPass = new JButton("Pass");
	JButton buttonUndo = new JButton("Undo");
	JButton buttonReset = new JButton("Reset");
	//container.add(buttonPass);
	//container.add(buttonUndo);
	//container.add(buttonReset);
	JPanel panel = new JPanel();//new GridBagLayout());
	panel.setLayout(new BoxLayout(panel, BoxLayout.PAGE_AXIS));
	panel.add(buttonPass);
	panel.add(buttonUndo);
	panel.add(buttonReset);
	scoreGreen=new JLabel();
	scoreBlue=new JLabel();
	panel.add(scoreGreen);
	panel.add(scoreBlue);
	container.add(panel,BorderLayout.EAST);
	/*JToolBar toolBar = new JToolBar();
	toolBar.add(buttonPass);
	toolBar.add(buttonUndo);
	toolBar.add(buttonReset);
	container.add(toolBar);*/
	
	/*JPanel buttonPane = new JPanel();
	buttonPane.setLayout(new BoxLayout(buttonPane, BoxLayout.LINE_AXIS));
	buttonPane.add(buttonPass);
	buttonPane.add(buttonUndo);
	buttonPane.add(buttonReset);
	container.add(buttonPane,BorderLayout.CENTER);*/
	
	CoordinateArea coordinateArea = new CoordinateArea(this);
	this.tg=coordinateArea.tg;
	container.add(coordinateArea,BorderLayout.WEST);
	updateScore();
	 
	buttonPass.addActionListener(new ActionListener(){  
		public void actionPerformed(ActionEvent e){  
			if (coordinateArea.controller.player==1){
				coordinateArea.controller.player=2;
			} else { 
				coordinateArea.controller.player=1;
			}
		}  
	});
	buttonUndo.addActionListener(new ActionListener(){  
		public void actionPerformed(ActionEvent e){
			int last=coordinateArea.tg.clicked.size()-1;
			Triangle tri=coordinateArea.tg.clicked.get(last);
			int ncaptured=tri.captured.size();
			if (tri.player==1){
				greenCaptures-=ncaptured;
			} else if (tri.player==2){
				blueCaptures-=ncaptured;
			}
			for (int i=0;i<ncaptured;i++){
				Triangle ttri=tri.captured.get(i);
				ttri.player=ttri.prevPlayer;
				ttri.prevPlayer=0;
			}
			tri.player=0;
			tri.captured=new ArrayList<Triangle>();
			coordinateArea.tg.clicked.remove(last);
			coordinateArea.controller.switchPlayer();
			coordinateArea.repaint();
		}  
	});
	buttonReset.addActionListener(new ActionListener(){  
		public void actionPerformed(ActionEvent e){  
			greenCaptures=0;
			blueCaptures=0;
			coordinateArea.tg.setUpGrid();
			coordinateArea.repaint();
		}  
	});

	 label = new JLabel();
	 resetLabel();
	 container.add(label,BorderLayout.SOUTH);

	 coordinateArea.setAlignmentX(Component.LEFT_ALIGNMENT);
	 label.setAlignmentX(Component.LEFT_ALIGNMENT); // redundant
  }
  void updateScore(){
	  int gstones=0;
	  int bstones=0;
	  for (int y=0;y<tg.triangles.size();y++){
		  for (int x=0;x<tg.triangles.get(y).size();x++){
			  Triangle t=tg.triangles.get(y).get(x);
			  if (t.player==1){
				  gstones++;
			} else if (t.player==2){
				bstones++;
			}
		}
	}
	scoreGreen.setText("<html>Green:<br/>Stones "+gstones+"<br/>Captures "+greenCaptures+"</html>");
	scoreBlue.setText("<html>Blue:<br/>Stones "+bstones+"<br/>Captures "+blueCaptures+"</html>");
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
		text = "Click the cursor within the framed area.";
	 } else {

		if (this.tg.clicked.size()>0) {
			Triangle tri=this.tg.clicked.get(this.tg.clicked.size()-1);
			text += "The last click was at (" + tri.x + ", " + tri.y + "). ";
		}
/*
		if (cursorPoint != null) {
		  text += "The cursor is at (" + cursorPoint.x + ", " + cursorPoint.y + "). ";
		}
		*/
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

		addMouseListener(this);
		addMouseMotionListener(this);
		setBackground(Color.WHITE);
		setOpaque(true);
	 }

	 public Dimension getPreferredSize() {
		return preferredSize;
	 }

	 protected void paintComponent(Graphics g) {
		 controller.updateScore();
		// Paint background if we're opaque.
		if (isOpaque()) {
		  g.setColor(getBackground());
		  g.fillRect(0, 0, getWidth(), getHeight());
		}

		g.setColor(Color.GRAY);
		drawGrid(g);

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
			g.setColor(Color.WHITE);
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
	public void updateCaptures(ArrayList<Triangle> group,int capturingPlayer){
		if (!group.isEmpty()){
			int p=capturingPlayer;
			if (p==1){
				controller.greenCaptures+=group.size();
			} else if (p==2){
				controller.blueCaptures+=group.size();
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
							tg.removeGroup(g,tri);
							updateCaptures(g,tri.player);
						}
					}
					ArrayList<Triangle> group=tg.getGroup(tri);
					if (tg.liberties(group)==0){
						tg.removeGroup(group,tri);
						updateCaptures(group,tri.player);
					}
					breakLoop=true;
					break;
				}
			}
			if (breakLoop){
				break;
			}
		}
		controller.updateClickPoint(point);
		repaint();
	 }

	 public void mouseMoved(MouseEvent e) {
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
