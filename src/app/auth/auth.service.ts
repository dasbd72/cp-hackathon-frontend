import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthData {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authDataSubject = new BehaviorSubject<AuthData>({
    isAuthenticated: false,
    isLoading: true,
    username: '',
  });

  constructor() {
    // Load username from local storage
    setTimeout(() => {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        this.authDataSubject.next({
          ...this.authDataSubject.value,
          isAuthenticated: true,
          username: storedUsername,
          isLoading: false,
        });
      } else {
        this.authDataSubject.next({
          ...this.authDataSubject.value,
          isLoading: false,
        });
      }
    }, 10);
  }

  get authData$(): Observable<AuthData> {
    return this.authDataSubject.asObservable();
  }

  login(username: string): void {
    // Simulate a login process
    setTimeout(() => {
      localStorage.setItem('username', username);
      this.authDataSubject.next({
        isAuthenticated: true,
        isLoading: false,
        username: username,
      });
    }, 10);
  }

  logout(): void {
    // Simulate a logout process
    setTimeout(() => {
      localStorage.removeItem('username');
      this.authDataSubject.next({
        isAuthenticated: false,
        isLoading: false,
        username: '',
      });
    }, 10);
  }
}
