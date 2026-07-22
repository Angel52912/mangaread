# Sistema de diseño — MangaReadV1

Concepto: **"hecho por un otaku"** combinado con la base visual que ya trajo
el equipo (estilo "shonen energético", generado originalmente con una
herramienta de diseño IA). Es una fusión aprobada por el equipo — no cambiar
la dirección sin discutirlo con ellos primero.

## Paleta de colores (tokens Tailwind, dark mode)

El proyecto usa tokens de color estilo Material (definidos en
`tailwind.config` dentro de cada HTML). Los que importan para mantener
consistencia:

| Token              | Valor      | Uso                                    |
|---------------------|------------|------------------------------------------|
| `primary`            | `#93b4e3`  | Acento principal (antes era naranja-salmón, se recoloreó a índigo) |
| `on-primary`         | `#0d1b30`  | Texto sobre fondo `primary`             |
| `primary-container`  | `#2b4570`  | Fondo de botones principales (índigo profundo, "ai") |
| `on-primary-container`| `#dce6f5` | Texto sobre `primary-container`         |
| `tertiary`           | `#e9c400`  | Dorado — ratings, destacados ("kin")    |
| `secondary-container`| `#e60000`  | Rojo intenso — badges, sellos hanko ("hiiro") |
| `background` / `surface` | `#131313` | Fondo general oscuro ("sumi")       |

**No tocar** `tertiary` ni `secondary-container` — ya coincidían con la
paleta otaku original. Si agregas una pantalla nueva, reusa estos mismos
tokens; no inventes hex nuevos sueltos en el HTML.

## Tipografía

- **Yuji Syuku** (Google Fonts): título del logo "MangaReadV1", títulos de
  manga (en tarjetas de biblioteca y en `detalle.html`). Look de pincel
  japonés — úsalo solo en títulos grandes, nunca en texto de body ni en
  labels pequeños (es ilegible en tamaños chicos).
- **Anton**: se conserva del diseño original para headers del panel de
  admin (`admin.html`) — no reemplazar por Yuji Syuku ahí, es la identidad
  visual que el equipo quiere mantener en el lado admin.
- **Space Grotesk**: labels en mayúscula, botones, chips.
- **Hanken Grotesk**: texto de cuerpo (sinopsis, párrafos).

## Componentes de firma (no genéricos)

### Sello hanko (género)
Chip rojo, rotado ligeramente (-1° a 2°, alternando), esquinas redondeadas,
fondo sólido rojo (`secondary-container`) o transparente con borde rojo
cuando no está activo. Se usa para:
- Filtros de género en la biblioteca (envueltos con `flex-wrap`, nunca lista
  vertical — deben escalar bien con 8+ géneros)
- Badge de género siempre visible en la esquina de cada portada (no solo al
  hacer hover)

```css
.hanko-chip {
  border: 1.5px solid #C63D2F;
  color: #C63D2F;
  border-radius: 6px;
  transform: rotate(-1deg); /* alternar por nth-child */
}
.hanko-chip:hover, .hanko-chip-active {
  background: #C63D2F;
  color: #fff6f5;
}
```

### Tarjetas "estante de libros"
Las portadas en la biblioteca llevan una inclinación leve y alternada
(`--tilt`, entre -1° y 0.8° por posición) que se endereza al hacer hover —
simula libros apoyados en un estante físico, no una grilla plana.

### Obi band (franja inferior)
Pendiente de aplicar de forma consistente en todas las tarjetas: franja
inferior con corte diagonal (`clip-path`), fondo oscuro, texto dorado
(`tertiary`), mostrando género + cantidad de tomos.

## Reglas al agregar UI nueva

1. Revisa antes si ya existe un componente parecido (chip, badge, card) en
   `index.html` o `detalle.html` — reutiliza esa clase/estilo en vez de crear
   uno nuevo.
2. Nunca agregues una librería de iconos distinta a `material-symbols-outlined`.
3. Todo texto de body va en Hanken Grotesk; todo título grande en Yuji Syuku
   (lado lector) o Anton (lado admin) — no mezclar ambos en la misma pantalla.
4. Si necesitas un color que no está en la tabla de arriba, primero pregúntate
   si puedes reusar `primary`/`tertiary`/`secondary-container` — evita sumar
   tokens de color nuevos sin necesidad real.
