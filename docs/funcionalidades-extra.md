# Funcionalidades extra — MangaReadV1

Estas 5 quedaron decididas por el equipo, en este orden de dependencia
(implementar en este orden si se está empezando desde cero):

## 1. Géneros / etiquetas
- Tablas `genres` + `manga_genres` (ver `docs/base-de-datos.md`)
- UI: chips estilo sello hanko, con wrap (ver `docs/diseno.md`)
- Filtrar biblioteca por género seleccionado (múltiple o único — a definir
  en implementación, no bloqueante)

## 2. Historial de lectura
- **Sin login de lector** → se guarda en `localStorage`, llave sugerida:
  `mangaread:progress:<volume_id>` → `{ page: N, updatedAt: ISO }`
- Mostrar en biblioteca una sección "Continuar leyendo" leyendo del
  localStorage, cruzando con datos de `mangas`/`volumes` desde Supabase
- No requiere ninguna tabla nueva en Supabase

## 3. Ordenar biblioteca
- Opciones: más reciente (`created_at desc`), alfabético (`title asc`)
- No requiere schema nuevo, solo el `order by` en la consulta desde el
  frontend

## 4. Búsqueda avanzada
- Full-text search ya implementado en `mangas.search_vector` +
  función `search_mangas(query)` (ver `docs/base-de-datos.md`)
- Llamar por RPC desde el frontend, no hacer `ilike` manual

## 5. Estadísticas para admin
- Vistas `admin_stats` (totales) y `admin_top_mangas` (top 10 por
  `view_count`), ambas restringidas a admin vía `where public.is_admin()`
  dentro de la vista
- Incrementar vistas con `supabaseClient.rpc('increment_manga_view', { manga_id_param: id })`
  al abrir la ficha de un manga (no al cargar la biblioteca)

## Backlog (mencionadas, NO decididas todavía — no implementar sin confirmar)
Ideas que se discutieron pero no entraron en el alcance actual. Si el equipo
pide una de estas, confirma con ellos el diseño antes de tocar schema:
- "Continuar leyendo" destacado en portada (parcialmente cubierto por #2)
- Contador de vistas por manga (ya cubierto por `view_count` de #5)
- Recién agregados / badge "Nuevo"
- Atajos de teclado en el lector
- Colecciones/listas personalizadas — **requiere login de lector, descartado
  mientras esa decisión no cambie**
- Compartir manga (link directo)
- Modo lectura vertical (webtoon-style)
- Recomendaciones por género compartido
- Sección de novelas ligeras — "tal vez, solo si sobra tiempo", ver
  `docs/requisitos.md`

## Explícitamente fuera de alcance (no reabrir sin decisión de equipo)
- Cualquier feature que requiera cuenta de lector (favoritos, comentarios,
  ratings personalizados, listas propias)
- Múltiples administradores gestionables desde la app (hoy es una lista de
  correos hardcodeada en SQL — funciona, no se pidió cambiarlo)
