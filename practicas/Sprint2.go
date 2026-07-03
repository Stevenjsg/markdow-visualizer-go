/*## Sprint 2 — Fundamentos de Go II

**Objetivo:** entender lo que hace a Go diferente: errores explícitos e interfaces.

**Qué aprendes:**
- **Manejo de errores sin try/catch.** En Go no hay excepciones: cada función que puede fallar devuelve un `error` y se comprueba `if err != nil` a mano.
- **Structs y métodos** (struct = forma de un objeto, método = función con "receiver"; sin clases ni herencia, todo es composición)
- **Interfaces** (tipado por comportamiento, implementación implícita: sin `implements`)
- `defer`, `panic`/`recover` (lo básico)
- Testing nativo con el paquete `testing`

**Tareas:**
1. Refactorizar la CLI del Sprint 1 en un struct `MarkdownStats` con métodos
2. Crear errores personalizados (`errors.New`, `fmt.Errorf`)
3. Escribir 3-4 tests con `go test`
4. Ejercicios de interfaces en Go by Example

**Entregable:** paquete Go reutilizable y testeado, sin UI todavía.*/

// Package practicas contains the implementation for this package.
package practicas

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

type MarkdownStats struct {
	TotalLines      int
	TotalWords      int
	TotalCharacters int
}
type MarkdownFile struct {
	FileName     string
	PathAbsolute string
}

var (
	ErrContentEmpty = errors.New("content is empty")
	ErrCountLines   = errors.New("error counting lines")
	ErrFileNotFound = errors.New("file not found")
	ErrInvalidArgs  = errors.New("invalid arguments")
	ErrInvalidPath  = errors.New("invalid path")
	ErrReadFile     = errors.New("error reading file")
)

func ValidateArgs(args []string) error {
	if len(args) < 2 {
		return ErrInvalidArgs
	}
	path := args[1]
	if err := ValidatePath(path); err != nil {
		return err
	}
	return nil
}

func ValidatePath(path string) error {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return ErrFileNotFound
	}
	return nil
}

func (mf *MarkdownFile) SetMarkdownFile(filePath string) error {
	pathAbs, err := filepath.Abs(filePath)
	if err != nil {
		return ErrInvalidPath
	}
	filename := strings.TrimSuffix(filepath.Base(pathAbs), filepath.Ext(pathAbs))

	mf.PathAbsolute = pathAbs
	mf.FileName = filename
	return nil
}

func GetContentFromFile(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", ErrReadFile
	}

	return string(content), nil
}

func CountLines(content string) (int, error) {
	if content == "" {
		return 0, ErrContentEmpty
	}
	lines := 0
	scanner := bufio.NewScanner(strings.NewReader(content))
	scanner.Split(bufio.ScanLines)
	for scanner.Scan() {
		lines++
	}
	if err := scanner.Err(); err != nil {
		return 0, fmt.Errorf("error scanning file: %w", err)
	}
	return lines, nil
}

func (ms *MarkdownStats) Analyze(content string) error {
	if content == "" {
		return ErrContentEmpty
	}
	ms.TotalCharacters = utf8.RuneCountInString(content)
	ms.TotalWords = len(strings.Fields(content))
	lines, err := CountLines(content)
	if err != nil {
		return ErrCountLines
	}
	ms.TotalLines = lines
	return nil
}
