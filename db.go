package main

import (
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/readpref"
    "go.mongodb.org/mongo-driver/mongo/options"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "context"
    "time"
    "log"
    "fmt"
    "encoding/json"
    "strconv"
    "strings"
)


func getClient() *mongo.Client{
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if (err!=nil){ log.Println(err) }
	return client
}
func ping(client *mongo.Client){
	ctx, _ := context.WithTimeout(context.Background(), 2*time.Second)
	err := client.Ping(ctx, readpref.Primary())
	if (err!=nil){ log.Println(err) }
}
func addChatMessage(client *mongo.Client,msg string){
	message:=bson.M{"message": msg}
	collection := client.Database("trigo").Collection("chat")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	_, err := collection.InsertOne(ctx, message)
	if (err!=nil){ log.Println(err) }
}
func boardExists(client *mongo.Client,key string) bool{
	collection := client.Database("trigo").Collection("boards")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	res := collection.FindOne(ctx, bson.M{"key":key})
	if (res.Err()!=nil){ return false }
	return true
}
func addBoard(client *mongo.Client,key string){
	collection := client.Database("trigo").Collection("boards")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	_, err := collection.InsertOne(ctx, bson.M{"key": key})
	if (err!=nil){ log.Println(err) }
}
func addOp(client *mongo.Client,c string,key string,op string){
	collection := client.Database("trigo").Collection(c)
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	filter := bson.M{"key": bson.M{"$eq": key}}
	update := bson.M{"$push": bson.M{"ops": op}}
	_, err := collection.UpdateOne(ctx,filter,update)
	if (err!=nil){ log.Println(err) }
}
func getOps(client *mongo.Client,c string,key string) []string {
	collection := client.Database("trigo").Collection(c)
	ctx, _ := context.WithTimeout(context.Background(), 30*time.Second)
	var result struct {
		Ops primitive.A
	}
	err := collection.FindOne(ctx, bson.M{"key":key}).Decode(&result)
	if err != nil { log.Println(err) }
	var ops []string
	for _,op := range(result.Ops){
		sop := fmt.Sprintf("%v", op)
		ops=append(ops,sop)
	}
	return ops
}
func printAll(client *mongo.Client){
	collection := client.Database("trigo").Collection("chat")
	ctx, _ := context.WithTimeout(context.Background(), 30*time.Second)
	cur, err := collection.Find(ctx, bson.D{})
	if err != nil { log.Println(err) }
	defer cur.Close(ctx)
	for cur.Next(ctx) {
	   var result bson.M
	   err := cur.Decode(&result)
	   if err != nil { log.Println(err) }
	   // do something with result....
	   log.Println(result)
	}
	if err := cur.Err(); err != nil {
	  log.Println(err)
	}
}
func getRecentMessages(client *mongo.Client, n int64) []string {
	collection := client.Database("trigo").Collection("chat")
	ctx, _ := context.WithTimeout(context.Background(), 30*time.Second)
	findOptions := options.Find()
	findOptions.SetLimit(n)
	findOptions.SetSort(bson.D{{"_id", -1}})
	cur, err := collection.Find(ctx, bson.D{},findOptions)
	if err != nil { log.Println(err) }
	defer cur.Close(ctx)
	var s []string
	for cur.Next(ctx) {
	   var result bson.M
	   err := cur.Decode(&result)
	   if err != nil { log.Println(err) }
	   str := fmt.Sprintf("%v", result["message"])
	   s=append(s,str)
	}
	if err := cur.Err(); err != nil {
	  log.Println(err)
	}
	return s
}
type lobbyMessage struct{
	Op string
	Size int
	Id string
}
type lobbyEntry struct{
	Size int
	Id string
	User string
}
func handleLobbyMessage(client *mongo.Client, message []byte,user string,h *GameHub){
	var lm lobbyMessage
	json.Unmarshal(message,&lm)
	collection := client.Database("trigo").Collection("lobby")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	if lm.Op=="addGame" {
		_, err := collection.InsertOne(ctx, bson.M{"size": lm.Size,"id":lm.Id,"user":user})
		if (err!=nil){
			log.Println(err)
			return
		}
		msg:=Door{"lobby","",message,user}
		h.broadcast<-msg
	} else if lm.Op=="joinGame" {
		var le lobbyEntry
		filter := bson.M{"id": lm.Id}
		err := collection.FindOne(ctx, filter).Decode(&le)
		if (err!=nil){
			msg:=Door{"lobby","",[]byte("{\"Op\":\"gameNotFound\"}"),user}
			h.toUser<-msg
			return
		}
		_, err = collection.DeleteOne(ctx, bson.M{"id": lm.Id})
		if (err!=nil){ log.Println("Error deleting lobby entry. ",err) }
		msg:=Door{"lobby","",message,user}
		h.broadcast<-msg
		addGame(client,le.Size,user,le.User,h)
	}
}
func getLobbyEntries(client *mongo.Client) []lobbyEntry {
	collection := client.Database("trigo").Collection("lobby")
	ctx, _ := context.WithTimeout(context.Background(), 30*time.Second)
	cur, err := collection.Find(ctx, bson.D{})
	if err != nil { log.Println(err) }
	defer cur.Close(ctx)
	var es []lobbyEntry
	for cur.Next(ctx) {
	   var result lobbyEntry
	   err := cur.Decode(&result)
	   if err != nil { log.Println(err) }
	   es=append(es,result)
	}
	if err := cur.Err(); err != nil {
	  log.Println(err)
	}
	return es
}
func addGame(client *mongo.Client,size int,green string,blue string,h *GameHub){
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	count, _ := collection.CountDocuments(ctx, bson.M{}, nil) //change to get count from GameHub
	key:=strconv.Itoa(int(count))
	_, err := collection.InsertOne(ctx, bson.M{"key": key,"size":size,"green":green,"blue":blue,"currentUser":green,"currentColor":"green","passed":false,"markDead":false,"done":false,"score":0,"winner":""})
	if (err!=nil){
		log.Println("Error adding game.",err)
	} else {
		msg:=Door{"lobby","",[]byte("{\"Op\":\"userToPlay\",\"Key\":\""+key+"\"}"),green}
		h.toUser<-msg
	}		
}
type game struct{
	Key string
	Size int
	Green string
	Blue string
	CurrentUser string
	CurrentColor string
	Passed bool
	MarkDead bool
	Done bool
	Score int
	Winner string
	//Ops []string
}
func getGame(client *mongo.Client,key string) (game,error){
	var g game
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	filter := bson.M{"key": key}
	err := collection.FindOne(ctx, filter).Decode(&g)
	return g,err
}
func userToPlay(client *mongo.Client,user string) []game{
	var gs []game
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 30*time.Second)
	filter := bson.M{"currentUser": user}
	cur, err := collection.Find(ctx, filter)
	if err != nil { log.Println(err) }
	for cur.Next(ctx) {
	   var result game
	   err = cur.Decode(&result)
	   if err != nil { log.Println(err) }
	   gs=append(gs,result)
	}
	return gs
}
func switchPlayer(client *mongo.Client,g game){
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	filter := bson.M{"key": bson.M{"$eq": g.Key}}
	cu:=g.Green
	cc:="green"
	if g.CurrentColor=="green"{
		cu=g.Blue
		cc="blue"
	}
	update := bson.M{"$set": bson.M{"currentUser": cu,"currentColor":cc} }
	_, err := collection.UpdateOne(ctx,filter,update)
	if (err!=nil){ log.Println(err) }
}
func updateGame(client *mongo.Client,key string,update bson.M){
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	filter := bson.M{"key": bson.M{"$eq": key}}
	_, err := collection.UpdateOne(ctx,filter,update)
	if (err!=nil){ log.Println(err) }
}
func handleGameMessage(client *mongo.Client, message Door,h *GameHub){
	g,err:=getGame(client,message.key)
	if (err!=nil){
		log.Println(err)
		return
	}
	if (g.Winner!=""){
		return
	}
	if (g.CurrentUser!=message.user){ //how to disable quick doublemoves?
		msg:=Door{"games",message.key,[]byte("notYourTurn"),message.user}
		h.toUser<-msg
		return
	}
	a:=strings.Split(string(message.message)," ")
	if (a[0]=="placeMove"){
		addOp(client,"games",message.key,string(message.message))
		x,_:=strconv.ParseInt(strings.Split(a[1],",")[0],10,64)
		isPass:=x<0
		var update bson.M
		if isPass{
			if g.Passed{
				update = bson.M{"$set": bson.M{"markDead": true} }
			} else {
				update = bson.M{"$set": bson.M{"passed": true} }
			}
			updateGame(client,g.Key,update)
		} else if g.Passed{
			if g.MarkDead{
				update = bson.M{"$set": bson.M{"passed": false,"markDead": false,"done":false} }
				addOp(client,"games",message.key,"markDead false")
				msg:=Door{"games",g.Key,[]byte("markDead false"),message.user}
				h.broadcast<-msg
				addOp(client,"games",message.key,"unmarkDeadStones")
				msg=Door{"games",g.Key,[]byte("unmarkDeadStones"),message.user}
				h.broadcast<-msg
			} else {
				update = bson.M{"$set": bson.M{"passed": false} }
			}
			updateGame(client,g.Key,update)
		}
		switchPlayer(client,g)
		h.broadcast<-message
		if isPass && g.Passed{
			addOp(client,"games",message.key,"markDead true")
			msg:=Door{"games",g.Key,[]byte("markDead true"),message.user}
			h.broadcast<-msg
		}
	} else if (g.MarkDead && a[0]=="markDeadStones"){
		addOp(client,"games",message.key,string(message.message))
		h.broadcast<-message
	} else if (g.MarkDead && a[0]=="done"){
		if g.Done{
			var winner string
			score,_:=strconv.ParseInt(a[1],10,64)
			if score>0&&g.Score>0{
				winner="green"
			} else if score<0&&g.Score<0{
				winner="blue"
			} else if score==0&&g.Score==0{
				winner="draw!"
			} else {
				winner="missmatch"
			}
			update := bson.M{"$set": bson.M{"winner": winner,"userToPlay":""} }
			updateGame(client,g.Key,update)
			addOp(client,"games",message.key,"winner "+winner)
			msg:=Door{"games",g.Key,[]byte("winner "+winner),message.user}
			h.broadcast<-msg
		} else {
			score,_:=strconv.ParseInt(a[1],10,64)
			update := bson.M{"$set": bson.M{"done": true,"score":score} }
			updateGame(client,g.Key,update)
			addOp(client,"games",message.key,string(message.message))
			h.broadcast<-message
		}
	}
}
