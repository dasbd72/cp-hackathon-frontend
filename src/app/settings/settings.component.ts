import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Observable, catchError, filter, of, switchMap, tap } from 'rxjs';

import { UserService, UserSettings } from '../api/user.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  isLoading = false;
  isLoadingUserSettings = false;
  userSettings: UserSettings = {
    email: '',
    username: '',
    musicId: '',
  };
  userSettings$: Observable<UserSettings | null> = of(null);
  isLoadingHeadshot = false;
  headshotBase64: string | null = null;
  headshotUrl: string | null = null;
  headshotUrl$: Observable<string | null> = of(null);

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    // Load settings and headshot when authService changes
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        switchMap(() => {
          this.loadSettings();
          this.loadHeadshot();
          return of(null);
        }),
      )
      .subscribe();
  }

  setLoadingUserSettings(loading: boolean) {
    this.isLoadingUserSettings = loading;
    this.isLoading = this.isLoadingUserSettings || this.isLoadingHeadshot;
  }

  setLoadingHeadshot(loading: boolean) {
    this.isLoadingHeadshot = loading;
    this.isLoading = this.isLoadingUserSettings || this.isLoadingHeadshot;
  }

  loadSettings() {
    this.setLoadingUserSettings(true);
    this.userSettings$ = this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated),
      switchMap(() => this.userService.getUserSettings()),
      tap((settings) => {
        if (settings) {
          this.userSettings = { ...settings }; // Initialize userSettings
        }
        this.setLoadingUserSettings(false);
      }),
      catchError((error) => {
        console.error('Failed to load settings:', error);
        this.setLoadingUserSettings(false);
        return of(null);
      }),
    );
  }

  loadHeadshot() {
    this.setLoadingHeadshot(true);
    this.headshotUrl$ = this.authService.authData$.pipe(
      filter((authData) => authData.isAuthenticated),
      switchMap(() => this.userService.getHeadshot()),
      tap((headshot) => {
        if (headshot) {
          this.headshotUrl = headshot.imageUrl;
        }
        this.setLoadingHeadshot(false);
      }),
      catchError((error) => {
        console.error('Failed to load headshot:', error);
        this.setLoadingHeadshot(false);
        return of(null);
      }),
    );
  }

  onSubmitUserSettings() {
    this.setLoadingUserSettings(true);
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        switchMap(
          () => this.userService.updateUserSettings(this.userSettings), // Pass userSettings
        ),
        tap((updatedSettings) => {
          this.userSettings = { ...updatedSettings }; // Update userSettings with response
          this.setLoadingUserSettings(false);
          console.log('Settings updated successfully!');
        }),
        catchError((error) => {
          console.error('Failed to update settings:', error);
          this.setLoadingUserSettings(false);
          return of(null);
        }),
      )
      .subscribe();
  }

  onSubmitHeadshot() {
    this.setLoadingUserSettings(true);
    this.authService.authData$
      .pipe(
        filter((authData) => authData.isAuthenticated),
        switchMap(() => this.userService.uploadHeadshot(this.headshotBase64!)), // Pass headshotBase64
        tap(() => {
          this.setLoadingUserSettings(false);
          console.log('Headshot uploaded successfully!');
        }),
        catchError((error) => {
          console.error('Failed to upload headshot:', error);
          this.setLoadingUserSettings(false);
          return of(null);
        }),
      )
      .subscribe();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.headshotBase64 = e.target.result.split(',')[1]; // Extract base64 string
      };
      reader.readAsDataURL(file);
    }
  }
}
