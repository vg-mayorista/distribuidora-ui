# Rediseño de Acciones Rápidas en la Lista de Pedidos del Distribuidor

**Módulo**: Frontend (`distribuidora-ui`)  
**Patrón**:  
- La sección de cambiar estado dentro de cada detalle de pedido (`pedido-detalle`) ocupaba espacio excesivo y requería entrar a cada pedido para avanzar el flujo o descargar el remito.
- La tabla principal de pedidos (`pedidos.html`) solo contaba con un botón "Ver".

**Diagnóstico / Fix**:  
- **Causa raíz**: Falta de acciones directas en la vista tabular del dashboard de distribuidor.
- **Solución**: 
  1. Se ocultó la tarjeta de "Cambiar estado" dentro de `pedido-detalle.html`.
  2. Se integraron botones de acción directa en la columna `Acción` de la tabla de pedidos (`pedidos.html`):
     - **Botón `📄 Remito`**: Permite la descarga directa del archivo DOCX del remito para pedidos mayoristas armados o entregados.
     - **Botones de transición (`🚚 Enviar`, `✓ Entregar`)**: Permiten cambiar el estado del pedido directamente desde la fila.
     - **Badge `✓ Entregado`**: Cuando el pedido pasa a estado `ENTREGADO`, el botón se transforma en una píldora verde brillante fija con animación suave.
  3. Se hizo dinámica la propiedad `apiUrl` en `DeliveryNoteService` para resolver correctamente el rol activo (`ROLE_DISTRIBUTOR` vs `ROLE_ADMIN`).
