# HANDOFF — estado actual
Actualizado: 2026-11-04 por Copilot · Rama: feature/sgi-workflow-execution (desde feature/sgi-frontend-motor) · Último commit: ver `git log`

## Tarea en curso
Entrega 2A.1 hecha (ver/descargar archivos, estados del panel, zona de arrastre plegable); pendiente de verificación visual del usuario. No mergear. Comentarios y avanzar/retroceder = entrega 2B.

## Hecho
- Entregas 1, 1.1 y 2A (stepper, documentos, permiso `sgi.phases.files.manage` vía AuthService).
- Entrega 2A.1: `SgiApiService.downloadFile` (blob), `PhaseFileAccess`, `sgi-phase-file-actions` en checklist, panel y modal del mantenedor; panel con cargando/error/vacío. 127 tests y build en verde.

## Siguiente paso exacto
Verificación visual de `/proyecto/<id>/flujo` y del modal de documentos (requiere sesión y backend): probar Ver (pdf/imagen), Descargar, 403/404 y pestaña bloqueada. Luego entrega 2B.

## Cuidado con
- Ver solo abre pdf/png/jpeg/gif/webp; nunca SVG/HTML. No usar `file_path`.
- Permiso de archivos no viene en `actions` ni en `bootstrap` (`permissions: []`): se usa `AuthService`.
- El listado del mantenedor no informa si el proyecto terminó.
- `uoh-ui@0.0.1` declara peers de Angular 21: reinstalar requiere `--legacy-peer-deps` y mantener `@angular/cdk`.
