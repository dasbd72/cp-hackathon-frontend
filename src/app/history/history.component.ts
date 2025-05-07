import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { catchError, of, tap } from 'rxjs';

import { History, HistoryService } from '../api/history.service';

interface HistoryElement {
  index: number;
  history: History;
}

@Component({
  selector: 'app-history',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent implements OnInit {
  isLoading = true;
  historyList: HistoryElement[] = [];

  constructor(private historyService: HistoryService) {}

  ngOnInit(): void {
    this.loadHistoryList();
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  loadHistoryList(): void {
    this.setLoading(true);
    this.historyService
      .getHistoryList()
      .pipe(
        tap((historyList) => {
          historyList = historyList || [];
          historyList.sort((a, b) => {
            return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
          });
          this.historyList = historyList.map((history, index) => ({
            index: index + 1,
            history: history,
          }));
          this.setLoading(false);
        }),
        catchError((error) => {
          console.error('Error fetching history list:', error);
          this.setLoading(false);
          return of([]);
        }),
      )
      .subscribe();
  }
}
