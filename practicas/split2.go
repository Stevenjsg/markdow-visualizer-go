// Package practicas contains the implementation for this package.
package practicas

type MarkdownStats struct {
	TotalLines      int
	TotalWords      int
	TotalCharacters int
}

func (ms *MarkdownStats) CountLines(content string) int {
	lines := 0
	for _, char := range content {
		if char == '\n' {
			lines++
		}
	}
	return lines
}
