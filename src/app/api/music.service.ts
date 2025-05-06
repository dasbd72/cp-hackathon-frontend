import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface Music {
  musicId: string;
  title: string;
  s3Key: string;
  presignedUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MusicService {
  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  extractMusicListData(obj: any): Music[] {
    return obj.data.music_list.map((item: any) => ({
      musicId: item.music_id,
      title: item.title,
      s3Key: item.s3_key,
      presignedUrl: item.presigned_url ? item.presigned_url : null,
    }));
  }

  extractMusicData(obj: any): Music {
    return {
      musicId: obj.music_id,
      title: obj.title,
      s3Key: obj.s3_key,
      presignedUrl: obj.presigned_url ? obj.presigned_url : null,
    };
  }

  private fetchMusicList(idToken: string): Observable<Music[] | null> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${idToken}`,
    });

    return this.http.get<any>(`${environment.apiBaseUrl}/music/list`, { headers }).pipe(
      map(this.extractMusicListData),
      catchError((error) => {
        console.error('Error fetching music list:', error);
        return of(null);
      }),
    );
  }

  getMusicList(): Observable<Music[] | null> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.idToken),
      switchMap((authData) => this.fetchMusicList(authData.idToken)),
    );
  }

  private fetchMusic(idToken: string, musicId: string): Observable<Music | null> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${idToken}`,
    });

    return this.http
      .get<any>(`${environment.apiBaseUrl}/music?music_id=${musicId}`, { headers })
      .pipe(
        map(this.extractMusicData),
        catchError((error) => {
          console.error('Error fetching music:', error);
          return of(null);
        }),
      );
  }

  getMusic(musicId: string): Observable<Music | null> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.idToken),
      switchMap((authData) => this.fetchMusic(authData.idToken, musicId)),
    );
  }

  private uploadMusicRequest(
    idToken: string,
    base64music: string,
    title: string,
    extension: string,
  ): Observable<Music | null> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${idToken}`,
      Accept: 'application/json',
    });
    const data = {
      music: base64music,
      title: title,
      extension: extension,
    };
    return this.http.post<any>(`${environment.apiBaseUrl}/music`, data, { headers }).pipe(
      map(this.extractMusicData),
      catchError((error) => {
        console.error('Error uploading music:', error);
        return of(null);
      }),
    );
  }

  uploadMusic(base64music: string, title: string, extension: string): Observable<Music | null> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.idToken),
      switchMap((authData) =>
        this.uploadMusicRequest(authData.idToken, base64music, title, extension),
      ),
    );
  }

  private deleteMusicRequest(idToken: string, musicId: string): Observable<Music | null> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${idToken}`,
      Accept: 'application/json',
    });
    return this.http
      .delete<any>(`${environment.apiBaseUrl}/music?music_id=${musicId}`, { headers })
      .pipe(
        map(this.extractMusicData),
        catchError((error) => {
          console.error('Error deleting music:', error);
          return of(null);
        }),
      );
  }

  deleteMusic(musicId: string): Observable<Music | null> {
    return this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated && !!authData.idToken),
      switchMap((authData) => this.deleteMusicRequest(authData.idToken, musicId)),
    );
  }
}
