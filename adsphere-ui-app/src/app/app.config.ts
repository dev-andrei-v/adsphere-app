import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, LOCALE_ID, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './interceptors/token.interceptor';
import { provideNzI18n, ro_RO} from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import localeRo from '@angular/common/locales/ro';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { AppConstants } from './constants/app-constants';
import { InMemoryCache } from '@apollo/client/core';
registerLocaleData(localeRo, 'ro'); // Register Romanian locale

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideNzI18n(ro_RO),
    importProvidersFrom(FormsModule),
    provideAnimationsAsync(),
    provideApollo(() => {
      const httpLink = inject(HttpLink)

      return {
        link: httpLink.create({ uri: AppConstants.GRAPHQL_ENDPOINT }),
        cache: new InMemoryCache(),
        // other options...
      };

    }),
    { provide: LOCALE_ID, useValue: 'ro' }
  ]
};
