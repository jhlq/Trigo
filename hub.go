// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license.

package main

import (
	"log"
	"encoding/json"
	"time"
	"strings"
)

type Door struct {
	collection string
	key string
	message []byte
	user string
}
// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan Door

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan Door),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) run() {
	dbclient:=getClient()
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			if client.collection=="" && client.key==""{
				go func(){
					msgs:=getRecentMessages(dbclient,5) //store these in a list?
					for i:=range msgs {
						client.send<-[]byte(msgs[len(msgs)-i-1])
					}
				}()
			} else if client.collection=="boards"{
				go func(){
					if boardExists(dbclient,client.key){
						ops:=getOps(dbclient,"boards",client.key)
						for _,op:=range ops {
							client.send<-[]byte(op)
						}
					} else {
						addBoard(dbclient,client.key)
					}
				}()
			}
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			if message.collection=="" && message.key==""{
				go addChatMessage(dbclient,string(message.message))
			} else if message.collection=="boards"{
				go addOp(dbclient,"boards",message.key,string(message.message))
			}
			for client := range h.clients {
				if (message.collection==client.collection && message.key==client.key){
					select {
					case client.send <- message.message:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
		}
	}
}

type GameHub struct {
	clients map[*GameClient]bool
	toUser chan Door
	fromUser chan Door
	broadcast chan Door
	register chan *GameClient
	unregister chan *GameClient
	gameCount chan chan int
	count int
	timeout chan string
	addGame chan *game
}

func newGameHub() *GameHub {
	bs:=5
	return &GameHub{
		toUser:  make(chan Door,bs),
		fromUser:  make(chan Door,bs),
		broadcast:  make(chan Door,bs),
		register:   make(chan *GameClient),
		unregister: make(chan *GameClient),
		clients:    make(map[*GameClient]bool),
		gameCount: make(chan chan int),
		count: countGames(),
		timeout: make(chan string),
		addGame: make(chan *game),
	}
}
func remainingTime(g *game) int{
	var rt int
	now:=int(time.Now().Unix())
	if g.CurrentColor=="green"{
		rt=g.GreenDeadline-now
	} else if g.CurrentColor=="blue"{
		rt=g.BlueDeadline-now
	}
	return rt
}
type gameTimer struct{
	t *time.Timer
	cancel chan struct{}
}
func newgt(seconds int) *gameTimer{
	gt:=gameTimer{time.NewTimer(time.Duration(seconds) * time.Second),make(chan struct{}, 1)}
	return &gt
}
func gtlistener(gt *gameTimer,key string,to chan string){
	select{
	case <-gt.t.C:
		to<-key
		return
	case <-gt.cancel:
		return
	}
}
func deleteGame(key string,gm map[string]*game,gtm map[string]*gameTimer){
	gtm[key].t.Stop()
	gtm[key].cancel<-struct{}{}
	delete(gtm,key)
	delete(gm,key)
}
func sp(g *game){
	if g.CurrentColor=="green"{
		g.CurrentUser=g.Blue
		g.CurrentColor="blue"
	} else if g.CurrentColor=="blue"{
		g.CurrentUser=g.Green
		g.CurrentColor="green"
	}
}
func updateTime(g *game){
	rt:=remainingTime(g)
	rt+=g.TurnTime
	if rt>g.MaxTime{
		rt=g.MaxTime
	}
	now:=int(time.Now().Unix())
	dl:=now+rt
	if g.CurrentColor=="green"{
		g.GreenDeadline=dl
	} else if g.CurrentColor=="blue"{
		g.BlueDeadline=dl
	}
}
func (h *GameHub) run() {
	dbclient:=getClient()
	gm:=make(map[string]*game)
	gtm:=make(map[string]*gameTimer)
	ga:=getActiveGames(dbclient)
	for _,g := range(ga){
		rt:=remainingTime(g)
		if rt<0{
			go setWinner(dbclient,g,"","time",h)
			continue
		}
		gm[g.Key]=g
		gtm[g.Key]=newgt(rt)
		go gtlistener(gtm[g.Key],g.Key,h.timeout)
	}
	for {
		select {
		case g:=<-h.addGame:
			rt:=remainingTime(g)
			gm[g.Key]=g
			gtm[g.Key]=newgt(rt)
			go gtlistener(gtm[g.Key],g.Key,h.timeout)
		case key:=<-h.timeout:
			go setWinner(dbclient,gm[key],"","time",h)
			delete(gtm,key)
			delete(gm,key)
		case c:=<-h.gameCount:
			c<-h.count
			h.count+=1
		case client := <-h.register:
			h.clients[client] = true
			if client.collection=="lobby"{
				go func(){
					var op struct{
						Op string
						Key string
						Size int
						Id string
						RemainingTime int
					}
					gs:=userToPlay(dbclient,client.user)
					op.Op="userToPlay"
					for _,g:=range gs {
						op.Key=g.Key
						op.RemainingTime=remainingTime(&g)
						jop,_:=json.Marshal(op)
						client.send<-jop
					}
					les:=getLobbyEntries(dbclient)
					op.Op="addGame"
					for _,le:=range les {
						op.Size=le.Size
						op.Id=le.Id
						jop,_:=json.Marshal(op)
						client.send<-jop
					}
				}()
			} else if client.collection=="games"{
				go func(){
					ops:=getOps(dbclient,"games",client.key)
					for _,op:=range ops {
						client.send<-[]byte(op)
					}
				}()
			}
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				if (message.collection==client.collection && message.key==client.key){
					select {
					case client.send <- message.message:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
		case message := <-h.toUser:
			for client := range h.clients {
				if (message.user==client.user && message.collection==client.collection && message.key==client.key){
					select {
					case client.send <- message.message:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
		case message := <-h.fromUser:
			if message.collection=="lobby"{
				go handleLobbyMessage(dbclient,message.message,message.user,h)
			} else if message.collection=="games"{
				//go handleGameMessage(dbclient,message,h)
				key:=message.key
				g:=gm[key]
				gt:=gtm[key]
				if (g.CurrentUser!=message.user){
					msg:=Door{"games",key,[]byte("notYourTurn"),message.user}
					h.toUser<-msg
				} else {
					gt.t.Stop()
					a:=strings.Split(string(message.message)," ")
					if (a[0]=="resign"){
						go setWinner(dbclient,g,"","resignation",h)
						gt.cancel<-struct{}{}
						delete(gtm,key)
						delete(gm,key)
					} else if (a[0]=="placeMove"){
						updateTime(g)
						log.Println(gm[key].CurrentColor)
						sp(g)
						log.Println(gm[key].CurrentColor)
					}
				}
			}
		}
	}
}
