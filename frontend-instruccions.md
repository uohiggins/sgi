# Instrucciones de Desarrollo - Contexto del proyecto Frontend SGI (Sistema de Gestión de Infraestructura)

Este proyecto es una aplicacion Angular standalone para el Sistema de Gestión de Infraestructura de la UOH. La app funciona como intranet autenticada para consultar dashboard, mantener programas, mantener actividades y registrar actividades mediante un flujo por pasos.

## Stack Tecnológico
- **Framework**: Angular 21 con componentes standalone, rutas lazy y `ChangeDetectionStrategy.OnPush` en la mayoria de componentes.
- UI: Bootstrap 5 customizado con SCSS, FontAwesome, `ng-select`, SweetAlert2 y estilos propios UOH.
- Estado local: Angular signals (`signal`, `computed`, `effect`) en pantallas y servicios de UI.
- HTTP: `HttpClient` con `withFetch()` y un interceptor funcional para token Bearer.
- Mapas: Mapbox GL en el paso de perfil de actividad.


## Estructura principal

- `src/app/app.*`: componente raiz. Tambien implementa `TitleStrategy` para titulos `SGI - <pagina>`.
- `src/app/app.routes.ts`: rutas globales. Login publico en `/`, layout autenticado en rutas internas y fallback a `/dashboard`.
- `src/app/auth`: login, guardias, interceptor, servicio de autenticacion y modelo de usuario.
- `src/app/layouts/main-layout`: layout autenticado con sidebar, header y `router-outlet`.
- `src/app/shared`: componentes compartidos `uoh-sidebar`, `uoh-header`, `uoh-card`, `uoh-button` y pipe `truncate`.
- `src/app/sgi`: dominio principal SGI: rutas, servicios, interfaces, validadores y paginas.
- `src/styles`: variables SCSS, Bootstrap customizado, mixins, fuentes y estilos globales.
- `public` y `src/assets`: logos UOH, fondos, favicon e imagen placeholder.


## Integración con Backend (Intranet V2)
- Backend esperado: API tipo Laravel bajo `environment.API_URL`, con respuestas usualmente en formato `{ data: ... }`.
- **Tipado:** TypeScript estricto (`strict`, `noImplicitReturns`, `strictTemplates`, etc.).


## Configuracion y comandos

Scripts disponibles en `package.json`:

- `npm start`: ejecuta `ng serve`.
- `npm run build`: build de produccion.
- `npm run watch`: build en modo watch con configuracion development.
- `npm test`: pruebas unitarias Angular/Vitest.

Configuracion Angular:

- `angular.json` define app `vcm`.
- `ng serve` usa host `0.0.0.0`, puerto `4100` y allowed host `dev.app.uoh.cl`.
- Build de desarrollo reemplaza `src/environments/environment.ts` por `environment.development.ts`.
- Build de test reemplaza `environment.ts` por `environment.test.ts`.
- `src/environments/environment.ts`, `environment.development.ts` y `environment.test.ts` estan ignorados por git. No documentar valores sensibles. Usar `environment.example.ts` como forma esperada: `API_URL` y `MAPBOX_KEY`.

Verificacion ejecutada:

- `npm run build`: pasa.
- Advertencias de build: budget inicial supera 500 kB, `sweetalert2`, `mapbox-gl`, Bootstrap y `bootstrap/js/dist/modal` aparecen como CommonJS/AMD optimization bailouts, Sass advierte de funciones globales/deprecadas (`darken`).
- `npm test -- --watch=false`: falla en el estado actual.
- Fallas de test: `src/app/app.spec.ts` aun espera el texto inicial `Hello, sgi` en un `h1`, pero `app.html` solo renderiza `router-outlet`; ademas Vitest toma `src/environments/environment.test.ts` como archivo de suite y reporta "No test suite found".


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

Punto a cuidar: `publicGuard` solo revisa presencia de token en memoria/localStorage mediante `isAuthenticated`; la validacion real sucede en `authGuard`.


## Reglas de IA
- Generar código modular, reutilizable y documentado.
- Priorizar la inyección de dependencias moderna (`inject()`).