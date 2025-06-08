import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AppConstants} from '../constants/app-constants';
import {catchError, map, Observable, throwError} from 'rxjs';
import {LoginRequest, RegisterRequest} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private httpClient: HttpClient) { }

  login(data: LoginRequest): Observable<any> {
    return this.httpClient.post<any>(`${AppConstants.API_URL}/auth/login`, data)
      .pipe(
        map(response => {
          if(response.accessToken !== undefined) {
            localStorage.setItem("accessToken", response.accessToken);
          }
          return response;
        }),
      )
  }

  register(data: RegisterRequest): Observable<any> {
    return this.httpClient.post<any>(`${AppConstants.API_URL}/auth/register`, data)
      .pipe(
        map(response => {
          return response;
        }),
      )
  }

  getUserInfo(): Observable<any> {
    return this.httpClient.get<any>(`${AppConstants.API_URL}/auth/me`, {
      withCredentials: true,
    })
      .pipe(
        map(data => {
          if(data.accessToken !== undefined) {
            localStorage.setItem("accessToken", data.accessToken);
          }
          return data.user;
        }),
        catchError(error => {
          localStorage.removeItem("accessToken");
          console.error('Error fetching user info:', error);
          return throwError(() => error);
        })
      )
  }

  logout(): void {
    localStorage.removeItem("accessToken");
    this.httpClient.post(`${AppConstants.API_URL}/auth/logout`, {}, {
      withCredentials: true,
    })
      .subscribe({
        next: () => {
          console.log('Logged out successfully');
        },
        error: (error) => {
          console.error('Error during logout:', error);
        }
      });
  }
}
