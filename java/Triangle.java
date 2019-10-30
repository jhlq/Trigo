import java.util.ArrayList;

public class Triangle{
	int x;
	int y;
	int pixX;
	int pixY;
	int player;
	int prevPlayer;
	ArrayList<Triangle> captured=new ArrayList<Triangle>();
	boolean markedDead=false;
	public Triangle(int x,int y,int pixX,int pixY){
		this.x=x;
		this.y=y;
		this.pixX=pixX;
		this.pixY=pixY;
		this.player=0;
	}
	boolean alive(){
		return player>0 && !markedDead;
	}
	boolean sameAs(Triangle t){
		return this.player==t.player || ((this.markedDead||this.player==0)&&(t.markedDead||t.player==0));
	}
}
