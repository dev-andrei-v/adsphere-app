import { Component, OnInit } from '@angular/core';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzTabComponent, NzTabSetComponent} from 'ng-zorro-antd/tabs';
import {RegisterPageComponent} from '../register-page/register-page.component';
import {Router} from '@angular/router';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {LoginPageComponent} from '../login-page/login-page.component';
import {AppConstants} from '../../../constants/app-constants';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import { AuthStore } from '../../../stores/auth.store';

@Component({
  selector: 'app-auth-wrapper',
  imports: [
    LoginPageComponent,
    RegisterPageComponent,
    NzCardComponent,
    NzTabSetComponent,
    NzTabComponent,
    RegisterPageComponent,
    NzButtonComponent,
    NzIconDirective,
    NzDividerComponent
  ],
  templateUrl: './auth-wrapper.component.html',
  styleUrl: './auth-wrapper.component.scss'
})
export class AuthWrapperComponent implements OnInit {
  selectedTabIndex = 0;

  constructor(
    private router: Router,
    readonly authStore: AuthStore) {}

  ngOnInit(): void {
    if (this.authStore.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  handleGoogleAuth() {
    const redirect = this.authStore.getLastNonAuthRoute();
    const URL = redirect != null ? `${AppConstants.API_URL}/auth/google?redirect=${redirect}` : `${AppConstants.API_URL}/auth/google`;
    window.open(URL, '_self');
  }
}
