import { Component, Input } from '@angular/core';
import { AdCardComponent } from "../../../../shared/ad-card/ad-card.component";
import { AdService } from '../../../../services/ad.service';

@Component({
  selector: 'app-related-ads',
    imports: [
        AdCardComponent
    ],
  templateUrl: './related-ads.component.html',
  styleUrl: './related-ads.component.scss'
})
export class RelatedAdsComponent {
  ads: any[] = [];
  @Input({required: true}) adId!: string;

  constructor(private adService: AdService) {

  }
  ngOnInit(): void {
    this.adService.getRecommendedAdsForAd(this.adId).subscribe(ads => {
      this.ads = ads;
    })
  }
}
