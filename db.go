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
	Ruleset string
	Metal float64
}
type lobbyEntry struct{
	Size int
	Id string
	Ruleset string
	User string
	MetalStake float64
}
func handleLobbyMessage(client *mongo.Client, message []byte,user string,h *GameHub){
	var lm lobbyMessage
	json.Unmarshal(message,&lm)
	collection := client.Database("trigo").Collection("lobby")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	if lm.Op=="addGame" {
		if lm.Size<1 || lm.Size>999{
			msg:=Door{"lobby","",[]byte("{\"Op\":\"log\",\"Msg\":\"Invalid size.\"}"),user}
			h.toUser<-msg
			return
		}
		if lm.Metal<0 || (lm.Metal>0 && lm.Metal>getMetal(client,user)){
			return
		}
		if lm.Metal>0{
			modMetal(client,user,-lm.Metal)
		}
		_, err := collection.InsertOne(ctx, bson.M{"size": lm.Size,"id":lm.Id,"ruleset": lm.Ruleset,"user":user,"metalStake":lm.Metal})
		if (err!=nil){
			log.Println(err)
			return
		}
		msg:=Door{"lobby","",message,user}
		h.broadcast<-msg
	} else if lm.Op=="joinGame" || lm.Op=="removeGame"{
		var le lobbyEntry
		filter := bson.M{"id": lm.Id}
		err := collection.FindOne(ctx, filter).Decode(&le)
		if (err!=nil){
			msg:=Door{"lobby","",[]byte("{\"Op\":\"log\",\"Msg\":\"Entry not found.\"}"),user}
			h.toUser<-msg
			return
		}
		if lm.Op=="joinGame"{
			if le.MetalStake>getMetal(client,user){
				msg:=Door{"lobby","",[]byte("{\"Op\":\"log\",\"Msg\":\"Not enough metal.\"}"),user}
				h.toUser<-msg
				return
			}
		}
		_, err = collection.DeleteOne(ctx, bson.M{"id": lm.Id})
		if (err!=nil){ log.Println("Error deleting lobby entry. ",err) }
		msg:=Door{"lobby","",message,user}
		h.broadcast<-msg
		if lm.Op=="joinGame"{
			msg:=Door{"lobby","",[]byte("{\"Op\":\"incMetal\",\"Metal\":"+fmt.Sprintf("%g", -le.MetalStake)+"}"),user}
			h.toUser<-msg
			addGame(client,le,user,h)
			modMetal(client,user,-le.MetalStake)
		} else if lm.Op=="removeGame"{
			modMetal(client,user,le.MetalStake)
			msg:=Door{"lobby","",[]byte("{\"Op\":\"incMetal\",\"Metal\":"+fmt.Sprintf("%g", le.MetalStake)+"}"),user}
			h.toUser<-msg
		}
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
func countGames() int{
	collection:=getClient().Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	count, _ := collection.CountDocuments(ctx, bson.M{}, nil)
	return int(count)
}
func u2pop(g *game) []byte{
	return []byte("{\"Op\":\"userToPlay\",\"Key\":\""+g.Key+"\",\"Ruleset\":\""+g.Ruleset+"\",\"Metal\":"+fmt.Sprintf("%g", g.MetalStake)+",\"RemainingTime\":"+strconv.Itoa(remainingTime(g))+"}")
}
func addGame(client *mongo.Client,le lobbyEntry,green string,h *GameHub){
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	c:=make(chan int)
	h.gameCount<-c
	count:=<-c
	key:=strconv.Itoa(count)
	day:=86400
	timelimit:=5*day
	tt:=day
	deadline:=int(time.Now().Unix())+timelimit
	_, err := collection.InsertOne(ctx, bson.M{"key": key,"size":le.Size,"green":green,"blue":le.User,"deadline":deadline,"remainingTime":timelimit,"maxTime":timelimit,"turnTime":tt,"currentUser":green,"currentColor":"green","passed":false,"markDead":false,"done":false,"ruleset":le.Ruleset,"score":0,"winner":"","metalStake":le.MetalStake})
	if (err!=nil){
		log.Println("Error adding game.",err)
	} else {
		if le.Ruleset!="Hybrid"{
			addOp(client,"games",key,"ruleset "+le.Ruleset)
		}
		g,_:=getGame(client,key)
		h.addGame<-g
		msg:=Door{"lobby","",u2pop(g),g.CurrentUser}
		h.toUser<-msg
	}		
}
type game struct{ //capitalize?
	Key string
	Size int
	Green string
	Blue string
	Deadline int
	RemainingTime int
	TurnTime int
	MaxTime int
	CurrentUser string
	CurrentColor string
	Passed bool
	MarkDead bool
	Done bool
	Ruleset string
	Score int
	Winner string
	Wintype string
	MetalStake float64
	//Ops []string
}
func getGame(client *mongo.Client,key string) (*game,error){
	var g game
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	filter := bson.M{"key": key}
	err := collection.FindOne(ctx, filter).Decode(&g)
	return &g,err
}
func getGames(client *mongo.Client,filter bson.M) []*game{
	var ga []*game
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 30*time.Second)
	cur, err := collection.Find(ctx, filter)
	if err != nil { log.Println(err) }
	for cur.Next(ctx) {
	   var result game
	   err = cur.Decode(&result)
	   if err != nil { log.Println(err) }
	   ga=append(ga,&result)
	}
	return ga
}
func updateGame(client *mongo.Client,key string,update bson.M){
	collection := client.Database("trigo").Collection("games")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	filter := bson.M{"key": bson.M{"$eq": key}}
	_, err := collection.UpdateOne(ctx,filter,update)
	if (err!=nil){ log.Println(err) }
}
func setWinner(client *mongo.Client,g *game,winner string,wintype string,h *GameHub){
	if winner==""{ //for timeout and resignation
		if g.CurrentColor=="green"{
			winner="blue"
		} else if g.CurrentColor=="blue"{
			winner="green"
		}
	}
	swin:="winner "+winner+" "+wintype
	msg:=Door{"games",g.Key,[]byte(swin),""}
	h.broadcast<-msg
	update := bson.M{"$set": bson.M{"winner": winner,"wintype":wintype,"currentUser":""} }
	updateGame(client,g.Key,update)
	addOp(client,"games",g.Key,swin)
	msg=Door{"lobby","",[]byte("{\"Op\":\"userPlayed\",\"Key\":"+g.Key+"}"),g.CurrentUser}
	h.toUser<-msg
	if winner=="draw!"{
		m:=1.5*g.MetalStake
		if m==0{
			m=0.75
		}
		msg=Door{"lobby","",[]byte("{\"Op\":\"incMetal\",\"Metal\":"+fmt.Sprintf("%g", m)+"}"),g.Green}
		h.toUser<-msg
		modMetal(client,g.Green,m)
		msg=Door{"lobby","",[]byte("{\"Op\":\"incMetal\",\"Metal\":"+fmt.Sprintf("%g", m)+"}"),g.Blue}
		h.toUser<-msg
		modMetal(client,g.Blue,m)
	} else if winner=="missmatch"{
		log.Println("Missmatch in game "+g.Key)
	} else {
		var winuser string
		if winner=="blue"{
			winuser=g.Blue
		} else if winner=="green"{
			winuser=g.Green
		}
		m:=2*g.MetalStake
		if m==0 && getMetal(client,winuser)<100{
			m=1
		}
		msg=Door{"lobby","",[]byte("{\"Op\":\"incMetal\",\"Metal\":"+fmt.Sprintf("%g", m)+"}"),winuser}
		h.toUser<-msg
		modMetal(client,winuser,m)
	}
}
func getMetal(client *mongo.Client,user string) float64{
	collection := client.Database("trigo").Collection("users")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	res := collection.FindOne(ctx, bson.M{"user":user})
	if (res.Err()!=nil){
		_, err := collection.InsertOne(ctx, bson.M{"user": user,"metal":1.0})
		if (err!=nil){ log.Println(err) }
		return 1
	} else {
		var m struct{ Metal float64 }
		res.Decode(&m)
		return m.Metal
	}
}
func modMetal(client *mongo.Client,user string,amount float64){
	collection := client.Database("trigo").Collection("users")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	_,err := collection.UpdateOne(ctx, bson.M{"user":user},bson.M{"$inc":bson.M{"metal": amount}})
	if (err!=nil){ log.Println(err) }
}
