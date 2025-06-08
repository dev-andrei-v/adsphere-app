import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {AppConstants} from '../constants/app-constants';
import {AdPostRequest} from '../models/ad.model';
import { AuthStore } from '../stores/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AdService {

  constructor(
    private readonly httpClient: HttpClient,
  ) { }

  publishAd(ad: AdPostRequest): Observable<any> {
    return this.httpClient.post<{ data: any }>(`${AppConstants.API_URL}/ads`, ad)
  }

  editAd(ad: AdPostRequest, adId: string): Observable<any> {
    return this.httpClient.put(`${AppConstants.API_URL}/ads/${adId}`, ad)
  }

  getAdView(adId: string) {
    return this.httpClient.get<{ data: any }>(`${AppConstants.API_URL}/ads/view/${adId}`)
      .pipe(
        map(response => response.data)
      );
  }

  getLatestAds(): Observable<any[]> {
    return this.httpClient.get<{ data: any[] }>(`${AppConstants.API_URL}/ads/latest`)
      .pipe(
        map(response => response.data)
      );
  }

  getAdBySlug(slug: string): Observable<any> {
    return this.httpClient.get<{ data: any }>(`${AppConstants.API_URL}/ads/${slug}`)
  }

  uploadImage(adId: string, image?: File): Observable<any> {
    if(!image) {
      throw new Error('Image file is required');
    }
    const formData = new FormData();
    formData.append('image', image);

    return this.httpClient.post<{ data: any }>(`${AppConstants.API_URL}/ads/${adId}/image`, formData)
  }

  searchAds(query: string, page: number, pageSize: number,
            categoryId?: string, localityId?: string): Observable<any> {
    const params: {
      q: string;
      page: string;
      limit: string;
      categoryId?: string;
      localityId?: string;
    } = {
      q: query,
      page: page.toString(),
      limit: pageSize.toString()
    }
    if (categoryId) {
      params['categoryId'] = categoryId;
    }
    if (localityId) {
      params['localityId'] = localityId;
    }
    return this.httpClient.get(`${AppConstants.API_URL}/ads/search`, {
      params
    })
  }

  enhanceAdTitle(title: string, description?: string): Observable<any> {
    return this.httpClient.post<{ data: any }>(`${AppConstants.API_URL}/ads/ai/generate/title`, { title, description })
      .pipe(
        map(response => response)
      );
  }

  enhanceAdDescription(description: string, title: string): Observable<any> {
    return this.httpClient.post<{ data: any }>(`${AppConstants.API_URL}/ads/ai/generate/description`, { description, title })
      .pipe(
        map(response => response)
      );
  }

  disableAd(adId: string): Observable<any> {
    return this.httpClient.patch<{ data: any }>(`${AppConstants.API_URL}/ads/${adId}/disable`, {});
  }

  enableAd(adId: string): Observable<any> {
    return this.httpClient.patch<{ data: any }>(`${AppConstants.API_URL}/ads/${adId}/enable`, {});
  }

  getAuctionInfo(adId: string): Observable<any> {
    return this.httpClient.get<{ data: any }>(`${AppConstants.API_URL}/ads/${adId}/auction`)
      .pipe(
        map(response => response.data)
      );
  }

  trackAdView(adId: string): Observable<any> {
    return this.httpClient.post<{ data: any }>(`${AppConstants.API_URL}/ads/track-view`, {
      adId
    })
  }

  getRecommendedAdsForUser(): Observable<any[]> {
    return this.httpClient.get<{ data: any[] }>(`${AppConstants.API_URL}/ads/recommended`)
      .pipe(
        map(response => response.data)
      );
  }

  getRecommendedAdsForAd(adId: string): Observable<any[]> {
    return this.httpClient.get<{ data: any[] }>(`${AppConstants.API_URL}/ads/recommended/${adId}`)
      .pipe(
        map(response => response.data)
      );
  }
}
