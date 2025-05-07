import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

export interface History {
  decoded: {
    s3Key: string;
    lastModified: string;
    presignedUrl: string;
  };
  results: any;
}

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  constructor(private http: HttpClient) {}

  private extractHistoryListData(obj: any): History[] {
    return obj.data.history_list.map((item: any) => ({
      decoded: {
        s3Key: item.decoded.s3_key,
        lastModified: item.decoded.last_modified,
        presignedUrl: item.decoded.presigned_url,
      },
      results: item.results,
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
