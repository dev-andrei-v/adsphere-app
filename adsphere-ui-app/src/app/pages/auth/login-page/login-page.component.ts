import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import { MatIcon } from '@angular/material/icon';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import {AppConstants} from '../../../constants/app-constants';
import {LoginRequest} from '../../../models/auth.model';
import {AuthService} from '../../../services/auth.service';

import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';

import {NzFormControlComponent, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective} from 'ng-zorro-antd/grid';
import {NzInputDirective} from 'ng-zorro-antd/input';
import { AuthStore } from '../../../stores/auth.store';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    NzButtonComponent,
    NzIconDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzColDirective,
    NzInputDirective
],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  loginForm: any

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private notificationService: NzNotificationService,
    private authService: AuthService,
    private authStore: AuthStore,
  ) {
    this.loginForm = this.formBuilder.group({
      email: '',
      password: ''
    });
  }

  onSubmit(): void {
    const loginRequest: LoginRequest = {
      email: this.loginForm.value.email || '',
      password: this.loginForm.value.password || ''
    }

    this.authService.login(loginRequest)
      .subscribe({
        next: (res: any) => {
          const lastNonAuthRoute = this.authStore.getLastNonAuthRoute()
          if (lastNonAuthRoute) {
            this.router.navigateByUrl(lastNonAuthRoute)
              .then(r => {
              });
          } else {
            this.authStore.loadUser();
            this.router.navigate(['/'])
              .then(r => {
              });
          }
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.notificationService.error("Eroare la autentificare", "Verificați datele introduse și încercați din nou.");
        }
      })
  }
}
