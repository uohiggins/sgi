# HANDOFF — estado actual
Actualizado: 2026-11-02 por Antigravity · Rama: feature/sgi-modals-uohmodal · Último commit: 17d6118

## Tarea en curso
Migrar los dos modales de `mantenedor-proyectos-page` (Historial de transiciones y Repositorio de documentos) a `<uoh-modal>` de `uoh-ui`. **Detenido por regla de gobernanza (Paso 4)** al detectar un bug en `UohModal.ngOnDestroy()` cuando coexisten dos `<uoh-modal>` hermanos.

## Hecho
- **Diagnóstico DevTools (Paso 1):** `.modal` (`position: fixed; z-index: 1055`) estaba dentro de `<article class="container-fluid p-4">` (`position: relative; z-index: 1` de `uoh-shared-styles`), quedando atrapado en ese stacking context hijo (`z-index: 1`) por debajo de `.sidebar-desktop.sticky-top` (`position: sticky; z-index: 1020` en `<main>`).
- **Migración y prueba en navegador (Pasos 2 y 3):** migrados ambos modales a `<uoh-modal>` en `mantenedor-proyectos-page` y verificado en navegador (apertura, cierre por botones/ESC/backdrop, reapertura en múltiples ciclos y z-index `11000` en `document.body` sobre el sidebar).
- **Hallazgo de gobernanza en `UohModal` (Pasos 4 y 5):** al destruir el componente (`ngOnDestroy`), `UohModal` ejecuta `this.originalParent.insertBefore(hostElement, this.originalNextSibling ?? null)`. Con dos `<uoh-modal>` hermanos, `originalNextSibling` del primero es el segundo `<uoh-modal>` (que sigue en `document.body`), lanzando `DOMException: NotFoundError`.

## Siguiente paso exacto
Esperar decisión del usuario sobre corregir `UohModal.ngOnDestroy()` en `uoh-angular-ui` (ej. verificando `this.originalNextSibling?.parentNode === this.originalParent` o usando un comentario ancla/removido directo) antes de finalizar `npm test`, `DECISIONS.md` y `git push`.

## Cuidado con
- No agregar wrappers DOM locales (`<div>` alrededor de cada `<uoh-modal>`) sin autorización, por la regla de gobernanza de `uoh-ui`.
