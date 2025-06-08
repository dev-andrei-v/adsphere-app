import { Component } from '@angular/core';
import {
  NzSkeletonElementAvatarComponent,
  NzSkeletonElementButtonComponent,
  NzSkeletonElementDirective, NzSkeletonElementInputComponent
} from 'ng-zorro-antd/skeleton';
import {NzCardComponent} from 'ng-zorro-antd/card';

@Component({
  selector: 'app-ad-card-skeleton',
  imports: [
    NzSkeletonElementDirective,
    NzSkeletonElementButtonComponent,
    NzSkeletonElementAvatarComponent,
    NzSkeletonElementInputComponent,
    NzCardComponent
  ],
  templateUrl: './ad-card-skeleton.component.html',
})
export class AdCardSkeletonComponent {

}
