import java.util.ArrayList;

public class Triangle{
	int x;
	int y;
	int pixX;
	int pixY;
	int player;
	int prevPlayer;
	ArrayList<Triangle> captured=new ArrayList<Triangle>();
	public Triangle(int x,int y,int pixX,int pixY){
		this.x=x;
		this.y=y;
		this.pixX=pixX;
		this.pixY=pixY;
		this.player=0;
	}
}
