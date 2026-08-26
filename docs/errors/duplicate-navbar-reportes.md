# Opción "Reportes" duplicada en la barra de navegación (Navbar)

**Módulo**: Frontend (`distribuidora-ui`)  
**Patrón**:  
En la barra de navegación del usuario con rol `ROLE_DISTRIBUTOR`, el enlace **Reportes** aparece duplicado consecutivamente.

**Diagnóstico / Fix**:  
- **Causa raíz**: En `src/app/shared/components/navbar/navbar.html` existían dos bloques `<li>` idénticos con `*ngIf="user.role === 'ROLE_DISTRIBUTOR'"` apuntando a `/distribuidor/reportes`.
- **Solución**: Se eliminó el bloque duplicado sobrante al final de la lista en `navbar.html`.
