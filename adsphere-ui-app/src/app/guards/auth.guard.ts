import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {AuthStore} from '../stores/auth.store';
import { catchError, map, of } from 'rxjs';


export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return of(true);
  }

  // Dacă nu e autenticat, mai încearcă o dată să ceară datele userului
  return authService.getUserInfo().pipe(
    map(user => {
      authStore.setUser(user);
      return true;
    }),
    catchError(() => {
      authStore.removeUser();
      return of(router.parseUrl('/auth'));
    })
  );
};
