import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface UserInfo {
  username: string;
  roles: string[];
  canEdit: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize with default credentials if none exist
    if (!sessionStorage.getItem('authHeader')) {
      const defaultAuth = 'Basic ' + btoa('admin:admin123');
      sessionStorage.setItem('authHeader', defaultAuth);
    }
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.http.get<UserInfo>(`${this.apiUrl}/me`).subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: () => this.currentUserSubject.next(null)
    });
  }

  getCurrentUser(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.apiUrl}/me`).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  canEdit(): boolean {
    const user = this.currentUserSubject.value;
    return user?.canEdit || false;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.roles?.includes('ROLE_ADMIN') || false;
  }

  getUsername(): string {
    const user = this.currentUserSubject.value;
    return user?.username || 'Guest';
  }
}
