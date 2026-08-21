# No aparecen remitos ni descarga en el dashboard del distribuidor

**Módulo**: Frontend  
**Patrón**:  
Ruta `/distribuidor/remitos` accesible pero sin links de navegación, o error 403/404 al cargar remitos, o no aparecen remitos después de marcar un pedido como `ARMADO`.

**Diagnóstico / Fix**:  
Cuatro fallos frontend:
1. `delivery-note.service.ts` tenía `apiUrl` hardcodeada a `/api/admin/delivery-notes`, así que `ROLE_DISTRIBUTOR` recibía 403. Fix: detectar rol y usar `/api/distributor/delivery-notes` cuando corresponde.
2. `navbar.html` no mostraba el ítem `Remitos` para `ROLE_DISTRIBUTOR`. Fix: agregar `<li>` con `routerLink="/distribuidor/remitos"`.
3. Componentes y templates usaban rutas absolutas `/admin/remitos/...` en `openDetail()`, `openTransition()` y botones volver/cancelar. Fix: usar rutas relativas (`./`, `../`, `../../`).
4. El detalle de pedido no mostraba remitos asociados ni recargaba la lista después de cambiar estado. Fix: cargar `listByOrder` en `ngOnInit` y recargar después de `transitionStatus`; mostrar sección `Remitos` con botón de generar si falta.

**Problemas saneados adicionales**:
- Backend no generaba remito automáticamente al pasar a `ARMADO`. Se agregó generación automática en `OrderService.transitionInternal` para pedidos `WHOLESALE`.
- El botón “Generar remito” no aparecía porque `delivery-note.service.ts` usaba ruta de admin; ahora el servicio usa el prefijo correcto según el rol.

**Ver también**: [`missing-distributor-remitos.md`](../../distribuidora/docs/errors/missing-distributor-remitos.md) (causa backend complementaria)
