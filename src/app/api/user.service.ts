import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface UserSettings {
  email: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSettingsSubject = new BehaviorSubject<UserSettings>({
    email: '',
    username: '',
  });

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  get userSettings$(): Observable<UserSettings> {
    return this.userSettingsSubject.asObservable();
  }

  private extractData(obj: any): UserSettings {
    return {
      ...obj.data,
    };
  }

  private convertToCamelCase(obj: any): UserSettings {
    return {
      email: obj.email,
      username: obj.username,
    };
  }

  private convertToUnderscoreCase(settings: UserSettings): any {
    return {
      email: settings.email,
      username: settings.username,
    };
  }

  private fetchUserSettings(idToken: string): Observable<UserSettings> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${idToken}`,
    });
    return this.http.get<any>(`${environment.apiBaseUrl}/user/settings`, { headers }).pipe(
      map((data) => this.extractData(data)),
      map((data) => this.convertToCamelCase(data)),
      tap((settings) => this.userSettingsSubject.next(settings)),
      catchError((error) => {
        console.error('Failed to fetch settings:', error);
        return of({
          email: '',
          username: '',
        });
      }),
    );
  }

  getUserSettings(): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.idToken),
      switchMap((authData) => this.fetchUserSettings(authData.idToken)),
    );
  }

  private updateUserSettingsRequest(
    idToken: string,
    userSettings: UserSettings,
  ): Observable<UserSettings> {
    const underscoredSettings = this.convertToUnderscoreCase(userSettings);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    });
    return this.http
      .put<any>(`${environment.apiBaseUrl}/user/settings`, underscoredSettings, { headers })
      .pipe(
        map((data) => this.extractData(data)),
        map((data) => this.convertToCamelCase(data)),
        tap((settings) => this.userSettingsSubject.next(settings)),
        catchError((error) => {
          console.error('Failed to update settings:', error);
          return of(userSettings);
        }),
      );
  }

  updateUserSettings(userSettings: UserSettings): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.idToken),
      switchMap((authData) => this.updateUserSettingsRequest(authData.idToken, userSettings)),
    );
  }
}
