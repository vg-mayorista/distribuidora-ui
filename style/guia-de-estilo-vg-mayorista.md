# Guía de estilo — VG Mayorista Distribución

Guía de identidad visual para la PWA de pedidos mayoristas. Uso previsto: input directo para agentes de diseño/desarrollo (Claude Code, Figma, etc).

---

## 1. Principios de marca

| Valor | Cómo se traduce en el diseño |
|---|---|
| Confiabilidad y seriedad | Sin errores visuales, estados de carga claros, jerarquía tipográfica estable, cero elementos decorativos que compitan con la información |
| Eficiencia y rapidez | Máximo 3 clics para completar un pedido repetido, componentes livianos, fuentes del sistema/web-safe, sin animaciones largas |
| Frescura y origen natural | Verde como color semántico de "disponible/fresco", fotografía de producto real, fondo cálido no-blanco puro |
| Profesionalismo | Grillas consistentes, espaciado generoso, una sola fuente de acento (Montserrat) usada con moderación |

---

## 2. Logo

- Isotipo: monograma "VG" (V verde + G naranja) con espiga de trigo naranja y arco verde envolvente.
- Wordmark: "MAYORISTA" en carbón, "DISTRIBUCIÓN" en naranja, subrayado verde en trazo orgánico.
- Espacio de resguardo mínimo: alto de la letra "M" de MAYORISTA en todos los lados.
- Fondo: usar siempre sobre blanco o crema (`#FBF8F2`). No colocar sobre foto sin placa de contraste.
- No: rotar, distorsionar, recolorear, aplicar sombra/gradiente, ni separar el monograma del wordmark en el header principal.
- Versión reducida (favicon / ícono de app): solo el monograma "VG", sin espiga ni texto, mínimo 32×32px.

---

## 3. Paleta de colores

### 3.1 Colores base (extraídos del logo)

| Nombre | Hex | Uso |
|---|---|---|
| Naranja marca | `#F2790E` | Color primario de acción |
| Verde marca | `#5D8A1F` | Color semántico de estado positivo |
| Carbón | `#3C3C3C` | Texto principal |
| Crema | `#FBF8F2` | Fondo general |

### 3.2 Escalas derivadas (para estados hover/active/disabled y fondos tintados)

**Naranja**
| Token | Hex | Uso |
|---|---|---|
| `orange-50` | `#FDF0E4` | Fondo de badge / alerta suave |
| `orange-100` | `#FBD9B8` | Fondo hover de badge |
| `orange-400` | `#F2790E` | Color base — botón primario |
| `orange-600` | `#D9640A` | Hover de botón primario |
| `orange-700` | `#B85408` | Active/pressed |
| `orange-900` | `#6B3005` | Texto sobre fondo naranja claro |

**Verde**
| Token | Hex | Uso |
|---|---|---|
| `green-50` | `#EEF4E2` | Fondo de badge "en stock" |
| `green-100` | `#D6E6B8` | Fondo hover de badge |
| `green-400` | `#5D8A1F` | Color base — íconos de éxito, check |
| `green-600` | `#4A6F19` | Hover |
| `green-700` | `#3C5A14` | Active/pressed |
| `green-900` | `#22330B` | Texto sobre fondo verde claro |

**Neutros**
| Token | Hex | Uso |
|---|---|---|
| `neutral-0` | `#FBF8F2` | Fondo de página (crema) |
| `neutral-50` | `#F1EEE6` | Fondo de card / sección alterna |
| `neutral-100` | `#E2DED3` | Bordes, separadores |
| `neutral-400` | `#8A8781` | Texto secundario, placeholders |
| `neutral-800` | `#3C3C3C` | Texto principal (carbón) |
| `neutral-900` | `#1E1E1E` | Títulos de alto contraste |

**Semánticos adicionales** (no vienen del logo, se agregan solo si hace falta)
| Token | Hex | Uso |
|---|---|---|
| `red-500` | `#C43D3D` | Error, stock agotado, pedido rechazado |
| `red-50` | `#FBEAEA` | Fondo de alerta de error |

### 3.3 Reglas de uso

- **Naranja** = acción del usuario: "Agregar al carrito", "Confirmar pedido", "Enviar", enlaces activos, botón flotante.
- **Verde** = estado del sistema, no acción: badge "en stock", check de "precio actualizado", confirmación de pedido exitoso.
- **Nunca** usar naranja y verde en el mismo componente compitiendo por atención (ej. no hacer un botón verde de acción). Verde no se clickea, se lee.
- Un solo color de acento saturado por vista como máximo (naranja). El resto del color viene de neutros + verde funcional.
- Texto sobre fondo de color: usar siempre el stop 700-900 de esa misma escala, nunca negro puro ni gris genérico.
- Fondo de página: `neutral-0` (crema), nunca blanco puro `#FFFFFF` — mantiene la calidez y evita el look "clínico".

---

## 4. Tipografía

### 4.1 Familias

| Familia | Uso | Pesos |
|---|---|---|
| **Montserrat** | Nombre de marca, H1, títulos de sección hero | 700, 800 |
| **Inter** | Todo el resto: body, tablas, botones, formularios, navegación | 400, 500, 600 |

