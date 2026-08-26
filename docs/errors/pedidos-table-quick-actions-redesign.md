# Rediseño Impeccable: Eliminación de Redundancia de Estados y Transición Inteligente

**Módulo**: Frontend (`distribuidora-ui`)  
**Patrón**:  
- La presencia de badges de estado en dos columnas simultáneas (**Estado** y **Acción**) generaba ruido visual y sobrecarga duplicada.
- Los botones de acción tenían textos largos ("ENTREGAR") y paletas de colores discordantes.
- En pedidos de retiro en local, el intento de transición fallaba al intentar pasar por estados de envío inexistentes.

**Diagnóstico / Fix (Impeccable Style)**:  
1. **Unificación Única de Estado en Columna "Estado"**:
   - La columna **Estado** es la única fuente de verdad (`Pendiente` o `Entregado`).
   - La columna **Acción** se reservó exclusivamente para controles ejecutables (`Ver`, `📄 Remito`, `✓ Marcar entregado`). Cuando el pedido se encuentra en `ENTREGADO`, la columna **Acción** no duplica insignias de estado.
2. **Lógica de Transición Inteligente**:
   - Para pedidos de tipo Retiro en Local (`isRetiro`), la secuencia salta automáticamente el estado `ENVIADO` (`PENDIENTE` -> `ARMADO` -> `ENTREGADO`), eliminando errores de alerta del backend.
3. **Estética y Paleta Armoniosa Impeccable**:
   - Botón `Ver`: Neutro sutil secundario.
   - Botón `📄 Remito`: Azul suave equilibrado (`#f0f7ff`).
   - Botón `✓ Marcar entregado`: Verde esmeralda sólido profesional (`#16a34a`), con texto conciso y legible.
