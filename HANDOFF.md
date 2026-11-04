# HANDOFF — estado actual
Actualizado: 2026-11-04 por Copilot · Rama: feature/sgi-workflow-execution (desde feature/sgi-frontend-motor) · Último commit: ver `git log`

## Tarea en curso
Entrega 2A hecha (selector de etapa con UohStepper, documentos por requisito y panel "Documentos de la fase"); pendiente de verificación visual del usuario. No mergear. Comentarios y avanzar/retroceder = entrega 2B.

## Hecho
- Entregas 1 y 1.1: `uohx-timeline`, feature `project-workflow`, checklist, `icon`.
- Entrega 2A: stepper de etapas, archivos vía `getPhase`, Adjuntar/Eliminar con permiso `sgi.phases.files.manage` (AuthService), panel con autor/fecha/tamaño y marca "después del cierre". 110 tests y build en verde.

## Siguiente paso exacto
Verificación visual de `/proyecto/<id>/flujo` (requiere sesión y backend). Backend: falta endpoint de descarga/visualización de archivos (no hay "ver/descargar"). Luego entrega 2B.

## Cuidado con
- El backend no tiene ruta de descarga; no inventarla.
- Permiso de archivos no viene en `actions` ni en `bootstrap` (`permissions: []`): se usa `AuthService`.
- El listado del mantenedor no informa si el proyecto terminó.
- `uoh-ui@0.0.1` declara peers de Angular 21: reinstalar requiere `--legacy-peer-deps` y mantener `@angular/cdk`.
