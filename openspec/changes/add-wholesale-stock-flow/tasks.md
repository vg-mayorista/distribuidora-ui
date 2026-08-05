# Frontend Tasks: Add Wholesale vs. Stock Order Flow

## F5 — Quitar cap de stock en catálogo mayorista (✅)

- [x] `CatalogoComponent`: quitar `maxPacksFor` capping y el fetch inicial a
      `cart/check-stock`.
- [x] `cart.store.ts`: dos stores paralelos (wholesale + stock).
- [x] Helpers `OrderType` y `DeliveryMethodScope` en `models/`.

## F6 — Pantalla stock-disponible (✅)

- [x] Nuevo `StockDisponibleComponent` (grid + sort by stock desc).
- [x] Banner explicativo con link al catálogo mayorista.
- [x] Sidebar agrega ítem "Stock disponible" solo para `ROLE_CUSTOMER`.

## F7 — Confirmar refactor (✅)

- [x] `ConfirmarComponent` con `mode: 'wholesale' | 'stock'` (detectado vía
      ruta `data.mode` o fallback al contenido del carrito).
- [x] Wholesale: dropdown de próximas 2 fechas válidas; banner; oculta Express.
- [x] Stock: sin fecha; todos los métodos incluyendo Express.
- [x] `OrderService.createWholesale(req)` y `createStock(req)`.

## F8 — Mis pedidos y detalle (✅)

- [x] Badge `type` en `MisPedidosComponent` (en cada order-card).
- [x] `PedidoDetalleClienteComponent`: badge en el header.
- [x] `DistribuidorPedidosComponent`: columna "Flujo" + chip filter.
- [x] `DistribuidorPedidoDetalleComponent`: badge en el header.
- [x] `OrdersComponent` admin: badge "Flujo".

## F9 — Admin delivery-windows (✅)

- [x] `AdminDeliveryWindowService` (CRUD).
- [x] `AdminDeliveryWindowsComponent` (tabla + modal crear/editar/eliminar).
- [x] Ruta `/admin/delivery-windows` + entry en navbar admin.
- [x] Vista de días localizada (lunes..domingo).

## Pendiente

### Smoke test manual recomendado

Pasos para QA:

1. `npm run build` (debe pasar sin warnings nuevos).
2. `npm start` y login como cliente:
   - `/cliente/catalogo` debe mostrar el banner 🏭 "Estás armando un pedido a fábrica"
     y permitir agregar packs de productos sin stock al carrito mayorista.
   - `/cliente/stock-disponible` debe mostrar productos con `stock > 0`,
     ordenar por cantidad disponible, y ocultar el resto.
   - Carrito mayorista → confirmar → debe mostrar dropdown con las próximas
     fechas de entrega (próximo miércoles / viernes), ocultar "Envío Express".
   - Carrito de stock → confirmar → debe incluir "Envío Express", sin pedir fecha.
3. Login como distribuidor:
   - `/distribuidor/pedidos` debe mostrar la columna "Flujo" con badges tipo.
     El chip filter "A fábrica / Stock / Todos" debe cambiar el query `?type=`.
   - En el detalle, `updateDeliveryDate` solo se permite para mayoristas en
     PENDIENTE (campo no visible para STOCK).
4. Login como admin:
   - `/admin/delivery-windows` debe listar las 2 ventanas por defecto y permitir
     agregar/editar/eliminar.

### Fuera de scope

- Tests E2E / unitarios en Angular (no hay infra previa, queda como backlog).
