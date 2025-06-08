import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {AppConstants} from '../constants/app-constants';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClient: HttpClient) { }

  getUserAds(): Observable<any> {
    return this.httpClient.get<any>(`${AppConstants.API_URL}/users/me/ads`)
      .pipe(
        map(response => response.data)
      );
  }

  getUserFavorites(): Observable<any> {
    return this.httpClient.get<any>(`${AppConstants.API_URL}/users/me/favorites`)
  }

  adToFavorite(adId: string): Observable<any> {
    return this.httpClient.post<{ data: any }>(`${AppConstants.API_URL}/users/me/favorites`, { adId })
      .pipe(
        map(response => response.data)
      );
  }
  removeAdFromFavorites(adId: string): Observable<any> {
    return this.httpClient.delete<{ data: any }>(`${AppConstants.API_URL}/users/me/favorites`, {
      body: { adId }
    }).pipe(
      map(response => response.data)
    );
  }

  sendSeenStatus(){
    return this.httpClient.post(`${AppConstants.API_URL}/users/me/seen`, {})
      .pipe(
        map(response => response)
      );
  }
}
