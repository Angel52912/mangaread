# Actividad integradora: Construir app web MangaReadV1

> Este documento es el texto **completo y original** de la actividad tal como
> la entregó el profesor. Si algo en `docs/requisitos.md` o en `AGENTS.md`
> parece contradecir esto, **este archivo tiene prioridad** — los demás son
> resúmenes curados por el equipo.
>
> Excepción documentada: el equipo decidió NO implementar el registro de
> admin con código autorizado que menciona RF09 más abajo. El admin se crea
> manualmente desde el dashboard de Supabase. Ver `AGENTS.md` regla 3.

## Descripción

En esta actividad deberás construir desde cero una aplicación web llamada
MangaReadV1, una biblioteca digital donde los usuarios puedan consultar
mangas/comics en PDF y leerlos desde el navegador.

## Objetivo general

En equipos de 3 o 4 personas (máximo 4), desarrollar una aplicación web
funcional usando HTML, CSS, JavaScript y Supabase, capaz de administrar
mangas/comics, tomos, portadas, PDFs y marcas de capítulos.

## Resultado esperado

Al finalizar, la aplicación debe permitir:
- Mostrar una biblioteca pública de mangas.
- Buscar mangas por título o autor.
- Ver detalle de un manga.
- Mostrar portada, autor, sinopsis, sentido de lectura y tomos.
- Leer un tomo en PDF desde el navegador con efecto libro 3D.
- Iniciar sesión como administrador.
- Crear, editar y eliminar mangas.
- Agregar y editar tomos dentro del manga correcto.
- Subir portadas y PDFs a Supabase Storage.
- Registrar en qué página inicia cada capítulo.
- Validar campos obligatorios y evitar registros duplicados.

## Tecnologías mínimas requeridas
- HTML.
- CSS.
- JavaScript.
- Supabase.
- Supabase Auth.
- Supabase Database.
- Supabase Storage.

Tecnologías adicionales sugeridas:
- PDF.js para renderizar PDFs.
- PageFlip o una librería similar para efecto de libro 3D.
- GitHub Pages, Netlify o Vercel para publicación.

## Estructura mínima sugerida

Cada equipo puede organizar el proyecto como considere, pero se recomienda
esta estructura:

```
mangaread/
  index.html
  admin.html
  css/
    styles.css
  js/
    config.js
    app.js
    auth.js
    manga-service.js
    ui.js
    reader.js
    utils.js
  docs/
    evidencias.md
```

## Roles de usuario que debe tener el sistema

### Usuario lector
No necesita iniciar sesión.

Debe poder:
- Ver biblioteca.
- Buscar mangas/comics.
- Abrir detalle del manga/comic.
- Leer tomos.

No debe poder:
- Crear mangas/comics.
- Editar mangas/comics.
- Eliminar mangas/comics.
- Subir archivos.
- Modificar tomos.

### Administrador
Debe iniciar sesión para poder realizar las siguientes actividades:

Debe poder:
- Crear mangas/comics.
- Editar mangas/comics.
- Eliminar mangas/comics.
- Agregar tomos.
- Editar tomos.
- Subir portadas.
- Subir PDFs de los tomos de mangas/comics.
- Agregar marcas de capítulos (esto para indicar dentro del tomo dónde
  inicia cada capítulo).

## Requisitos funcionales

### RF01. Biblioteca pública
La pantalla principal debe mostrar tarjetas de mangas con:
- Portada.
- Título.
- Autor.
- Número de tomos.

### RF02. Búsqueda
Debe existir un campo para buscar mangas por:
- Título.
- Autor.

### RF03. Detalle de manga
Al seleccionar un manga, se debe mostrar:
- Portada.
- Título.
- Autor.
- Sinopsis.
- Sentido de lectura.
- Lista de tomos disponibles.

### RF04. Crear manga
El administrador debe poder crear un manga con:
- Título.
- Autor.
- Sinopsis.
- Sentido de lectura.
- Portada.

### RF05. Editar manga
El administrador debe poder modificar:
- Título.
- Autor.
- Sinopsis.
- Sentido de lectura.
- Portada.

### RF06. Agregar tomo
El administrador solo debe poder agregar un tomo después de seleccionar el
manga correcto. Un tomo debe tener:
- Título.
- Texto de capítulos incluidos.
- PDF.
- Marcas de capítulos.

### RF07. Editar tomo
El administrador debe poder editar:
- Título del tomo.
- Texto de capítulos incluidos.
- PDF, opcional si desea conservar el existente.
- Marcas de capítulos.

### RF08. Lector PDF
El lector debe permitir:
- Ver páginas del PDF.
- Ir a página siguiente.
- Ir a página anterior.
- Ir a una página específica.
- Ir a un capítulo registrado.
- Efecto libro 3D.

Extras opcionales:
- Zoom al libro.
- Pantalla completa al leer el libro.
- Modo responsive para móvil.

### RF09. Autenticación administrador
Debe existir una pantalla o sección de acceso administrador. El
administrador debe poder:
- Crear cuenta si usa un código autorizado. **(NO implementado — decisión de
  equipo, ver nota al inicio de este archivo)**
- Iniciar sesión.
- Cerrar sesión.

