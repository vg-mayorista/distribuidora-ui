# UI Spec — Order Flow

Ver la spec del backend (`../../distribuidora/openspec/specs/order-flow/spec.md`).
Esta sección solo cubre los aspectos que aplican al cliente.

## UX

- En el sidebar del cliente hay dos entradas:
  - **"Hacer pedido mayorista"** → `/cliente/catalogo`.
  - **"Stock disponible"** → `/cliente/stock-disponible`.
- El cliente nunca está obligado a mezclar los dos: cada flujo tiene su propio carrito y su
  propia pantalla de confirmación.
- En "Mis pedidos" cada pedido muestra un badge `type`:
  - 🏭 "A fábrica" (WHOLESALE)
  - 📦 "Stock" (STOCK)
- En la pantalla de confirmar el cliente ve un banner con la regla de corte cuando está
  eligiendo fecha (ej. "Pedidos hasta hoy 18 h → entrega miércoles").

## Compatibilidad

- Los pedidos creados por clientes antes de este cambio quedan como `STOCK` (default del
  backend). Su edición sigue igual que antes.
- Los métodos de entrega sin `appliesToOrderType` se muestran como `BOTH` para no romper
  UI preexistente.
