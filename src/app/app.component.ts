import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from './theme.service';

interface User {
  name: string;
  role: string;
  username: string;
  password: string;
  avatar: string;
  permissions: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2><i class="fas fa-university"></i> ERP Finance</h2>
      </div>
      <ul class="sidebar-menu">
        <li>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </a>
        </li>
        <li>
          <a routerLink="/accounts" routerLinkActive="active">
            <i class="fas fa-book"></i>
            <span>Chart of Accounts</span>
          </a>
        </li>
        <li>
          <a routerLink="/general-ledger" routerLinkActive="active">
            <i class="fas fa-book"></i>
            <span>General Ledger</span>
          </a>
        </li>
        <li>
          <a routerLink="/accounts-payable" routerLinkActive="active">
            <i class="fas fa-file-invoice-dollar"></i>
            <span>Accounts Payable</span>
          </a>
        </li>
        <li>
          <a routerLink="/accounts-receivable" routerLinkActive="active">
            <i class="fas fa-hand-holding-usd"></i>
            <span>Accounts Receivable</span>
          </a>
        </li>
        <li>
          <a routerLink="/fixed-assets" routerLinkActive="active">
            <i class="fas fa-building"></i>
            <span>Fixed Assets</span>
          </a>
        </li>
        <li>
          <a routerLink="/budget" routerLinkActive="active">
            <i class="fas fa-chart-pie"></i>
            <span>Budget</span>
          </a>
        </li>
        <li>
          <a routerLink="/financial-reports" routerLinkActive="active">
            <i class="fas fa-file-alt"></i>
            <span>Financial Reports</span>
          </a>
        </li>
        <li>
          <a routerLink="/recon" routerLinkActive="active">
            <i class="fas fa-sync-alt"></i>
            <span>Reconciliation</span>
          </a>
        </li>
        <li>
          <a routerLink="/company-settings" routerLinkActive="active">
            <i class="fas fa-cog"></i>
            <span>Company Settings</span>
          </a>
        </li>
        <li>
          <a routerLink="/invoice-templates" routerLinkActive="active">
            <i class="fas fa-file-invoice"></i>
            <span>Invoice Templates</span>
          </a>
        </li>
        <li>
          <a routerLink="/ui-showcase" routerLinkActive="active">
            <i class="fas fa-palette"></i>
            <span>UI Showcase</span>
          </a>
        </li>
        <li *ngIf="currentUser.role === 'SYSTEM ADMIN'">
          <a routerLink="/user-management" routerLinkActive="active">
            <i class="fas fa-users-cog"></i>
            <span>User Management</span>
          </a>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Topbar -->
      <div class="topbar">
        <div class="page-title">
          <h1>ERP Finance Module</h1>
          <span class="subtitle">Complete Financial Management</span>
        </div>
        <div class="user-actions">
          <div class="notification">
            <i class="fas fa-bell"></i>
            <span class="notification-badge">3</span>
          </div>
          
          <!-- Theme Toggle Button -->
          <div class="theme-toggle-wrapper" [attr.data-tooltip]="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <div class="theme-toggle" (click)="toggleTheme()">
              <div class="theme-toggle-slider">
                <i class="fas theme-toggle-icon" [class.fa-sun]="!isDarkMode" [class.fa-moon]="isDarkMode"></i>
              </div>
            </div>
          </div>
          
          <!-- User Dropdown Button -->
          <div class="user-dropdown" (click)="toggleDropdown()">
            <div class="user-profile">
              <div class="user-avatar">{{ currentUser.avatar }}</div>
              <div class="user-info">
                <h4>{{ currentUser.name }}</h4>
                <p>{{ currentUser.role }}</p>
              </div>
              <i class="fas fa-chevron-down dropdown-icon" [class.rotate]="showDropdown"></i>
            </div>
            
