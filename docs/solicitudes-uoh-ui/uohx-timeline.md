# uohx-timeline

## Estado
pendiente

## Base en uoh-ui
`UohTimeline` (`projects/uoh-ui/src/lib/components/uoh-timeline/`), commit de `main` `56c0600`.

## Archivo local
`src/app/shared/uoh-derived/uohx-timeline/`

## Qué falta o qué no sirve
`UohTimeline` pinta el progreso a partir de `currentStep` (paso visto) y `furthestStep`. Si el usuario mira un paso anterior al máximo, los pasos intermedios salen como "alcanzados" (amarillo) y no como completados, aunque ya estén cerrados. Además el color del paso activo, de los completados y de las líneas está fijo (`--bs-principal` / `--bs-success`), por lo que no se puede colorear por contexto (por ejemplo, por etapa de un flujo).

## Pantalla de SGI donde se necesita
`/proyecto/:projectId/flujo` (feature `project-workflow`): fases de una etapa, cada etapa con su color; las fases anteriores a la abierta deben verse siempre completadas.

## Propuesta de API
Dos inputs nuevos, opcionales:

| Input | Tipo | Por defecto | Efecto |
| :--- | :--- | :--- | :--- |
| `color` | `string \| null` | `null` | Color CSS para el paso activo, los completados y las líneas completadas. `null` conserva `--bs-principal` (activo) y `--bs-success` (completados). Se aplica con las variables `--uohx-active-color` y `--uohx-completed-color`. |
| `completedUpTo` | `number \| null` | `null` | Los pasos con índice menor se muestran siempre como completados (y las líneas entre ellos), aunque se esté mirando otro paso. El paso visto sigue siendo `active`. `null` conserva el comportamiento original. |

```html
<uoh-timeline
  [steps]="phases()"
  [currentStep]="viewed()"
  [furthestStep]="open()"
  [completedUpTo]="open()"
  color="#8a2be2" />
```

## Comportamiento esperado
- `completedUpTo = n`: pasos `0..n-1` en estado `completed` salvo el que está `active`; la línea `i` es `line-completed` si `i + 1 < n`.
- `color`: el activo, los completados y las líneas completadas usan ese color. Los estados `reached` (amarillo) y `blocked` (gris) no cambian.

## Compatibilidad con otros proyectos
**Retrocompatible**: ambos inputs son opcionales y, con sus valores por defecto (`null`), el resultado es idéntico al de `UohTimeline` actual. No cambia el nombre de las clases ni la API existente.

## Notas de implementación local
- El color se expone con `host: { '[style.--uohx-active-color]': 'color()' }`; el SCSS usa `var(--uohx-active-color, var(--bs-principal))`.
- La clase `active` tiene prioridad sobre `completed`, de modo que el paso que se mira se distingue siempre.
- Tests en `uohx-timeline.spec.ts`.
