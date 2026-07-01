package practicas

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

// MarkdownFile to hold information about markdown files
type MarkdownFile struct {
	FileName       string
	PathAbsolute   string
	CharacterCount int
}

func Split1() {
	if len(os.Args) < 2 {
		fmt.Println("Please provide any arguments.")
		return
	}
	argPath := os.Args[1]

	if argPath == "" || filepath.Ext(argPath) != ".md" {
		fmt.Println("Please provide a path to the markdown file.")
		return
	}

	pathAbs, err := filepath.Abs(argPath)
	if err != nil {
		fmt.Println("Error occurred while getting absolute path.")
		return
	}
	filename := strings.TrimSuffix(filepath.Base(pathAbs), filepath.Ext(pathAbs))

	f, err := os.ReadFile(pathAbs)
	if err != nil {
		fmt.Println("Error occurred while reading the file.")
		return
	}
	fileToString := string(f)
	if len(fileToString) == 0 {
		fmt.Println("The file is empty.")
		return
	}
	characterCount := utf8.RuneCountInString(fileToString)
	fmt.Printf("The file has %d characters.\n", characterCount)

	wordCount := len(strings.Fields(fileToString))
	fmt.Printf("The file has %d words.\n", wordCount)

	lineCount := 0
	scanner := bufio.NewScanner(strings.NewReader(fileToString))
	scanner.Split(bufio.ScanLines)
	for scanner.Scan() {
		lineCount++
	}
	if err := scanner.Err(); err != nil {
		fmt.Println("Error occurred while scanning the file.")
		return
	}
	fmt.Printf("The file has %d lines.\n", lineCount)

	// fmt.Println("The file has the following content:")
	// fmt.Println(fileToString)
	file := MarkdownFile{
		FileName:       filename,
		CharacterCount: characterCount,
		PathAbsolute:   pathAbs,
	}
	fmt.Println(file)
}
