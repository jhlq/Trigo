// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"flag"
	"log"
	"net/http"
	"bytes"
	
	"html/template"
	
	"github.com/gorilla/mux"
)

var addr = flag.String("addr", ":8080", "http service address")

func serveHome(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	if r.URL.Path != "/" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	http.ServeFile(w, r, "html/home.html")
}
type BoardData struct {
    Key string
    Header string
    Chat string
}
func serveBoard(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	vars := mux.Vars(r)
	headertemplate := template.Must(template.ParseFiles("templates/chat.header.template"))
	var tpl bytes.Buffer
	if err := headertemplate.Execute(&tpl, struct{}); err != nil {
		log.Println(err)
	}
	header := tpl.String()
	chattemplate := template.Must(template.ParseFiles("templates/chat.html.template"))
	var tpl2 bytes.Buffer
	if err := headertemplate.Execute(&tpl2, struct{}); err != nil {
		log.Println(err)
	}
	chat := tpl2.String()
	boardtemplate := template.Must(template.ParseFiles("templates/board.html.template"))
	data := BoardData{
		Key: vars["key"],
		Header: header,
		Chat: chat,
	}
	err:=boardtemplate.Execute(w, data)
	if (err!=nil){ log.Println(err) }
}

func main() {
	flag.Parse()
	hub := newHub()
	go hub.run()
	//http.HandleFunc("/", serveHome)
	http.Handle("/javascript/", http.StripPrefix("/javascript/", http.FileServer(http.Dir("javascript"))))
	//http.HandleFunc("/board/", serveBoard)
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
	router := mux.NewRouter()
	router.HandleFunc("/ws/{key}", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
	router.HandleFunc("/board/{key}",serveBoard)
	fileServer := http.FileServer(http.Dir("./html/"))
	router.Handle("/", http.StripPrefix("/", fileServer))
	http.Handle("/", router)
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
