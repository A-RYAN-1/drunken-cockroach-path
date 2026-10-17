/*Necessary library inclusion graphics library for graphical representation*/
#include <iostream> 
#include <graphics.h>
#include <string> 
using namespace std; 
#define N 8
/* Global declaration of box and sol2 
box contains the internal mid-point (x,y) of the grahical screen which is made up of 64 tiles
each tile corresponds to a matrix row and column whose mid-points are stored inside the box
sol2 contains the path tracing of cockroach within the matrix i.e. tiles 
*/
int box[8][8][2];
int sol2[8][8];
/*Standard Node definition*/
class node
{
	public:
		int x;/*stores x Coordinate for matrix*/
		int y;/*stores y Coordinate for matrix*/
		int num;/*stores the step Number*/
		node* next=NULL;
	node(int x1,int y1, int num1)/*Constructor*/
	{
		x=x1;
		y=y1;
		num=num1;
	}
};
/*Standard linear Linked list defination*/
class link
{
	public:
	node* head=NULL;	
	/*Empty construtor*/
	link()
	{}
	/*Parameterized constructor
	Takes coordinates and step Number as parameters and creates head node*/
	link(int x, int y, int num)
	{
		node *n=new node(x,y,num);
		head=n;
	}
	/*Insertion function to add node to linked list which contains step Number and coordinates*/
	void insert(int x, int y, int num)
	{
		node *n= new node(x,y,num);
		node *temp=head;
		/*If the head is Null then it saves node as head*/
		if(head==NULL)
		{
			head=n;
			return;
		}/*Loop runs until it finds its end and stores the node at the end*/
		while(temp->next!=NULL)
		{
			temp=temp->next;
		}
		temp->next=n;
	}
	/*Displays Entire linked list*/
	void dis()
	{
		node* temp=head;
		while(temp->next!=NULL)
		{
			cout<<temp->x<<" "<<temp->y<<" "<<temp->num;
			cout<<"\n";
			temp=temp->next;
		}
		cout<<temp->x<<" "<<temp->y<<" "<<temp->num;
	}
		/*
		Sorts the linked list based on steps and swaps data to sort it Uses Simple sort
		It sorts based on Step count
		Starts from 1st element and compares it with the next element if greater then swaps both elements until the end
		*/
		void sort()
		{	
			node *temp=head;
			node *temp2;
			node *min;
			int tempx,tempy,tempnum;
			while(temp!=NULL)
			{	
				temp2=temp->next;
				min=temp;
				while(temp2!=NULL)
				{
					if(temp2->num<min->num)
					{
						min=temp2;
					}
					temp2=temp2->next;
				}
				tempx=temp->x;
				tempy=temp->y;
				tempnum=temp->num;
				temp->x=min->x;
				temp->y=min->y;
				temp->num=min->num;
				min->x=tempx;
				min->y=tempy;
				min->num=tempnum;
				temp=temp->next;
			}
		}
		/*Color function is used to fill boxes using the sorted linked list which contains coordinates and step count */
		void color()
	{
		node* temp=head;
		int x,y;/*stores matrix row and columns i.e coordinates*/
		int a,b;/*used to align the numbers that are shown within each tile at the center*/
		delay(1000);
		while(temp!=NULL)
		{
			x=temp->x;
			y=temp->y;
			char numStr[32];
    		sprintf(numStr, "%d", temp->num); 
    		setfillstyle(SOLID_FILL, YELLOW);/*used to select filling color*/
			floodfill(box[x][y][0], box[x][y][1], GREEN);/*Used to fill color inside the tiles to show the path*/
			setfillstyle(SOLID_FILL, BLUE);/*used to select filling color*/
			floodfill(box[x][y][0], box[x][y][1], GREEN);/*Used to fill color inside the tiles to show the path*/
			setcolor(RED);/*Sets the color to red for lines and circle*/
			if(temp->num>9)/*Used to align text*/
			{
				a=15;
			}
			else
			{
				a=10;
			}
			b=10;
    		circle(box[x][y][0],box[x][y][1],20);/*Draws cicle*/
    		setcolor(GREEN);/*Sets the color to green*/
    		settextstyle(TRIPLEX_FONT, HORIZ_DIR, 2);  /*Used to set text type*/
    		outtextxy(box[x][y][0]-a,box[x][y][1]-b,numStr);/*Used to display text i.e is step count*/
			delay(150);
			temp=temp->next;
		}
	}
		
};
int solveKTUtil(int x, int y, int movei, int sol[N][N], 
        int xMove[], int yMove[]); /*function declaration*/


