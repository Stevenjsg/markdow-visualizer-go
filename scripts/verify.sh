#!/usr/bin/env bash
# Suite de verificacion de MarkView: backend (Go) + frontend.
#
# Excluye `frontend/node_modules` de los comandos de Go: al vivir el frontend
# dentro del modulo Go, `./...` alcanzaria paquetes Go incrustados en
# dependencias de npm (p. ej. flatted). Filtramos con `go list`.
#
# Antes del backend construye el frontend, porque `main.go` incrusta
# `//go:embed all:frontend/dist`; sin esa carpeta `go build` falla.
#
# Uso: ./scripts/verify.sh
set -euo pipefail

# Raiz del repositorio (este script vive en scripts/).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "### frontend: build (genera frontend/dist para el embed) ###"
npm --prefix frontend run build

# Paquetes Go del modulo, excluyendo node_modules.
GO_PKGS="$(go list ./... | grep -v '/node_modules/')"

echo "### go build ###"
go build $GO_PKGS
echo "### go vet ###"
go vet $GO_PKGS
echo "### go test ###"
go test $GO_PKGS

echo "### frontend: lint ###"
npm --prefix frontend run lint
echo "### frontend: test ###"
npm --prefix frontend test

echo "### Verificacion completa: OK ###"
