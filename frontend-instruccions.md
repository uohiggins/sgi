# Instrucciones de Desarrollo - Contexto del proyecto Frontend SGI (Sistema de Gestión de Infraestructura)

Este proyecto es una aplicación Angular standalone para el Sistema de Gestión de Infraestructura de la UOH. La app funciona como intranet autenticada para consultar dashboard, mantener proyectos y gestionar etapas, fases y requisitos mediante el motor de flujo de trabajo.

## Stack Tecnológico
- **Framework**: Angular 22 con componentes standalone, rutas lazy y `ChangeDetectionStrategy.OnPush` como estandar para el dominio SGI.
- UI: Bootstrap 5 customizado con SCSS, FontAwesome, `ng-select`, SweetAlert2 y estilos propios UOH.
- Estado local: Angular signals (`signal`, `computed`, `effect`) en pantallas y servicios de UI.
- HTTP: `HttpClient` con `withFetch()` y un interceptor funcional para token Bearer.


## Estructura principal

- `src/app/app.*`: componente raiz. Tambien implementa `TitleStrategy` para titulos `SGI - <pagina>`.
- `src/app/app.routes.ts`: rutas globales. Login publico en `/`, layout autenticado en rutas internas y fallback a `/dashboard`.
- `src/app/auth`: login, guardias, interceptor, servicio de autenticacion y modelo de usuario.
- `src/app/layouts/main-layout`: layout autenticado con sidebar, header y `router-outlet`.
- `src/app/shared`: componentes compartidos `uoh-sidebar`, `uoh-header`, `uoh-card`, `uoh-button` y pipe `truncate`.
- `src/app/sgi`: dominio principal SGI. Desde 2026-09-09 se organiza de forma interna en `core`, `ui` y `features` para aislar el sistema SGI del resto del frontend compartido.
- `src/styles`: variables SCSS, Bootstrap customizado, mixins, fuentes y estilos globales.
- `public` y `src/assets`: logos UOH, fondos, favicon e imagen placeholder.


## Integración con Backend (Intranet V2)
- Backend esperado: API tipo Laravel bajo `environment.API_URL`, con respuestas usualmente en formato `{ data: ... }` o envelope `{ success, data, message? }` en endpoints nuevos de SGI.
- **Tipado:** TypeScript estricto (`strict`, `noImplicitReturns`, `strictTemplates`, etc.).

## Arquitectura interna de SGI

Dentro de `src/app/sgi` se debe trabajar con esta separacion:

- `core/`: servicios y contratos base del dominio SGI, por ejemplo acceso HTTP propio del modulo.
- `ui/`: componentes presentacionales reutilizables solo dentro de SGI.
- `features/`: funcionalidades verticales del dominio, cada una con sus propias `pages`, `components`, `models` y `services` si aplica.

Arbol base vigente:

- `src/app/sgi/core/services/sgi-api.service.ts`: servicio base de prueba para consumir Laravel desde SGI.
- `src/app/sgi/features/home/pages/home-page`: pagina de entrada del dominio SGI.
- `src/app/sgi/features/mantenedor-proyectos/pages/mantenedor-proyectos-page`: sandbox inicial del mantenedor de proyectos usando `signal()` y `computed()`.
- `src/app/sgi/features/mantenedor-proyectos/models/project.interface.ts`: contratos e interfaces del feature y del dominio.
- `src/app/sgi/interfaces` y `src/app/sgi/services`: carpetas heredadas del arranque inicial; tratarlas como transitorias hasta migrarlas por feature.

## Uso de la librería uoh-ui y convenciones de página

### Uso de `uoh-ui`

a) **Verificar primero.** Antes de construir UI, comprobar si `uoh-ui` la cubre (`node_modules/uoh-ui` y la documentación en `C:\repositorios\uoh-angular-ui\docs`; también la wiki `github.com/uohiggins/uoh-angular-ui.wiki.git`). Si la cubre, usarla.

