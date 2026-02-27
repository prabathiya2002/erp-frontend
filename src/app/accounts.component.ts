import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsService, JournalsService } from './services';
import { AuthService } from './auth.service';
import * as XLSX from 'xlsx';

@Component({
  standalone: true,
  selector: 'app-accounts',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1><i class="fas fa-book"></i> Chart of Accounts</h1>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAddModal()" *ngIf="canEdit">
            <i class="fas fa-plus"></i> Add Account
          </button>
          <button class="btn btn-success" (click)="exportAccounts()">
            <i class="fas fa-file-export"></i> Export
          </button>
          <button class="btn btn-info" (click)="loadSampleData()" *ngIf="canEdit">
            <i class="fas fa-download"></i> Load Sample
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="filters-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input type="text" [(ngModel)]="searchTerm" (input)="filterAccounts()" placeholder="Search accounts..." class="form-control" />
      </div>
      <select [(ngModel)]="filterType" (change)="filterAccounts()" class="form-control filter-select">
        <option value="">All Types</option>
        <option value="ASSET">Asset</option>
        <option value="LIABILITY">Liability</option>
        <option value="EQUITY">Equity</option>
        <option value="REVENUE">Revenue</option>
        <option value="EXPENSE">Expense</option>
      </select>
      <select [(ngModel)]="filterStatus" (change)="filterAccounts()" class="form-control filter-select">
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <div class="tabs">
        <button [class.active]="activeTab === 'list'" (click)="activeTab = 'list'" class="tab">
          Accounts List
        </button>
        <button [class.active]="activeTab === 'hierarchy'" (click)="activeTab = 'hierarchy'" class="tab">
          Account Hierarchy
        </button>
        <button [class.active]="activeTab === 'balances'" (click)="activeTab = 'balances'" class="tab">
          Account Balances
        </button>
      </div>
    </div>

    <!-- Accounts List Tab -->
    <div *ngIf="activeTab === 'list'" class="tab-content">
      <div class="table-container">
        <table class="accounts-table">
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th>Sub-Type</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let account of filteredAccounts">
              <td><strong>{{account.code}}</strong></td>
              <td>{{account.name}}</td>
              <td>
                <span [class]="'badge badge-' + getTypeBadge(account.type)">
                  {{account.type}}
                </span>
              </td>
              <td>{{account.subType || '-'}}</td>
              <td><strong [style.color]="'#28a745'">&#36;{{account.balance | number:'1.2-2'}}</strong></td>
              <td>
                <span [class]="'status-badge ' + (account.status === 'Active' ? 'status-active' : 'status-inactive')">
                  {{account.status || 'Active'}}
                </span>
              </td>
              <td>
                <button class="action-btn edit-btn" (click)="editAccount(account)" title="Edit" *ngIf="canEdit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn entry-btn" (click)="openEntryModal(account)" title="Add Entry" *ngIf="canEdit">
                  <i class="fas fa-plus-circle"></i>
                </button>
                <button class="action-btn delete-btn" (click)="deleteAccount(account.id)" title="Delete" *ngIf="canEdit">
                  <i class="fas fa-ban"></i>
                </button>
                <button class="action-btn view-btn" (click)="viewAccount(account)" title="View Details" *ngIf="!canEdit">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredAccounts.length === 0">
              <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                No accounts found. Click "Add Account" to create one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Account Hierarchy Tab -->
    <div *ngIf="activeTab === 'hierarchy'" class="tab-content">
      <div class="hierarchy-container">
        <div *ngFor="let group of accountGroups" class="hierarchy-group">
          <h3 class="hierarchy-title">
            <i [class]="getTypeIcon(group.type)"></i>
            {{group.title}}
          </h3>
          <div class="hierarchy-items">
            <div *ngFor="let account of group.accounts" class="hierarchy-item">
              <div class="account-code">{{account.code}}</div>
              <div class="account-info">
                <div class="account-name">{{account.name}}</div>
                <div class="account-balance">&#36;{{account.balance | number:'1.2-2'}}</div>
              </div>
            </div>
            <div *ngIf="group.accounts.length === 0" class="no-accounts">
              No {{group.title.toLowerCase()}} yet
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Account Balances Tab -->
    <div *ngIf="activeTab === 'balances'" class="tab-content">
      <div class="balances-summary">
        <div class="balance-card">
          <h4>Total Assets</h4>
          <div class="balance-value">&#36;{{getTotalByType('ASSET') | number:'1.2-2'}}</div>
        </div>
        <div class="balance-card">
          <h4>Total Liabilities</h4>
          <div class="balance-value">&#36;{{getTotalByType('LIABILITY') | number:'1.2-2'}}</div>
        </div>
        <div class="balance-card">
          <h4>Total Equity</h4>
          <div class="balance-value">&#36;{{getTotalByType('EQUITY') | number:'1.2-2'}}</div>
        </div>
        <div class="balance-card">
          <h4>Total Revenue</h4>
          <div class="balance-value">&#36;{{getTotalByType('REVENUE') | number:'1.2-2'}}</div>
        </div>
        <div class="balance-card">
          <h4>Total Expenses</h4>
          <div class="balance-value">&#36;{{getTotalByType('EXPENSE') | number:'1.2-2'}}</div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas fa-plus-circle"></i>
            {{editingAccount ? 'Edit Account' : 'Add New Account'}}
          </h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form (ngSubmit)="saveAccount()" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label>Account Code <span class="required">*</span></label>
              <input [(ngModel)]="formData.code" name="code" class="form-control" placeholder="e.g., 1000" required />
            </div>
            <div class="form-group">
              <label>Account Name <span class="required">*</span></label>
              <input [(ngModel)]="formData.name" name="name" class="form-control" placeholder="e.g., Cash" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Account Type <span class="required">*</span></label>
              <select [(ngModel)]="formData.type" name="type" (change)="onTypeChange()" class="form-control">
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div class="form-group">
              <label>Sub-Type</label>
              <select [(ngModel)]="formData.subType" name="subType" class="form-control">
                <option value="">Select sub-type</option>
                <option *ngFor="let subType of getSubTypeOptions()" [value]="subType">{{subType}}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Status</label>
              <select [(ngModel)]="formData.status" name="status" class="form-control">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div class="form-group" *ngIf="editingAccount">
              <label>Balance</label>
              <input [(ngModel)]="formData.balance" name="balance" type="number" step="0.01" class="form-control" readonly />
            </div>
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i>
              {{editingAccount ? 'Update' : 'Create'}} Account
            </button>
            <button type="button" class="btn btn-secondary" (click)="closeModal()">
              <i class="fas fa-times"></i> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Entry Modal -->
    <div *ngIf="showEntryModal" class="modal-overlay" (click)="closeEntryModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas fa-file-invoice-dollar"></i>
            Add Entry for Account: {{selectedAccount?.code}} - {{selectedAccount?.name}}
          </h3>
          <button class="close-btn" (click)="closeEntryModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form (ngSubmit)="createJournalEntry()" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label>Date <span class="required">*</span></label>
              <input [(ngModel)]="entryData.date" name="date" type="date" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Period <span class="required">*</span></label>
              <input [(ngModel)]="entryData.period" name="period" class="form-control" placeholder="2026-01" required />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Description</label>
              <input [(ngModel)]="entryData.description" name="description" class="form-control" placeholder="Transaction description" />
            </div>
          </div>

          <h4 style="margin: 20px 0 10px; color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
            <i class="fas fa-list"></i> Transaction Lines
          </h4>

          <!-- Main Account Line -->
          <div class="entry-line-card main-line">
            <div class="line-header">
              <strong>{{selectedAccount?.code}} - {{selectedAccount?.name}}</strong>
              <span class="badge badge-info">Main Account</span>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Debit Amount</label>
                <input [(ngModel)]="entryData.mainDebit" name="mainDebit" type="number" step="0.01" 
                       (input)="onMainAmountChange('debit')" class="form-control" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label>Credit Amount</label>
                <input [(ngModel)]="entryData.mainCredit" name="mainCredit" type="number" step="0.01" 
                       (input)="onMainAmountChange('credit')" class="form-control" placeholder="0.00" />
              </div>
            </div>
          </div>

          <!-- Offset Account Line -->
          <div class="entry-line-card offset-line">
            <div class="line-header">
              <strong>Offset Account</strong>
              <span class="badge badge-warning">Required for Balance</span>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Select Offset Account <span class="required">*</span></label>
                <select [(ngModel)]="entryData.offsetAccountId" name="offsetAccountId" 
                        class="form-control" required>
                  <option value="">-- Select Account --</option>
                  <option *ngFor="let acc of accounts" [value]="acc.id">
                    {{acc.code}} - {{acc.name}} ({{acc.type}})
                  </option>
                </select>
                <small style="color: #666; font-size: 12px;">Choose account to balance this entry</small>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Debit Amount</label>
                <input [(ngModel)]="entryData.offsetDebit" name="offsetDebit" type="number" step="0.01" 
                       class="form-control" placeholder="0.00" readonly />
              </div>
              <div class="form-group">
                <label>Credit Amount</label>
                <input [(ngModel)]="entryData.offsetCredit" name="offsetCredit" type="number" step="0.01" 
                       class="form-control" placeholder="0.00" readonly />
              </div>
            </div>
          </div>

          <!-- Totals Display -->
          <div class="totals-display">
            <div class="total-item">
              <span>Total Debit:</span>
              <strong style="color: #28a745;">&#36;{{getTotalDebit() | number:'1.2-2'}}</strong>
            </div>
            <div class="total-item">
              <span>Total Credit:</span>
              <strong style="color: #dc3545;">&#36;{{getTotalCredit() | number:'1.2-2'}}</strong>
            </div>
            <div class="total-item balance-status" [class.balanced]="isBalanced()" [class.unbalanced]="!isBalanced()">
              <i [class]="isBalanced() ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'"></i>
              <span>{{isBalanced() ? 'Balanced' : 'Unbalanced'}}</span>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn btn-success" [disabled]="!isBalanced()">
              <i class="fas fa-save"></i>
              Create & Post Entry
            </button>
            <button type="button" class="btn btn-secondary" (click)="closeEntryModal()">
              <i class="fas fa-times"></i> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      margin: -20px -20px 30px -20px;
      border-radius: 0 0 15px 15px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }
    .header-actions .btn {
      padding: 10px 20px;
      font-weight: 600;
    }
    
    .filters-section {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
      align-items: center;
    }
    .search-box {
      flex: 1;
      position: relative;
    }
    .search-box i {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
    }
    .search-box input {
      padding-left: 45px;
      width: 100%;
    }
    .filter-select {
      min-width: 180px;
    }
    
    .tabs-container {
      border-bottom: 2px solid #e0e0e0;
      margin-bottom: 25px;
    }
    .tabs {
      display: flex;
      gap: 0;
    }
    .tab {
      padding: 15px 30px;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      color: #666;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .tab:hover {
      color: #667eea;
      background: #f8f9fa;
    }
    .tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    
    .tab-content {
      animation: fadeIn 0.3s;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .table-container {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .accounts-table {
      width: 100%;
      border-collapse: collapse;
    }
    .accounts-table th {
      background: #f8f9fa;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e0e0e0;
    }
    .accounts-table td {
      padding: 15px;
      border-bottom: 1px solid #f0f0f0;
    }
    .accounts-table tr:hover {
      background: #f8f9fa;
    }
    
    .badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    
    .status-badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-active {
      background: #d4edda;
      color: #155724;
    }
    .status-inactive {
      background: #f8d7da;
      color: #721c24;
    }
    
    .action-btn {
      padding: 8px 12px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-right: 5px;
      transition: all 0.2s;
    }
    .edit-btn {
      background: #3b82f6;
      color: white;
    }
    .edit-btn:hover {
      background: #2563eb;
    }
    .entry-btn {
      background: #10b981;
      color: white;
    }
    .entry-btn:hover {
      background: #059669;
    }
    .delete-btn {
      background: #6c757d;
      color: white;
    }
    .delete-btn:hover {
      background: #5a6268;
    }
    .view-btn {
      background: #17a2b8;
      color: white;
    }
    .view-btn:hover {
      background: #138496;
    }
    
    .hierarchy-container {
      display: grid;
      gap: 25px;
    }
    .hierarchy-group {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .hierarchy-title {
      color: #333;
      font-size: 18px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }
    .hierarchy-items {
      display: grid;
      gap: 12px;
    }
    .hierarchy-item {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      transition: all 0.2s;
    }
    .hierarchy-item:hover {
      background: #e9ecef;
      transform: translateX(5px);
    }
    .account-code {
      font-weight: 700;
      color: #667eea;
      min-width: 80px;
      font-size: 16px;
    }
    .account-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .account-name {
      font-weight: 500;
      color: #333;
    }
    .account-balance {
      font-weight: 700;
      color: #28a745;
      font-size: 16px;
    }
    .no-accounts {
      text-align: center;
      padding: 20px;
      color: #999;
      font-style: italic;
    }
    
    .balances-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .balance-card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    .balance-card h4 {
      color: #666;
      margin: 0 0 15px 0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .balance-value {
      font-size: 32px;
      font-weight: 700;
      color: #28a745;
    }
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s;
    }
    .modal-content {
      background: white;
      border-radius: 15px;
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: slideUp 0.3s;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(50px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-header {
      padding: 20px 25px;
      border-bottom: 2px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px 15px 0 0;
    }
    .modal-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .close-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 18px;
    }
    .close-btn:hover {
      background: rgba(255,255,255,0.3);
    }
    .modal-form {
      padding: 25px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }
    .required {
      color: #dc3545;
    }
    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 25px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
    }
    
    .entry-line-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
      border-left: 4px solid #667eea;
    }
    .main-line {
      border-left-color: #10b981;
      background: #f0fdf4;
    }
    .offset-line {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }
    .line-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    .totals-display {
      display: flex;
      gap: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 20px 0;
      align-items: center;
    }
    .total-item {
      flex: 1;
      text-align: center;
      padding: 10px;
      background: white;
      border-radius: 5px;
    }
    .total-item span {
      display: block;
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .total-item strong {
      font-size: 20px;
    }
    .balance-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 700;
      font-size: 16px;
    }
    .balance-status.balanced {
      color: #10b981;
    }
    .balance-status.unbalanced {
      color: #dc3545;
    }
  `]
})
export class AccountsComponent implements OnInit {
  activeTab = 'list';
  accounts: any[] = [];
  filteredAccounts: any[] = [];
  searchTerm = '';
  filterType = '';
  filterStatus = '';
  showModal = false;
  editingAccount: any = null;
  showEntryModal = false;
  selectedAccount: any = null;
  canEdit = false;
  currentUser = '';
  
  formData: any = {
    code: '',
    name: '',
    type: 'ASSET',
    subType: '',
    balance: 0,
    status: 'Active'
  };

  entryData: any = {
    date: new Date().toISOString().split('T')[0],
    period: '2026-01',
    description: '',
    mainDebit: 0,
    mainCredit: 0,
    offsetAccountId: '',
    offsetDebit: 0,
    offsetCredit: 0
  };

  subTypeOptions: { [key: string]: string[] } = {
    'ASSET': ['Current Asset', 'Fixed Asset', 'Intangible Asset'],
    'LIABILITY': ['Current Liability', 'Long-term Liability'],
    'EQUITY': [],
    'REVENUE': [],
    'EXPENSE': []
  };

  accountGroups: any[] = [];
  
  constructor(
    private api: AccountsService, 
    private journalApi: JournalsService,
    private authService: AuthService
  ) {}
  
  ngOnInit() {
    this.loadUserInfo();
    this.load();
  }

  loadUserInfo() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.canEdit = user.canEdit;
        this.currentUser = user.username;
      },
      error: () => {
        this.canEdit = false;
        this.currentUser = 'Guest';
      }
    });
  }
  
  load() {
    this.api.list().subscribe((data: any) => {
      this.accounts = data;
      this.filteredAccounts = data;
      this.updateHierarchy();
    });
  }

  viewAccount(account: any) {
    alert(`Account Details:\n\nCode: ${account.code}\nName: ${account.name}\nType: ${account.type}\nBalance: $${account.balance.toFixed(2)}\nStatus: ${account.status}`);
  }

  filterAccounts() {
    this.filteredAccounts = this.accounts.filter(account => {
      const matchesSearch = !this.searchTerm || 
        account.code.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesType = !this.filterType || account.type === this.filterType;
      const matchesStatus = !this.filterStatus || account.status === this.filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  updateHierarchy() {
    this.accountGroups = [
      { title: 'Asset Accounts', type: 'ASSET', accounts: this.accounts.filter(a => a.type === 'ASSET') },
      { title: 'Liability Accounts', type: 'LIABILITY', accounts: this.accounts.filter(a => a.type === 'LIABILITY') },
      { title: 'Equity Accounts', type: 'EQUITY', accounts: this.accounts.filter(a => a.type === 'EQUITY') },
      { title: 'Revenue Accounts', type: 'REVENUE', accounts: this.accounts.filter(a => a.type === 'REVENUE') },
      { title: 'Expense Accounts', type: 'EXPENSE', accounts: this.accounts.filter(a => a.type === 'EXPENSE') }
    ];
  }

  getTotalByType(type: string): number {
    return this.accounts
      .filter(a => a.type === type)
      .reduce((sum, a) => sum + (a.balance || 0), 0);
  }

  getTypeBadge(type: string): string {
    const map: any = {
      'ASSET': 'success',
      'LIABILITY': 'warning',
      'EQUITY': 'info',
      'REVENUE': 'success',
      'EXPENSE': 'danger'
    };
    return map[type] || 'info';
  }

  getTypeIcon(type: string): string {
    const map: any = {
      'ASSET': 'fas fa-coins',
      'LIABILITY': 'fas fa-file-invoice-dollar',
      'EQUITY': 'fas fa-balance-scale',
      'REVENUE': 'fas fa-chart-line',
      'EXPENSE': 'fas fa-receipt'
    };
    return map[type] || 'fas fa-folder';
  }

  openAddModal() {
    this.editingAccount = null;
    this.formData = {
      code: '',
      name: '',
      type: 'ASSET',
      subType: '',
      balance: 0,
      status: 'Active'
    };
    this.showModal = true;
  }

  editAccount(account: any) {
    this.editingAccount = account;
    this.formData = { ...account };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingAccount = null;
  }

  onTypeChange() {
    this.formData.subType = '';
  }

  getSubTypeOptions(): string[] {
    return this.subTypeOptions[this.formData.type] || [];
  }

  saveAccount() {
    if (!this.formData.code || !this.formData.name) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.editingAccount) {
      // Update existing account
      this.api.update(this.editingAccount.id, this.formData).subscribe({
        next: () => {
          alert('Account updated successfully!');
          this.closeModal();
          this.load();
        },
        error: () => alert('Error updating account')
      });
    } else {
      // Create new account
      this.api.create(this.formData).subscribe({
        next: () => {
          alert('Account created successfully!');
          this.closeModal();
          this.load();
        },
        error: () => alert('Error creating account. Account code may already exist.')
      });
    }
  }

  deleteAccount(id: number) {
    if (!confirm('Are you sure you want to delete this account?')) return;
    
    this.api.delete(id).subscribe({
      next: () => {
        alert('Account deleted successfully!');
        this.load();
      },
      error: () => alert('Error deleting account. It may be used in journal entries.')
    });
  }

  loadSampleData() {
    const sampleAccounts = [
      { code: '1000', name: 'Cash', type: 'ASSET', subType: 'Current Asset', status: 'Active' },
      { code: '1100', name: 'Accounts Receivable', type: 'ASSET', subType: 'Current Asset', status: 'Active' },
      { code: '1200', name: 'Inventory', type: 'ASSET', subType: 'Current Asset', status: 'Active' },
      { code: '1500', name: 'Equipment', type: 'ASSET', subType: 'Fixed Asset', status: 'Active' },
      { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'Current Liability', status: 'Active' },
      { code: '2500', name: 'Loans Payable', type: 'LIABILITY', subType: 'Long-term Liability', status: 'Active' },
      { code: '3000', name: 'Common Stock', type: 'EQUITY', subType: '', status: 'Active' },
      { code: '3100', name: 'Retained Earnings', type: 'EQUITY', subType: '', status: 'Active' },
      { code: '4000', name: 'Sales Revenue', type: 'REVENUE', subType: '', status: 'Active' },
      { code: '4100', name: 'Service Revenue', type: 'REVENUE', subType: '', status: 'Active' },
      { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', subType: '', status: 'Active' },
      { code: '6000', name: 'Salaries Expense', type: 'EXPENSE', subType: '', status: 'Active' },
      { code: '6100', name: 'Rent Expense', type: 'EXPENSE', subType: '', status: 'Active' },
      { code: '6200', name: 'Utilities Expense', type: 'EXPENSE', subType: '', status: 'Active' }
    ];

    let created = 0;
    sampleAccounts.forEach(account => {
      this.api.create(account).subscribe({
        next: () => {
          created++;
          if (created === sampleAccounts.length) {
            alert('Sample data loaded successfully!');
            this.load();
          }
        },
        error: () => {} // Ignore duplicates
      });
    });
  }

  openEntryModal(account: any) {
    this.selectedAccount = account;
    this.entryData = {
      date: new Date().toISOString().split('T')[0],
      period: new Date().toISOString().substring(0, 7),
      description: `Entry for ${account.name}`,
      mainDebit: 0,
      mainCredit: 0,
      offsetAccountId: '',
      offsetDebit: 0,
      offsetCredit: 0
    };
    this.showEntryModal = true;
  }

  closeEntryModal() {
    this.showEntryModal = false;
    this.selectedAccount = null;
  }

  onMainAmountChange(type: 'debit' | 'credit') {
    if (type === 'debit') {
      // If entering debit on main account, offset should be credit
      this.entryData.mainCredit = 0;
      this.entryData.offsetDebit = 0;
      this.entryData.offsetCredit = this.entryData.mainDebit;
    } else {
      // If entering credit on main account, offset should be debit
      this.entryData.mainDebit = 0;
      this.entryData.offsetCredit = 0;
      this.entryData.offsetDebit = this.entryData.mainCredit;
    }
  }

  getTotalDebit(): number {
    return (parseFloat(this.entryData.mainDebit) || 0) + (parseFloat(this.entryData.offsetDebit) || 0);
  }

  getTotalCredit(): number {
    return (parseFloat(this.entryData.mainCredit) || 0) + (parseFloat(this.entryData.offsetCredit) || 0);
  }

  isBalanced(): boolean {
    const totalDebit = this.getTotalDebit();
    const totalCredit = this.getTotalCredit();
    return totalDebit > 0 && totalCredit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;
  }

  createJournalEntry() {
    if (!this.isBalanced()) {
      alert('Entry must be balanced (Total Debit = Total Credit)');
      return;
    }

    if (!this.entryData.offsetAccountId) {
      alert('Please enter an offset account ID');
      return;
    }

    // Create journal entry with two lines
    const journalEntry = {
      date: this.entryData.date,
      period: this.entryData.period,
      status: 'DRAFT',
      lines: [
        {
          accountId: this.selectedAccount.id,
          debit: parseFloat(this.entryData.mainDebit) || 0,
          credit: parseFloat(this.entryData.mainCredit) || 0,
          description: this.entryData.description
        },
        {
          accountId: parseInt(this.entryData.offsetAccountId),
          debit: parseFloat(this.entryData.offsetDebit) || 0,
          credit: parseFloat(this.entryData.offsetCredit) || 0,
          description: this.entryData.description
        }
      ]
    };

    // Validate account IDs before creating journal
    const mainAccountExists = this.accounts.find(a => a.id === this.selectedAccount.id);
    const offsetAccountExists = this.accounts.find(a => a.id === parseInt(this.entryData.offsetAccountId));
    
    if (!mainAccountExists || !offsetAccountExists) {
      alert('Error: One or both accounts not found in database. Please reload the page and try again.');
      return;
    }

    // Create the journal entry
    this.journalApi.create(journalEntry).subscribe({
      next: (response: any) => {
        console.log('Journal created:', response);
        
        // Approve and post automatically
        this.journalApi.approve(response.id).subscribe({
          next: () => {
            console.log('Journal approved:', response.id);
            
            this.journalApi.post(response.id).subscribe({
              next: () => {
                console.log('Journal posted:', response.id);
                alert(`Entry created and posted successfully! Account balance updated.\n\nJournal ID: ${response.id}`);
                this.closeEntryModal();
                this.load(); // Refresh to show updated balance
              },
              error: (err) => {
                console.error('Error posting journal:', err);
                alert(`Entry created and approved but posting failed.\nJournal ID: ${response.id}\n\nError: ${err.error?.message || err.message || 'Unknown error'}`);
              }
            });
          },
          error: (err) => {
            console.error('Error approving journal:', err);
            alert(`Entry created but approval failed.\nJournal ID: ${response.id}\n\nError: ${err.error?.message || err.message || 'Unknown error'}\n\nPlease check the backend console for details.`);
          }
        });
      },
      error: (err) => {
        console.error('Error creating entry:', err);
        alert(`Error creating journal entry.\n\nError: ${err.error?.message || err.message || 'Unknown error'}`);
      }
    });
  }

  exportAccounts() {
    if (!this.filteredAccounts || this.filteredAccounts.length === 0) {
      alert('No accounts to export. Please add accounts first.');
      return;
    }

    // Prepare data for export
    const exportData = this.filteredAccounts.map(account => ({
      'Account Code': account.code,
      'Account Name': account.name,
      'Type': account.type,
      'Sub Type': account.subType || '',
      'Balance': account.balance || 0,
      'Status': account.status,
      'Parent Account': account.parentId ? this.getAccountName(account.parentId) : ''
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Account Code
      { wch: 30 }, // Account Name
      { wch: 12 }, // Type
      { wch: 20 }, // Sub Type
      { wch: 15 }, // Balance
      { wch: 10 }, // Status
      { wch: 30 }  // Parent Account
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chart of Accounts');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `Chart_of_Accounts_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  }

  getAccountName(id: number): string {
    const account = this.accounts.find(a => a.id === id);
    return account ? `${account.code} - ${account.name}` : '';
  }
}
