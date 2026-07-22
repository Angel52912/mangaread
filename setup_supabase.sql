-- ============================================================
-- MangaReadV1 - Script COMPLETO de Supabase
-- Incluye: base del proyecto + géneros/etiquetas + búsqueda
-- avanzada + estadísticas para admin.
-- (El historial de lectura NO va aquí: se maneja con
-- localStorage en el navegador, sin tocar la base de datos)
-- ============================================================
-- ANTES DE EJECUTAR: reemplaza 'correo-administrador@ejemplo.com'
-- por el correo real del administrador/equipo (línea ~9).
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists unaccent;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'correo-administrador@ejemplo.com'
  );
$$;

-- ============================================================
-- TABLAS BASE
-- ============================================================

create table if not exists public.mangas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  normalized_title text not null unique,
  author text not null default 'Autor desconocido',
  synopsis text not null default '',
  direction text not null default 'rtl' check (direction in ('rtl', 'ltr')),
  cover_path text,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.volumes (
  id uuid primary key default gen_random_uuid(),
  manga_id uuid not null references public.mangas(id) on delete cascade,
  title text not null,
  normalized_title text not null,
  chapters_label text not null default '',
  pdf_path text not null,
  pdf_storage_mode text not null default 'single' check (pdf_storage_mode in ('single', 'chunks')),
  pdf_parts jsonb,
  pdf_name text not null,
  normalized_pdf_name text not null,
  created_at timestamptz not null default now(),
  constraint volumes_unique_title_per_manga unique (manga_id, normalized_title),
  constraint volumes_unique_pdf_per_manga unique (manga_id, normalized_pdf_name)
);

create table if not exists public.chapter_marks (
  id bigint generated always as identity primary key,
  volume_id uuid not null references public.volumes(id) on delete cascade,
  chapter integer not null check (chapter > 0),
  page integer not null check (page > 0),
  created_at timestamptz not null default now(),
  constraint chapter_marks_unique_chapter unique (volume_id, chapter),
  constraint chapter_marks_unique_page unique (volume_id, page)
);

create index if not exists volumes_manga_id_idx on public.volumes(manga_id);
create index if not exists chapter_marks_volume_id_idx on public.chapter_marks(volume_id);

-- ============================================================
-- FEATURE: GÉNEROS / ETIQUETAS
-- ============================================================

create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists public.manga_genres (
  manga_id uuid not null references public.mangas(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (manga_id, genre_id)
);

create index if not exists manga_genres_genre_id_idx on public.manga_genres(genre_id);

insert into public.genres (name, slug) values
  ('Shōnen', 'shonen'),
  ('Seinen', 'seinen'),
  ('Comedia', 'comedia'),
  ('Terror', 'terror'),
  ('Slice of life', 'slice-of-life'),
  ('Acción', 'accion'),
  ('Romance', 'romance'),
  ('Fantasía', 'fantasia')
on conflict (name) do nothing;

-- ============================================================
-- FEATURE: BÚSQUEDA AVANZADA (full-text search)
-- ============================================================

-- Postgres no deja usar unaccent() directo en una columna
-- generada porque no está marcada como IMMUTABLE. La envolvemos
-- en nuestra propia función immutable para poder usarla ahí.
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
as $$
  select unaccent('public.unaccent', $1);
$$;

alter table public.mangas
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(author, ''))), 'B') ||
    setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(synopsis, ''))), 'C')
  ) stored;

create index if not exists mangas_search_vector_idx
  on public.mangas using gin (search_vector);

-- Función de búsqueda: úsala desde el frontend con
-- supabaseClient.rpc('search_mangas', { query: 'texto' })
create or replace function public.search_mangas(query text)
returns setof public.mangas
language sql
stable
as $$
  select *
  from public.mangas
  where search_vector @@ websearch_to_tsquery('spanish', unaccent(query))
  order by ts_rank(search_vector, websearch_to_tsquery('spanish', unaccent(query))) desc;
$$;

-- ============================================================
-- FEATURE: ESTADÍSTICAS PARA ADMIN
-- ============================================================

