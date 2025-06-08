import {Component, Input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass, NgOptimizedImage} from '@angular/common';

import {Category} from '../../models/category.model';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzIconDirective} from 'ng-zorro-antd/icon';


@Component({
  selector: 'app-category-card',
  imports: [
    RouterLink,
    NgClass,
    NzCardComponent,
    NgOptimizedImage
  ],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss'
})
export class CategoryCardComponent {
  @Input({required: true}) category!: Category;
  @Input({required: true}) link!: string;


  get image() {
    return this.category.image?.url ? this.category.image.url : '/no-image.jpg';
  }
}
