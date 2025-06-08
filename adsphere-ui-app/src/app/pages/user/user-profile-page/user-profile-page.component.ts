import {Component, OnInit, signal} from '@angular/core';


import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';

import {MatSnackBar} from '@angular/material/snack-bar';


import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-user-profile-page',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzCardComponent,
    NzIconDirective,
    NzButtonComponent,
    NgIf
],
  templateUrl: './user-profile-page.component.html',
  styleUrl: './user-profile-page.component.scss'
})
export class UserProfilePageComponent implements OnInit {
  editMode = signal(false)
  profileForm!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['test', Validators.required],
    })
  }

  toggleEditMode() {
    this.editMode.update(value => !value)
  }
  onSubmit() {

  }
}
