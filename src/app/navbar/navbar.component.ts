import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { catchError, filter, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  isUserDropdownOpen = false;
  isMobileMenuOpen = false; // Added for mobile menu

  toggleDropdown() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    // Close the mobile menu if the dropdown is opened
    if (this.isUserDropdownOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  // Added for mobile menu
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Close the user dropdown if the mobile menu is opened
    if (this.isMobileMenuOpen) {
      this.isUserDropdownOpen = false;
    }
  }

  // Added for mobile menu
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  // Closes user dropdown and mobile menu when clicking outside
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const clickedInsideUserDropdown =
      (event.target as HTMLElement).closest('.user-dropdown') !== null;
    const clickedInsideMobileMenu =
      (event.target as HTMLElement).closest('.mobile-menu') !== null ||
      (event.target as HTMLElement).closest('.mobile-menu-button') !== null;

    if (!clickedInsideUserDropdown) {
      this.isUserDropdownOpen = false;
    }
    if (!clickedInsideMobileMenu) {
      this.isMobileMenuOpen = false;
    }
  }
}
