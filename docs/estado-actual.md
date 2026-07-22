# Estado actual — MangaReadV1

## ✅ Hecho

### Backend (Supabase)
- Proyecto creado, tablas base (`mangas`, `volumes`, `chapter_marks`) con RLS
- Géneros (`genres`, `manga_genres`) precargados con 8 valores
- Búsqueda avanzada: `search_vector` + función `search_mangas()`
- Estadísticas: `view_count`, `increment_manga_view()`, vistas `admin_stats`
  y `admin_top_mangas` (con `security_invoker` + restricción a admin)
- Buckets de Storage `covers` y `pdfs` con políticas
- Usuario admin creado en Authentication → Users (email + password)
- Advertencias del Security Advisor resueltas (vistas `SECURITY DEFINER` →
  `security_invoker = true`)

### Frontend (Lógica y Conexión)
- Implementación de `js/utils.js` (normalización)
- Implementación de `js/config.js` (cliente Supabase + variables globales)
- Implementación de `js/auth.js` (login/logout/registro con código)
- Implementación de `js/manga-service.js` (CRUD Supabase + Storage)
- Implementación de `js/ui.js` (renderizado de biblioteca y filtros)
- Implementación de `js/reader.js` (PDF.js + localStorage progress + efecto 3D)
- Implementación de `js/app.js` (orquestación final y conexión DOM)
- Conexión CRUD: Creación de Mangas y Tomos (modales)
- Conexión Biblioteca: Búsqueda, Filtrado por género, Ordenamiento
- Conexión Admin: Listado de mangas, borrado y registro de Admin (RF09)
- Conexión Detalle: Carga dinámica por ID de manga

### Frontend (visual)
- Maquetas HTML/CSS completas
- Versión híbrida de diseño aplicada
- Corrección de bugs de scripts

## ⏳ Pendiente (el trabajo real que falta)

### Conexión real y refinamiento
- `admin.html`: Acciones CRUD (actualización de mangas)
- `lector.html`: cargar PDF real del tomo, mostrar página, guardar progreso
  en `localStorage`

### Sin empezar
- Obi band consistente en todas las tarjetas (mencionado en `docs/diseno.md`,
  aplicado parcialmente)

## Entregables pendientes
- `docs/evidencias.md` — documento de pruebas + explicación de estructura
- Capturas de Supabase y de la app funcionando.