b) **Si no existe o no sirve del todo, NO modificar la librería** (la usan otros proyectos y se publica a mano en la rama `release`). Crear un componente local derivado en `src/app/shared/uoh-derived/`, partiendo del código fuente de `C:\repositorios\uoh-angular-ui\projects\uoh-ui\src\lib\components\`, con selector de prefijo `uohx-` y clase de prefijo `Uohx`. La cabecera del archivo indica el componente base y el commit de `main` del que se derivó.

c) **Solicitud al diseñador.** En el mismo commit, crear `docs/solicitudes-uoh-ui/<componente>.md` con la plantilla (`docs/solicitudes-uoh-ui/_plantilla.md`) y una fila en el índice `docs/solicitudes-uoh-ui/README.md`.

d) **Migración.** Cuando el diseñador incorpore el cambio a `uoh-ui`, evaluar migrar (opcional) y actualizar el estado en el índice.

e) **Bootstrap plano** tematizado por `uoh-shared-styles` cuenta como parte de la librería; no requiere solicitud.

f) **SweetAlert2** queda aprobado como excepción documentada mientras `uoh-ui` no tenga un diálogo de aviso o confirmación.

### Convenciones de página

- **Título de página:** `UohHeader` lo resuelve automáticamente según el título de la ruta activa. No declarar título, eyebrow ni descripción dentro del cuerpo de la página.
- **Cuerpo de página:** envolver el contenido en el siguiente patrón:

  ```html
  <div class="card pattern color-border mt-4">
    <div class="p-3 p-md-4">
      ...contenido...
    </div>
  </div>
  ```


## Configuracion y comandos

Scripts disponibles en `package.json`:

- `npm start`: ejecuta `ng serve`.
- `npm run build`: build de produccion.
- `npm run watch`: build en modo watch con configuracion development.
- `npm test`: pruebas unitarias Angular/Vitest.

Configuracion Angular:

- `angular.json` define la app `sgi`.
- `ng serve` usa host `0.0.0.0`, puerto `4100` y allowed host `dev.app.uoh.cl`.
- Build de desarrollo reemplaza `src/environments/environment.ts` por `environment.development.ts`.
- Build de test reemplaza `environment.ts` por `environment.test.ts`.
- `src/environments/environment.ts`, `environment.development.ts` y `environment.test.ts` estan ignorados por git. No documentar valores sensibles. Usar `environment.example.ts` como forma esperada: `API_URL`, `APP_ID`, `APP_NAME`, `AUTH_USE_LOCAL_STORAGE_TOKEN`, `LOGIN_ROUTE`, `HOME_ROUTE` y `NO_ACCESS_ROUTE`.

Verificacion ejecutada:

- `npm run build`: pasa.
- Advertencias de build: budget inicial supera 500 kB, `sweetalert2`, Bootstrap y `bootstrap/js/dist/modal` aparecen como CommonJS/AMD optimization bailouts, Sass advierte de funciones globales/deprecadas (`darken`).
- `npm test -- --watch=false`: pasa (14 archivos de test, 77 tests, Vitest).


## Autenticacion

Archivo clave: `src/app/auth/services/auth-service.ts`.

Flujo:

- Login via `POST {API_URL}/auth/login`.
- Guarda `access_token` en `localStorage`.
- Expone `currentUser` e `isAuthenticated` con signals.
- `checkAuthStatus()` llama `GET {API_URL}/auth/me`; si falla, limpia sesion.
- `authInterceptor` agrega `Authorization: Bearer <token>` y ante `401` hace logout y navega a `/`.
- `authGuard` protege rutas internas validando `checkAuthStatus()`.
- `publicGuard` evita volver al login si ya hay token y redirige a `/home`.

Restriccion de trabajo acordada:

- `src/app/auth` y configuracion global son capas compartidas. Solo deben modificarse si SGI necesita integrarse correctamente.
- `src/app/shared`, `src/app/layouts` y `src/environments/` modificar con precaución y comprobando compatibilidad con el código desarollado anteriormente
- `src/app/sgi` es el espacio con libertad total de refactor y reorganizacion.

Punto a cuidar: `publicGuard` solo revisa presencia de token en memoria/localStorage mediante `isAuthenticated`; la validacion real sucede en `authGuard`.


## Reglas de IA
- Generar código modular, reutilizable y documentado.
- Priorizar la inyección de dependencias moderna (`inject()`).
- En SGI nuevo, preferir `signal()`, `computed()` y componentes standalone con `OnPush` como base, evitando logica imperativa fuera de casos justificados.