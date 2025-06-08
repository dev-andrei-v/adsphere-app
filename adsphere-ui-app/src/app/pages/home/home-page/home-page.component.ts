import {Component, OnInit} from '@angular/core';
import {SearchBarComponent} from '../search-bar/search-bar.component';
import {FeaturedCategoriesComponent} from '../featured-categories/featured-categories.component';
import {AdvantagesComponent} from '../advantages/advantages.component';
import {LatestAdsComponent} from '../latest-ads/latest-ads.component';

import {AuthService} from '../../../services/auth.service';
import { AuthStore } from '../../../stores/auth.store';
import { SuggestedAdsComponent } from '../suggested-ads/suggested-ads.component';


@Component({
  selector: 'app-home-page',
  imports: [
    SearchBarComponent,
    FeaturedCategoriesComponent,
    AdvantagesComponent,
    LatestAdsComponent,
    SuggestedAdsComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

  constructor(private authStore: AuthStore) {

  }

  get isAuth() {
    return this.authStore.isAuthenticated()
  }
}
