import { Component } from '@angular/core';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {
  NzSkeletonComponent,
  NzSkeletonElementAvatarComponent, NzSkeletonElementDirective,
  NzSkeletonElementInputComponent
} from 'ng-zorro-antd/skeleton';
import {NzSpaceComponent, NzSpaceItemDirective} from 'ng-zorro-antd/space';

@Component({
  selector: 'app-category-card-skeleton',
  imports: [
    NzCardComponent,
    NzSkeletonElementAvatarComponent,
    NzSkeletonComponent,
    NzSkeletonElementDirective,
  ],
  templateUrl: './category-card-skeleton.component.html',
})
export class CategoryCardSkeletonComponent {

}
