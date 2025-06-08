import { Component } from '@angular/core';
import {NzResultComponent} from 'ng-zorro-antd/result';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [
    NzResultComponent,
    NzButtonComponent,
    RouterLink
  ],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.scss'
})
export class NotFoundPageComponent {

}
