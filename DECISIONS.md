# Registro de Decisiones de Arquitectura — Frontend SGI

Este archivo registra las decisiones de arquitectura, estructura de datos, convenciones y alcance tomadas en el proyecto frontend de SGI.

## 2026-10-27 — Eliminación de FeaturePageHeader
**Contexto:** `FeaturePageHeader` quedó sin contenido tras adoptar `UohHeader` de `uoh-ui` para mostrar el título de página, por lo que conservarlo como componente SGI independiente era redundante.
**Decisión:** Eliminar el componente y su carpeta de `src/app/sgi/ui/feature-page-header/`, además de retirar sus etiquetas e imports en Home y Mantenedor de proyectos.
**Alternativas descartadas:** Mantener un componente sin contenido ni responsabilidad propia.

## 2026-08-21 — Adopción de Angular 22 standalone y Vitest
**Contexto:** Inicio del desarrollo del frontend de la intranet SGI para la Universidad de O'Higgins con necesidad de modernización técnica.
**Decisión:** Utilizar Angular 22 con componentes 100% standalone (sin `NgModule`), `ChangeDetectionStrategy.OnPush`, inyección de dependencias moderna mediante `inject()`, reactividad con Angular Signals (`signal`, `computed`), y Vitest + jsdom como runner de pruebas unitarias.
**Alternativas descartadas:** Mantener NgModules tradicionales o el runner Karma/Jasmine (deprecados y más lentos en el ecosistema actual de Angular).

## 2026-09-08 — Política de aislamiento y restricciones de edición en capas compartidas
**Contexto:** El commit `2946ace` integró las capas compartidas heredadas de la intranet institucional UOH (`auth`, `layouts`, `shared`, `environments`) que otros módulos también reutilizan.
**Decisión:** Declarar `src/app/auth/` como estrictamente restringida (NO modificar a menos que sea explícitamente requerido para integración). Permitir modificaciones en `layouts/`, `shared/` y `environments/` solo con precaución y comprobando compatibilidad con el código desarrollado anteriormente. Toda nueva funcionalidad debe concentrarse con total libertad dentro de `src/app/sgi/`.
**Alternativas descartadas:** Modificar libremente la capa de autenticación y layouts globales, descartado por riesgo de incompatibilidad con el estándar institucional.

## 2026-09-09 — Organización interna del módulo SGI en core, ui y features
**Contexto:** Se requería aislar el dominio SGI del resto del frontend compartido de la intranet, evitando dependencias cruzadas y manteniendo modularidad a escala.
**Decisión:** Organizar `src/app/sgi` en tres capas internas: `core/` (servicios y contratos base del dominio, acceso HTTP), `ui/` (componentes presentacionales reutilizables exclusivos de SGI) y `features/` (funcionalidades verticales con sus propias `pages`, `components`, `models` y `services`). Las carpetas heredadas `interfaces/` y `services/` pasan a estado de transición hasta su migración por feature.
**Alternativas descartadas:** Mantener una estructura plana o compartir componentes directamente en `src/app/shared`, descartado para evitar acoplamiento con otros sistemas de la intranet.

## 2026-10-09 — Estrategia de ramificación Git y retiro de master
**Contexto:** La rama inicial `master` no reflejaba la convención de releases de producción ni el aislamiento necesario para el desarrollo del nuevo motor de flujo.
**Decisión:** Renombrar la rama local `master` a `prod-release` y subirla a `origin`; eliminar `master` en remoto; y crear desde `prod-release` las ramas `testing` y `feature/sgi-frontend-motor` para el trabajo activo del motor.
**Alternativas descartadas:** Continuar commiteando directamente sobre `master`.

## 2026-10-09 — Exclusión de environments en Vitest y corrección de tests unitarios
**Contexto:** Las pruebas unitarias (`npm test`) fallaban desde el inicio del proyecto porque Vitest interpretaba `src/environments/environment.test.ts` como una suite de pruebas vacía (`**/*.test.ts`) y `app.spec.ts` esperaba un `<h1>Hello, sgi</h1>` inexistente en `app.html`.
**Decisión:** Configurar la opción `"exclude": ["src/environments/**"]` bajo el builder `@angular/build:unit-test` en `angular.json`, y actualizar `app.spec.ts` para verificar la existencia del elemento `<router-outlet>`.
**Alternativas descartadas:** Renombrar `environment.test.ts` (descartado para preservar las sustituciones de configuración estándar de Angular CLI) o desactivar las pruebas unitarias.

