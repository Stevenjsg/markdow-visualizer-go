package practicas

import "testing"

func TestAnalyze(t *testing.T) {
	ms := &MarkdownStats{}
	err := ms.Analyze("")
	if err == nil {
		t.Errorf("Expected error for empty content, got nil")
	}
}

func TestCountLines(t *testing.T) {}

func TestValidateArgs(t *testing.T) {
}

func TestValidatePath(t *testing.T) {}
