# HANDOFF — estado actual
Actualizado: 2026-11-04 por Copilot · Rama: feature/sgi-workflow-execution (desde feature/sgi-frontend-motor) · Último commit: ver `git log`

## Tarea en curso
Entrega 2A.3 hecha (tabla principal del mantenedor sin colores fijos); pendiente de verificación visual en modo claro y oscuro. No mergear. Comentarios y avanzar/retroceder = entrega 2B.

## Hecho
- Entregas 1, 1.1 y 2A (stepper, documentos, permiso `sgi.phases.files.manage` vía AuthService).
- Entrega 2A.1: `SgiApiService.downloadFile` (blob), `PhaseFileAccess`, `sgi-phase-file-actions` en checklist, panel y modal del mantenedor; panel con cargando/error/vacío. 127 tests y build en verde.
- Entrega 2A.2: `transition-action-labels.ts` (18 códigos) usado en el modal de historial; clases de tema en modales, flujo y tabla del mantenedor. 133 tests y build en verde.

## Siguiente paso exacto
Verificación visual de `/proyecto/<id>/flujo` y del modal de documentos (requiere sesión y backend): probar Ver (pdf/imagen), Descargar, 403/404 y pestaña bloqueada. Luego entrega 2B.

## Cuidado con
- Ver solo abre pdf/png/jpeg/gif/webp; nunca SVG/HTML. No usar `file_path`.
- Permiso de archivos no viene en `actions` ni en `bootstrap` (`permissions: []`): se usa `AuthService`.
- El listado del mantenedor no informa si el proyecto terminó.
- `uoh-ui@0.0.1` declara peers de Angular 21: reinstalar requiere `--legacy-peer-deps` y mantener `@angular/cdk`.
