import { Component, OnInit, signal } from '@angular/core';
import {AdCardComponent} from '../../../shared/ad-card/ad-card.component';
import {AdService} from '../../../services/ad.service';
import { NzSpinComponent } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-latest-ads',
  imports: [
    AdCardComponent,
    NzSpinComponent
  ],
  templateUrl: './latest-ads.component.html',
  styleUrl: './latest-ads.component.scss'
})
export class LatestAdsComponent implements OnInit {
  ads: any[] = [];
  isLoading = signal(true);

  constructor(private adService: AdService) {

  }
  ngOnInit(): void {
    this.adService.getLatestAds()
      .subscribe(ads => {
        this.ads = ads
        this.isLoading.set(false);
      });
  }

}
