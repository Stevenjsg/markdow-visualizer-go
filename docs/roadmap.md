# Roadmap — Editor/Previsualizador de Markdown en Go (Wails)

**Stack:** Go + Wails v2 (backend) · React/Vue + Tailwind (frontend, ya dominado)
**Ritmo:** ~10-15h/semana · Sin fecha límite, a tu propio ritmo
**Punto de partida:** 0 conocimiento de Go, sólido en TypeScript/React/Vue/Next.js

---

## Vista rápida

| Sprint | Semana | Enfoque | Horas aprox. |
|---|---|---|---|
| 1 | 1 | Fundamentos de Go I (sintaxis, tipos, funciones) | 10-12h |
| 2 | 2 | Fundamentos de Go II (structs, interfaces, errores) | 10-12h |
| 3 | 3 | Wails: conectar Go ↔ frontend | 10-12h |
| 4 | 4 | Parser de Markdown + preview en vivo | 10-12h |
| 5 | 5 | Abrir/guardar archivos reales | 10-12h |
| 6 | 6 | Editor avanzado + tema oscuro + settings | 10-12h |
| 7 | 7 | Empaquetado y distribución | 8-10h |
| 8 | 8+ | Extras (opcional) | variable |

**Total estimado:** ~7 semanas para un MVP pulido y distribuible, +1 semana opcional para extras.

**Decisión técnica:** usar **Wails v2** (estable, GA desde 2022, con mucha documentación) en lugar de v3 (todavía en alfa). Migrar más adelante es sencillo si se desea.

---

## Sprint 1 — Fundamentos de Go I

**Objetivo:** dejar de "buscar" sintaxis de TS y empezar a pensar en Go.

**Qué aprendes (con analogía a TS):**
- Variables y tipado estático explícito (`var x int`, `:=` para inferencia)
- Funciones con **múltiples valores de retorno** (`func dividir(a, b int) (int, error)`) — no existe en TS, es la base del manejo de errores en Go
- Control de flujo: solo `if`, `for` (no hay `while`) y `switch`, sin paréntesis
- Slices y maps (como arrays/objects, con sus propias reglas de memoria)
- Paquetes y módulos (`go.mod` ≈ `package.json`)

**Tareas:**
1. Instalar Go + extensión de Go para VS Code
2. Completar el **Tour of Go** oficial (interactivo, ~3-4h)
3. Ejercicios en [Go by Example](https://gobyexample.com/): funciones, slices, maps, strings
4. Mini-proyecto: CLI que lea un archivo `.md` y muestre conteo de líneas/palabras/caracteres

**Entregable:** `go run main.go archivo.md` imprime estadísticas del archivo.

---

## Sprint 2 — Fundamentos de Go II

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

**Entregable:** paquete Go reutilizable y testeado, sin UI todavía.

---

## Sprint 3 — Wails: primer contacto

**Objetivo:** conectar Go con el frontend por primera vez.

**Qué aprendes:**
- Estructura de un proyecto Wails (`main.go`, carpeta `frontend/`)
- **Bindings**: un método Go se convierte automáticamente en una función JS que se puede `await` desde React/Vue
- Eventos (`EventsEmit`/`EventsOn`) para comunicación Go → frontend
- Ciclo de vida de la app (`OnStartup`, `OnShutdown`)

**Tareas:**
1. `wails init -t react-ts` (o `vue-ts`)
2. `wails dev` y entender el hot-reload
3. Crear un método Go simple y llamarlo desde un botón
4. Probar `runtime.OpenFileDialog`

**Entregable:** app "hola mundo" donde un botón en React ejecuta código Go real.

---

## Sprint 4 — Parser de Markdown + preview en vivo

**Objetivo:** el corazón de la app.

**Qué aprendes:**
- Usar una librería externa de Go (`go get github.com/yuin/goldmark`)
- Exponer un método `ParseMarkdown(texto string) string` que devuelve HTML
- Patrón de debounce en el frontend para no llamar a Go en cada tecla

**Tareas:**
1. Integrar goldmark en el backend
2. Componente de dos paneles: editor a la izquierda, preview a la derecha
3. Conectar ambos con debounce (~150-300ms)

**Entregable:** editor funcional con preview en vivo.

---

## Sprint 5 — Archivos reales

**Objetivo:** que la app sirva para algo real.

**Qué aprendes:**
- Paquete `os` de Go para leer/escribir archivos
- `runtime.OpenFileDialog` / `runtime.SaveFileDialog` con filtros
- Estado "documento modificado" (flag dirty)
- Atajos de teclado (Ctrl+S, Ctrl+O)

**Tareas:**
1. Abrir archivo → cargar contenido en el editor
2. Guardar / Guardar como
3. Indicador visual de cambios sin guardar
4. Confirmación al cerrar con cambios pendientes

**Entregable:** app que abre, edita y guarda archivos `.md` reales.

---

## Sprint 6 — Pulido de UI/UX

**Objetivo:** que deje de parecer un prototipo.

**Qué aprendes:**
- `encoding/json` de Go para guardar configuración (último archivo, tema, tamaño de ventana)
- Integrar CodeMirror para resaltado de sintaxis
- Paneles redimensionables

**Tareas:**
1. Modo oscuro/claro con Tailwind
2. Persistir preferencias en JSON local vía Go
3. Reemplazar textarea por CodeMirror

**Entregable:** app visualmente terminada.

---

## Sprint 7 — Empaquetado

**Objetivo:** generar un ejecutable instalable.

**Tareas:**
1. `wails build` para Windows/Mac/Linux
2. Icono de app y metadata
3. Probar el binario en una máquina "limpia"

**Entregable:** ejecutable distribuible.

---

## Sprint 8 — Extras (opcional)

Elegir según interés:
- Exportar a PDF/HTML
- Pestañas múltiples
- Buscar/reemplazar
- Soporte de tablas y listas de tareas (`- [ ]`)
- Sincronizar scroll entre editor y preview

---

## Recursos clave

- [A Tour of Go](https://go.dev/tour/)
- [Go by Example](https://gobyexample.com/)
- [Documentación de Wails v2](https://wails.io/docs/introduction)
- [goldmark (parser de Markdown en Go)](https://github.com/yuin/goldmark)

---

<!-- Nota (2026-07-06): los sprints de aprendizaje de Go de este roadmap quedan como
referencia histórica. La construcción real de la aplicación la guía, prompt a prompt,
docs/plan-desarrollo-ia.md (fases P0.x–P8.x). -->