            <!-- Dropdown Menu -->
            <div class="dropdown-menu" *ngIf="showDropdown" (click)="$event.stopPropagation()">
              <div class="dropdown-header">
                <i class="fas fa-users"></i>
                <span>Switch User</span>
              </div>
              <div class="dropdown-divider"></div>
              <div 
                *ngFor="let user of users" 
                class="dropdown-item" 
                [class.active]="currentUser.username === user.username"
                (click)="switchUser(user)">
                <div class="user-item">
                  <div class="user-item-avatar">{{ user.avatar }}</div>
                  <div class="user-item-info">
                    <div class="user-item-name">{{ user.name }}</div>
                    <div class="user-item-role">{{ user.role }}</div>
                    <div class="user-item-permissions">{{ user.permissions }}</div>
                  </div>
                  <i class="fas fa-check" *ngIf="currentUser.username === user.username"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .user-dropdown {
      position: relative;
      cursor: pointer;
    }
    
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      transition: background 0.3s;
    }
    
    .user-dropdown:hover .user-profile {
      background: rgba(0, 0, 0, 0.05);
    }
    
    .dropdown-icon {
      font-size: 12px;
      color: var(--gray-600);
      transition: transform 0.3s;
      margin-left: 8px;
    }
    
    .dropdown-icon.rotate {
      transform: rotate(180deg);
    }
    
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      min-width: 320px;
      z-index: 1000;
      animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      color: var(--gray-800);
      font-weight: 600;
      font-size: 14px;
    }
    
    .dropdown-header i {
      color: var(--primary);
    }
    
    .dropdown-divider {
      height: 1px;
      background: #e0e0e0;
      margin: 0 10px;
    }
    
    .dropdown-item {
      padding: 12px 20px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .dropdown-item:hover {
      background: #f8f9fa;
    }
    
    .dropdown-item.active {
      background: #e8f4f8;
    }
    
    .dropdown-item:last-child {
      border-radius: 0 0 12px 12px;
    }
    
    .user-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .user-item-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--success));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .user-item-info {
      flex: 1;
    }
    
    .user-item-name {
      font-weight: 600;
      color: var(--gray-800);
      font-size: 14px;
      margin-bottom: 2px;
    }
    
    .user-item-role {
      color: var(--gray-600);
      font-size: 12px;
      margin-bottom: 4px;
    }
    
    .user-item-permissions {
      color: var(--gray-500);
      font-size: 11px;
      font-style: italic;
    }
    
    .dropdown-item i.fa-check {
      color: var(--success);
      font-size: 16px;
    }
  `]
})
export class AppComponent {
  showDropdown = false;
  isDarkMode = false;
  
  users: User[] = [
    {
      name: 'System Admin',
      role: 'SYSTEM ADMIN',
      username: 'sysadmin',
      password: 'sysadmin123',
      avatar: 'SA',
      permissions: 'Super Admin - All System Access'
    },
    {
      name: 'Accountant',
      role: 'ACCOUNTANT',
      username: 'admin',
      password: 'admin123',
      avatar: 'AC',
      permissions: 'Full Access - Create, Edit, Delete'
    },
    {
      name: 'Account Executive',
      role: 'ACCOUNT EXECUTIVE',
      username: 'viewer',
      password: 'viewer123',
      avatar: 'AE',
      permissions: 'View Only - Read Access'
    }
  ];
  
  currentUser: User = this.users[0];
  
  constructor(
    private http: HttpClient,
    public themeService: ThemeService
  ) {
    // Initialize with default user (Accountant) if no auth exists
    this.initializeAuth();
    
    // Subscribe to theme changes
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-dropdown')) {
        this.showDropdown = false;
      }
    });
  }
  
  initializeAuth() {
    const existingAuth = sessionStorage.getItem('authHeader');
    const existingUser = sessionStorage.getItem('currentUserIndex');
    
    if (existingAuth && existingUser) {
      // Restore previous user
      const userIndex = parseInt(existingUser);
      if (userIndex >= 0 && userIndex < this.users.length) {
        this.currentUser = this.users[userIndex];
      }
    } else {
      // Set default user (Accountant with full access)
      const defaultUser = this.users[0];
      this.currentUser = defaultUser;
      const authHeader = 'Basic ' + btoa(defaultUser.username + ':' + defaultUser.password);
      sessionStorage.setItem('authHeader', authHeader);
      sessionStorage.setItem('currentUserIndex', '0');
    }
  }
  
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }
  
  switchUser(user: User) {
    this.currentUser = user;
    this.showDropdown = false;
    
    // Find user index
    const userIndex = this.users.findIndex(u => u.username === user.username);
    
    // Authenticate with new user credentials
    const authHeader = 'Basic ' + btoa(user.username + ':' + user.password);
    
    // Store auth header and user index for future requests
    sessionStorage.setItem('authHeader', authHeader);
    sessionStorage.setItem('currentUserIndex', userIndex.toString());
    
    // Show notification
    alert(`Switched to ${user.name}\nRole: ${user.role}\nPermissions: ${user.permissions}`);
    
    // Reload page to apply new permissions
    window.location.reload();
  }
}
