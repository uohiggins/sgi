# HANDOFF — estado actual
Actualizado: 2026-11-03 por Copilot · Rama: feature/sgi-workflow-execution (desde feature/sgi-frontend-motor) · Último commit: ver `git log`

## Tarea en curso
Motor de ejecución del flujo, ENTREGA 1: `uohx-timeline`, feature `project-workflow` (ruta `proyecto/:projectId/flujo`), checklist de solo lectura y botón "Avanzar paso" del mantenedor. No mergear.

## Hecho
- Regla de componentes derivados `uohx-` formalizada (frontend-instruccions.md, DECISIONS.md, AGENTS.md, docs/solicitudes-uoh-ui/).

## Siguiente paso exacto
Crear `src/app/shared/uoh-derived/uohx-timeline` desde UohTimeline (inputs `color` y `completedUpTo`).

## Cuidado con
- `uoh-ui@0.0.1` aún declara `peerDependencies` para Angular 21 (`^21.2.0`), por lo que reinstalar requiere `--legacy-peer-deps` y verificar que `@angular/cdk` permanezca en `package.json`.
