// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license.

package main

import (
	//"log"
	"encoding/json"
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
					msgs:=getRecentMessages(dbclient,5)
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
}

func newGameHub() *GameHub {
	return &GameHub{
		toUser:  make(chan Door),
		fromUser:  make(chan Door),
		broadcast:  make(chan Door),
		register:   make(chan *GameClient),
		unregister: make(chan *GameClient),
		clients:    make(map[*GameClient]bool),
		gameCount: make(chan chan int),
		count: countGames(),
	}
}

func (h *GameHub) run() {
	dbclient:=getClient()
	for {
		select {
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
					}
					gs:=userToPlay(dbclient,client.user)
					op.Op="userToPlay"
					for _,g:=range gs {
						op.Key=g.Key
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
				go handleGameMessage(dbclient,message,h)
			}
		}
	}
}