## 2026-10-09 — Tipado estricto en snake_case para contratos de API y modelos de dominio
**Contexto:** El documento inicial preliminar proponía propiedades en `camelCase`, pero la API real de Laravel (`ProjectController`, `PhaseController`, `SgiWorkflowService`) retorna arrays y objetos estructurados directamente en `snake_case` sin Resources ni transformadores intermedios.
**Decisión:** Reescribir `project.interface.ts` en `snake_case` para mapear 1:1 las respuestas del backend (ej. `internal_code`, `status_id`, `sort_order`, `is_required`, `closed_at`, `closed_by`, etc.), y envolver los payloads en el envelope genérico `SgiApiResponse<T>` / `SgiPaginatedResponse<T>`.
**Alternativas descartadas:** Implementar mappers o interceptores en Angular para convertir a `camelCase`, descartado por generar sobrecarga innecesaria y riesgo de desajuste en peticiones POST/PUT.

## 2026-10-09 — Eliminación de project-summary.ts y migración a ProjectListItem
**Contexto:** El archivo `project-summary.ts` definía un tipo de estado fijo (`'draft'|'active'|'archived'`) desalineado con la tabla `sgi_project_statuses` del backend (catálogo dinámico con `id`, `name`, `hex_color`).
**Decisión:** Borrar `project-summary.ts` e incorporar la interfaz `ProjectListItem` directamente en `project.interface.ts` reflejando el payload real del listado (`ProjectController@index`), actualizando el componente de sandbox `mantenedor-proyectos-page.ts` a este contrato.
**Alternativas descartadas:** Mantener `project-summary.ts` como interfaz paralela o adaptar temporalmente un modelo huérfano.

## 2026-10-09 — Tipos de unión estrictos para requerimientos, hitos y layouts
**Contexto:** Los tipos `RequirementType`, `MilestoneStatus` y `PhaseLayout` contenían un fallback `| string` que anulaba la seguridad de tipos estricta en TypeScript. Además, `RequirementType` incluía el valor `'info'` no soportado por el backend.
**Decisión:** Definir uniones estrictas validadas contra las migraciones y controladores de Laravel: `RequirementType` (`'document' | 'milestone'`), `MilestoneStatus` (`'pending' | 'in_progress' | 'completed' | 'cancelled'`) y `PhaseLayout` (`'standard' | 'milestones'`).
**Alternativas descartadas:** Conservar `| string` permisivo o mantener el valor `'info'` sin respaldo en el esquema de base de datos.

## 2026-10-09 — Retiro de Mapbox GL y depuración de referencias residuales a "actividades"
**Contexto:** La documentación contenía menciones a Mapbox GL, "perfil de actividad" y flujos de "actividades" heredados del proyecto VCM y fuera del alcance de los prototipos aprobados de SGI.
**Decisión:** Eliminar toda referencia y dependencia de Mapbox GL de `frontend-instruccions.md` y actualizar la descripción del proyecto para centrarse en proyectos, etapas, fases, requisitos y el motor de flujo de trabajo.
**Alternativas descartadas:** Mantener referencias o instalar la dependencia sin caso de uso aprobado.

## 2026-10-09 — Adopción de DECISIONS.md y regla de registro continuo
**Contexto:** Se requería un registro vivo y auditable del historial de decisiones técnicas que permitiese a desarrolladores y agentes de IA entender el porqué del diseño actual.
**Decisión:** Establecer `DECISIONS.md` en la raíz del repositorio siguiendo el formato de contexto, decisión y alternativas descartadas. Se acordó la regla obligatoria de documentar cada decisión arquitectónica de forma inmediata al momento de ser acordada.
**Alternativas descartadas:** Documentar decisiones únicamente en resúmenes al cierre de sprints o sesiones.

