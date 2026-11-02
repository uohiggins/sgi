# HANDOFF — estado actual
Actualizado: 2026-11-02 por Antigravity · Rama: feature/sgi-modals-uohmodal · Último commit: 95c0d0c

## Tarea en curso
Migrar los dos modales de `mantenedor-proyectos-page` (Historial de transiciones y Repositorio de documentos) al componente oficial `<uoh-modal>` de `uoh-ui`.

## Hecho
- Creada la rama `feature/sgi-modals-uohmodal` desde `feature/sgi-frontend-motor` (`95c0d0c`).
- Corregida la regla en `AGENTS.md` a "un agente por repo a la vez".

## Siguiente paso exacto
1. Diagnosticar con DevTools por qué el modal de "Repositorio de documentos" aparece por debajo del sidebar (`uoh-sidebar`), comparando `z-index` e identificando el ancestro que crea el contexto de apilamiento.
2. Revisar la API real de `UohModal` en `node_modules/uoh-ui`.

## Cuidado con
- No aplicar workarounds locales si a `UohModal` le falta alguna capacidad necesaria (tamaño `xl`, scroll interno, centrado): detenerse y avisar al usuario.
- Sincronizar el cierre nativo de Bootstrap (ESC / backdrop) con el signal `activeModal()`.
