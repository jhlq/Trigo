// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"log"
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
	//broadcast chan []byte
	broadcast chan Door

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		//broadcast:  make(chan []byte),
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
						ops:=getOps(dbclient,client.key)
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
				go addOp(dbclient,message.key,string(message.message))
			} else if message.collection=="lobby"{
				log.Println(string(message.message))
				go handleLobbyMessage(dbclient,message.message,message.user)
			}
			for client := range h.clients {
				if (message.collection==client.collection && message.key==client.key) || (message.collection=="lobby" && client.collection=="lobby") {
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
