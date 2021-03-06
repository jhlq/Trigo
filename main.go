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

var addr = flag.String("addr", ":8080", "http service address") //iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
var templates = template.Must(template.ParseFiles("templates/templates.gohtml"))
var tm map[string]*template.Template

func inittm(){
	tm=make(map[string]*template.Template)
	tm["home"] = template.Must(template.ParseFiles("templates/home.gohtml","templates/templates.gohtml","templates/base.gohtml"))
	tm["lobby"] = template.Must(template.ParseFiles("templates/lobby.gohtml","templates/templates.gohtml","templates/base.gohtml"))
	tm["game"] = template.Must(template.ParseFiles("templates/game.gohtml","templates/templates.gohtml","templates/base.gohtml"))
	tm["board"] = template.Must(template.ParseFiles("templates/board.gohtml","templates/templates.gohtml","templates/base.gohtml"))
	tm["about"] = template.Must(template.ParseFiles("templates/about.gohtml","templates/templates.gohtml","templates/base.gohtml"))
	tm["contact"] = template.Must(template.ParseFiles("templates/contact.gohtml","templates/templates.gohtml","templates/base.gohtml"))
	tm["account"] = template.Must(template.ParseFiles("templates/account.gohtml","templates/templates.gohtml","templates/base.gohtml"))
}
func serveIP(w http.ResponseWriter, r *http.Request){
	fmt.Fprintf(w, "RemoteAddr: "+r.RemoteAddr)
	c, err := r.Cookie("user")
	if err == nil {
		fmt.Fprintf(w, "\nCookie: "+c.Value)
	}
}
func getUser(r *http.Request) string{
	c, err := r.Cookie("user")
	if err != nil {
		ip,_,_:=net.SplitHostPort(r.RemoteAddr)
		return ip
	} else {
		return c.Value
	}
}
func serveHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	err:=tm["home"].ExecuteTemplate(w, "base",struct{}{})
	if (err!=nil){ log.Println(err) }
}
func serveBoard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	vars := mux.Vars(r)
	data:=struct{Key string}{Key:vars["key"]}
	err:=tm["board"].ExecuteTemplate(w, "base",data)
	if (err!=nil){ log.Println(err) }
}
func serveTimeBoard(w http.ResponseWriter, r *http.Request) {
	t:=time.Now().Format("02-Jan-2006-15:04")
	http.Redirect(w, r, "/board/"+t, http.StatusFound)
}
func serveAbout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	err:=tm["about"].ExecuteTemplate(w, "base",struct{}{})
	if (err!=nil){ log.Println(err) }
}
func serveContact(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	err:=tm["contact"].ExecuteTemplate(w, "base",struct{}{})
	if (err!=nil){ log.Println(err) }
}
func serveAccount(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-cache")
	u:=getUser(r)
	if r.Method != http.MethodPost {
		err:=tm["account"].ExecuteTemplate(w, "base",struct{Msg string;User string}{"",u})
		if (err!=nil){ log.Println(err) }
	} else {
		nu:=r.FormValue("user")
		var msg string
		if nu==""{
			cookie := http.Cookie{
				Name:	"user",
				Value:   "",
				Path: "/",
				MaxAge: -1,
			}
			http.SetCookie(w, &cookie)
			msg="Removed cookie."
			nu,_,_=net.SplitHostPort(r.RemoteAddr)
		} else {
			cookie := http.Cookie{
				Name:	"user",
				Value:   nu,
				Path: "/",
				MaxAge: 315360000,
			}
			http.SetCookie(w, &cookie)
			msg="Updated cookie."
		}
		err:=tm["account"].ExecuteTemplate(w, "base",struct{Msg string;User string}{msg,nu})
		if (err!=nil){ log.Println(err) }
	}
}
func serveLobby(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "max-age:10800, public")
	_, err := r.Cookie("user")
	if err != nil {
		ip,_,_:=net.SplitHostPort(r.RemoteAddr)
		cookie := http.Cookie{
			Name:	"user",
			Value:   ip,
			Path: "/",
			MaxAge: 315360000,
		}
		http.SetCookie(w, &cookie)
	}
	err=tm["lobby"].ExecuteTemplate(w, "base",struct{}{})
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
	err=tm["game"].ExecuteTemplate(w, "base",g)
	if (err!=nil){ log.Println(err) }
}
func updateTemplates(w http.ResponseWriter, r *http.Request){
	templates = template.Must(template.ParseFiles("templates/templates.gohtml"))
	inittm()
	fmt.Fprintf(w, "Updated templates")
}
func main() {
	inittm()
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
	router := mux.NewRouter()
	router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ip,_,_:=net.SplitHostPort(r.RemoteAddr)
		serveWs(hub, w, r,"","",ip)
	})
	router.HandleFunc("/ws/boards/{key}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		ip,_,_:=net.SplitHostPort(r.RemoteAddr)
		serveWs(hub, w, r, "boards",vars["key"],ip)
	})
	router.HandleFunc("/ws/games/{key}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		serveGameWs(gamehub, w, r, "games",vars["key"],getUser(r))
	})
	router.HandleFunc("/ws/lobby", func(w http.ResponseWriter, r *http.Request) {
		serveGameWs(gamehub, w, r, "lobby","",getUser(r))
	})
	router.HandleFunc("/", serveHome)
	router.HandleFunc("/board/{key}",serveBoard)
	router.HandleFunc("/board/", serveTimeBoard)
	router.HandleFunc("/about/", serveAbout)
	router.HandleFunc("/contact/", serveContact)
	router.HandleFunc("/account/", serveAccount)
	router.HandleFunc("/lobby/", serveLobby)
	router.HandleFunc("/game/{key}", serveGame)
	router.HandleFunc("/update/templates/", updateTemplates)
	router.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request){ http.ServeFile(w, r, "favicon.ico") })
	router.HandleFunc("/style.css", func(w http.ResponseWriter, r *http.Request){ w.Header().Set("Cache-Control", "max-age:10800, public"); http.ServeFile(w, r, "style.css") })
	http.Handle("/",router)
	s := &http.Server{
		ReadTimeout: 60 * time.Second,
		WriteTimeout: 60 * time.Second,
		Addr:*addr,
	}
	log.Println("Starting to listen...")
	err:=s.ListenAndServe()
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