## 2026-10-13 — Implementación integral de SgiApiService y DTOs de contrato
**Contexto:** Se requería implementar la capa cliente HTTP completa para consumir los 29 endpoints del backend SGI definidos en `routes/api/sgi.php` de `intranet-v2-backend`, manteniendo tipado estricto en `snake_case` y compatibilidad con `SgiApiResponse<T>` / `SgiPaginatedResponse<T>`.
**Decisión:** Centralizar los 29 métodos en `SgiApiService` dentro de `src/app/sgi/core/services/` agrupados por recurso (Sistema, Proyectos, Workflow, Etapas, Fases, Requisitos, Archivos, Comentarios e Hitos). Definir todos los DTOs de petición y respuesta en `project.interface.ts`. Soportar tanto `FormData` directo como objetos tipados para la subida multipart de archivos (`uploadPhaseFile`), y serializar parámetros de búsqueda y paginación con filtrado estricto de nulos.
**Alternativas descartadas:** Dividir en múltiples microservicios por recurso (descartado para mantener coherencia con `auth-service.ts` y la arquitectura establecida para el core de SGI).

## 2026-10-13 — Incorporación de status_color en ProjectListItem
**Contexto:** El prototipo del mantenedor de proyectos requiere que el pill de estado se pinte dinámicamente con el color hexadecimal (`hex_color`) definido en la base de datos sin hardcodeo en el frontend.
**Decisión:** Actualizar el contrato `ProjectListItem` en `project.interface.ts` incorporando la propiedad opcional `status_color?: string | null`, alineándose con el payload actualizado de `GET /sgi/projects`.
**Alternativas descartadas:** Mapear colores con clases hardcodeadas en CSS/SCSS en el frontend.

## 2026-10-13 — Sustitución de datos mock por grilla reactiva en mantenedor de proyectos
**Contexto:** La página `mantenedor-proyectos-page` funcionaba con un sandbox inicial de datos estáticos en memoria. Se requería conectar la grilla con el backend real respetando el prototipo aprobado (columnas Número, Nombre, Dirección, Solicitado por, Estado y Opciones), paginación de servidor y modales interactivos para historial y documentos.
**Decisión:** Migrar el componente al consumo directo de `SgiApiService.getProjects()`, manejando el estado mediante Signals (`projects`, `loading`, `error`, `pagination`). Renderizar el pill de estado con el color hexadecimal devuelto por el backend (`status_color`) calculando el contraste de texto para asegurar legibilidad. Implementar modales integrados para historial de transiciones (`getProjectHistory()`) y documentos agrupados por fase (`getProjectDocuments()`), dejando stubs controlados mediante SweetAlert2 para la vista de detalle y el avance de flujo.
**Alternativas descartadas:** Utilizar paginación en el cliente o librerías de modales pesadas de terceros, descartado para mantener bundle ligero y rendimiento nativo con OnPush.

## 2026-10-22 — Reactivación de tema dinámico applyApplicationTheme en AuthService
**Contexto:** El método `applyApplicationTheme()` en `src/app/auth/services/auth-service.ts` estaba comentado dentro de `storeSession()`, impidiendo que el color institucional devuelto por el backend en `access.current_application.color` (ej. `#0075C9` al enviar `X-App-Id`) actualizara dinámicamente la variable CSS `--bs-principal` en `:root` durante `login()`, `loadSession()` y `refresh()`.
**Decisión:** Descomentar `this.applyApplicationTheme(session.access?.current_application)` en `AuthService.storeSession()`, ajustar la firma de `applyApplicationTheme(application?: AuthApplication | null)` para compatibilidad estricta con `strictNullChecks`, y cubrir el comportamiento con pruebas unitarias en `auth-service.spec.ts`.
**Alternativas descartadas:** Mantener únicamente el color estático compilado en `src/styles.scss` e ignorar la configuración de color por aplicación proveniente de la tabla `applications` de Intranet V2.

