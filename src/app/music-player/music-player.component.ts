import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-music-player',
  imports: [
    FormsModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSliderModule,
  ],
  templateUrl: './music-player.component.html',
  styleUrl: './music-player.component.css',
})
export class MusicPlayerComponent implements AfterViewInit, OnChanges {
  @Input() url?: string | null = null;
  @Input() title?: string | null = null;

  isPlaying = false;
  duration = 0;
  currentTime = 0;
  volume = 0.2;

  @ViewChild('audioPlayerRef', { static: false })
  audioPlayerRef: ElementRef = new ElementRef(null);
  audioPlayer: HTMLMediaElement = new Audio();

  ngAfterViewInit() {
    this.setupAudioPlayer();
  }

  ngOnChanges() {
    if (!this.url) {
      return;
    }
    this.audioPlayer.src = this.url;
    this.audioPlayer.load();
  }

  setupAudioPlayer() {
    if (!this.audioPlayerRef) {
      console.error('Audio player reference is not available');
      return;
    }
    this.audioPlayer = this.audioPlayerRef.nativeElement;
    this.audioPlayer.volume = this.volume;
  }

  onLoadedMetadata() {
    this.duration = this.audioPlayer.duration;
    this.isPlaying = true;
    this.currentTime = 0;
    this.audioPlayer.play();
  }

  onTimeUpdate() {
    this.currentTime = this.audioPlayer.currentTime;
  }

  onInputTimeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newTime = parseFloat(target.value);
    this.audioPlayer.currentTime = newTime;
    this.currentTime = newTime;
  }

  onInputVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newVolume = parseFloat(target.value);
    this.audioPlayer.volume = newVolume;
    this.volume = newVolume;
  }

  onInputPlayPause() {
    if (!this.audioPlayer.paused) {
      this.audioPlayer.pause();
      this.isPlaying = false;
    } else {
      this.audioPlayer.play();
      this.isPlaying = true;
    }
  }
}