-- Incrementa vistas de forma segura sin dar permiso de UPDATE
-- general a usuarios públicos (evita saltarse la RLS de mangas).
create or replace function public.increment_manga_view(manga_id_param uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.mangas set view_count = view_count + 1 where id = manga_id_param;
$$;

-- Vista con lo que necesita el dashboard de estadísticas
-- (security_invoker = true respeta la RLS de quien consulta;
-- el "where public.is_admin()" hace que solo el admin vea datos,
-- cualquier otro usuario recibe 0 filas)
create or replace view public.admin_stats
with (security_invoker = true) as
select * from (
  select
    (select count(*) from public.mangas) as total_mangas,
    (select count(*) from public.volumes) as total_volumes,
    (select count(*) from public.chapter_marks) as total_chapter_marks,
    (select coalesce(sum(view_count), 0) from public.mangas) as total_views
) s
where public.is_admin();

create or replace view public.admin_top_mangas
with (security_invoker = true) as
select id, title, author, view_count
from public.mangas
where public.is_admin()
order by view_count desc
limit 10;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.mangas enable row level security;
alter table public.volumes enable row level security;
alter table public.chapter_marks enable row level security;
alter table public.genres enable row level security;
alter table public.manga_genres enable row level security;

-- Políticas: mangas
drop policy if exists "public can read mangas" on public.mangas;
drop policy if exists "admin can insert mangas" on public.mangas;
drop policy if exists "admin can update mangas" on public.mangas;
drop policy if exists "admin can delete mangas" on public.mangas;

create policy "public can read mangas" on public.mangas for select using (true);
create policy "admin can insert mangas" on public.mangas for insert with check (public.is_admin());
create policy "admin can update mangas" on public.mangas for update using (public.is_admin()) with check (public.is_admin());
create policy "admin can delete mangas" on public.mangas for delete using (public.is_admin());

-- Políticas: volumes
drop policy if exists "public can read volumes" on public.volumes;
drop policy if exists "admin can insert volumes" on public.volumes;
drop policy if exists "admin can update volumes" on public.volumes;
drop policy if exists "admin can delete volumes" on public.volumes;

create policy "public can read volumes" on public.volumes for select using (true);
create policy "admin can insert volumes" on public.volumes for insert with check (public.is_admin());
create policy "admin can update volumes" on public.volumes for update using (public.is_admin()) with check (public.is_admin());
create policy "admin can delete volumes" on public.volumes for delete using (public.is_admin());

-- Políticas: chapter_marks
drop policy if exists "public can read chapter marks" on public.chapter_marks;
drop policy if exists "admin can insert chapter marks" on public.chapter_marks;
drop policy if exists "admin can update chapter marks" on public.chapter_marks;
drop policy if exists "admin can delete chapter marks" on public.chapter_marks;

create policy "public can read chapter marks" on public.chapter_marks for select using (true);
create policy "admin can insert chapter marks" on public.chapter_marks for insert with check (public.is_admin());
create policy "admin can update chapter marks" on public.chapter_marks for update using (public.is_admin()) with check (public.is_admin());
create policy "admin can delete chapter marks" on public.chapter_marks for delete using (public.is_admin());

-- Políticas: genres
drop policy if exists "public can read genres" on public.genres;
drop policy if exists "admin can manage genres" on public.genres;

create policy "public can read genres" on public.genres for select using (true);
create policy "admin can manage genres" on public.genres for all using (public.is_admin()) with check (public.is_admin());

-- Políticas: manga_genres
drop policy if exists "public can read manga_genres" on public.manga_genres;
drop policy if exists "admin can manage manga_genres" on public.manga_genres;

create policy "public can read manga_genres" on public.manga_genres for select using (true);
create policy "admin can manage manga_genres" on public.manga_genres for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- STORAGE: BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('covers', 'covers', true, 10485760),
  ('pdfs', 'pdfs', true, 838860800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

-- ============================================================
-- STORAGE: POLÍTICAS
-- ============================================================

drop policy if exists "public can read covers" on storage.objects;
drop policy if exists "admin can insert covers" on storage.objects;
drop policy if exists "admin can update covers" on storage.objects;
drop policy if exists "admin can delete covers" on storage.objects;
drop policy if exists "public can read pdfs" on storage.objects;
drop policy if exists "admin can insert pdfs" on storage.objects;
drop policy if exists "admin can update pdfs" on storage.objects;
drop policy if exists "admin can delete pdfs" on storage.objects;

create policy "public can read covers" on storage.objects for select using (bucket_id = 'covers');
create policy "admin can insert covers" on storage.objects for insert with check (bucket_id = 'covers' and public.is_admin());
create policy "admin can update covers" on storage.objects for update using (bucket_id = 'covers' and public.is_admin()) with check (bucket_id = 'covers' and public.is_admin());
create policy "admin can delete covers" on storage.objects for delete using (bucket_id = 'covers' and public.is_admin());

create policy "public can read pdfs" on storage.objects for select using (bucket_id = 'pdfs');
create policy "admin can insert pdfs" on storage.objects for insert with check (bucket_id = 'pdfs' and public.is_admin());
create policy "admin can update pdfs" on storage.objects for update using (bucket_id = 'pdfs' and public.is_admin()) with check (bucket_id = 'pdfs' and public.is_admin());
create policy "admin can delete pdfs" on storage.objects for delete using (bucket_id = 'pdfs' and public.is_admin());
