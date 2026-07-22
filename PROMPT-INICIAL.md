# Prompt inicial — pegar en Gemini CLI / OpenCode / etc.

Ejecuta el agente **desde la raíz del proyecto** (donde están `AGENTS.md`,
`GEMINI.md`, `docs/`, los `.html` y `setup_supabase.sql`), y pega esto como
primer mensaje:

---

Antes de escribir una sola línea de código, lee en este orden:
1. `AGENTS.md`
2. `docs/actividad-original.md` (el enunciado real del profesor, incluye la rúbrica)
3. `docs/requisitos.md`
4. `docs/base-de-datos.md`
5. `docs/diseno.md`
6. `docs/funcionalidades-extra.md`
7. `docs/estado-actual.md`

Ya tengo el backend de Supabase configurado y corriendo (tablas, RLS,
storage, funciones — todo descrito en `docs/base-de-datos.md`), y el
frontend visual ya está armado (los `.html` en la raíz), pero **sin
conectar**: `js/manga-service.js` no existe todavía y los datos en el HTML
están hardcodeados.

Quiero que implementes la capa de lógica en JavaScript vainilla siguiendo
EXACTAMENTE la estructura de archivos de `AGENTS.md` (`config.js`, `app.js`,
`auth.js`, `manga-service.js`, `ui.js`, `reader.js`, `utils.js`) — no la
cambies ni la simplifiques aunque te parezca más práctico juntar archivos.

Empieza en este orden, y después de cada paso muéstrame qué archivo tocaste
y por qué antes de seguir con el siguiente:

1. `js/utils.js` — `normalizeText()` y helpers puros (usa la implementación
   exacta que está en `docs/actividad-original.md`, sección "Normalización
   de texto")
2. `js/config.js` — dejar el cliente de Supabase listo (ya existe una
   plantilla, complétala si falta algo)
3. `js/auth.js` — login/logout de admin con `signInWithPassword`, registro
   de admin con `signUp()` (validando código de invitación contra
   `SUPABASE_CONFIG.adminInviteCode` antes de llamar a Supabase), más una
   función que exponga si hay sesión de admin activa. Ver RF09 en
   `docs/actividad-original.md`
4. `js/manga-service.js` — TODAS las consultas a Supabase: listar/crear/
   editar/borrar mangas y tomos, marcas de capítulo, géneros, búsqueda
   (`search_mangas` RPC), incremento de vistas (`increment_manga_view` RPC).
   Nada de `fetch('/api/...')`, hablamos directo con Supabase.
5. `js/ui.js` — funciones de render (tarjetas de manga, chips de género,
   estados de carga/error) que reciban datos ya resueltos, sin llamar a
   Supabase ellas mismas
6. `js/reader.js` — integración con PDF.js + efecto libro 3D, navegación de
   páginas/capítulos, progreso de lectura en `localStorage` (sin login de
   lector, ver regla en `AGENTS.md`)
7. `js/app.js` — conecta eventos del DOM de cada página con lo anterior

Reglas importantes que ya están en `AGENTS.md` pero repito porque son las
que más se rompen por accidente:
- No agregues login/registro de lectores bajo ninguna circunstancia.
- SÍ implementa el registro de admin con código autorizado (RF09) — el
  profesor lo pedió explícitamente. El código se valida en el cliente contra
  `SUPABASE_CONFIG.adminInviteCode` antes de llamar a `signUp()`.
- Sigue el sistema de diseño de `docs/diseno.md` tal cual — no cambies
  colores, tipografía ni componentes ya definidos.
- Todas las validaciones obligatorias de `docs/actividad-original.md` deben
  quedar implementadas del lado del cliente, aunque ya existan como
  constraints en la base de datos (para dar mensajes de error legibles al
  usuario, no solo un error crudo de Postgres).
- Cuando termines una pieza grande, actualiza `docs/estado-actual.md`
  marcándola como hecha.

Empieza por el paso 1 y espera mi confirmación antes de seguir con el
siguiente.

---

**Por qué pedirle que vaya paso a paso y no todo de un jalón:** un agente que
recibe "hazme todo el proyecto" tiende a inventar decisiones donde falta
detalle. Yendo archivo por archivo puedes revisar cada pieza contra
`docs/estado-actual.md` y corregir a tiempo si algo no cuadra con lo que
aprobó el equipo, en vez de descubrirlo al final con todo ya escrito.