int isSafe(int x, int y, int sol[N][N]) /*keeps the cockroach within bound*/
{ 
  return (x >= 0 && x < N && y >= 0 && y < N 
      && sol[x][y] == -1); 
} 

void printSolution(int sol[N][N]) /*used to print solution*/
{ 
  for (int x = 0; x < N; x++) { 
    for (int y = 0; y < N; y++) 
     {
    	 sol2[x][y]=sol[x][y];
	 }
  } 
} 

int solveKT(int x,int y) /*solves the path of the cockroach*/
{ 
  int sol[N][N]; 

  for (int x = 0; x < N; x++) 
    for (int y = 0; y < N; y++) 
      sol[x][y] = -1; 

  int xMove[8] = { -1, 0, 1, -1, 1, -1, 0, 1}; 
  int yMove[8] = {  1, 1, 1, 0, 0, -1, -1, -1 }; 

  sol[x][y] = 0;

  if (solveKTUtil(x, y, 1, sol, xMove, yMove) == 0) { 
    cout << "Solution does not exist"; 
    return 0; 
  } 
  else
    printSolution(sol); 

  return 1; 
} 

int solveKTUtil(int x, int y, int movei, int sol[N][N], 
        int xMove[8], int yMove[8]) /*recursion and backtracking to solve the path*/
{ 
  int k, next_x, next_y; 
  if (movei == N * N) 
    return 1; 
  for (k = 0; k < 8; k++) { 
    next_x = x + xMove[k]; 
    next_y = y + yMove[k]; 
    if (isSafe(next_x, next_y, sol)) { 
      sol[next_x][next_y] = movei; 
      if (solveKTUtil(next_x, next_y, movei + 1, sol, 
              xMove, yMove) 
        == 1) 
        return 1; 
      else

        sol[next_x][next_y] = -1; 
    } 
  } 
  return 0; 
} 
void createboard()/*Graphically creates the tiles */
{
	int cellWidth = getmaxx() / 8;
    int cellHeight = getmaxy() / 8;

    for (int i = 0; i < 8; i++) {
        for (int j = 0; j < 8; j++) {
            int x1 = j * cellWidth;
            int y1 = i * cellHeight;
            int x2 = x1 + cellWidth;
            int y2 = y1 + cellHeight;
			setcolor(GREEN);
            rectangle(x1, y1, x2, y2);

            int fillX = (x1 + x2) / 2; /*used to calculate internal point*/
            int fillY = (y1 + y2) / 2; 
			box[i][j][0]=fillX;
			box[i][j][1]=fillY;
        }
    }

    //delay(5000);
}

 
int main() 
{  
	int x,y;/*takes cell number as input*/
    cout<<"Enter Cell number : ";
    cout<<"\n";
    cout<<"0<=Y,X<8";
    cout<<"\n";
    cout<<"x :";
    cin>>x;
    cout<<"y :";
    cin>>y;
    int gd = DETECT, gm;
    initgraph(&gd, &gm,NULL);
    createboard();
    link l1;
    solveKT(x,y);/*function call*/
    for(int i=0;i<8;i++)
    {
    	for(int j=0;j<8;j++)
    	{
    		l1.insert(i,j,sol2[i][j]);/*stores the matrix solution within a linked list so that it can be easily sorted*/
		}
	}
	l1.sort();
	delay(500);
	l1.color();
	getch();		
  	closegraph();
  	return 0; 
} 
