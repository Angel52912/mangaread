# MangaReadV1 — Contexto para agentes IA

Este archivo es el punto de entrada para cualquier agente de código (Gemini CLI,
OpenCode, Codex, Claude Code, Aider, etc.). Léelo completo antes de tocar
código. Los detalles largos están separados en `docs/` para no saturar el
contexto; este archivo resume qué es el proyecto y cuándo ir a leer cada uno.

## Qué es el proyecto

Biblioteca web de mangas/comics en PDF con lector estilo "libro" (efecto de
página), backend 100% en Supabase (Postgres + Auth + Storage), sin backend
propio (no Node/Express, no API REST intermedia). Todo el frontend habla
directo con Supabase usando `@supabase/supabase-js`.

Dos roles:
- **Lector**: navega sin cuenta. Puede buscar, filtrar por género, ordenar la
  biblioteca y leer. Su historial de lectura se guarda en `localStorage`
  (decisión de equipo: **no habrá registro/login de lectores**).
- **Admin**: única cuenta con login real (Supabase Auth, email+password).
  Puede crear/editar/borrar mangas y tomos, y ve estadísticas internas.

## Documentos que debes leer según la tarea

| Si vas a trabajar en...                          | Lee primero                    |
|---------------------------------------------------|---------------------------------|
| El enunciado ORIGINAL completo del profesor        | `docs/actividad-original.md`   |
| Pasos para configurar Supabase (la guía práctica)  | `docs/guia-supabase.md`        |
| Requisitos funcionales, alcance, qué NO hacer      | `docs/requisitos.md`           |
| Esquema de base de datos, RLS, funciones, vistas   | `docs/base-de-datos.md`        |
| Estilo visual, paleta, tipografía, componentes     | `docs/diseno.md`               |
| Features extra ya decididas (géneros, historial…)  | `docs/funcionalidades-extra.md`|
| Qué ya está hecho vs qué falta                     | `docs/estado-actual.md`        |

`docs/requisitos.md` es un resumen curado; `docs/actividad-original.md` es el
texto completo tal cual lo mandó el profesor, palabra por palabra (incluye la
rúbrica de calificación). Si hay cualquier duda o conflicto entre ambos,
**gana el original**.

## Reglas no negociables (no las rompas aunque parezca más simple)

1. **No agregar login/registro de lectores.** El historial de lectura va por
   `localStorage`, nunca por una tabla con `user_id` de un lector autenticado.
2. **No crear un backend intermedio.** Nada de Express/Node/API REST propia.
   El frontend llama a Supabase directo con la anon key.
3. **El admin se identifica por correo**, comparado en la función SQL
   `public.is_admin()` — no hay tabla de roles ni JWT claims custom todavía.
4. **Sí debe existir registro de admin con código autorizado (RF09).** El
   enunciado original (`docs/actividad-original.md`) lo pide explícitamente
   y los requisitos del profesor tienen prioridad sobre preferencias del
   equipo. Flujo: pantalla de registro (`admin_login_2.html`, restaurar/
   conectar, no borrar) pide email + password + confirmar password + código
   de invitación; antes de llamar a `supabaseClient.auth.signUp()`, valida
   en el cliente que el código ingresado coincida con
   `SUPABASE_CONFIG.adminInviteCode`. **Nota de seguridad honesta:** esta
   validación es solo del lado del cliente (JS es visible/editable por
   cualquiera), así que no es una barrera real contra alguien con
   conocimientos técnicos — para este proyecto académico es aceptable
   porque así lo pide la actividad, pero no lo presenten como "seguro" en la
   documentación de entrega.
5. **RLS siempre activo.** Cualquier tabla nueva necesita política de lectura
   pública + escritura solo-admin, siguiendo el patrón ya usado (ver
   `docs/base-de-datos.md`).
6. **No inventar backend REST en `manga-service.js`.** Ese archivo debe llamar
   al cliente de Supabase directamente, no a `fetch('/api/...')`.
7. **Respeta el sistema de diseño** en `docs/diseno.md` — paleta, tipografía y
   componentes (obi bands, sellos hanko) ya están definidos y aprobados por el
   equipo. No introduzcas otra paleta o librería de íconos sin que se pida.
8. **Stack**: HTML + Tailwind (CDN) + JS vanilla + Supabase JS v2. Nada de
   frameworks (React/Vue) a menos que se pida explícitamente.

## Estructura de carpetas del proyecto

**Esta estructura de archivos JS es la que pidió el profesor explícitamente
en la actividad (`docs/actividad-original.md`) — no la cambies ni la
simplifiques, aunque parezca más práctico juntar archivos.**

```
mangaread/
├── index.html                  # Biblioteca principal
├── detalle.html                 # Ficha de un manga
├── lector.html                    # Lector con efecto libro
├── admin.html                      # Panel de administración (CRUD)
├── admin_login_1.html               # Login de admin (única pantalla, sin registro)
├── modal_agregar_manga.html
├── modal_agregar_tomo.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js               # Cliente de Supabase (URL + anon key)
│   ├── app.js                    # Arranque/orquestación general de la página
│   ├── auth.js                     # Login/logout del admin (Supabase Auth)
│   ├── manga-service.js              # TODAS las llamadas a Supabase (mangas, volumes, chapter_marks, genres)
│   ├── ui.js                           # Render de tarjetas, modales, estados de carga/error
│   ├── reader.js                         # Lógica del lector PDF + efecto libro 3D + progreso en localStorage
│   └── utils.js                            # normalizeText() y demás helpers puros
├── docs/
│   └── evidencias.md              # Documento de pruebas + explicación pedido en "Entregables"
└── setup_supabase.sql               # Script único de base de datos (idempotente)
```

**Responsabilidad de cada archivo JS (para que un agente no mezcle todo en
uno solo):**
- `config.js`: solo el objeto `SUPABASE_CONFIG` y la creación de `supabaseClient`. Nada de lógica.
- `utils.js`: funciones puras sin dependencias de Supabase ni del DOM (ej. `normalizeText()`)
- `auth.js`: `signIn()`, `signOut()`, `getSession()`, `isAdmin()` del lado cliente
- `manga-service.js`: capa de datos — CRUD de `mangas`/`volumes`/`chapter_marks`, géneros, búsqueda (`search_mangas` RPC), estadísticas (`increment_manga_view` RPC). No debe tocar el DOM.
- `ui.js`: solo funciones que reciben datos y pintan HTML (tarjetas, modales, mensajes de error/carga). No debe llamar a Supabase directo.
- `reader.js`: PDF.js + PageFlip, navegación de páginas/capítulos, guardar/leer progreso de `localStorage`
- `app.js`: importa lo anterior y conecta eventos del DOM con las funciones de servicio/UI — es el único archivo que "orquesta"

## Cómo trabajar en este repo

- Antes de escribir código, confirma en `docs/estado-actual.md` si la pieza que
  vas a tocar ya existe o es nueva.
- Si tu cambio requiere una tabla, columna o política nueva, agrégala al
  **mismo** `setup_supabase.sql` (no crear un segundo script) y documenta el
  cambio en `docs/base-de-datos.md`.
- Si tu cambio es visual, sigue `docs/diseno.md` al pie de la letra antes de
  improvisar colores o tipografías nuevas.
- Prueba conexión con `test-connection.html` antes de dar por buena cualquier
  integración con Supabase.
