import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

export interface History {
  s3Key: string;
  lastModified: string;
  presignedUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  constructor(private http: HttpClient) {}

  private extractHistoryListData(obj: any): History[] {
    return obj.data.history_list.map((item: any) => ({
      s3Key: item.s3_key,
      lastModified: item.last_modified,
      presignedUrl: item.presigned_url,
    }));
  }

  private fetchHistoryList(): Observable<History[] | null> {
    return this.http.get<any>(`${environment.apiBaseUrl}/history/list`).pipe(
      map(this.extractHistoryListData),
      catchError((error) => {
        console.error('Error fetching history list:', error);
        return of(null);
      }),
    );
  }

  getHistoryList(): Observable<History[] | null> {
    return this.fetchHistoryList();
  }
}
