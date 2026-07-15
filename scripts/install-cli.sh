#!/usr/bin/env bash
#
# Instala el CLI de MarkView en Linux (equivalente de scripts/install-cli.ps1).
#
# Copia el binario MarkView a un directorio por usuario (por defecto
# ~/.local/bin, que suele estar en el PATH), instala un comando `mrw` que lanza
# la app sin bloquear la terminal (estilo `code`/`start`), y registra icono y
# lanzador .desktop para el menu de aplicaciones. No usa sudo ni toca el sistema.
#
# Tras instalar, en una terminal NUEVA:
#     mrw notas.md      # abre (o crea al guardar) notas.md
#     mrw               # abre MarkView vacio
#
# Uso:
#     ./scripts/install-cli.sh                       # instala desde build/bin
#     ./scripts/install-cli.sh --source-dir ~/Descargas
#     ./scripts/install-cli.sh --bin-dir ~/bin
#     ./scripts/install-cli.sh --uninstall
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/../build/bin"
BIN_DIR="$HOME/.local/bin"
UNINSTALL=false

while [ $# -gt 0 ]; do
    case "$1" in
        --source-dir) SOURCE_DIR="$2"; shift 2 ;;
        --bin-dir)    BIN_DIR="$2"; shift 2 ;;
        --uninstall)  UNINSTALL=true; shift ;;
        -h|--help)    grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "Opcion desconocida: $1" >&2; exit 1 ;;
    esac
done

ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"
APPS_DIR="$HOME/.local/share/applications"
ICON="$ICON_DIR/markview.png"
DESKTOP="$APPS_DIR/markview.desktop"

if [ "$UNINSTALL" = true ]; then
    rm -f "$BIN_DIR/MarkView" "$BIN_DIR/mrw" "$ICON" "$DESKTOP"
    update-desktop-database "$APPS_DIR" 2>/dev/null || true
    gtk-update-icon-cache "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
    echo "MarkView CLI desinstalado."
    exit 0
fi

BIN_SRC="$SOURCE_DIR/MarkView"
if [ ! -x "$BIN_SRC" ]; then
    echo "No se encontro $BIN_SRC." >&2
    echo "Compila primero con 'wails build -tags webkit2_41' o indica --source-dir." >&2
    exit 1
fi
# appicon.png se busca junto al binario o en build/ del repositorio.
ICON_SRC="$SOURCE_DIR/appicon.png"
[ -f "$ICON_SRC" ] || ICON_SRC="$SCRIPT_DIR/../build/appicon.png"

mkdir -p "$BIN_DIR" "$ICON_DIR" "$APPS_DIR"

# 1. Binario.
install -m 755 "$BIN_SRC" "$BIN_DIR/MarkView"

# 2. Comando `mrw`: lanza MarkView desasociado de la terminal (no bloquea).
cat > "$BIN_DIR/mrw" <<EOF
#!/usr/bin/env bash
# Shim CLI de MarkView: abre la app sin bloquear la terminal.
setsid "$BIN_DIR/MarkView" "\$@" </dev/null >/dev/null 2>&1 &
EOF
chmod 755 "$BIN_DIR/mrw"

# 3. Icono y lanzador de escritorio.
[ -f "$ICON_SRC" ] && install -m 644 "$ICON_SRC" "$ICON"
cat > "$DESKTOP" <<EOF
[Desktop Entry]
Type=Application
Name=MarkView
Comment=Editor de Markdown con vista previa en vivo, 100% local
Exec=$BIN_DIR/MarkView %F
Icon=markview
Terminal=false
Categories=Office;Utility;TextEditor;
MimeType=text/markdown;text/x-markdown;
StartupWMClass=MarkView
EOF

update-desktop-database "$APPS_DIR" 2>/dev/null || true
gtk-update-icon-cache "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

echo "MarkView instalado en $BIN_DIR"
case ":$PATH:" in
    *":$BIN_DIR:"*) echo "Abre una terminal NUEVA y prueba:  mrw notas.md" ;;
    *) echo "AVISO: $BIN_DIR no esta en tu PATH. Anadelo a tu shell, p. ej.:"
       echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc" ;;
esac
