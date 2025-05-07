import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

import { catchError, filter, of, switchMap, tap } from 'rxjs';

import { UserService, UserSettings } from '../api/user.service';
import { AuthData, AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  username = '';
  authData: AuthData = {
    isAuthenticated: false,
    userData: null,
    accessToken: '',
    idToken: '',
    isLoading: true,
  };
  userSettings: UserSettings = {
    email: '',
    username: '',
    musicId: '',
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  ngOnInit(): void {
    this.authService.authData$
      .pipe(
        tap((authData) => {
          this.authData = authData;
        }),
        filter((authData) => authData.isAuthenticated && !!authData.accessToken),
        switchMap(() =>
          this.userService.getUserSettings().pipe(
            filter((settings) => !!settings),
            tap((settings) => {
              this.userSettings = settings;
            }),
            catchError((error) => {
              console.error('Failed to load user settings:', error);
              return of(null); // Return observable here
            }),
          ),
        ),
      )
      .subscribe();
  }
}
