import {signal, computed, Injectable} from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import {User} from '../models/user.model';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private authService = inject(AuthService);

  private readonly _user = signal<User | null>(null);
  readonly user = computed(() => this._user());

  private lastNonAuthRoute: string | null = null;

  constructor(private readonly router: Router){
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;

      if (!url.startsWith('/auth')) {
        this.lastNonAuthRoute = url;
      }
    });
  }

  loadUser() {
    return new Promise(() => {
      this.authService.getUserInfo().subscribe({
        next: (user) => {
          this._user.set(user);
          return user
        },
        error: () => {
          this._user.set(null);
          return null
        }
      });
    });
  }


  logout() {
    this.authService.logout();
    this._user.set(null);

    this.router.navigate(['/']).then(() => {
      this.lastNonAuthRoute = null;
    });
  }

  setUser(user: User) {
    this._user.set(user);
  }

  removeUser(){
    this._user.set(null);
  }

  getLastNonAuthRoute(): string | null {
    if(this.lastNonAuthRoute === '' || this.lastNonAuthRoute === '/')
      return null;
    return this.lastNonAuthRoute;
  }

  getUserId() {
    return this.user()?.id || null;
  }

  isAuthenticated(): boolean {
    return this.user() !== null;
  }
}
