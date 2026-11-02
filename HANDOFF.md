# HANDOFF — estado actual
Actualizado: 2026-11-02 por Antigravity · Rama: feature/sgi-modals-uohmodal · Último commit: pendiente de commit final

## Tarea en curso
Actualización de `uoh-ui` (`6b7398275dfd1409003822ba940ad7e93ad16438`) y migración de los dos modales de `mantenedor-proyectos-page` a `<uoh-modal>` completada y verificada. Pendiente de revisión y merge por el usuario.

## Hecho
- Actualizado `uoh-ui@0.0.1` desde `github:uohiggins/uoh-angular-ui#release` de `5ce41d13c2d5b3e3eb5b9c2ee8e8cc79900f2d7b` a `6b7398275dfd1409003822ba940ad7e93ad16438` (con `--legacy-peer-deps` y Node 20; `@angular/cdk@^22.1.0` conservado en `package.json`).
- Verificadas en `node_modules/uoh-ui/fesm2022/uoh-ui.mjs` las correcciones del diseñador:
  - `UohModal.ngOnDestroy()` ya no usa `originalParent` ni `insertBefore`; ejecuta `hostElement.remove()`.
  - `UohSidebar` renderiza `data-bs-dismiss="offcanvas"` (y el botón `.btn-close`) únicamente cuando `isOffcanvas` es `true`.
  - Sin otros usos de `data-bs-dismiss="offcanvas"` en el resto de `uoh-ui`.
- Ejecutados `npm run build` y `npm test -- --watch=false`: 14 suites / 78 tests en verde (incluyendo `mantenedor-proyectos-page.spec.ts` y `uoh-ui-compat.spec.ts`).
- Registrada la decisión en `DECISIONS.md` y rama `feature/sgi-modals-uohmodal` subida a `origin`.

## Siguiente paso exacto
Revisar con el usuario la rama `feature/sgi-modals-uohmodal` antes de integrar/mergear.

## Cuidado con
- `uoh-ui@0.0.1` aún declara `peerDependencies` para Angular 21 (`^21.2.0`), por lo que reinstalar requiere `--legacy-peer-deps` y verificar que `@angular/cdk` permanezca en `package.json`.
