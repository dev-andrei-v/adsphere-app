import {Injectable} from '@angular/core';
import {delay, map, Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AppConstants} from '../constants/app-constants';
import {Locality} from '../models/locality.model.';


@Injectable({
  providedIn: 'root'
})
export class LocalityService {

  constructor(private httpClient: HttpClient) {
  }

  getCounties(): Observable<string[]> {
    return this.httpClient.get<{ data: string[] }>(`${AppConstants.API_URL}/localities/counties`)
      .pipe(
        map(response => response.data)
      );
  }

  getLocalitiesByCounty(county: string): Observable<Locality[]> {
    return this.httpClient.get<{ data: Locality[] }>(`${AppConstants.API_URL}/localities?county=${county}`)
      .pipe(
        map(response => response.data)
      );
  }

  getAutocomplete(query: string): Observable<Locality[]> {
    if(!query || query.length < 3) {
      return of([]); // Return empty array after a delay
    }
    return this.httpClient.get<{ data: Locality[] }>(`${AppConstants.API_URL}/localities/autocomplete?query=${query}`)
      .pipe(
        map(response =>
          response.data.sort((a, b) => a.county.localeCompare(b.county))
        )
      );
  }

  getNearbyLocality(latitude: number, longitude: number): Observable<Locality | null> {
    return this.httpClient.get<{ data: Locality | null }>(`${AppConstants.API_URL}/localities/nearby?lat=${latitude}&lng=${longitude}`)
      .pipe(
        map(response => response.data),
      );
  }

  getNearbyLocalities(latitude: number, longitude: number, maxDistance: number = 10000): Observable<Locality[]> {
    return this.httpClient.get<{ data: Locality[] }>(`${AppConstants.API_URL}/localities/nearby-localities?lat=${latitude}&lng=${longitude}&maxDistance=${maxDistance}`)
      .pipe(
        map(response => response.data),
      );
  }
}
