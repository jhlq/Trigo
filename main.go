package main

import (
	"flag"
	"log"
	"fmt"
	"net/http"
	"net"
	
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
func serveLobby(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	tlobby:=template.Must(template.ParseFiles("templates/templates.gohtml","templates/base.gohtml","templates/lobby.gohtml"))
	err:=tlobby.ExecuteTemplate(w, "base",struct{}{})
	if (err!=nil){ log.Println(err) }
}
func serveGame(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	vars := mux.Vars(r)
	dbclient:=getClient()
	g,err:=getGame(dbclient,vars["key"])
	if (err!=nil){
		fmt.Fprintf(w, "Game not found.")
		return
	}
	tgame:=template.Must(template.ParseFiles("templates/game.gohtml","templates/templates.gohtml","templates/base.gohtml"))
	err=tgame.ExecuteTemplate(w,"base",g)
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
	gamehub := newGameHub()
	go gamehub.run()
	http.HandleFunc("/ip", serveIP)
	changeHeaderThenServe := func(h http.Handler) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", "max-age:10800, public")
			h.ServeHTTP(w, r)
		}
	}
	http.Handle("/javascript/", http.StripPrefix("/javascript/", changeHeaderThenServe(http.FileServer(http.Dir("javascript")))))
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ip,_,_:=net.SplitHostPort(r.RemoteAddr)
		serveWs(hub, w, r,"","",ip)
	})
	router := mux.NewRouter()
	router.HandleFunc("/ws/boards/{key}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		ip,_,_:=net.SplitHostPort(r.RemoteAddr)
		serveWs(hub, w, r, "boards",vars["key"],ip)
	})
	router.HandleFunc("/ws/games/{key}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		ip,_,_:=net.SplitHostPort(r.RemoteAddr)
		serveGameWs(gamehub, w, r, "games",vars["key"],ip)
	})
	router.HandleFunc("/ws/lobby", func(w http.ResponseWriter, r *http.Request) {
		ip,_,_:=net.SplitHostPort(r.RemoteAddr)
		serveGameWs(gamehub, w, r, "lobby","",ip)
	})
	router.HandleFunc("/", serveHome)
	router.HandleFunc("/board/{key}",serveBoard)
	router.HandleFunc("/board/", serveTimeBoard)
	router.HandleFunc("/about/", serveAbout)
	router.HandleFunc("/contact/", serveContact)
	router.HandleFunc("/lobby/", serveLobby)
	router.HandleFunc("/game/{key}", serveGame)
	router.HandleFunc("/update/templates/", updateTemplates)
	router.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request){ http.ServeFile(w, r, "favicon.ico") })
	http.Handle("/",router)
	s := &http.Server{
		ReadTimeout: 60 * time.Second,
		WriteTimeout: 60 * time.Second,
		Addr:*addr,
	}
	err:=s.ListenAndServe()
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
