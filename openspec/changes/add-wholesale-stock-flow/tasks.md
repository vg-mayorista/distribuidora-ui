# Frontend Tasks: Add Wholesale vs. Stock Order Flow

## F5 — Quitar cap de stock en catálogo mayorista

- [ ] `CatalogoComponent`: quitar `maxPacksFor` capping y el fetch inicial a
      `cart/check-stock`.
- [ ] `cart.store.ts`: no aplicar `maxAllowed` cuando se cargan líneas.
- [ ] Helpers `OrderType` y `DeliveryMethodScope` en `models/`.

## F6 — Pantalla stock-disponible

- [ ] Nuevo `StockDisponibleComponent` (grid + filtro + sort by stock desc).
- [ ] Nuevo `StockCartStore` con capping por stock (reutiliza `cart.check-stock`).
- [ ] Sidebar agrega ítem "Stock disponible" solo para `ROLE_CUSTOMER`.

## F7 — Confirmar refactor

- [ ] `ConfirmarComponent` con `mode: 'wholesale' | 'stock'`.
- [ ] Wholesale: dropdown de próximas 2 fechas válidas (consume
      `businessConfig.deliveryWindows`); banner informativo.
- [ ] Wholesale: filtrar métodos por `appliesToOrderType IN (WHOLESALE, BOTH)`.
- [ ] Stock: sin fecha; todos los métodos incluyendo Express.
- [ ] `OrderService.createWholesale(req)` y `createStock(req)`.

## F8 — Mis pedidos y detalle

- [ ] Badge `type` en `MisPedidosComponent` (en cada card / fila).
- [ ] `PedidoDetalleClienteComponent`: badge y reglas de edición por tipo.
- [ ] `DistribuidorPedidosComponent`: columna `type` + filtro.
- [ ] `DistribuidorPedidoDetalleComponent`: editable desde PENDIENTE para WHOLESALE.

## F9 — Admin delivery-windows

- [ ] Página `/admin/delivery-windows` con tabla y modal de crear/editar.
- [ ] `AdminDeliveryWindowService` con ABM.
- [ ] Solo visible para `ROLE_ADMIN`.

## Pendiente de integración

- Verificar que `businessConfig.deliveryWindows` llegue bien desde el backend (F4 listo).
- Cobertura de tests para `cart.store`, `stock-cart.store`, `confirmar` componente.
