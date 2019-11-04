package main

import (
	"log"
	"os/exec"
	"fmt"
)

func main() {
    //cmd := exec.Command("ls", "-lah")
	cmd := exec.Command("./ExampleProject")
    out, err := cmd.CombinedOutput()
    if err != nil {
        log.Fatalf("cmd.Run() failed with %s\n", err)
    }
    fmt.Printf("combined out:\n%s\n", string(out))
}
