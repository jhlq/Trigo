package main

import (
	"flag"
	"log"
	"fmt"
	"net/http"
	"net"
	"bytes"
	"strings"
	
	"html/template"
	
	"github.com/gorilla/mux"
	"time"
)

var addr = flag.String("addr", ":8080", "http service address")
var templates = template.Must(template.ParseFiles("templates/templates.gohtml"))

func serveIP(w http.ResponseWriter, r *http.Request){
	fmt.Fprintf(w, "RemoteAddr: "+r.RemoteAddr)
}
func serveHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	err:=templates.ExecuteTemplate(w, "home",struct{}{})
	if (err!=nil){ log.Println(err) }
}
type BoardData struct {
	Key string
}
func serveBoard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	vars := mux.Vars(r)
	data:=struct{Key string}{Key:vars["key"]}
	err:=templates.ExecuteTemplate(w, "board", data)
	if (err!=nil){ log.Println(err) }
}
func serveTimeBoard(w http.ResponseWriter, r *http.Request) {
	t:=time.Now().Format("02-Jan-2006-15:04")
	http.Redirect(w, r, "/board/"+t, http.StatusFound)
}
func serveAbout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	err:=templates.ExecuteTemplate(w, "about",struct{}{})
	if (err!=nil){ log.Println(err) }
}
func serveContact(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	err:=templates.ExecuteTemplate(w, "contact",struct{}{})
	if (err!=nil){ log.Println(err) }
}
func updateTemplates(w http.ResponseWriter, r *http.Request){
	templates = template.Must(template.ParseFiles("templates/templates.gohtml"))
	fmt.Fprintf(w, "Updated templates")
}
func main() {
	flag.Parse()
	hub := newHub()
	go hub.run()
	http.HandleFunc("/ip", serveIP)
	changeHeaderThenServe := func(h http.Handler) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", "max-age:10800, public")
			h.ServeHTTP(w, r)
		}
	}
	http.Handle("/javascript/", http.StripPrefix("/javascript/", changeHeaderThenServe(http.FileServer(http.Dir("javascript")))))
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r,"","")
	})
	router := mux.NewRouter()
	router.HandleFunc("/ws/{collection}/{key}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		serveWs(hub, w, r, vars["collection"],vars["key"])
	})
	router.HandleFunc("/", serveHome)
	router.HandleFunc("/board/{key}",serveBoard)
	router.HandleFunc("/board/", serveTimeBoard)
	router.HandleFunc("/about/", serveAbout)
	router.HandleFunc("/contact/", serveContact)
	router.HandleFunc("/update/templates/", updateTemplates)
	router.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request){ http.ServeFile(w, r, "favicon.ico") })
	//router.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("html")))) //remove folder html?
	http.Handle("/",router)
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
