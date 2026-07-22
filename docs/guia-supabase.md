# Guía paso a paso: Configurar Supabase para MangaReadV1

> Este es el documento de guía que el profesor entregó junto con la actividad.
> Está aquí como referencia práctica para los pasos de configuración de
> Supabase. Si hay diferencia con `docs/base-de-datos.md`, esta guía tiene
> prioridad en los pasos de configuración del lado de Supabase.

## 1. Qué es Supabase en este proyecto

Supabase funciona como el backend de la aplicación.

En MangaReadV1 se usa para:

- Guardar información de mangas en una base de datos Postgres.
- Guardar tomos y marcas de capítulos.
- Subir portadas y PDFs a Storage.
- Crear e iniciar sesión con usuario administrador.
- Permitir que los usuarios lean sin iniciar sesión.
- Evitar que los usuarios puedan modificar la biblioteca.

## 2. Crear cuenta en Supabase

1. Entrar a: `https://supabase.com`
2. Dar clic en **Start your project** o **Sign in**.
3. Iniciar sesión con GitHub, Google o correo.
4. Si Supabase pide verificar correo, revisar la bandeja de entrada.

## 3. Crear un nuevo proyecto

1. En el panel principal de Supabase, dar clic en **New project**.
2. Seleccionar una organización. Si no existe, crear una.
3. Completar los campos:
   - Project name: `mangaread-v1`
   - Database Password: una contraseña segura
   - Region: la más cercana disponible
4. Guardar la contraseña de la base de datos en un lugar seguro.
5. Dar clic en **Create new project**.
6. Esperar a que Supabase termine de preparar el proyecto.

**Nota:** la contraseña de la base de datos no se coloca en el código del
frontend.

## 4. Abrir SQL Editor

1. Dentro del proyecto de Supabase, buscar el menú lateral.
2. Entrar a **SQL Editor**.
3. Dar clic en **New query**.
4. Copiar el SQL que viene en `setup_supabase.sql` del proyecto.
5. Pegar el SQL en Supabase.

## 5. Cambiar el correo administrador en el SQL

Antes de ejecutar el SQL, buscar esta parte:

```sql
select lower(coalesce(auth.jwt() ->> 'email', '')) in (
  'correo-administrador@ejemplo.com'
);
```

Cambiar el correo por el correo administrador que se va a usar:

Si hay más de un administrador, se pueden agregar correos separados por coma:

```sql
select lower(coalesce(auth.jwt() ->> 'email', '')) in (
  'administrador1@ejemplo.com',
  'administrador2@ejemplo.com'
);
```

**Importante:** el correo debe escribirse en minúsculas para evitar errores.

## 6. Ejecutar el SQL

1. Dar clic en **Run**.
2. Esperar a que termine.
3. Si todo está correcto, Supabase mostrará que la consulta fue ejecutada.

Este SQL crea:
- Tabla `mangas`
- Tabla `volumes`
- Tabla `chapter_marks`
- Buckets `covers` y `pdfs`
- Políticas de seguridad RLS
- Políticas de lectura pública
- Políticas de escritura solo para administradores

## 7. Verificar tablas creadas

1. En el menú lateral entrar a **Table Editor**.
2. Revisar que existan estas tablas:
   - `mangas`
   - `volumes`
   - `chapter_marks`
3. Al inicio estarán vacías. Eso es normal.

## 8. Verificar buckets de Storage

1. En el menú lateral entrar a **Storage**.
2. Revisar que existan estos buckets:
   - `covers`
   - `pdfs`
3. Entrar a cada bucket y verificar que exista la opción de bucket público.

El SQL ya intenta crearlos como públicos. Si por alguna razón no aparecen, se
pueden crear manualmente:

**Bucket `covers`**
- Name: `covers`
- Public bucket: activado
- File size limit: 10 MB

**Bucket `pdfs`**
- Name: `pdfs`
- Public bucket: activado
- File size limit: 800 MB

## 9. Revisar el límite global de archivos

Supabase puede mostrar un límite global de archivo menor al límite del bucket.

1. Entrar a **Storage**.
2. Entrar al bucket `pdfs`.
3. Revisar configuración del bucket.
4. Si aparece "Restrict file size", confirmar que esté en `800 MB`.
5. Si Supabase muestra un límite global de `50 MB`, el proyecto aún puede
   subir PDFs grandes porque divide los PDFs en partes más pequeñas.

## 10. Obtener Project URL y anon key

1. Entrar a **Project Settings**.
2. Entrar a **API**.
3. Copiar:
   - Project URL
   - anon public key

**No copiar la `service_role key`.**

### Diferencia importante

- **anon public key**: Se puede usar en el frontend.
- **service_role key**: Es privada. Nunca debe ponerse en `js/config.js`.

## 11. Configurar `js/config.js`

Dentro de tu proyecto crea el archivo: `js/config.js`

Reemplazar los valores por los del proyecto de cada usuario o equipo:

```js
const SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU-ANON-PUBLIC-KEY",
  adminInviteCode: "CODIGO-ADMINISTRADOR-DE-PRUEBA",
  adminEmails: [
    "correo-administrador@ejemplo.com"
  ],
  buckets: {
    covers: "covers",
    pdfs: "pdfs"
  }
};
```

Los valores importantes son:
- `url`: Project URL de Supabase.
- `anonKey`: anon public key.
- `adminInviteCode`: código que se pedirá para crear cuenta de administrador.
- `adminEmails`: lista de correos permitidos como administradores.
- `covers`: nombre del bucket de portadas.
- `pdfs`: nombre del bucket de PDFs.

**El correo de `adminEmails` debe coincidir con el correo usado en
`setup_supabase.sql`.**

## 12. Configurar autenticación

1. En Supabase entrar a **Authentication**.
2. Entrar a **Providers**.
3. Verificar que **Email** esté activado.
4. Entrar a **URL Configuration**.
5. Agregar las URL donde se usará el proyecto.

Para trabajo local, usar:
- `http://localhost:8000`
- `http://127.0.0.1:5500`

Si se publica en GitHub Pages, agregar también la URL final:
- `https://usuario.github.io/nombre-del-repositorio`

**Nota:** si usan Live Server en Visual Studio Code, normalmente la URL será:
`http://127.0.0.1:5500`.
