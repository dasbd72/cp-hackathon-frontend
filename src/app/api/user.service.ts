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
  private headshotUrlSubject = new BehaviorSubject<string>('');

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  get userSettings$(): Observable<UserSettings> {
    return this.userSettingsSubject.asObservable();
  }

  get headshotUrl$(): Observable<string> {
    return this.headshotUrlSubject.asObservable();
  }

  private extractUserSettingsData(obj: any): UserSettings {
    return {
      ...obj.data,
    };
  }

  private convertUserSettingsToCamelCase(obj: any): UserSettings {
    return {
      email: obj.email,
      username: obj.username,
    };
  }

  private convertUserSettingsToUnderscoreCase(settings: UserSettings): any {
    return {
      email: settings.email,
      username: settings.username,
    };
  }

  private fetchUserSettings(username: string): Observable<UserSettings> {
    const headers = new HttpHeaders();
    return this.http
      .get<any>(`${environment.apiBaseUrl}/user/settings?username=${username}`, { headers })
      .pipe(
        map((data) => this.extractUserSettingsData(data)),
        map((data) => this.convertUserSettingsToCamelCase(data)),
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
      filter((authData) => authData.isAuthenticated),
      switchMap((authData) => this.fetchUserSettings(authData.username)),
    );
  }

  private updateUserSettingsRequest(
    username: string,
    userSettings: UserSettings,
  ): Observable<UserSettings> {
    const underscoredSettings = this.convertUserSettingsToUnderscoreCase(userSettings);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http
      .put<any>(
        `${environment.apiBaseUrl}/user/settings?username=${username}`,
        underscoredSettings,
        { headers },
      )
      .pipe(
        map((data) => this.extractUserSettingsData(data)),
        map((data) => this.convertUserSettingsToCamelCase(data)),
        tap((settings) => this.userSettingsSubject.next(settings)),
        catchError((error) => {
          console.error('Failed to update settings:', error);
          return of(userSettings);
        }),
      );
  }

  updateUserSettings(userSettings: UserSettings): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated),
      switchMap((authData) => this.updateUserSettingsRequest(authData.username, userSettings)),
    );
  }

  private getHeadshotRequest(username: string): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http
      .get<any>(`${environment.apiBaseUrl}/user/image?username=${username}`, { headers })
      .pipe(
        map((data: any) => ({ imageUrl: data.data.image_url })),
        tap((data: any) => this.headshotUrlSubject.next(data.imageUrl)),
        catchError((error) => {
          console.error('Failed to fetch image:', error);
          return of('');
        }),
      );
  }

  getHeadshot(): Observable<any> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated),
      switchMap((authData) => this.getHeadshotRequest(authData.username)),
    );
  }

  private uploadHeadshotRequest(username: string, base64image: string): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    const data = {
      image: base64image,
    };
    return this.http
      .post<any>(`${environment.apiBaseUrl}/user/image?username=${username}`, data, {
        headers,
      })
      .pipe(
        map((data: any) => ({ imageUrl: data.data.image_url })),
        tap((data: any) => this.headshotUrlSubject.next(data.imageUrl)),
        catchError((error) => {
          console.error('Failed to upload image:', error);
          return of('');
        }),
      );
  }

  uploadHeadshot(base64image: string): Observable<any> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated),
      switchMap((authData) => this.uploadHeadshotRequest(authData.username, base64image)),
    );
  }
}
