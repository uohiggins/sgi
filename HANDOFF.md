# HANDOFF — estado actual
Actualizado: 2026-11-02 por Antigravity · Rama: feature/sgi-modals-uohmodal · Último commit: 5a4b5ae

## Tarea en curso
Actualizar `uoh-ui` desde la rama `release` de `uoh-angular-ui` en SGI, verificar las correcciones del diseñador (`UohModal.ngOnDestroy`, `UohSidebar` y `data-bs-dismiss="offcanvas"`), y ejecutar `npm run build` y `npm test -- --watch=false`.

## Hecho
- Migrados ambos modales de `mantenedor-proyectos-page` (Historial de transiciones y Repositorio de documentos) a `<uoh-modal>` de `uoh-ui`.
- Reportado el hallazgo de `UohModal.ngOnDestroy()` al coexistir dos `<uoh-modal>` hermanos.

## Siguiente paso exacto
1. Comparar SHA de `refs/heads/release` en `uoh-angular-ui` con `package-lock.json` (`5ce41d13c2d5b3e3eb5b9c2ee8e8cc79900f2d7b`).
2. Reinstalar `github:uohiggins/uoh-angular-ui#release` (probando primero sin `--legacy-peer-deps` y verificando `@angular/cdk`).
3. Inspeccionar `node_modules/uoh-ui/fesm2022/uoh-ui.mjs` y correr build + tests.

## Cuidado con
- No aplicar workarounds locales si algún test o corrección de `uoh-ui` falla; reportar directamente.
