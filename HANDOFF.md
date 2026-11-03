# HANDOFF — estado actual
Actualizado: 2026-11-03 por Copilot · Rama: feature/sgi-workflow-execution (desde feature/sgi-frontend-motor) · Último commit: ver `git log`

## Tarea en curso
Motor de ejecución del flujo, ENTREGA 1 terminada y pendiente de revisión del usuario (no mergear). Entrega 2: adjuntar archivos y comentar en el checklist.

## Hecho
- Regla de componentes derivados `uohx-` (frontend-instruccions.md, DECISIONS.md, AGENTS.md, docs/solicitudes-uoh-ui/).
- `uohx-timeline` (inputs `color`, `completedUpTo`) con solicitud documentada.
- Feature `project-workflow`: ruta `proyecto/:projectId/flujo`, `ProjectWorkflowState`, página con timeline, flechas, contador y checklist de solo lectura.
- Mantenedor: botón al flujo siempre visible. Tests (97) y build en verde.

## Siguiente paso exacto
Pendiente: capturas de pantalla (requieren sesión y backend). Luego, entrega 2 según indique el usuario.

## Cuidado con
- El backend (`ProjectController::show`) NO serializa `icon` en las fases (la columna existe en `Phase`); se usa `fa-file-lines`. El listado no informa si el proyecto terminó.
- `uoh-ui@0.0.1` aún declara `peerDependencies` para Angular 21 (`^21.2.0`), por lo que reinstalar requiere `--legacy-peer-deps` y verificar que `@angular/cdk` permanezca en `package.json`.