## 2026-10-22 — Integración inicial de uoh-angular-ui (uoh-ui@0.0.1) y compatibilidad con Angular 22 / ng-select 24
**Contexto:** El paquete `git+https://github.com/uohiggins/uoh-angular-ui.git#release` se publica bajo el nombre `uoh-ui@0.0.1` y declara `peerDependencies` para Angular 21 (`@angular/*: "^21.2.0"`) y `@ng-select/ng-select: "^21.8.2"`, mientras que el proyecto SGI utiliza Angular 22 (`^22.1.0`) y `@ng-select/ng-select: "^24.0.2"`. Además, `@ng-select/ng-select@24.0.2` requiere `@angular/cdk@^22.0.0` para su overlay/portal, y `uoh-ui` importa `{ Modal } from 'bootstrap'` en su bundle ESM plano.
**Decisión:** Instalar `uoh-ui` con `--legacy-peer-deps` usando Node 20 para la descarga desde GitHub, declarar explícitamente `@angular/cdk@^22.1.0` en `dependencies` de `package.json` para evitar que npm lo pode al usar `--legacy-peer-deps`, registrar `provideUohUi({ apiUrl: environment.API_URL })` en `app.config.ts`, y configurar `vitest-base.config.ts` (`server.deps.inline: ['uoh-ui']`) con `"runnerConfig": true` en `angular.json` para que Vitest resuelva `bootstrap` a su entrada ESM en las pruebas unitarias.
**Alternativas descartadas:** Degradar el proyecto de Angular 22 a Angular 21 o bajar `@ng-select/ng-select` a v21, descartado tras comprobar que `<uoh-user-select>` funciona correctamente en compilación, runtime y pruebas sobre Angular 22 y `@ng-select/ng-select@24.0.2`.

## 2026-10-26 — Migración de componentes compartidos provisionales al design system oficial uoh-ui
**Contexto:** El repositorio incluía copias locales provisionales en `src/app/shared/components/` (`uoh-card`, `uoh-button`, `uoh-header`, `uoh-sidebar`) heredadas del arranque inicial. Con la adopción de `uoh-ui` y `uoh-shared-styles`, mantener copias locales generaba duplicidad, acoplamiento directo a servicios (`AuthService`/`HeaderService` dentro del header) y divergencia frente al design system institucional pensado como plantilla base reutilizable.
**Decisión:** Eliminar los cuatro componentes locales provisionales (`uoh-card`, `uoh-button`, `uoh-header`, `uoh-sidebar`) y migrar a la capa oficial: reemplazar el esqueleto local `uoh-card` por las clases nativas `.card.pattern.color-border` de `uoh-shared-styles` (ya que `uoh-ui` delega tarjetas contenedoras a `uoh-shared-styles` y reserva `UohDataView` para vistas conmutables lista/tarjetas), usar `UohButton` desde `uoh-ui`, e integrar `UohHeader` y `UohSidebar` de `uoh-ui` en `MainLayout` desacoplados por inputs/outputs y sincronizados mediante `offcanvasId`. Se conserva únicamente `TruncatePipe` en `src/app/shared/pipes/truncate-pipe.ts` por ser una utilidad genérica sin equivalente en `uoh-ui`.
**Alternativas descartadas:** Conservar wrappers locales sobre `uoh-ui` o mantener el acoplamiento directo de `uoh-header` con servicios internos del proyecto.







---

## 2026-10-26 — SGI usa su propia Application en desarrollo
**Contexto:** El tema dinámico (`applyApplicationTheme`) y el título del sidebar salen de `current_application` en `GET /auth/me`. Con el APP_ID de Intranet el sidebar mostraba "Intranet" y el tema azul.
**Decisión:** `environment.development.ts` usa `APP_ID: '8c4e9b2a-3f1d-4e7a-9c5b-2d8f6a1e4c90'` (Application "Sistema de Gestión de Infraestructura", color `#e0ce4d`). `MainLayout.appTitle` vuelve a `currentApplication()?.name || environment.APP_NAME`. `environment.ts` y `environment.test.ts` no se tocan (producción aún sin migrar; el cambio de APP_ID allí debe coordinarse con el despliegue del seeder backend).
**Alternativas descartadas:** Fijar el título con `environment.APP_NAME` (parche que ocultaba el nombre real de la Application).
