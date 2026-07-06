package main

import (
	"fmt"
	"os"

	"github.com/Stevenjsg/markdow-visualizer-go/practicas"
)

func main() {
	Sprint2 := practicas.MarkdownStats{}
	Sprint2File := practicas.MarkdownFile{}

	args := os.Args
	if err := practicas.ValidateArgs(args); err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	if err := practicas.ValidatePath(args[1]); err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	Sprint2File.SetMarkdownFile(args[1])
	contente, err := practicas.GetContentFromFile(args[1])
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}

	Sprint2.Analyze(contente)
	fmt.Println(Sprint2File)
	fmt.Println(Sprint2)
}
