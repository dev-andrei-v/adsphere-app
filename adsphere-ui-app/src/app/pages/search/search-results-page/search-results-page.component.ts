import {Component, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AdService} from '../../../services/ad.service';
import {AdCardData} from '../../../models/ad.model';
import {AdListComponent} from '../../../shared/ad-list/ad-list.component';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzResultComponent, NzResultContentDirective, NzResultSubtitleDirective} from 'ng-zorro-antd/result';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import { SearchBarComponent } from '../../home/search-bar/search-bar.component';

@Component({
  selector: 'app-search-results-page',
  imports: [
    AdListComponent,
    NzResultComponent,
    NzButtonComponent,
    NzResultSubtitleDirective,
    SearchBarComponent,
  ],
  templateUrl: './search-results-page.component.html',
  styleUrl: './search-results-page.component.scss'
})
export class SearchResultsPageComponent implements OnInit {
  readonly DEFAULT_PAGE_SIZE = 20;
  ads = signal<AdCardData[]>([]);
  categoryName = signal<string | null>(null);
  locationName = signal<string | null>(null);
  isLoading = signal(true);
  pageData = signal({
    page: 1,
    total: 0,
    totalPages: 0,
    pageSize: this.DEFAULT_PAGE_SIZE});
  query = signal('');
  loc = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adService: AdService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.query.set(params['q'] || null);
      this.loc.set(params['loc'] || null);
      const page = parseInt(params['page'] || '1', 10);
      if(!this.query()) {
        // If no query is provided, redirect to home or show a message
        this.router.navigate(['/']);
      }
      this.pageData.update((p) => ({ ...p, page }));
      this.fetchAds();
    });
  }

  private fetchAds(): void {
    if (!this.query()) return;

    this.isLoading.set(true);

    this.adService
      .searchAds(this.query(), this.pageData().page, this.pageData().pageSize, undefined, this.loc())
      .subscribe({
        next: (res) => {
          this.ads.set(res.data);
          if(res.locality) {
            this.locationName.set(`${res.locality.county} | ${res.locality.name}`);
          }
          if(res.category){
            this.categoryName.set(res.category.name);
          }
          this.pageData.update((p) => ({
            ...p,
            total: res.total,
            totalPages: Math.ceil(res.total / p.pageSize),
          }));
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Search failed:', err);
          this.isLoading.set(false);
        },
      });
  }

  handlePageChange(page: number): void {
    this.router.navigate([], {
      queryParams: {
        q: this.query(),
        page,
      },
      queryParamsHandling: 'merge',
    });
  }

  handlePageSizeChange(size: number): void {
    this.pageData.update((p) => ({ ...p, pageSize: size, page: 1 }));
    this.router.navigate([], {
      queryParams: {
        q: this.query(),
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  get isEmpty(): boolean {
    return !this.isLoading() && this.ads().length === 0;
  }
}