### RF10. Persistencia
La información debe quedar guardada en Supabase. Si se recarga la página,
los mangas y tomos deben seguir apareciendo.

## Validaciones obligatorias

La aplicación debe validar:
- No crear manga sin título.
- No repetir manga con el mismo título.
- No crear tomo sin título.
- No agregar tomo sin seleccionar manga.
- No repetir título de tomo dentro del mismo manga.
- No repetir el mismo nombre de PDF dentro del mismo manga.
- No subir portada que no sea imagen.
- No subir tomo que no sea PDF.
- No aceptar marcas de capítulo incompletas.
- No repetir número de capítulo en el mismo tomo.
- No repetir página inicial en el mismo tomo.
- No aceptar páginas menores o iguales a 0.
- No permitir que un usuario sin sesión administrador escriba en la base de
  datos.

## Configuración de Supabase

Cada equipo debe crear su propio proyecto de Supabase.

### Paso 1. Crear proyecto
1. Entrar a `https://supabase.com`
2. Crear cuenta o iniciar sesión.
3. Crear un proyecto nuevo.
4. Guardar la contraseña de base de datos en un lugar seguro.

### Paso 2. Ejecutar SQL
Entrar a SQL Editor y ejecutar el script de configuración (antes de
ejecutarlo, cambiar `correo-administrador@ejemplo.com` por el correo real del
administrador o del equipo). El script base del profesor crea: la función
`public.is_admin()`, las tablas `mangas`/`volumes`/`chapter_marks` con RLS
completo, y los buckets `covers`/`pdfs` con sus políticas. **La versión que
usa este equipo ya incluye esto más las extensiones del equipo — ver
`setup_supabase.sql` en la raíz y `docs/base-de-datos.md`.**

### Paso 3. Verificar tablas
En Table Editor, verificar que existan: `mangas`, `volumes`, `chapter_marks`

### Paso 4. Verificar Storage
En Storage, verificar que existan: `covers`, `pdfs` (deben ser públicos)

### Paso 5. Obtener credenciales públicas
Entrar a Project Settings > API y copiar `Project URL` y `anon public key`.
No copiar ni usar la `service_role key`.

### Paso 6. Crear archivo de configuración
```js
const SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU-ANON-PUBLIC-KEY",
  adminInviteCode: "CODIGO-DE-PRUEBA", // NO usado — no hay registro
  adminEmails: [
    "correo-administrador@ejemplo.com"
  ],
  buckets: {
    covers: "covers",
    pdfs: "pdfs"
  }
};
```
El correo debe coincidir con el correo configurado en la función
`public.is_admin()`.

### Paso 7. Activar proveedor Email
1. Ir a Authentication.
2. Entrar a Providers.
3. Confirmar que Email esté activado.
4. Entrar a URL Configuration.
5. Agregar las URLs locales o publicadas que usará el equipo (ej.
   `http://localhost:8000`, `http://127.0.0.1:5500`,
   `https://usuario.github.io/repositorio`)

## Requerimientos técnicos mínimos

### Conexión a Supabase
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```
```js
const supabaseClient = supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);
```

### Normalización de texto
Para evitar duplicados, deben normalizar textos antes de guardar:
```js
function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
```

### Guardar manga
```js
{
  title,
  normalized_title: normalizeText(title),
  author,
  synopsis,
  direction,
  cover_path
}
```

### Guardar tomo
```js
{
  manga_id,
  title,
  normalized_title: normalizeText(title),
  chapters_label,
  pdf_path,
  pdf_storage_mode,
  pdf_name,
  normalized_pdf_name: normalizeText(pdfName)
}
```

### Guardar marcas de capítulos
```js
{
  volume_id,
  chapter,
  page
}
```

## Entregables

Cada equipo debe entregar:
- Código fuente completo.
- Capturas de Supabase: tablas creadas, buckets creados, usuario
  administrador.
- Capturas de la aplicación: biblioteca, detalle de manga, formulario de
  manga, formulario de tomo, lector, login administrador.
- Documento de pruebas.
- Documento breve explicando: estructura del proyecto, cómo se conecta a
  Supabase, cómo se protegen las operaciones administrador, qué
  validaciones implementaron, qué dificultades encontraron.

## Rúbrica

| Criterio                                                    | Puntos |
|--------------------------------------------------------------|--------|
| Estructura del proyecto                                       | 5      |
| Maquetación clara y navegable                                  | 10     |
| Conexión correcta con Supabase                                  | 10     |
| Tablas, relaciones, buckets y políticas configuradas             | 10     |
| Evidencia de proyecto funcional                                   | 10     |
| Autenticación administrador funcional                              | 10     |
| CRUD de mangas funcional                                             | 10     |
| CRUD de tomos funcional y asociado al manga correcto                   | 10     |
| Lector PDF formato libro 3D funcional                                    | 10     |
| Validaciones obligatorias implementadas                                    | 10     |
| Documentación y evidencias                                                   | 5      |
| **Total**                                                                       | **100**|

## Criterios de calidad
- La app no debe depender de datos en memoria para funcionar.
- La información debe persistir en Supabase.
- El usuario lector no debe poder modificar datos.
- Los formularios deben mostrar errores comprensibles.
- El diseño debe ser usable en escritorio y móvil.
- El código debe estar organizado en funciones o módulos claros.
