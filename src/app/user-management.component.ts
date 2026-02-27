import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface User {
  id?: number;
  username: string;
  password?: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'SYSTEM_ADMIN' | 'ACCOUNTANT' | 'ACCOUNT_EXECUTIVE';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  avatar: string;
  department: string;
  notes: string;
  createdDate?: string;
  lastLogin?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-management-container">
      <div class="header">
        <h2>User Management</h2>
        <div class="header-actions">
          <button class="btn-primary" (click)="openCreateModal()">
            <i class="icon">➕</i> Add New User
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">👥</div>
          <div class="card-content">
            <h3>Total Users</h3>
            <p class="card-value">{{ users.length }}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">🟢</div>
          <div class="card-content">
            <h3>Active Users</h3>
            <p class="card-value">{{ getActiveUsersCount() }}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">👨‍💼</div>
          <div class="card-content">
            <h3>Admins</h3>
            <p class="card-value">{{ getAdminCount() }}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">👔</div>
          <div class="card-content">
            <h3>Accountants</h3>
            <p class="card-value">{{ getAccountantCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Filter by Role:</label>
          <select [(ngModel)]="filterRole" (change)="applyFilters()">
            <option value="">All Roles</option>
            <option value="SYSTEM_ADMIN">System Admin</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="ACCOUNT_EXECUTIVE">Account Executive</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Filter by Status:</label>
          <select [(ngModel)]="filterStatus" (change)="applyFilters()">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Search:</label>
          <input type="text" [(ngModel)]="searchText" (input)="applyFilters()" placeholder="Search by name or username...">
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Department</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers">
              <td><div class="avatar">{{ user.avatar || '👤' }}</div></td>
              <td>{{ user.username }}</td>
              <td>{{ user.fullName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone || '-' }}</td>
              <td><span class="role-badge" [class]="getRoleClass(user.role)">{{ getRoleLabel(user.role) }}</span></td>
              <td><span class="status-badge" [class]="getStatusClass(user.status)">{{ user.status }}</span></td>
              <td>{{ user.department || '-' }}</td>
              <td>{{ user.lastLogin ? (user.lastLogin | date:'MM/dd/yyyy HH:mm') : 'Never' }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" (click)="openEditModal(user)" title="Edit">✏️</button>
                  <button class="btn-icon" (click)="openPasswordModal(user)" title="Change Password">🔑</button>
                  <button class="btn-icon btn-danger" (click)="confirmDelete(user)" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredUsers.length === 0">
              <td colspan="10" class="no-data">No users found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Edit User' : 'Create New User' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-row">
                <div class="form-group">
                  <label>Username *</label>
                  <input type="text" [(ngModel)]="currentUser.username" name="username" required>
                </div>
                <div class="form-group" *ngIf="!isEditMode">
                  <label>Password *</label>
                  <input type="password" [(ngModel)]="currentUser.password" name="password" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Full Name *</label>
                  <input type="text" [(ngModel)]="currentUser.fullName" name="fullName" required>
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input type="email" [(ngModel)]="currentUser.email" name="email" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Phone</label>
                  <input type="text" [(ngModel)]="currentUser.phone" name="phone">
                </div>
                <div class="form-group">
                  <label>Department</label>
                  <input type="text" [(ngModel)]="currentUser.department" name="department">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Role *</label>
                  <select [(ngModel)]="currentUser.role" name="role" required>
                    <option value="SYSTEM_ADMIN">System Admin</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="ACCOUNT_EXECUTIVE">Account Executive</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Status *</label>
                  <select [(ngModel)]="currentUser.status" name="status" required>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="LOCKED">Locked</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Avatar Emoji</label>
                <input type="text" [(ngModel)]="currentUser.avatar" name="avatar" placeholder="e.g., 👤, 👨‍💼, 👩‍💼">
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea [(ngModel)]="currentUser.notes" name="notes" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="saveUser()">{{ isEditMode ? 'Update' : 'Create' }}</button>
          </div>
        </div>
      </div>

      <!-- Password Change Modal -->
      <div class="modal" *ngIf="showPasswordModal" (click)="closePasswordModal()">
        <div class="modal-content small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Change Password</h3>
            <button class="close-btn" (click)="closePasswordModal()">×</button>
          </div>
          <div class="modal-body">
            <p>Change password for: <strong>{{ selectedUser?.username }}</strong></p>
            <div class="form-group">
              <label>New Password *</label>
              <input type="password" [(ngModel)]="newPassword" placeholder="Enter new password">
            </div>
            <div class="form-group">
              <label>Confirm Password *</label>
              <input type="password" [(ngModel)]="confirmPassword" placeholder="Confirm new password">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closePasswordModal()">Cancel</button>
            <button class="btn-primary" (click)="changePassword()">Change Password</button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
        <div class="modal-content small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Confirm Delete</h3>
            <button class="close-btn" (click)="closeDeleteModal()">×</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete user: <strong>{{ selectedUser?.username }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeDeleteModal()">Cancel</button>
            <button class="btn-danger" (click)="deleteUser()">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container { padding: 20px; max-width: 100%; overflow-x: hidden; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header h2 { margin: 0; color: var(--gray-800); }
    .header-actions { display: flex; gap: 10px; }
    
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .summary-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 15px; }
    .card-icon { font-size: 40px; }
    .card-content h3 { margin: 0; font-size: 14px; color: var(--gray-600); }
    .card-value { margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: var(--gray-800); }
    
    .filters { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 180px; }
    .filter-group label { font-weight: 600; color: var(--gray-800); font-size: 14px; }
    .filter-group select, .filter-group input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; width: 100%; }
    
    .table-container { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow-x: auto; width: 100%; }
    .users-table { width: 100%; border-collapse: collapse; min-width: 1200px; }
    .users-table thead { background: #34495e; color: white; }
    .users-table th { padding: 12px 10px; text-align: left; font-weight: 600; white-space: nowrap; font-size: 14px; }
    .users-table td { padding: 10px; border-bottom: 1px solid #ecf0f1; font-size: 13px; }
    .users-table tbody tr:hover { background: #f8f9fa; }
    .no-data { text-align: center; padding: 40px; color: var(--gray-500); }
    
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #3498db; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    
    .role-badge, .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .role-system-admin { background: #e74c3c; color: white; }
    .role-accountant { background: #3498db; color: white; }
    .role-executive { background: #95a5a6; color: white; }
    .status-active { background: #27ae60; color: white; }
    .status-inactive { background: #f39c12; color: white; }
    .status-locked { background: #e74c3c; color: white; }
    
    .action-buttons { display: flex; gap: 5px; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 18px; padding: 5px; transition: transform 0.2s; }
    .btn-icon:hover { transform: scale(1.2); }
    
    .btn-primary, .btn-secondary, .btn-danger { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-primary { background: #3498db; color: white; }
    .btn-primary:hover { background: #2980b9; }
    .btn-secondary { background: #95a5a6; color: white; }
    .btn-secondary:hover { background: #7f8c8d; }
    .btn-danger { background: #e74c3c; color: white; }
    .btn-danger:hover { background: #c0392b; }
    .icon { margin-right: 5px; }
    
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 12px; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto; }
    .modal-content.small { max-width: 500px; }
    .modal-header { padding: 20px; border-bottom: 1px solid #ecf0f1; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; color: var(--gray-800); }
    .close-btn { background: none; border: none; font-size: 28px; cursor: pointer; color: var(--gray-500); }
    .close-btn:hover { color: var(--gray-800); }
    .modal-body { padding: 20px; }
    .modal-footer { padding: 20px; border-top: 1px solid #ecf0f1; display: flex; justify-content: flex-end; gap: 10px; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; }
    .form-group label { font-weight: 600; color: var(--gray-800); }
    .form-group input, .form-group select, .form-group textarea { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); }
    
    .warning-text { color: var(--danger); font-weight: 600; margin-top: 10px; }
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  
  showModal = false;
  showPasswordModal = false;
  showDeleteModal = false;
  isEditMode = false;
  
  currentUser: User = this.getEmptyUser();
  selectedUser: User | null = null;
  
  newPassword = '';
  confirmPassword = '';
  
  filterRole = '';
  filterStatus = '';
  searchText = '';
  
  private apiUrl = 'http://localhost:8080/api';
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.loadUsers();
  }
  
  loadUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users`).subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        alert('Error loading users. Please check your permissions.');
      }
    });
  }
  
  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      const matchesRole = !this.filterRole || user.role === this.filterRole;
      const matchesStatus = !this.filterStatus || user.status === this.filterStatus;
      const matchesSearch = !this.searchText || 
        user.username.toLowerCase().includes(this.searchText.toLowerCase()) ||
        user.fullName.toLowerCase().includes(this.searchText.toLowerCase());
      return matchesRole && matchesStatus && matchesSearch;
    });
  }
  
  getActiveUsersCount(): number {
    return this.users.filter(u => u.status === 'ACTIVE').length;
  }
  
  getAdminCount(): number {
    return this.users.filter(u => u.role === 'SYSTEM_ADMIN').length;
  }
  
  getAccountantCount(): number {
    return this.users.filter(u => u.role === 'ACCOUNTANT').length;
  }
  
  getRoleClass(role: string): string {
    const map: any = {
      'SYSTEM_ADMIN': 'role-system-admin',
      'ACCOUNTANT': 'role-accountant',
      'ACCOUNT_EXECUTIVE': 'role-executive'
    };
    return map[role] || '';
  }
  
  getRoleLabel(role: string): string {
    const map: any = {
      'SYSTEM_ADMIN': 'System Admin',
      'ACCOUNTANT': 'Accountant',
      'ACCOUNT_EXECUTIVE': 'Account Executive'
    };
    return map[role] || role;
  }
  
  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }
  
  openCreateModal() {
    this.isEditMode = false;
    this.currentUser = this.getEmptyUser();
    this.showModal = true;
  }
  
  openEditModal(user: User) {
    this.isEditMode = true;
    this.currentUser = { ...user };
    this.showModal = true;
  }
  
  closeModal() {
    this.showModal = false;
    this.currentUser = this.getEmptyUser();
  }
  
  saveUser() {
    const url = this.isEditMode 
      ? `${this.apiUrl}/users/${this.currentUser.id}`
      : `${this.apiUrl}/users`;
    
    const method = this.isEditMode ? 'put' : 'post';
    
    // When editing, remove password field as we use separate change password endpoint
    const userToSave = this.isEditMode 
      ? { ...this.currentUser, password: undefined }
      : this.currentUser;
    
    this.http.request(method, url, { body: userToSave }).subscribe({
      next: () => {
        this.loadUsers();
        this.closeModal();
        alert(this.isEditMode ? 'User updated successfully!' : 'User created successfully!');
      },
      error: (error) => {
        console.error('Error saving user:', error);
        let errorMsg = 'Username or email may already exist.';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMsg = error.error;
          } else if (error.error.message) {
            errorMsg = error.error.message;
          } else if (error.message) {
            errorMsg = error.message;
          }
        }
        
        alert(`Error saving user: ${errorMsg}`);
      }
    });
  }
  
  openPasswordModal(user: User) {
    this.selectedUser = user;
    this.newPassword = '';
    this.confirmPassword = '';
    this.showPasswordModal = true;
  }
  
  closePasswordModal() {
    this.showPasswordModal = false;
    this.selectedUser = null;
    this.newPassword = '';
    this.confirmPassword = '';
  }
  
  changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (this.newPassword.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }
    
    this.http.post(`${this.apiUrl}/users/${this.selectedUser!.id}/change-password`, 
      { newPassword: this.newPassword }).subscribe({
      next: () => {
        this.closePasswordModal();
        alert('Password changed successfully!');
      },
      error: (error) => {
        console.error('Error changing password:', error);
        alert('Error changing password.');
      }
    });
  }
  
  confirmDelete(user: User) {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }
  
  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }
  
  deleteUser() {
    this.http.delete(`${this.apiUrl}/users/${this.selectedUser!.id}`).subscribe({
      next: () => {
        this.loadUsers();
        this.closeDeleteModal();
        alert('User deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        alert('Error deleting user.');
      }
    });
  }
  
  getEmptyUser(): User {
    return {
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'ACCOUNT_EXECUTIVE',
      status: 'ACTIVE',
      avatar: '👤',
      department: '',
      notes: ''
    };
  }
}
