# Requisitos — MangaReadV1

## Contexto académico
Proyecto parcial universitario. Backend obligatorio: Supabase (Postgres +
Auth + Storage). El requerimiento mínimo pedido por la actividad ya está
cubierto por el esquema de base de datos; todo lo adicional listado aquí
son features que el equipo decidió agregar por encima del mínimo.

## Roles

### Lector (sin cuenta)
- Ver biblioteca de mangas publicados
- Buscar por título/autor/sinopsis (búsqueda avanzada, full-text)
- Filtrar por género
- Ordenar biblioteca: más reciente, alfabético
- Ver ficha de detalle (sinopsis, autor, tomos disponibles)
- Leer un tomo con el lector (efecto de página / libro)
- Su progreso de lectura se guarda **localmente** (localStorage) — **NO hay
  cuenta de lector, no se implementa registro/login para lectores.**

### Administrador (con cuenta)
- Login con email + password (Supabase Auth, `signInWithPassword`)
- **No hay pantalla de registro** — el/los admins se crean manualmente desde
  el dashboard de Supabase (Authentication → Users), decisión de equipo.
- CRUD completo de mangas (título, autor, sinopsis, dirección de lectura,
  portada, géneros)
- CRUD completo de tomos (PDF, marcas de capítulo por página)
- Ver estadísticas: total de mangas/tomos/capítulos, vistas totales, top
  mangas más vistos (solo visibles para el admin, reforzado a nivel de RLS)

## Validaciones obligatorias (heredadas de la actividad original)
- No permitir títulos de manga duplicados
- Cover (imagen) y PDF son obligatorios según el tipo de recurso
- Páginas de marcas de capítulo deben ser > 0
- No repetir número de capítulo ni página dentro del mismo tomo
- Estas validaciones ya están como `check`/`unique` constraints en el SQL —
  ver `docs/base-de-datos.md`

## Features extra decididas por el equipo (por encima del mínimo)
Ver detalle completo en `docs/funcionalidades-extra.md`. Resumen:
1. Géneros/etiquetas
2. Historial de lectura (vía localStorage, sin login de lector)
3. Ordenar biblioteca (recientes / alfabético)
4. Búsqueda avanzada (full-text search)
5. Estadísticas para admin

## Requisito de autenticación admin (RF09 — implementar)
El admin NO puede registrarse libremente. Debe existir una pantalla de
registro que pida:
- Email
- Password
- Confirmar password
- Código de autorización (valor hardcodeado, el equipo lo define en
  `SUPABASE_CONFIG.adminInviteCode`)

Flujo:
1. Usuario llena el formulario de registro
2. Antes de llamar a `supabaseClient.auth.signUp()`, valida en el cliente que
   el código ingresado coincida exactamente con `SUPABASE_CONFIG.adminInviteCode`
3. Si coincide, procede con `signUp(email, password)`
4. Si no coincide, muestra error "Código de autorización inválido"

**Nota sobre seguridad:** esta validación es del lado del cliente (JS es
editable por cualquiera), así que NO es una barrera técnica real. Para
este proyecto académico es aceptable porque así lo pide la actividad, pero
en la documentación de entrega no presenten como "seguro".

## Explícitamente descartado / fuera de alcance
- Registro o login de lectores (cualquier feature futura debe funcionar SIN
  cuenta de lector — favoritos, comentarios, etc. quedan descartados mientras
  esto no cambie)
- Backend intermedio tipo Node/Express — todo pasa por Supabase directo
- Sección de novelas ligeras: quedó como "tal vez, solo si sobra tiempo", NO
  planear el schema para esto todavía
