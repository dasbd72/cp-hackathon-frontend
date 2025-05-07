import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';

import { Observable, catchError, filter, map, of, switchMap, tap } from 'rxjs';

import { Music, MusicService } from '../api/music.service';
import { UserService } from '../api/user.service';
import { AuthService } from '../auth/auth.service';

interface MusicElement {
  music: Music;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
}

@Component({
  selector: 'app-music',
  imports: [
    FormsModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSliderModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './music.component.html',
  styleUrl: './music.component.css',
})
export class MusicComponent implements AfterViewInit {
  isLoading = false;
  musicList: Music[] | null = [];
  musicList$: Observable<Music[] | null> = of([]);
  musicFile: File | null = null;
  musicBase64: string | null = null;
  title = '';
  extension = '';
  currentMusic: MusicElement = {
    music: { musicId: '', title: '', s3Key: '', presignedUrl: '' },
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 0.2,
  };
  userSettingsMusicId = '';

  @ViewChild('audioPlayerRef', { static: false })
  audioPlayerRef: ElementRef = new ElementRef(null);
  audioPlayer: HTMLMediaElement = new Audio();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private musicService: MusicService,
  ) {}

  ngAfterViewInit() {
    this.setAudioPlayer();
    setTimeout(() => {
      // setTimeout to postpone the execution of the code
      this.loadMusicList();
      this.loadUserSettingsMusicId();
    });
  }

  setAudioPlayer() {
    if (!this.audioPlayerRef) {
      console.error('Audio player reference is not available');
      return;
    }
    this.audioPlayer = this.audioPlayerRef?.nativeElement;
    this.audioPlayer.volume = this.currentMusic.volume;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  loadMusicList() {
    this.setLoading(true);
    this.musicList$ = this.musicService.getMusicList().pipe(
      tap((musicList) => {
        this.musicList = musicList;
        this.setLoading(false);
      }),
      catchError((error) => {
        console.error('Error loading music list:', error);
        this.setLoading(false);
        return of([]);
      }),
    );
  }

  loadUserSettingsMusicId() {
    this.userService.userSettings$
      .pipe(
        filter((settings) => settings.musicId !== ''),
        map((settings) => settings.musicId),
        tap((musicId) => {
          this.userSettingsMusicId = musicId;
        }),
        catchError((error) => {
          console.error('Error loading user settings music ID:', error);
          return of('');
        }),
      )
      .subscribe();
  }

  onSubmitMusic() {
    this.setLoading(true);
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        switchMap(() =>
          this.musicService.uploadMusic(this.musicBase64!, this.title, this.extension),
        ),
        tap(() => {
          this.musicFile = null;
          this.musicBase64 = '';
          this.title = '';
          this.loadMusicList();
          console.log('Music uploaded successfully!');
        }),
        catchError((error) => {
          console.error('Error uploading music:', error);
          this.setLoading(false);
          return of(null);
        }),
      )
      .subscribe();
  }

  onDeleteMusic(music: Music) {
    const confirmed = confirm(`Are you sure you want to delete ${music.title}?`);
    if (!confirmed) {
      return;
    }
    this.setLoading(true);
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        switchMap(() => this.musicService.deleteMusic(music.musicId)),
        tap(() => {
          this.loadMusicList();
          console.log('Music deleted successfully!');
        }),
        catchError((error) => {
          console.error('Error deleting music:', error);
          this.setLoading(false);
          return of(null);
        }),
      )
      .subscribe();
  }

  onSetUserSettingsMusicId(music: Music) {
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        switchMap(() =>
          this.userService.updateUserSettingsMusicId(music.musicId).pipe(
            tap(() => {
              this.loadUserSettingsMusicId();
              console.log('User music ID set successfully!');
            }),
            catchError((error) => {
              console.error('Error setting user music ID:', error);
              return of(null);
            }),
          ),
        ),
      )
      .subscribe();
  }

  onFileChange(event: any) {
    this.musicFile = event.target.files[0];
    if (this.musicFile) {
      if (this.musicFile.name.split('.').length < 2) {
        console.error('Invalid file name');
        return;
      }
      this.title = this.musicFile.name.split('.')[0];
      this.extension = this.musicFile.name.split('.')[1];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.musicBase64 = e.target.result.split(',')[1]; // Extract base64 string
      };
      reader.readAsDataURL(this.musicFile);
    }
  }

  onLoadedMetadata() {
    this.currentMusic = {
      ...this.currentMusic,
      duration: this.audioPlayer.duration,
      isPlaying: true,
      currentTime: 0,
    };
  }

  onTimeUpdate() {
    this.currentMusic = {
      ...this.currentMusic,
      duration: this.audioPlayer.duration,
      currentTime: this.audioPlayer.currentTime,
    };
  }

  onPlayMusic(music: Music) {
    this.currentMusic = {
      ...this.currentMusic,
      music: music,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
    };
    this.audioPlayer.src = music.presignedUrl ? music.presignedUrl : '';
    this.audioPlayer.load();
    this.audioPlayer.play();
  }

  onInputTimeChange(event: any) {
    const value = event.target.value;
    this.audioPlayer.currentTime = value;
    this.currentMusic.currentTime = value;
  }

  onInputVolumeChange(event: any) {
    const value = event.target.value;
    this.currentMusic.volume = value;
    this.audioPlayer.volume = value;
  }

  togglePlay() {
    if (this.audioPlayer.paused) {
      this.currentMusic.isPlaying = true;
      this.audioPlayer.play();
    } else {
      this.currentMusic.isPlaying = false;
      this.audioPlayer.pause();
    }
  }
}
