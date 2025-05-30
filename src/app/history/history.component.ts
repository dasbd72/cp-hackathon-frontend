import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { catchError, of, tap } from 'rxjs';

import { History, HistoryService } from '../api/history.service';
import { Music, MusicService } from '../api/music.service';
import { UserService } from '../api/user.service';
import { MusicPlayerComponent } from '../music-player/music-player.component';

interface HistoryElement {
  index: number;
  date: string;
  imageUrl: string;
  userId?: string;
  username?: string;
  musicId?: string;
  history: History;
}

@Component({
  selector: 'app-history',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MusicPlayerComponent,
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent implements OnInit {
  isLoading = true;
  historyList: HistoryElement[] = [];
  currentMusic: Music | null = null;

  constructor(
    private historyService: HistoryService,
    private userService: UserService,
    private musicService: MusicService,
  ) {}

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
            return a.decoded.s3Key > b.decoded.s3Key ? -1 : 1;
          });
          this.historyList = historyList.map((history, index) => ({
            index: index + 1,
            date: history.decoded.lastModified,
            imageUrl: history.decoded.presignedUrl,
            userId: history.results.matched_role,
            history: history,
          }));
          this.historyList.forEach((historyElement) => {
            if (!historyElement.userId) {
              return;
            }
            this.userService
              .getUserSettingsByUserId(historyElement.userId)
              .pipe(
                tap((userSettings) => {
                  historyElement.username = userSettings.username;
                  historyElement.musicId = userSettings.musicId;
                }),
                catchError((error) => {
                  console.error('Error fetching user settings:', error);
                  return of(null);
                }),
              )
              .subscribe();
          });
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

  onPlayMusic(musicId: string): void {
    this.musicService
      .getMusic(musicId)
      .pipe(
        tap((music) => {
          if (!music) {
            console.error('Music not found');
            return;
          }
          this.currentMusic = music;
        }),
        catchError((error) => {
          console.error('Error fetching music:', error);
          return of(null);
        }),
      )
      .subscribe();
  }
}
