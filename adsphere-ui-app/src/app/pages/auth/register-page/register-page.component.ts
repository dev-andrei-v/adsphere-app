import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Form, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {NzFormControlComponent, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzColDirective} from 'ng-zorro-antd/grid';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzColDirective,
    NzInputDirective,
    NzButtonComponent,
    NzIconDirective,
    NgForOf
],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {
  registerForm
  accountTypes = [{
    value: 'ROLE_USER_INDIVIDUAL',
    label: 'Personal'
  },
    {
      value: 'ROLE_USER_BUSINESS',
      label: 'Afacere'
    },]
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
  ) {
    this.registerForm = this.formBuilder.group({
      accountType: this.accountTypes[0].value,
      name: '',
      email: '',
      password: ''
    });
  }

  onSubmit(): void {
    console.log("registerForm", this.registerForm.value)
    // this.authService.register({
    //   accountType: this.registerForm.value.accountType ?? '',
    //   name: this.registerForm.value.name ?? '',
    //   email: this.registerForm.value.email ?? '',
    //   password: this.registerForm.value.password ?? ''
    // }).subscribe((registerResponse) => {
    //   console.log("registerResponse", registerResponse)
    //   this.router.navigate(['/login']).then(r => {
    //     console.log("navigated to login")
    //   });
    // })

  }
}
