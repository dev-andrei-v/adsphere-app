import {Injectable} from '@angular/core';
import {Category, CategoryTreeItem} from '../models/category.model';
import {delay, map, Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AppConstants} from '../constants/app-constants';


@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categoryTreeCache: CategoryTreeItem[] | null = null;

  constructor(private httpClient: HttpClient) {
  }

  getFeaturedCategories(): Observable<Category[]> {
    return this.httpClient.get<{ data: Category[] }>(`${AppConstants.API_URL}/categories/featured`)
      .pipe(
        map(response => response.data),
        map(categories => {
          return categories;
        }),
      )

  }

  getCategoryTree(): Observable<CategoryTreeItem[]> {
    if (this.categoryTreeCache) {
      return of(this.categoryTreeCache); // Simulate delay for cache
    } else {
      return this.httpClient.get<{ data: any }>(`${AppConstants.API_URL}/categories/tree`)
        .pipe(
          map(response => response.data),
          map(categories => {
            this.categoryTreeCache = categories; // Cache the result
            return categories;
          }),
        )
    }
  }

  getSubcategoriesByParentSlug(slug: string): Observable<any> {
    return this.httpClient.get<{ data: Category[] }>(`${AppConstants.API_URL}/categories/${slug}/subcategories`)
      .pipe(
        map(response => response.data)
      );
  }

  getCategoryBySlug(slug: string): Observable<Category> {
    return this.httpClient.get<{ data: Category }>(`${AppConstants.API_URL}/categories/${slug}`)
      .pipe(
        map(response => response.data)
      );
  }

  getAdsByCategorySlug(slug: string, page: number = 1, pageSize: number = 20, filters = null): Observable<any> {
    return this.httpClient.post<{ data: any }>(`${AppConstants.API_URL}/categories/${slug}/ads`, {
      params: {
        page: page.toString(),
        pageSize: pageSize.toString()
      },
      filters
    })
  }

  getParentByChildSlug(slug: string): Observable<CategoryTreeItem | null> {
    const categoryTree = this.getCategoryTree();
    return categoryTree.pipe(
      map(tree => this.findParentByChildSlug(tree, slug))
    );
  }

  /**
   * Searches for the parent category of a given child slug in the category tree.
   * @private
   */
  private findParentByChildSlug(tree: CategoryTreeItem[], slug: string, parent: CategoryTreeItem | null = null): CategoryTreeItem | null {
    for (const item of tree) {
      if (item.slug === slug) {
        return parent; // returnează părintele!
      }
      if (item.subcategories && item.subcategories.length > 0) {
        const found = this.findParentByChildSlug(item.subcategories, slug, item);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
}
