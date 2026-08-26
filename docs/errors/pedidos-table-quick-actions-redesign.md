# Rediseño Impeccable: Simplificación a 2 Estados y Alineación de Acciones Rápidas

**Módulo**: Frontend (`distribuidora-ui`)  
**Patrón**:  
- Múltiples botones con anchos, colores y alturas dispares en la fila de pedidos causaban desalineación visual.
- Existían demasiados filtros de estados intermedios en el flujo operativo del distribuidor.

**Diagnóstico / Fix (Impeccable Style)**:  
1. **Modelo Simplificado de 2 Estados Operativos**:
   - En la vista principal se simplificaron las opciones de filtro a **`Todos`**, **`Pendientes`** y **`Entregados`**.
   - Para pedidos no entregados (`Pendiente`), se ofrece un único botón de acción destacado: **`✓ Entregar`**.
   - Al ejecutarse la acción, el sistema resuelve secuencialmente cualquier estado intermedio hasta llegar a `ENTREGADO`.
   - Cuando un pedido se encuentra en `ENTREGADO`, la acción se transforma suavemente en un badge esmeralda (`#dcfce7` / `#15803d`): **`✓ Entregado`**.
2. **Disposición Visual Uniforme Impeccable**:
   - Todos los botones de acción (`Ver`, `📄 Remito`, `✓ Entregar`, `✓ Entregado`) poseen una altura uniforme fija (`32px`), alineación vertical centrada y espaciado consistente (`gap: 0.5rem`).
   - El botón de remito adoptó un estilo azul suave armonioso (`#eff6ff`), mientras que `Ver` mantiene un estilo neutro sutil y limpio.
