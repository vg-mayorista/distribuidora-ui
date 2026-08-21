# AGENTS — Módulo: Descargar Remitos

## Propósito
UI para que `ROLE_ADMIN` / `ROLE_DISTRIBUTOR` genere, consulte y descargue remitos DOCX de pedidos mayoristas.

## Backend
- **Admin controller**: `AdminDeliveryNoteController`
- **Admin base path**: `/api/admin/delivery-notes`
- **Distribuidor controller**: `DistributorDeliveryNoteController`
- **Distribuidor base path**: `/api/distributor/delivery-notes`
- **Roles**: `ROLE_ADMIN` y `ROLE_DISTRIBUTOR` (backend y frontend).

## Endpoints
| Método | Ruta | Acción |
|--------|------|--------|
| POST | `/generate/{orderId}` | Generar remito desde orden ARMADO/ENVIADO |
| GET | `/{id}` | Detalle de remito |
| GET | `/` | Listado paginado + filtro por status |
| GET | `/order/{orderId}` | Remitos de una orden |
| PATCH | `/{id}/status` | Cambiar estado (PENDING → GENERATED/DELIVERED/CANCELED) |
| GET | `/{id}/download` | Descargar DOCX |

## Modelos frontend
- `DeliveryNote`: `id`, `orderId`, `deliveryNoteNumber`, `status`, `issueDate`, `deliveryDate`, `notes`, `items`, `createdAt`, `updatedAt`, `closedAt`
- `DeliveryNoteItem`: `id`, `productId`, `productName`, `unitPrice`, `quantityDelivered`
- `DeliveryNoteStatus`: `PENDING`, `GENERATED`, `DELIVERED`, `CANCELED`

## Estados y reglas
- **Numeración**: `R-YYYY-NNNN` (secuencial por año).
- **Transiciones**: PENDING → GENERATED/CANCELED; GENERATED → DELIVERED/CANCELED; DELIVERED/CANCELED = terminal.
- **Generación**: solo para `OrderType.WHOLESALE` y estados `ARMADO` o `ENVIADO`.
- **Inmutabilidad**: una vez `DELIVERED`, no se modifica ni cancela.
- **Corte**: descarga disponible después del corte (Mar/Jue 18:00).

## Estructura esperada
| Ruta | Contenido |
|------|-----------|
| `descargar-remitos/` | Componentes standalone, servicio HTTP |
| `services/delivery-note.service.ts` | Llamadas REST |
| `models/delivery-note.model.ts` | Tipos frontend |
| `components/remito-list/` | Tabla paginada con filtros |
| `components/remito-detail/` | Detalle + historial + descarga DOCX |
| `components/remito-status-transition/` | Formulario de cambio de estado |

## Dependencias
- `order.service.ts` (validar orden)
- Auth guard con `ROLE_ADMIN` / `ROLE_DISTRIBUTOR`
- `HttpClient` con interceptores

## UI
- Español (voseo argentino).
- Estilo: `style/guia-de-estilo-vg-mayorista.md`.
- Impeccable para UX review.

## Errores conocidos
Consultar **`docs/errors/index.md`** para diagnósticos rápidos por patrón.

## Futuro
- Filtros avanzados (rango de fechas, cliente, número de remito).
- Preview visual del DOCX antes de descargar.
- Descarga batch (ZIP) de múltiples remitos.
- Integración con notificaciones (`DeliveryNoteCreatedEvent`).
