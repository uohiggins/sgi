# HANDOFF — estado actual
Actualizado: 2026-11-02 por Antigravity · Rama: feature/sgi-modals-uohmodal · Último commit: f67c80f

## Tarea en curso
Migrar los dos modales de `mantenedor-proyectos-page` (Historial de transiciones y Repositorio de documentos) al componente oficial `<uoh-modal>` de `uoh-ui`.

## Hecho
- **Diagnóstico DevTools (Paso 1):**
  - `.modal` tiene `position: fixed; z-index: 1055`, mientras `.sidebar-desktop.sticky-top` (en `uoh-sidebar`) tiene `position: sticky; z-index: 1020`.
  - Causa: ambos cuelgan de `<main>` (`position: relative; z-index: 1`), pero `.modal` está dentro de `<article class="container-fluid p-4">` que tiene `position: relative; z-index: 1` (de `uoh-shared-styles`), creando un contexto de apilamiento hijo con `z-index: 1`. Por eso el `z-index: 1055` del modal queda atrapado dentro de `article` (`1 < 1020`) y se pinta por debajo de `.sidebar-desktop` (`z-index: 1020`).
  - `UohModal` lo resuelve moviendo su host a `document.body` en `ngAfterViewInit()` y aplicando `.uoh-modal { z-index: 11000 !important }`.
- **Revisión API `UohModal` (Paso 2):** soporta nativamente `modalId` (requerido), `ariaLabelledBy`, `size` (`'sm' | 'lg' | 'xl' | null`), `centered` (`true` por defecto), `scrollable` (`true` por defecto), `shown`, `hidden`, `open()`, `close()`, proyectando `<ng-content />` dentro de `.modal-content`.

## Siguiente paso exacto
Migrar los dos modales en `mantenedor-proyectos-page` a `<uoh-modal>`, sincronizando `(hidden)` con `closeModal()` / `activeModal()`, y verificar apertura/cierre por botones, ESC y clic en backdrop.

## Cuidado con
- `<uoh-modal>` debe permanecer montado en el DOM (no dentro de `@if (activeModal() === ...)` que lo destruya antes de la animación de Bootstrap) o abrirse/cerrarse mediante `viewChild(UohModal)` (`open()` / `close()`) y limpiar el estado en `(hidden)`.
