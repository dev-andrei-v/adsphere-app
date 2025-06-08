import {Component, OnInit, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {CategoryCardComponent} from '../../../shared/category-card/category-card.component';
import {CategoryService} from '../../../services/category.service';
import {Category} from '../../../models/category.model';
import {forkJoin, map, Observable, range, switchMap, tap} from 'rxjs';
import {CategoryCardSkeletonComponent} from '../../../shared/category-card-skeleton/category-card-skeleton.component';

@Component({
  selector: 'app-featured-categories',
  imports: [
    CategoryCardComponent,
    CategoryCardSkeletonComponent,
  ],
  templateUrl: './featured-categories.component.html',
  styleUrl: './featured-categories.component.scss'
})
export class FeaturedCategoriesComponent implements OnInit {
  categories = signal<Category[]>([])
  isLoading = signal<boolean>(true);

  constructor(private categoryService: CategoryService) {
  }

  ngOnInit(): void {
    this.categoryService.getFeaturedCategories().pipe(
      tap(categories => {
        this.categories.set(categories);
      }),
      switchMap(categories => {
        const imagePromises = categories.map(category =>
          this.preloadImage(category.image.url)
        );
        return forkJoin(imagePromises).pipe(
          map(() => categories)
        );
      }),
      tap(() => {
        this.isLoading.set(false);
      })
    ).subscribe();
  }


  protected readonly range = range;

  private preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = src;
    });
  }
}