Fallback stack:
```css
--font-display: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
--font-body: 'Inter', 'Helvetica Neue', Arial, sans-serif;
```

### 4.2 Escala tipográfica

| Estilo | Familia | Peso | Tamaño | Line-height | Uso |
|---|---|---|---|---|---|
| Display | Montserrat | 800 | 32px | 1.2 | Nombre de marca, landing hero |
| H1 | Montserrat | 700 | 24px | 1.3 | Título de página |
| H2 | Inter | 600 | 19px | 1.4 | Título de sección |
| H3 | Inter | 600 | 16px | 1.4 | Título de card / subsección |
| Body | Inter | 400 | 15px | 1.6 | Texto general, descripciones |
| Body strong | Inter | 500 | 15px | 1.6 | Precios, cantidades, datos clave |
| Caption | Inter | 400 | 13px | 1.5 | Metadata, timestamps, ayuda |
| Botón | Inter | 600 | 15px | 1 | Todo texto de botón/CTA |

### 4.3 Reglas

- Nunca usar Montserrat en párrafos, tablas o botones — solo títulos cortos.
- Números (precios, SKU, cantidades) siempre en Inter, con `font-variant-numeric: tabular-nums` para que alineen en tablas.
- Sentence case en toda la UI (botones, labels, menús). Sin TITLE CASE salvo nombres propios. Sin mayúsculas sostenidas salvo el wordmark del logo.
- Sin subrayado en texto salvo links dentro de párrafo.

---

## 5. Espaciado y grilla

| Token | Valor | Uso |
|---|---|---|
| `space-xs` | 4px | Gap entre ícono y texto |
| `space-sm` | 8px | Gap interno de componentes chicos |
| `space-md` | 16px | Padding de cards, gap entre elementos de lista |
| `space-lg` | 24px | Separación entre secciones |
| `space-xl` | 40px | Separación entre bloques mayores de página |

- Radio de borde: `8px` en inputs y botones, `12px` en cards.
- Bordes: `1px solid neutral-100` por defecto; `1px solid neutral-400` en hover/focus.
- Grilla de catálogo: mínimo 2 columnas en mobile, auto-fit `minmax(160px, 1fr)` en desktop.

---

## 6. Componentes clave

### Botón primario
- Fondo `orange-400`, texto blanco, radio 8px, padding `12px 20px`.
- Hover: `orange-600`. Active: `orange-700`. Nunca gradiente ni sombra decorativa.
- Un solo botón primario visible por vista; el resto usa botón secundario (outline neutral).

### Badge de stock
- "En stock": fondo `green-50`, texto `green-900`, ícono check verde.
- "Stock bajo": fondo `orange-50`, texto `orange-900`.
- "Sin stock": fondo `red-50`, texto `red-500`, deshabilita el botón de agregar.

### Card de producto
- Fondo `neutral-0` o blanco, borde `1px solid neutral-100`, radio 12px.
- Foto de producto ocupa el 60% superior de la card, sin recorte agresivo.
- Precio en Body strong, disponibilidad como badge, botón de agregar siempre visible (no oculto en hover — es mobile-first).

### Tabla de pedidos / precios
- Encabezados en Inter 600, `neutral-400` sobre fondo `neutral-50`.
- Filas con borde inferior `neutral-100`, sin zebra-striping (más limpio, más "serio").
- Números alineados a la derecha, tabular-nums.

---

## 7. Tono de voz (copy de UI)

- Directo y sin rodeos: "Agregar al carrito", no "¡Sumalo ya!".
- Sin signos de exclamación en confirmaciones del sistema: "Pedido confirmado", no "¡Pedido confirmado!".
- Errores: decir qué pasó y qué hacer, sin jerga técnica. "No pudimos procesar el pedido. Probá de nuevo." en vez de exponer códigos de error.
- Tratamiento: voseo argentino, consistente con la ubicación del negocio ("vos", "tu pedido", "confirmá").

---

## 8. Fotografía

- Producto sobre fondo neutro o en contexto de campo/almacén, luz natural, sin filtros saturados artificiales.
- Evitar stock photography genérica de "granos flotando" — priorizar fotos reales del producto/depósito propio en cuanto sea posible.
- Relación de aspecto consistente en todo el catálogo (recomendado 4:3 o 1:1) para que la grilla no salte.

---

## 9. Checklist rápido para el agente

- [ ] ¿El botón de acción principal es naranja `#F2790E` y hay uno solo por vista?
- [ ] ¿El verde se usa solo para estado, nunca como botón clickeable?
- [ ] ¿El fondo de página es `#FBF8F2`, no blanco puro?
- [ ] ¿Los títulos usan Montserrat y el resto Inter?
- [ ] ¿Los números/precios están en tabular-nums y alineados a la derecha en tablas?
- [ ] ¿El texto sobre fondo de color usa el stop 700-900 de esa escala?
- [ ] ¿El copy está en sentence case y voseo, sin exclamaciones en confirmaciones?
