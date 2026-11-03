# HANDOFF — estado actual
Actualizado: 2026-11-03 por Copilot · Rama: feature/sgi-workflow-execution (desde feature/sgi-frontend-motor) · Último commit: ver `git log`

## Tarea en curso
Entrega 1.1 (campo `icon` conectado, flechas limitadas a la etapa) hecha; pendiente de verificación visual del usuario (no mergear). Entrega 2: adjuntar archivos y comentar en el checklist.

## Hecho
- Entrega 1: `uohx-timeline`, feature `project-workflow`, checklist de solo lectura, botón del mantenedor.
- Entrega 1.1: `icon` en interfaces y timeline (fallback `fa-file-lines`), fixture/tests con fase con y sin icono, flechas dentro de la etapa vista. 11 clases de icono del seeder verificadas en FA 7.3.1. Tests (97) y build en verde.

## Siguiente paso exacto
Verificación visual de `/proyecto/<id>/flujo` (requiere sesión y backend). Cambiar de etapa en la UI queda pendiente de definir. Luego, entrega 2.

## Cuidado con
- El listado del mantenedor no informa si el proyecto terminó.
- `uoh-ui@0.0.1` aún declara `peerDependencies` para Angular 21 (`^21.2.0`), por lo que reinstalar requiere `--legacy-peer-deps` y verificar que `@angular/cdk` permanezca en `package.json`.
