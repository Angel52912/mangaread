# Documentación Técnica: MangaReadV1

## Descripción
Biblioteca web de mangas/cómics con lector tipo "libro" (efecto página).
Backend 100% Supabase (Postgres + Auth + Storage). Frontend Vanilla JS + Tailwind.

## Funcionalidades principales

### Lector (Público)
- Biblioteca visual con portadas (efecto estante).
- Búsqueda avanzada (full-text search).
- Filtros por género (chips estilo hanko).
- Ficha de detalle de manga (sinopsis, géneros, tomos).
- Lector de PDF con progreso guardado localmente (localStorage).

### Administrador (Autenticado)
- Panel de control (Dashboard).
- CRUD completo de mangas y tomos (imágenes y PDFs).
- Gestión de géneros (agregar/eliminar).
- Visualización de estadísticas internas (vistas totales, top mangas).

## Arquitectura

- **Frontend**: Vanilla JS (organizado en `js/app.js`, `js/auth.js`, `js/manga-service.js`, `js/ui.js`, `js/reader.js`, `js/utils.js`, `js/config.js`), HTML, CSS (Tailwind).
- **Backend**: Supabase.
- **Autenticación**: Supabase Auth (email + contraseña). Acceso a funciones administrativas protegido mediante `public.is_admin()`.
- **Storage**: Buckets `covers` (imágenes) y `pdfs` (libros).

## Responsabilidad de archivos JS
- `config.js`: Configuración cliente Supabase.
- `utils.js`: Helpers puros.
- `auth.js`: Lógica de sesión admin.
- `manga-service.js`: CRUD y llamadas Supabase.
- `ui.js`: Renderizado HTML.
- `reader.js`: Lógica de lector (PDF.js + PageFlip).
- `app.js`: Orquestación de eventos DOM.

## Diseño
Diseño inspirado en estética "otaku shonen" con tokens específicos (colores, fuentes Yuji Syuku/Anton/Space Grotesk/Hanken Grotesk). Adaptable a dispositivos móviles y escritorio mediante Tailwind CSS.
