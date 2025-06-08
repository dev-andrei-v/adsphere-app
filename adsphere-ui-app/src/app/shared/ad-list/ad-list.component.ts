import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Ad, AdCardData} from '../../models/ad.model';
import {AdCardSkeletonComponent} from '../ad-card-skeleton/ad-card-skeleton.component';
import {AdCardComponent} from '../ad-card/ad-card.component';
import {NzPaginationComponent} from 'ng-zorro-antd/pagination';

@Component({
  selector: 'app-ad-list',
  imports: [
    AdCardSkeletonComponent,
    AdCardComponent,
    NzPaginationComponent
  ],
  templateUrl: './ad-list.component.html',
  styleUrl: './ad-list.component.scss'
})
export class AdListComponent {
  @Input() ads: AdCardData[] | null = null;
  @Input() isLoading = false;
  @Input() pageData?: { page: number; total: number; pageSize: number };

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  constructor(){
    console.log(this.pageData);
  }
  handlePageIndexChange(page: number) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.pageChange.emit(page);
  }

  handlePageSizeChange(size: number) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.pageSizeChange.emit(size);
  }
}
