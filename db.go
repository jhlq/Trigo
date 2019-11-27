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
func handleLobbyMessage(client *mongo.Client, message []byte,user string){
	var lm lobbyMessage
	json.Unmarshal(message,&lm)
	collection := client.Database("trigo").Collection("lobby")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	if lm.Op=="addGame" {
		_, err := collection.InsertOne(ctx, bson.M{"size": lm.Size,"id":lm.Id,"user":user})
		if (err!=nil){ log.Println(err) }
	} else if lm.Op=="joinGame" {
		var le lobbyEntry
		filter := bson.M{"id": lm.Id}
		err := collection.FindOne(ctx, filter).Decode(&le)
		if (err!=nil){ return }
		_, err = collection.DeleteOne(ctx, bson.M{"id": lm.Id})
		if (err!=nil){ log.Println(err) }
		addGame(client,le.Size,user,le.User)
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
func addGame(client *mongo.Client,size int,green string,blue string){
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	count, _ := collection.CountDocuments(ctx, bson.M{}, nil)
	_, err := collection.InsertOne(ctx, bson.M{"key": strconv.Itoa(int(count)),"size":size,"green":green,"blue":blue,"currentUser":green,"currentColor":"green"})
	if (err!=nil){ log.Println(err) }
}
type game struct{
	Key string
	Size int
	Green string
	Blue string
	CurrentUser string
	CurrentColor string
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
