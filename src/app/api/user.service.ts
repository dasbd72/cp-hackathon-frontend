import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface UserSettings {
  email: string;
  username: string;
  musicId: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSettingsSubject = new BehaviorSubject<UserSettings>({
    email: '',
    username: '',
    musicId: '',
  });

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  private extractUserSettingsData(obj: any): UserSettings {
    return {
      email: obj.data.email,
      username: obj.data.username,
      musicId: obj.data.music_id,
    };
  }

  private fetchUserSettings(userId: string): Observable<UserSettings> {
    const headers = new HttpHeaders();
    return this.http
      .get<any>(`${environment.apiBaseUrl}/user/settings?user_id=${userId}`, { headers })
      .pipe(
        map(this.extractUserSettingsData),
        catchError((error) => {
          console.error('Failed to fetch settings:', error);
          return of({
            email: '',
            username: '',
            musicId: '',
          });
        }),
      );
  }

  getUserSettings(): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.userData),
      switchMap((authData) => this.fetchUserSettings(authData.userData.sub)),
      tap((settings) => this.userSettingsSubject.next(settings)),
    );
  }

  getUserSettingsByUserId(userId: string): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.userData),
      switchMap((authData) => this.fetchUserSettings(userId)),
    );
  }

  private updateUserSettingsRequest(
    idToken: string,
    userSettings: UserSettings,
  ): Observable<UserSettings> {
    const underscoredSettings = {
      email: userSettings.email,
      username: userSettings.username,
      music_id: userSettings.musicId,
    };
    const headers = new HttpHeaders({
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    });
    return this.http
      .put<any>(`${environment.apiBaseUrl}/user/settings`, underscoredSettings, { headers })
      .pipe(
        map(this.extractUserSettingsData),
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

  updateUserSettingsMusicId(musicId: string): Observable<UserSettings> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.idToken),
      switchMap((authData) =>
        this.updateUserSettingsRequest(authData.idToken, {
          ...this.userSettingsSubject.getValue(),
          musicId: musicId,
        }),
      ),
    );
  }

  private getHeadshotRequest(userId: string): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http
      .get<any>(`${environment.apiBaseUrl}/user/image?user_id=${userId}`, { headers })
      .pipe(
        map((data: any) => ({ imageUrl: data.data.image_url })),
        catchError((error) => {
          console.error('Failed to fetch image:', error);
          return of('');
        }),
      );
  }

  getHeadshot(): Observable<any> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.userData),
      switchMap((authData) => this.getHeadshotRequest(authData.userData.sub)),
    );
  }

  private uploadHeadshotRequest(idToken: string, base64image: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${idToken}`,
      Accept: 'application/json',
    });
    const data = {
      image: base64image,
    };
    return this.http
      .post<any>(`${environment.apiBaseUrl}/user/image`, data, {
        headers,
      })
      .pipe(
        map((data: any) => ({ imageUrl: data.data.image_url })),
        catchError((error) => {
          console.error('Failed to upload image:', error);
          return of('');
        }),
      );
  }

  uploadHeadshot(base64image: string): Observable<any> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.idToken),
      switchMap((authData) => this.uploadHeadshotRequest(authData.idToken, base64image)),
    );
  }
}
