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
    "strconv"
    "fmt"
)


func getClient() *mongo.Client{
	//client, err := mongo.NewClient(options.Client().ApplyURI("mongodb://localhost:27017"))
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
func insert(client *mongo.Client,item bson.M){
	collection := client.Database("testing").Collection("numbers")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	res, err := collection.InsertOne(ctx, item)
	id := res.InsertedID
	log.Println(id,err)
}
func addChatMessage(client *mongo.Client,message bson.M){
	collection := client.Database("testing").Collection("chat")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	_, err := collection.InsertOne(ctx, message)
	if (err!=nil){ log.Println(err) }
}
func addBoard(client *mongo.Client,key string,size int){
	collection := client.Database("testing").Collection("boards")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	_, err := collection.InsertOne(ctx, bson.M{"key": key, "size":size})
	if (err!=nil){ log.Println(err) }
	addOp(client,key,"loadGame "+strconv.Itoa(size)+";")
}
func addOp(client *mongo.Client,key string,op string){
	collection := client.Database("testing").Collection("boards")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	filter := bson.M{"key": bson.M{"$eq": key}}
	update := bson.M{"$push": bson.M{"ops": op}}
	_, err := collection.UpdateOne(ctx,filter,update)
	if (err!=nil){ log.Println(err) }
}
func getOps(client *mongo.Client,key string) []string {
	collection := client.Database("testing").Collection("boards")
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
	collection := client.Database("testing").Collection("chat")
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
func getN(client *mongo.Client, n int64) []string {
	collection := client.Database("testing").Collection("chat")
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
	   // do something with result....
	   //log.Println(result)
	   str := fmt.Sprintf("%v", result["message"])
	   s=append(s,str)
	}
	if err := cur.Err(); err != nil {
	  log.Println(err)
	}
	return s
}
func findOne(client *mongo.Client){
	collection := client.Database("testing").Collection("numbers")
	var result struct {
		Value float64
	}
	filter := bson.M{"name": "pi"}
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	err := collection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		log.Fatal(err)
	}
	// Do something with result...
	log.Println(result)
}
