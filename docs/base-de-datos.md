# Base de datos — MangaReadV1 (Supabase)

Fuente de verdad: `setup_supabase.sql` en la raíz del proyecto. Este documento
es un resumen para orientarte rápido; si hay diferencia entre este archivo y
el `.sql`, **el `.sql` manda**.

## Principio de autenticación

No hay tabla de roles. El admin se reconoce por correo, comparado dentro de
una función SQL:

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'correo-admin-real@ejemplo.com'
  );
$$;
```

Cualquier política RLS de escritura usa `public.is_admin()` en su `using`/
`with check`. Para agregar más admins, se agregan más correos separados por
coma dentro del `in (...)`.

## Tablas

- **`mangas`**: `id, title, normalized_title (unique), author, synopsis,
  direction (rtl|ltr), cover_path, view_count, search_vector (generado),
  created_at`
- **`volumes`**: `id, manga_id (FK), title, normalized_title, chapters_label,
  pdf_path, pdf_storage_mode (single|chunks), pdf_parts (jsonb), pdf_name,
  normalized_pdf_name, created_at`. Únicos por manga: título y nombre de PDF.
- **`chapter_marks`**: `id, volume_id (FK), chapter (>0), page (>0)`. Únicos
  por tomo: número de capítulo y número de página.
- **`genres`**: `id, name (unique), slug (unique)` — 8 géneros precargados
  (Shōnen, Seinen, Comedia, Terror, Slice of life, Acción, Romance, Fantasía)
- **`manga_genres`**: tabla intermedia many-to-many `(manga_id, genre_id)`

## Búsqueda avanzada (full-text search)

`mangas.search_vector` es una columna generada (`stored`) que combina título
(peso A), autor (peso B) y sinopsis (peso C), usando `to_tsvector('spanish', ...)`.

**Importante**: `unaccent()` no se puede usar directo dentro de una columna
generada (Postgres la considera no-immutable). Por eso existe el wrapper:

```sql
create or replace function public.immutable_unaccent(text)
returns text language sql immutable parallel safe
as $$ select unaccent('public.unaccent', $1); $$;
```

Para buscar desde el frontend, usar RPC, no un `select` directo:
```js
const { data } = await supabaseClient.rpc('search_mangas', { query: 'texto de búsqueda' });
```

## Estadísticas (solo admin)

- `mangas.view_count` se incrementa con la función `public.increment_manga_view(manga_id_param uuid)`
  (`security definer`, evita dar permiso de UPDATE público)
- Vistas `public.admin_stats` y `public.admin_top_mangas`: creadas con
  `security_invoker = true` y un `where public.is_admin()` interno — si quien
  consulta no es admin, la vista devuelve 0 filas. **Ojo:** desde el SQL
  Editor de Supabase siempre se ven los datos (entras como `postgres`,
  superusuario que se salta RLS); la restricción solo se nota consultando
  desde el frontend con la anon key.

## Historial de lectura

**No existe tabla para esto.** Se implementa 100% en el cliente con
`localStorage`, por la decisión de no tener login de lectores. Si en algún
momento el equipo decide agregar cuentas de lector, ahí sí se crearía una
tabla `reading_progress(user_id, volume_id, page)` — hasta entonces, no crear
nada en la base de datos para esto.

## Storage

Dos buckets, ambos públicos para lectura:
- `covers` (imágenes de portada, límite 10MB)
- `pdfs` (archivos de tomo, límite 800MB)

Política estándar en `storage.objects`: `select` público por `bucket_id`,
`insert/update/delete` solo si `public.is_admin()`.

## Patrón de RLS a replicar en cualquier tabla nueva

```sql
alter table public.mi_tabla_nueva enable row level security;

create policy "public can read x" on public.mi_tabla_nueva
  for select using (true);

create policy "admin can insert x" on public.mi_tabla_nueva
  for insert with check (public.is_admin());

create policy "admin can update x" on public.mi_tabla_nueva
  for update using (public.is_admin()) with check (public.is_admin());

create policy "admin can delete x" on public.mi_tabla_nueva
  for delete using (public.is_admin());
```
