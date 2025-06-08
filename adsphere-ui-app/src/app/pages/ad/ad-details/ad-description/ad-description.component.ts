import { Component, computed, Input, OnInit, signal } from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzTabComponent, NzTabSetComponent} from 'ng-zorro-antd/tabs';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import { CategoryService } from '../../../../services/category.service';
import { CategoryTreeItem } from '../../../../models/category.model';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-ad-description',
  imports: [
    NzCardComponent,
    NzTabComponent,
    NzTabSetComponent,
    NzTagComponent,
    NzIconDirective,
    DatePipe
  ],
  templateUrl: './ad-description.component.html',
  styleUrl: './ad-description.component.scss'
})
export class AdDescriptionComponent implements OnInit {
  @Input({required: true}) public title!: string;
  @Input({required: true}) public description!: string;
  @Input({required: true}) public category: any;
  @Input({required: true}) public createdAt!: string;
  @Input({required: true}) public updatedAt!: string;
  @Input() public categoryAttributes: any = [];
  @Input() public adAttributes: any = {}
  @Input() viewsCounterInput = 0;

  viewsCounter = signal(0);

  parentCategory = signal<CategoryTreeItem | null>(null)

  constructor(private readonly categoryService: CategoryService) {
  }

  ngOnInit(): void {
    this.viewsCounter.set(this.viewsCounterInput + 1);
    this.categoryService.getParentByChildSlug(this.category.slug).subscribe({
      next: (parentCategory) => {
        this.parentCategory.set(parentCategory);
      }}
    );
    }

  attributes = computed(() => {
    if(!this.categoryAttributes || !this.adAttributes) {
      return [];
    }

    return this.categoryAttributes
      .filter((attribute: { key: any; }) => this.adAttributes.hasOwnProperty(attribute.key))
      .map((attribute: { key: string | number; label: any; }) => {
        return {
          key: attribute.key,
          label: attribute.label,
          value: this.adAttributes[attribute.key],
          unit: this.categoryAttributes!.find((attr: { key: string | number; }) => attr.key === attribute.key)?.validation?.unit || '',
        };
      });
  })
}
