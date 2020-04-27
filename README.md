# Trigo

The Golang server is hosted at http://triangulargo.club/

Feel free to use the code as a template. To get it running first
```
go get github.com/gorilla/mux
go get github.com/gorilla/websocket
```
Then either remove all database references or install mongodb (available from Ubuntu universe repository) and
```
go get go.mongodb.org/mongo-driver/mongo
```
Finally in the Trigo folder do
```
go run *.go
```
Then navigate to http://localhost:8080/

When running on a public server the default port 80 can be redirected to 8080 with iptables:
```
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
```
Note that this command will have to be reinvoked upon reboot.

To run the Qt interface to Shark-ML:
```
cd cpp/TrigoTrain
mkdir build
cd build
cmake .. -DShark_DIR=/path/to/Shark/build
make
src/TrigoTrain
```
Only tested on Linux.
