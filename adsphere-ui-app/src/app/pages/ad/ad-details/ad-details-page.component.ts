import { Component, computed, OnInit, signal } from '@angular/core';
import {AdGalleryComponent} from './ad-gallery/ad-gallery.component';
import {AdDescriptionComponent} from './ad-description/ad-description.component';
import {AdPriceComponent} from './ad-price/ad-price.component';
import {AdSellerInfoComponent} from './ad-seller-info/ad-seller-info.component';
import {AdLocationMapComponent} from './ad-location-map/ad-location-map.component';
import {ActivatedRoute, Router} from '@angular/router';
import {AdService} from '../../../services/ad.service';
import {AdDetailsData} from '../../../models/ad.model';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { AuthStore } from '../../../stores/auth.store';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { NotFoundPageComponent } from '../../error/not-found-page/not-found-page.component';
import { RelatedAdsComponent } from './related-ads/related-ads.component';

@Component({
  selector: 'app-ad-details-page',
  imports: [
    AdGalleryComponent,
    AdDescriptionComponent,
    AdPriceComponent,
    AdSellerInfoComponent,
    AdLocationMapComponent,
    NzSpinComponent,
    NzAlertComponent,
    NotFoundPageComponent,
    RelatedAdsComponent
  ],
  templateUrl: './ad-details-page.component.html',
  styleUrl: './ad-details-page.component.scss'
})
export class AdDetailsPageComponent implements OnInit {
  slug!: string;
  ad: AdDetailsData | undefined;
  seller: any;
  category: {
    id: string;
    name: string;
    slug: string;
    attributes: { key: string; label: string; }[];
  } | undefined;

  isLoading = signal(true);

  adDescription = computed(() => {
    return this.ad!.description.replaceAll('\n', '<br/>')
  });

  constructor(private router: Router,
              private route: ActivatedRoute,
              private authStore: AuthStore,
              private adService: AdService) {}

  ngOnInit() {
    window.scrollTo({ top: 0 });

    this.slug = this.route.snapshot.paramMap.get('slug')!;

    this.adService.getAdBySlug(this.slug)
      .subscribe({
        next: (response) => {
          this.ad = response.ad
          this.seller = response.seller;
          this.category = response.category;

          window.history.replaceState({}, '', `/ad/${this.ad!.slug}`);

          this.isLoading.set(false);

          this.trackAd();

        },
        error: (error) => {
          this.router.navigate(['/404']).then();
        }
      })
  }
  get isAuthUserSeller(): boolean {
    const userId = this.authStore.getUserId();
    return userId !== null && this.ad?.userId === userId;
  }


  private trackAd(){
    console.log("Tracking ad view for ad ID:", this.ad?._id);
    if(this.ad?._id) {
      this.adService.trackAdView(
        this.ad?._id
      ).subscribe({
        next: (response) => {
          console.log("Ad view tracked successfully:", response);
        },
        error: (error) => {
          console.error("Error tracking ad view:", error);
        }
      })
    }
  }
}
