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

//this whole IP thing didn't work...
//ipRange - a structure that holds the start and end of a range of ip addresses
type ipRange struct {
    start net.IP
    end net.IP
}
// inRange - check to see if a given ip address is within a range given
func inRange(r ipRange, ipAddress net.IP) bool {
    // strcmp type byte comparison
    if bytes.Compare(ipAddress, r.start) >= 0 && bytes.Compare(ipAddress, r.end) < 0 {
        return true
    }
    return false
}
var privateRanges = []ipRange{
    ipRange{
        start: net.ParseIP("10.0.0.0"),
        end:   net.ParseIP("10.255.255.255"),
    },
    ipRange{
        start: net.ParseIP("100.64.0.0"),
        end:   net.ParseIP("100.127.255.255"),
    },
    ipRange{
        start: net.ParseIP("172.16.0.0"),
        end:   net.ParseIP("172.31.255.255"),
    },
    ipRange{
        start: net.ParseIP("192.0.0.0"),
        end:   net.ParseIP("192.0.0.255"),
    },
    ipRange{
        start: net.ParseIP("192.168.0.0"),
        end:   net.ParseIP("192.168.255.255"),
    },
    ipRange{
        start: net.ParseIP("198.18.0.0"),
        end:   net.ParseIP("198.19.255.255"),
    },
}
// isPrivateSubnet - check to see if this ip is in a private subnet
func isPrivateSubnet(ipAddress net.IP) bool {
    // my use case is only concerned with ipv4 atm. Maybe we need to include v6?
    if ipCheck := ipAddress.To4(); ipCheck != nil {
        // iterate over all our ranges
        for _, r := range privateRanges {
            // check if this ip is in a private range
            if inRange(r, ipAddress){
                return true
            }
        }
    }
    return false
}
func getIPAdress(r *http.Request) string {
    for _, h := range []string{"X-Forwarded-For", "X-Real-Ip"} {
        addresses := strings.Split(r.Header.Get(h), ",")
        // march from right to left until we get a public address
        // that will be the address right before our proxy.
        for i := len(addresses) -1 ; i >= 0; i-- {
            ip := strings.TrimSpace(addresses[i])
            // header can contain spaces too, strip those out.
            realIP := net.ParseIP(ip)
            if !realIP.IsGlobalUnicast() || isPrivateSubnet(realIP) {
                // bad address, go to next
                continue
            }
            return ip
        }
    }
    return ""
}//author: https://husobee.github.io/golang/ip-address/2015/12/17/remote-ip-go.html
func serveIP(w http.ResponseWriter, r *http.Request){
	fmt.Fprintf(w, "IP from header: "+getIPAdress(r)+"\nRemoteAddr: "+r.RemoteAddr)
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
	http.Handle("/javascript/", http.StripPrefix("/javascript/", http.FileServer(http.Dir("javascript"))))
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
	//router.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("html")))) //remove folder html
	http.Handle("/",router)
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
