import { Component, OnInit, signal } from '@angular/core';
import { AdService } from '../../../services/ad.service';
import { AdCardComponent } from '../../../shared/ad-card/ad-card.component';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzSpinComponent } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-suggested-ads',
  imports: [
    AdCardComponent,
    NzIconDirective,
    NzSpinComponent
  ],
  templateUrl: './suggested-ads.component.html',
  styleUrl: './suggested-ads.component.scss'
})
export class SuggestedAdsComponent implements OnInit {
  ads: any[] = [];
  isLoading = signal(true);

  constructor(private adService: AdService) {

  }
  ngOnInit(): void {
    this.adService.getRecommendedAdsForUser().subscribe(ads => {
      this.ads = ads;
      this.isLoading.set(false);
    })
  }
}
