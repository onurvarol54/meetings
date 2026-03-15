import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpContextToken, provideHttpClient, withInterceptors } from '@angular/common/http';
import { FlexiToastService } from 'flexi-toast';
import { httpInterceptor } from './interceptors/http-interceptor';
import { authInterceptor } from './interceptors/auth-interceptor';
import { errorInterceptor } from './interceptors/error-interceptor';
import { appRoutes } from './app.routes';
import { provideNgxMask } from 'ngx-mask';
import { registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';

registerLocaleData(localeTr);
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(appRoutes),
    provideNgxMask(),
    provideHttpClient(withInterceptors([httpInterceptor, authInterceptor, errorInterceptor])),
    { provide: LOCALE_ID, useValue: 'tr-TR' },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [FlexiToastService],
      useFactory: (toast: FlexiToastService) => () => {
        toast.options.autoClose = true;
        toast.options.position = 'bottom-right';
        toast.options.themeClass = 'dark';
      },
    },
  ],
};
export const SKIP_ERROR_HANDLER = new HttpContextToken<boolean>(() => false);
