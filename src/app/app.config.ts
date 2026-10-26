import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { App } from './app';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideUohUi } from 'uoh-ui';
import { environment } from '../environments/environment';
import { authInterceptor } from './auth/interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    { provide: TitleStrategy, useClass: App },
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideUohUi({ apiUrl: environment.API_URL }),
  ],
};
