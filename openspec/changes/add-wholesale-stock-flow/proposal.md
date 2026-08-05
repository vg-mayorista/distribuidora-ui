# Frontend — Add Wholesale vs. Stock Order Flow

## Why

Espejo del cambio del backend (`openspec/changes/add-wholesale-stock-flow` en
`../distribuidora`). El cliente necesita ver dos flujos claramente separados:

1. **Pedido mayorista** — hace pedido a fábrica; no se ve stock; se elige fecha de entrega
   según las ventanas semanales.
2. **Stock disponible** — compra excedente en depósito; capeado por stock; envío express
   disponible; sin fecha.

## What Changes

- `CatalogoComponent` (mayorista): quitar capping y consulta inicial de stock.
- Nuevo `StockDisponibleComponent` con su propio `StockCartStore`.
- `ConfirmarComponent` detecta `mode: 'wholesale' | 'stock'`:
  - Wholesale → dropdown de próximas 2 fechas, oculta Express.
  - Stock → sin fecha, incluye Express.
- Sidebar del cliente con dos entradas separadas (Hacer pedido mayorista / Stock disponible).
- Badge `type` en pedidos (Mis pedidos / Detalle / Distribuidor).
- Nueva pantalla admin `/admin/delivery-windows` (ABM de las ventanas).

## Impact

- 2 rutas nuevas (`/cliente/stock-disponible`, `/admin/delivery-windows`).
- Nuevos modelos: `OrderType`, `DeliveryMethodScope`, `DeliveryWindow`.
- `OrderService.create` se reemplaza por `createWholesale(req)` y `createStock(req)`.
- `businessConfig.deliveryWindows` ya viene en `GET /api/config/public`.

## Tasks

Ver `tasks.md` en este mismo directorio; se mantiene sincronizado con el backend.
