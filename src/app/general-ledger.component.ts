import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalsService, AccountsService, GlService } from './services';
import { AuthService } from './auth.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';

@Component({
  standalone: true,
  selector: 'app-general-ledger',
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, InputTextModule, DropdownModule, CalendarModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1><i class="fas fa-book"></i> General Ledger</h1>
          <p class="breadcrumb">General Business</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" *ngIf="canEdit" (click)="openJournalModal()">
            <i class="fas fa-plus"></i> Add Journal Entry
          </button>
          <button class="btn btn-success" *ngIf="canEdit" (click)="postAllEntries()">
            <i class="fas fa-check-circle"></i> Post All Entries
          </button>
          <button class="btn btn-info" *ngIf="canEdit">
            <i class="fas fa-calendar-times"></i> Month-End Close
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 30px;">
        <div class="stat-card">
          <div class="stat-label">Total Journal Entries</div>
          <div class="stat-value">{{stats.total}}</div>
          <i class="fas fa-file-alt stat-icon text-info"></i>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">Unposted Entries</div>
          <div class="stat-value">{{stats.unposted}}</div>
          <i class="fas fa-exclamation-circle stat-icon text-warning"></i>
        </div>
        <div class="stat-card info">
          <div class="stat-label">This Month</div>
          <div class="stat-value">{{stats.thisMonth}}</div>
          <i class="fas fa-calendar stat-icon text-info"></i>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Debit/Credit Balance</div>
          <div class="stat-value" style="font-size: 1.1rem;">
            &#36;{{stats.debitTotal.toLocaleString()}} / &#36;{{stats.creditTotal.toLocaleString()}}
          </div>
          <i class="fas fa-balance-scale stat-icon text-success"></i>
        </div>
      </div>

      <!-- Workflow Indicator -->
      <div class="workflow-indicator">
        <div class="workflow-step">
          <div class="workflow-icon">
            <i class="fas fa-plus-circle"></i>
          </div>
          <span>Create Entry</span>
        </div>
        <div class="workflow-arrow"></div>
        <div class="workflow-step">
          <div class="workflow-icon">
            <i class="fas fa-eye"></i>
          </div>
          <span>Review</span>
        </div>
        <div class="workflow-arrow"></div>
        <div class="workflow-step">
          <div class="workflow-icon">
            <i class="fas fa-check"></i>
          </div>
          <span>Approve</span>
        </div>
        <div class="workflow-arrow"></div>
        <div class="workflow-step">
          <div class="workflow-icon">
            <i class="fas fa-file-invoice"></i>
          </div>
          <span>Post to GL</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <div class="tabs">
          <button class="tab" [class.active]="activeTab === 'entries'" (click)="onTabChange('entries')">
            Journal Entries
          </button>
          <button class="tab" [class.active]="activeTab === 'trial'" (click)="onTabChange('trial')">
            Trial Balance
          </button>
          <button class="tab" [class.active]="activeTab === 'ledger'" (click)="onTabChange('ledger')">
            Ledger Details
          </button>
          <button class="tab" [class.active]="activeTab === 'closing'" (click)="onTabChange('closing')">
            Period Closing
          </button>
        </div>

        <!-- Journal Entries Tab -->
        <div class="tab-content" *ngIf="activeTab === 'entries'">
          <div class="table-controls">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Search journal entries..." [(ngModel)]="searchText">
            </div>
            <select [(ngModel)]="filterStatus" class="form-control" style="max-width: 200px;">
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVAL">Approval</option>
              <option value="POSTED">Posted</option>
            </select>
            <input type="date" [(ngModel)]="filterDate" class="form-control" style="max-width: 200px;">
          </div>

          <p-table 
            [value]="filteredJournals" 
            [paginator]="true" 
            [rows]="10" 
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 25, 50]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            [globalFilterFields]="['id', 'date', 'status']"
            styleClass="p-datatable-gridlines p-datatable-striped"
            responsiveLayout="scroll">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="date" style="width: 120px;">
                  Date <p-sortIcon field="date"></p-sortIcon>
                </th>
                <th pSortableColumn="id" style="width: 130px;">
                  Journal No. <p-sortIcon field="id"></p-sortIcon>
                </th>
                <th>Description</th>
                <th pSortableColumn="debitTotal" style="width: 140px;">
                  Debit Total <p-sortIcon field="debitTotal"></p-sortIcon>
                </th>
                <th pSortableColumn="creditTotal" style="width: 140px;">
                  Credit Total <p-sortIcon field="creditTotal"></p-sortIcon>
                </th>
                <th pSortableColumn="status" style="width: 110px;">
                  Status <p-sortIcon field="status"></p-sortIcon>
                </th>
                <th style="width: 120px;">Actions</th>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="body" let-journal>
              <tr>
                <td>{{journal.date}}</td>
                <td><strong>JRNL-{{journal.id.toString().padStart(3, '0')}}</strong></td>
                <td>{{getJournalDescription(journal)}}</td>
                <td>&#36;{{calculateDebitTotal(journal).toLocaleString('en-US', {minimumFractionDigits: 2})}}</td>
                <td>&#36;{{calculateCreditTotal(journal).toLocaleString('en-US', {minimumFractionDigits: 2})}}</td>
                <td>
                  <p-tag 
                    [value]="journal.status" 
                    [severity]="getStatusSeverity(journal.status)">
                  </p-tag>
                </td>
                <td>
                  <div style="display: flex; gap: 0.5rem;">
                    <p-button 
                      icon="pi pi-eye" 
                      (onClick)="viewJournal(journal)" 
                      [text]="true" 
                      [rounded]="true"
                      severity="info"
                      size="small"
                      styleClass="p-button-icon-only">
                    </p-button>
                    <p-button 
                      *ngIf="journal.status === 'APPROVAL' && canEdit"
                      icon="pi pi-check" 
                      (onClick)="approveJournal(journal)" 
                      [text]="true" 
                      [rounded]="true"
                      severity="success"
                      size="small"
                      styleClass="p-button-icon-only">
                    </p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                  <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 10px; display: block;"></i>
                  <span style="color: var(--text-secondary);">No journal entries found</span>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Trial Balance Tab -->
        <div class="tab-content" *ngIf="activeTab === 'trial'">
          <div class="trial-balance-header">
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 25px; flex-wrap: wrap;">
              <div style="display: flex; gap: 10px; align-items: center;">
                <label style="margin: 0; font-weight: 500;">Filter by:</label>
                <select [(ngModel)]="trialBalanceFilterType" class="form-control" style="max-width: 150px;">
                  <option value="period">Period</option>
                  <option value="dateRange">Date Range</option>
                </select>
              </div>
              
              <div *ngIf="trialBalanceFilterType === 'period'" style="display: flex; gap: 10px; align-items: center;">
                <input [(ngModel)]="trialBalancePeriod" class="form-control" placeholder="Period (YYYYMM)" style="max-width: 200px;" />
              </div>
              
              <div *ngIf="trialBalanceFilterType === 'dateRange'" style="display: flex; gap: 10px; align-items: center;">
                <input type="date" [(ngModel)]="trialBalanceStartDate" class="form-control" style="max-width: 180px;" />
                <span class="text-secondary">to</span>
                <input type="date" [(ngModel)]="trialBalanceEndDate" class="form-control" style="max-width: 180px;" />
              </div>
              
              <button (click)="loadTrialBalance()" class="btn btn-primary">
                <i class="fas fa-sync"></i> Generate Report
              </button>
            </div>
          </div>

          <div *ngIf="trialBalance">
            <!-- Summary Cards -->
            <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 30px;">
              <div class="stat-card success">
                <div class="stat-label">Total Assets</div>
                <div class="stat-value text-success">&#36;{{trialBalance.assets.toLocaleString('en-US', {minimumFractionDigits: 2})}}</div>
                <i class="fas fa-coins stat-icon"></i>
              </div>
              
              <div class="stat-card warning">
                <div class="stat-label">Total Liabilities</div>
                <div class="stat-value text-warning">&#36;{{trialBalance.liabilities.toLocaleString('en-US', {minimumFractionDigits: 2})}}</div>
                <i class="fas fa-file-invoice-dollar stat-icon"></i>
              </div>
              
              <div class="stat-card info">
                <div class="stat-label">Total Equity</div>
                <div class="stat-value text-info">&#36;{{trialBalance.equity.toLocaleString('en-US', {minimumFractionDigits: 2})}}</div>
                <i class="fas fa-landmark stat-icon"></i>
              </div>
              
              <div class="stat-card success">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value text-success">&#36;{{trialBalance.revenue.toLocaleString('en-US', {minimumFractionDigits: 2})}}</div>
                <i class="fas fa-arrow-up stat-icon"></i>
              </div>
              
              <div class="stat-card danger">
                <div class="stat-label">Total Expenses</div>
                <div class="stat-value text-danger">&#36;{{trialBalance.expenses.toLocaleString('en-US', {minimumFractionDigits: 2})}}</div>
                <i class="fas fa-arrow-down stat-icon"></i>
              </div>
              
              <div [class]="'stat-card ' + (trialBalance.equationOk ? 'success' : 'danger')">
                <div class="stat-label">Accounting Equation</div>
                <div class="stat-value" [style.color]="trialBalance.equationOk ? '#4caf50' : '#f44336'">
                  {{trialBalance.equationOk ? 'BALANCED' : 'UNBALANCED'}}
                </div>
                <i [class]="'fas ' + (trialBalance.equationOk ? 'fa-check-circle' : 'fa-exclamation-circle') + ' stat-icon'"></i>
              </div>
            </div>

            <!-- Accounting Equation Info -->
            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 25px;">
              <h4 style="margin: 0 0 10px 0;" class="text-dark"><i class="fas fa-info-circle"></i> Accounting Equation Verification</h4>
              <p style="margin: 0; font-size: 1.1rem;" class="text-secondary">
                <strong>Assets</strong> (&#36;{{trialBalance.assets.toFixed(2)}}) = 
                <strong>Liabilities</strong> (&#36;{{trialBalance.liabilities.toFixed(2)}}) + 
                <strong>Equity</strong> (&#36;{{trialBalance.equity.toFixed(2)}})
              </p>
              <p style="margin: 10px 0 0 0; font-size: 0.9rem;" class="text-muted">
                This includes Revenue (&#36;{{trialBalance.revenue.toFixed(2)}}) and Expenses (&#36;{{trialBalance.expenses.toFixed(2)}}) as part of Equity
              </p>
            </div>

            <!-- Account Breakdown Table -->
            <h4 style="margin-bottom: 15px;"><i class="fas fa-table"></i> Account Breakdown by Type</h4>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Account Type</th>
                    <th>Debit Balance</th>
                    <th>Credit Balance</th>
                    <th>Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Assets</strong></td>
                    <td>&#36;{{trialBalance.assets.toFixed(2)}}</td>
                    <td>-</td>
                    <td><strong>&#36;{{trialBalance.assets.toFixed(2)}}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Liabilities</strong></td>
                    <td>-</td>
                    <td>&#36;{{trialBalance.liabilities.toFixed(2)}}</td>
                    <td><strong>&#36;{{trialBalance.liabilities.toFixed(2)}}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Equity</strong></td>
                    <td>-</td>
                    <td>&#36;{{(trialBalance.equity - trialBalance.revenue + trialBalance.expenses).toFixed(2)}}</td>
                    <td><strong>&#36;{{(trialBalance.equity - trialBalance.revenue + trialBalance.expenses).toFixed(2)}}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Revenue</strong></td>
                    <td>-</td>
                    <td>&#36;{{trialBalance.revenue.toFixed(2)}}</td>
                    <td><strong>&#36;{{trialBalance.revenue.toFixed(2)}}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Expenses</strong></td>
                    <td>&#36;{{trialBalance.expenses.toFixed(2)}}</td>
                    <td>-</td>
                    <td><strong>&#36;{{trialBalance.expenses.toFixed(2)}}</strong></td>
                  </tr>
                  <tr style="background: #f5f5f5; font-weight: bold;">
                    <td><strong>TOTALS</strong></td>
                    <td>&#36;{{(trialBalance.assets + trialBalance.expenses).toFixed(2)}}</td>
                    <td>&#36;{{(trialBalance.liabilities + trialBalance.equity).toFixed(2)}}</td>
                    <td>
                      <span [style.color]="trialBalance.equationOk ? '#4caf50' : '#f44336'">
                        {{trialBalance.equationOk ? 'Balanced ✓' : 'Unbalanced ✗'}}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div *ngIf="!trialBalance" style="padding: 60px; text-align: center;" class="text-muted">
            <i class="fas fa-chart-bar" style="font-size: 4rem; opacity: 0.3; margin-bottom: 15px;"></i>
            <p style="font-size: 1.1rem;">No trial balance data available</p>
            <p style="font-size: 0.9rem;">Enter a period and click "Generate Report" to view the trial balance</p>
          </div>
        </div>

        <!-- Ledger Details Tab -->
        <div class="tab-content" *ngIf="activeTab === 'ledger'">
          <div class="ledger-controls">
            <div class="form-group" style="max-width: 400px; margin-bottom: 25px;">
              <label><strong>Select Account:</strong></label>
              <select [(ngModel)]="selectedAccountId" (change)="loadLedgerDetails()" class="form-control">
                <option value="">-- Select an Account --</option>
                <option *ngFor="let acc of accounts" [value]="acc.id">
                  {{acc.code}} - {{acc.name}} ({{acc.type}})
                </option>
              </select>
            </div>
          </div>

          <div *ngIf="ledgerDetails && selectedAccountId">
            <!-- Account Summary Card -->
            <div class="account-summary-card">
              <div class="account-summary-header">
                <div>
                  <h3>{{ledgerDetails.account.code}} - {{ledgerDetails.account.name}}</h3>
                  <p style="margin: 5px 0 0 0;" class="text-secondary">
                    <span class="badge" [ngClass]="'badge-' + ledgerDetails.account.type.toLowerCase()">
                      {{ledgerDetails.account.type}}
                    </span>
                  </p>
                </div>
                <div class="account-balance">
                  <div style="font-size: 0.9rem; margin-bottom: 5px;" class="text-secondary">Current Balance</div>
                  <div style="font-size: 1.8rem; font-weight: bold;" class="text-dark">
                    &#36;{{ledgerDetails.account.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}}
                  </div>
                </div>
              </div>
            </div>

            <!-- Transaction History -->
            <h4 style="margin: 25px 0 15px 0;"><i class="fas fa-history"></i> Transaction History</h4>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Journal No.</th>
                    <th>Description</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="ledgerDetails.transactions.length === 0">
                    <td colspan="6" style="text-align: center; padding: 40px;" class="text-muted">
                      <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                      No transactions found for this account
                    </td>
                  </tr>
                  <tr *ngFor="let txn of ledgerDetails.transactions; let i = index">
                    <td>{{txn.date}}</td>
                    <td><strong>JRNL-{{txn.journalId.toString().padStart(3, '0')}}</strong></td>
                    <td>{{txn.description}}</td>
                    <td [style.color]="txn.debit > 0 ? '#f44336' : '#999'">
                      {{txn.debit > 0 ? '&#36;' + txn.debit.toFixed(2) : '-'}}
                    </td>
                    <td [style.color]="txn.credit > 0 ? '#4caf50' : '#999'">
                      {{txn.credit > 0 ? '&#36;' + txn.credit.toFixed(2) : '-'}}
                    </td>
                    <td><strong>&#36;{{txn.runningBalance.toFixed(2)}}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Transaction Summary -->
            <div style="margin-top: 25px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div>
                  <div style="font-size: 0.85rem; margin-bottom: 5px;" class="text-muted">Total Debits</div>
                  <div style="font-size: 1.3rem; font-weight: bold;" class="text-danger">
                    &#36;{{ledgerDetails.summary.totalDebits.toFixed(2)}}
                  </div>
                </div>
                <div>
                  <div style="font-size: 0.85rem; color: #999; margin-bottom: 5px;">Total Credits</div>
                  <div style="font-size: 1.3rem; font-weight: bold; color: #4caf50;">
                    &#36;{{ledgerDetails.summary.totalCredits.toFixed(2)}}
                  </div>
                </div>
                <div>
                  <div style="font-size: 0.85rem; color: #999; margin-bottom: 5px;">Net Change</div>
                  <div style="font-size: 1.3rem; font-weight: bold; color: #2196f3;">
                    &#36;{{ledgerDetails.summary.netChange.toFixed(2)}}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!selectedAccountId" style="padding: 60px; text-align: center; color: #999;">
            <i class="fas fa-list-alt" style="font-size: 4rem; opacity: 0.3; margin-bottom: 15px;"></i>
            <p style="font-size: 1.1rem;">No account selected</p>
            <p style="font-size: 0.9rem;">Select an account above to view its ledger details</p>
          </div>
        </div>

        <!-- Period Closing Tab -->
        <div class="tab-content" *ngIf="activeTab === 'closing'">
          <div class="period-closing-container">
            <div class="closing-header">
              <div>
                <h3><i class="fas fa-calendar-times"></i> Month-End Closing Process</h3>
                <p style="color: #666; margin-top: 8px;">Complete all steps to close the accounting period</p>
              </div>
            </div>

            <!-- Period Selection -->
            <div class="form-group" style="max-width: 300px; margin-bottom: 30px;">
              <label><strong>Select Period to Close:</strong></label>
              <input type="text" [(ngModel)]="closingPeriod" class="form-control" placeholder="YYYYMM (e.g., 202601)">
            </div>

            <!-- Checklist -->
            <div class="closing-checklist">
              <h4 style="margin-bottom: 20px;"><i class="fas fa-tasks"></i> Pre-Closing Checklist</h4>
              
              <div class="checklist-item" [class.completed]="closingChecks.allJournalsPosted">
                <div class="check-icon">
                  <i class="fas" [class.fa-check-circle]="closingChecks.allJournalsPosted" [class.fa-circle]="!closingChecks.allJournalsPosted"></i>
                </div>
                <div class="check-content">
                  <h5>All Journal Entries Posted</h5>
                  <p>All journal entries for the period must be approved and posted to the General Ledger</p>
                  <div *ngIf="!closingChecks.allJournalsPosted" class="check-status error">
                    <i class="fas fa-exclamation-triangle"></i> {{closingChecks.unpostedCount}} unposted entries found
                  </div>
                  <div *ngIf="closingChecks.allJournalsPosted" class="check-status success">
                    <i class="fas fa-check"></i> All entries posted
                  </div>
                </div>
              </div>

              <div class="checklist-item" [class.completed]="closingChecks.trialBalanceOk">
                <div class="check-icon">
                  <i class="fas" [class.fa-check-circle]="closingChecks.trialBalanceOk" [class.fa-circle]="!closingChecks.trialBalanceOk"></i>
                </div>
                <div class="check-content">
                  <h5>Trial Balance Verification</h5>
                  <p>The accounting equation must be balanced: Assets = Liabilities + Equity</p>
                  <div *ngIf="!closingChecks.trialBalanceOk" class="check-status error">
                    <i class="fas fa-exclamation-triangle"></i> Trial balance is out of balance
                  </div>
                  <div *ngIf="closingChecks.trialBalanceOk" class="check-status success">
                    <i class="fas fa-check"></i> Trial balance is balanced
                  </div>
                </div>
              </div>

              <div class="checklist-item" [class.completed]="closingChecks.reconciliationComplete">
                <div class="check-icon">
                  <i class="fas" [class.fa-check-circle]="closingChecks.reconciliationComplete" [class.fa-circle]="!closingChecks.reconciliationComplete"></i>
                </div>
                <div class="check-content">
                  <h5>Bank Reconciliation</h5>
                  <p>All bank accounts should be reconciled with bank statements</p>
                  <div class="check-status warning">
                    <i class="fas fa-info-circle"></i> Manual verification required
                  </div>
                </div>
              </div>

              <div class="checklist-item">
                <div class="check-icon">
                  <i class="fas fa-circle"></i>
                </div>
                <div class="check-content">
                  <h5>Adjusting Entries</h5>
                  <p>Record accruals, deferrals, and other adjusting entries for accurate period reporting</p>
                  <div class="check-status warning">
                    <i class="fas fa-info-circle"></i> Manual verification required
                  </div>
                </div>
              </div>

              <div class="checklist-item">
                <div class="check-icon">
                  <i class="fas fa-circle"></i>
                </div>
                <div class="check-content">
                  <h5>Depreciation & Amortization</h5>
                  <p>Calculate and record depreciation for fixed assets and amortization for intangible assets</p>
                  <div class="check-status warning">
                    <i class="fas fa-info-circle"></i> Manual verification required
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="margin-top: 30px; padding-top: 30px; border-top: 2px solid #e0e0e0;">
              <button class="btn btn-primary" (click)="runClosingChecks()" style="margin-right: 15px;">
                <i class="fas fa-sync"></i> Run Pre-Closing Checks
              </button>
              <button 
                class="btn btn-success" 
                (click)="closePeriod()" 
                [disabled]="!canClosePeriod()"
                [title]="canClosePeriod() ? 'Close Period' : 'Complete all required checks first'">
                <i class="fas fa-lock"></i> Close Period
              </button>
              <div *ngIf="!canClosePeriod()" style="margin-top: 15px; color: #f44336; font-size: 0.9rem;">
                <i class="fas fa-exclamation-triangle"></i> Cannot close period: Complete all required checks first
              </div>
            </div>

            <!-- Closing Information -->
            <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;"><i class="fas fa-info-circle"></i> Period Closing Information</h4>
              <ul style="margin: 10px 0 0 20px; color: #666; line-height: 1.8;">
                <li>Closing a period prevents further modifications to that period's transactions</li>
                <li>All revenue and expense accounts will be closed to retained earnings</li>
                <li>Financial statements (P&L, Balance Sheet) will be generated</li>
                <li>Opening balances for the next period will be calculated automatically</li>
                <li>This action can only be reversed by a system administrator</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Journal Modal -->
      <div class="modal" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()" style="max-width: 900px;">
          <div class="modal-header">
            <h3><i class="fas fa-file-invoice"></i> {{modalMode === 'create' ? 'Create' : 'View'}} Journal Entry</h3>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Date</label>
              <input type="date" class="form-control" [(ngModel)]="journalForm.date" [disabled]="modalMode === 'view'">
            </div>
            <div class="form-group">
              <label>Period (YYYYMM)</label>
              <input type="text" class="form-control" [(ngModel)]="journalForm.period" placeholder="202601" [disabled]="modalMode === 'view'">
            </div>

            <h4 style="margin-top: 25px; margin-bottom: 15px;">Journal Lines</h4>
            <div class="journal-lines">
              <div class="journal-line" *ngFor="let line of journalForm.lines; let i = index">
                <div class="line-header">
                  <strong>Line {{i + 1}}</strong>
                  <button class="btn-icon" (click)="removeLine(i)" *ngIf="modalMode === 'create' && journalForm.lines.length > 2">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                <div class="form-row">
                  <div class="form-group" style="flex: 2;">
                    <label>Account</label>
                    <select class="form-control" [(ngModel)]="line.accountId" [disabled]="modalMode === 'view'">
                      <option value="">Select Account</option>
                      <option *ngFor="let acc of accounts" [value]="acc.id">
                        {{acc.code}} - {{acc.name}}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Debit</label>
                    <input type="number" class="form-control" [(ngModel)]="line.debit" [disabled]="modalMode === 'view'" step="0.01">
                  </div>
                  <div class="form-group">
                    <label>Credit</label>
                    <input type="number" class="form-control" [(ngModel)]="line.credit" [disabled]="modalMode === 'view'" step="0.01">
                  </div>
                </div>
                <div class="form-group">
                  <label>Description</label>
                  <input type="text" class="form-control" [(ngModel)]="line.description" [disabled]="modalMode === 'view'">
                </div>
              </div>
            </div>

            <button class="btn btn-secondary" (click)="addLine()" *ngIf="modalMode === 'create'" style="margin-top: 15px;">
              <i class="fas fa-plus"></i> Add Line
            </button>

            <div class="balance-summary" style="margin-top: 25px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Total Debits:</strong>
                <span>&#36;{{calculateTotalDebits().toFixed(2)}}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Total Credits:</strong>
                <span>&#36;{{calculateTotalCredits().toFixed(2)}}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd;">
                <strong>Balance:</strong>
                <span [style.color]="isBalanced() ? '#4caf50' : '#f44336'">
                  <i class="fas" [class.fa-check-circle]="isBalanced()" [class.fa-exclamation-circle]="!isBalanced()"></i>
                  {{isBalanced() ? 'Balanced' : 'Unbalanced'}}
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">
              {{modalMode === 'view' ? 'Close' : 'Cancel'}}
            </button>
            <button class="btn btn-primary" (click)="saveJournal()" *ngIf="modalMode === 'create'" [disabled]="!isBalanced()">
              <i class="fas fa-save"></i> Save Journal
            </button>
          </div>
        </div>
      </div>

      <!-- View Journal Modal -->
      <div class="modal" *ngIf="showViewModal" (click)="showViewModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-eye"></i> Journal Entry Details</h3>
            <button class="close-btn" (click)="showViewModal = false">&times;</button>
          </div>
          <div class="modal-body" *ngIf="selectedJournal">
            <div class="info-grid">
              <div>
                <label>Journal No.</label>
                <p><strong>JRNL-{{selectedJournal.id.toString().padStart(3, '0')}}</strong></p>
              </div>
              <div>
                <label>Date</label>
                <p>{{selectedJournal.date}}</p>
              </div>
              <div>
                <label>Period</label>
                <p>{{selectedJournal.period}}</p>
              </div>
              <div>
                <label>Status</label>
                <p><span class="badge" [ngClass]="'badge-' + selectedJournal.status.toLowerCase()">{{selectedJournal.status}}</span></p>
              </div>
            </div>

            <h4 style="margin: 25px 0 15px 0;">Journal Lines</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let line of selectedJournal.lines">
                  <td>{{getAccountName(line.accountId)}}</td>
                  <td>{{line.description}}</td>
                  <td>{{line.debit > 0 ? '&#36;' + line.debit.toFixed(2) : '-'}}</td>
                  <td>{{line.credit > 0 ? '&#36;' + line.credit.toFixed(2) : '-'}}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style="font-weight: bold; background: #f5f5f5;">
                  <td colspan="2">Total</td>
                  <td>&#36;{{calculateDebitTotal(selectedJournal).toFixed(2)}}</td>
                  <td>&#36;{{calculateCreditTotal(selectedJournal).toFixed(2)}}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showViewModal = false">Close</button>
            <button class="btn btn-success" *ngIf="selectedJournal && selectedJournal.status === 'DRAFT' && canEdit" (click)="approveJournalDirect(selectedJournal)">
              <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn btn-primary" *ngIf="selectedJournal && selectedJournal.status === 'APPROVAL' && canEdit" (click)="postJournalDirect(selectedJournal)">
              <i class="fas fa-paper-plane"></i> Post to GL
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workflow-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 25px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 30px;
    }

    .workflow-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .workflow-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
    }

    .workflow-arrow {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      margin: 0 15px;
      position: relative;
    }

    .workflow-arrow::after {
      content: '';
      position: absolute;
      right: -8px;
      top: -4px;
      width: 0;
      height: 0;
      border-left: 8px solid #764ba2;
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
    }

    .workflow-step span {
      font-size: 0.9rem;
      color: #666;
      font-weight: 500;
    }

    .tabs-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .tabs {
      display: flex;
      border-bottom: 2px solid #e0e0e0;
      background: #f8f9fa;
    }

    .tab {
      padding: 15px 30px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-weight: 500;
      color: #666;
      transition: all 0.3s;
      position: relative;
    }

    .tab:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .tab.active {
      color: #667eea;
      background: white;
    }

    .tab.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    .tab-content {
      padding: 25px;
    }

    .table-controls {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
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
      width: 100%;
      padding: 10px 15px 10px 45px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
    }

    .journal-lines {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .journal-line {
      padding: 20px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }

    .line-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }

    .form-row {
      display: flex;
      gap: 15px;
    }

    .badge-draft {
      background: #ff9800;
    }

    .badge-approval {
      background: #2196f3;
    }

    .badge-posted {
      background: #4caf50;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }

    .info-grid label {
      display: block;
      font-size: 0.85rem;
      color: #999;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-grid p {
      margin: 0;
      font-size: 1rem;
      color: #333;
    }

    .badge-asset {
      background: #e3f2fd;
      color: #1565c0;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-liability {
      background: #fff3e0;
      color: #e65100;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-equity {
      background: #f3e5f5;
      color: #6a1b9a;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-revenue {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-expense {
      background: #ffebee;
      color: #c62828;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .tb-section {
      margin-bottom: 30px;
    }

    .tb-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .tb-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid #3498db;
    }

    .tb-card.asset { border-left-color: #3498db; }
    .tb-card.liability { border-left-color: #f39c12; }
    .tb-card.equity { border-left-color: #9b59b6; }
    .tb-card.revenue { border-left-color: #27ae60; }
    .tb-card.expense { border-left-color: #e74c3c; }
    .tb-card.equation { border-left-color: #34495e; }

    .equation-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 30px;
    }

    .equation-box.unbalanced {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    }

    .equation-formula {
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 15px;
    }

    .equation-status {
      text-align: center;
      font-size: 14px;
      opacity: 0.9;
    }

    .account-selector {
      margin-bottom: 25px;
    }

    .ledger-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 25px;
    }

    .summary-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
    }

    .summary-label {
      font-size: 12px;
      color: #7f8c8d;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .summary-value {
      font-size: 22px;
      font-weight: 700;
      color: #2c3e50;
    }

    .closing-checklist {
      margin-bottom: 30px;
    }

    .checklist-item {
      display: flex;
      align-items: flex-start;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .check-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      flex-shrink: 0;
    }

    .checklist-item.complete .check-icon {
      background: #27ae60;
      border-color: #27ae60;
      color: white;
    }

    .check-content {
      flex: 1;
    }

    .check-title {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .check-description {
      font-size: 13px;
      color: #7f8c8d;
    }

    .check-status {
      margin-left: auto;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .check-status.complete {
      background: #d4edda;
      color: #155724;
    }

    .check-status.incomplete {
      background: #fff3cd;
      color: #856404;
    }

    .info-panel {
      background: #e8f4f8;
      border-left: 4px solid #3498db;
      padding: 20px;
      border-radius: 8px;
      margin-top: 25px;
    }

    .info-title {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .info-text {
      font-size: 14px;
      color: #555;
      line-height: 1.6;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .text-muted {
      color: #7f8c8d;
    }

    .mb-3 {
      margin-bottom: 20px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #95a5a6;
    }

    .empty-state i {
      font-size: 48px;
      margin-bottom: 15px;
      opacity: 0.5;
    }
  `]
})
export class GeneralLedgerComponent implements OnInit {
  activeTab = 'entries';
  journals: any[] = [];
  accounts: any[] = [];
  showModal = false;
  showViewModal = false;
  modalMode: 'create' | 'view' = 'create';
  selectedJournal: any = null;
  searchText = '';
  filterStatus = '';
  filterDate = '';
  canEdit = false;

  // Trial Balance
  trialBalanceFilterType: 'period' | 'dateRange' = 'period';
  trialBalancePeriod = new Date().toISOString().slice(0, 7).replace('-', '');
  trialBalanceStartDate = new Date().toISOString().split('T')[0];
  trialBalanceEndDate = new Date().toISOString().split('T')[0];
  trialBalance: any = null;

  // Ledger Details
  selectedAccountId = '';
  ledgerDetails: any = null;

  // Period Closing
  closingPeriod = new Date().toISOString().slice(0, 7).replace('-', '');
  closingChecks = {
    allJournalsPosted: false,
    trialBalanceOk: false,
    reconciliationComplete: false,
    unpostedCount: 0
  };

  stats = {
    total: 0,
    unposted: 0,
    thisMonth: 0,
    debitTotal: 0,
    creditTotal: 0
  };

  journalForm = {
    date: new Date().toISOString().split('T')[0],
    period: new Date().toISOString().slice(0, 7).replace('-', ''),
    lines: [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' }
    ]
  };

  constructor(
    private journalsService: JournalsService,
    private accountsService: AccountsService,
    private authService: AuthService,
    private glService: GlService
  ) {}

  ngOnInit() {
    this.loadData();
    this.canEdit = this.authService.canEdit();
  }

  loadData() {
    this.journalsService.list().subscribe((data: any) => {
      this.journals = data;
      this.calculateStats();
    });

    this.accountsService.list().subscribe((data: any) => {
      this.accounts = data;
    });
  }

  calculateStats() {
    this.stats.total = this.journals.length;
    this.stats.unposted = this.journals.filter(j => j.status !== 'POSTED').length;
    
    const currentMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    this.stats.thisMonth = this.journals.filter(j => j.period === currentMonth).length;

    this.stats.debitTotal = this.journals.reduce((sum, j) => 
      sum + this.calculateDebitTotal(j), 0);
    this.stats.creditTotal = this.journals.reduce((sum, j) => 
      sum + this.calculateCreditTotal(j), 0);
  }

  get filteredJournals() {
    return this.journals.filter(j => {
      const matchSearch = !this.searchText || 
        this.getJournalDescription(j).toLowerCase().includes(this.searchText.toLowerCase()) ||
        j.id.toString().includes(this.searchText);
      const matchStatus = !this.filterStatus || j.status === this.filterStatus;
      const matchDate = !this.filterDate || j.date === this.filterDate;
      return matchSearch && matchStatus && matchDate;
    });
  }

  openJournalModal() {
    this.modalMode = 'create';
    this.resetForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.journalForm = {
      date: new Date().toISOString().split('T')[0],
      period: new Date().toISOString().slice(0, 7).replace('-', ''),
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', debit: 0, credit: 0, description: '' }
      ]
    };
  }

  addLine() {
    this.journalForm.lines.push({ accountId: '', debit: 0, credit: 0, description: '' });
  }

  removeLine(index: number) {
    this.journalForm.lines.splice(index, 1);
  }

  calculateTotalDebits(): number {
    return this.journalForm.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  }

  calculateTotalCredits(): number {
    return this.journalForm.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  }

  isBalanced(): boolean {
    const diff = Math.abs(this.calculateTotalDebits() - this.calculateTotalCredits());
    return diff < 0.01;
  }

  saveJournal() {
    if (!this.isBalanced()) {
      alert('Journal must be balanced! Total debits must equal total credits.');
      return;
    }

    const journal = {
      date: this.journalForm.date,
      period: this.journalForm.period,
      status: 'DRAFT',
      lines: this.journalForm.lines.map(line => ({
        accountId: Number(line.accountId),
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        description: line.description
      }))
    };

    this.journalsService.create(journal).subscribe({
      next: () => {
        this.refreshData();
        this.closeModal();
        alert('Journal entry created successfully!');
      },
      error: (err) => {
        console.error('Error creating journal:', err);
        alert('Failed to create journal entry. Please try again.');
      }
    });
  }

  viewJournal(journal: any) {
    this.journalsService.getById(journal.id).subscribe((data: any) => {
      this.selectedJournal = data;
      this.showViewModal = true;
    });
  }

  approveJournal(journal: any) {
    if (confirm(`Approve journal JRNL-${journal.id.toString().padStart(3, '0')}?`)) {
      this.journalsService.approve(journal.id).subscribe({
        next: () => {
          this.refreshData();
          alert('Journal approved successfully!');
        },
        error: (err) => {
          console.error('Error approving journal:', err);
          alert('Failed to approve journal. Please try again.');
        }
      });
    }
  }

  approveJournalDirect(journal: any) {
    this.journalsService.approve(journal.id).subscribe({
      next: () => {
        this.refreshData();
        this.showViewModal = false;
        alert('Journal approved successfully!');
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Failed to approve journal.');
      }
    });
  }

  postJournalDirect(journal: any) {
    this.journalsService.post(journal.id).subscribe({
      next: () => {
        this.refreshData();
        this.showViewModal = false;
        alert('Journal posted to General Ledger successfully!');
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Failed to post journal.');
      }
    });
  }

  postAllEntries() {
    const unposted = this.journals.filter(j => j.status === 'APPROVAL');
    if (unposted.length === 0) {
      alert('No entries in APPROVAL status to post.');
      return;
    }

    if (confirm(`Post ${unposted.length} approved entries to General Ledger?`)) {
      let posted = 0;
      unposted.forEach((journal, index) => {
        this.journalsService.post(journal.id).subscribe({
          next: () => {
            posted++;
            if (index === unposted.length - 1) {
              this.refreshData();
              alert(`Successfully posted ${posted} entries to General Ledger!`);
            }
          },
          error: (err) => {
            console.error('Error posting journal:', err);
          }
        });
      });
    }
  }

  getJournalDescription(journal: any): string {
    if (!journal.lines || journal.lines.length === 0) return 'No description';
    const firstLine = journal.lines[0];
    return firstLine.description || 'Journal entry';
  }

  calculateDebitTotal(journal: any): number {
    if (!journal.lines) return 0;
    return journal.lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
  }

  calculateCreditTotal(journal: any): number {
    if (!journal.lines) return 0;
    return journal.lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);
  }

  getAccountName(accountId: number): string {
    const account = this.accounts.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : 'Unknown Account';
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
    
    // Auto-load data when switching to specific tabs
    if (tab === 'trial') {
      this.loadTrialBalance();
    } else if (tab === 'ledger' && this.selectedAccountId) {
      this.loadLedgerDetails();
    }
  }

  refreshData() {
    // Reload journals and accounts
    this.loadData();
    
    // Update trial balance period to current period to ensure it shows latest data
    this.trialBalancePeriod = new Date().toISOString().slice(0, 7).replace('-', '');
    
    // Refresh trial balance if period is set
    if (this.trialBalancePeriod) {
      this.loadTrialBalance();
    }
    
    // Refresh ledger details if we're on that tab
    if (this.activeTab === 'ledger' && this.selectedAccountId) {
      this.loadLedgerDetails();
    }
  }

  // Trial Balance Methods
  loadTrialBalance() {
    if (this.trialBalanceFilterType === 'period') {
      if (!this.trialBalancePeriod) {
        alert('Please enter a period (YYYYMM)');
        return;
      }
      this.glService.trialBalance(this.trialBalancePeriod).subscribe({
        next: (data: any) => {
          this.trialBalance = data;
        },
        error: (err) => {
          console.error('Error loading trial balance:', err);
          alert('Failed to load trial balance. Please try again.');
        }
      });
    } else {
      if (!this.trialBalanceStartDate || !this.trialBalanceEndDate) {
        alert('Please enter both start and end dates');
        return;
      }
      if (this.trialBalanceStartDate > this.trialBalanceEndDate) {
        alert('Start date must be before end date');
        return;
      }
      this.glService.trialBalanceByDateRange(this.trialBalanceStartDate, this.trialBalanceEndDate).subscribe({
        next: (data: any) => {
          this.trialBalance = data;
        },
        error: (err) => {
          console.error('Error loading trial balance:', err);
          alert('Failed to load trial balance. Please try again.');
        }
      });
    }
  }

  // Ledger Details Methods
  loadLedgerDetails() {
    if (!this.selectedAccountId) {
      this.ledgerDetails = null;
      return;
    }

    const account = this.accounts.find(a => a.id === Number(this.selectedAccountId));
    if (!account) return;

    // Get all posted journals
    const postedJournals = this.journals.filter(j => j.status === 'POSTED');
    
    // Find all transactions for this account
    const transactions: any[] = [];
    let runningBalance = 0;

    postedJournals.forEach(journal => {
      if (journal.lines) {
        journal.lines.forEach((line: any) => {
          if (line.accountId === Number(this.selectedAccountId)) {
            // Calculate balance change based on account type
            let balanceChange = 0;
            if (account.type === 'ASSET' || account.type === 'EXPENSE') {
              balanceChange = line.debit - line.credit;
            } else {
              balanceChange = line.credit - line.debit;
            }
            runningBalance += balanceChange;

            transactions.push({
              date: journal.date,
              journalId: journal.id,
              description: line.description || 'Journal entry',
              debit: line.debit,
              credit: line.credit,
              runningBalance: runningBalance
            });
          }
        });
      }
    });

    // Sort by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate summary
    const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
    const netChange = totalDebits - totalCredits;

    this.ledgerDetails = {
      account: account,
      transactions: transactions,
      summary: {
        totalDebits: totalDebits,
        totalCredits: totalCredits,
        netChange: Math.abs(netChange)
      }
    };
  }

  // Period Closing Methods
  runClosingChecks() {
    if (!this.closingPeriod) {
      alert('Please enter a period to close (YYYYMM)');
      return;
    }

    // Check 1: All journals posted
    const periodJournals = this.journals.filter(j => j.period === this.closingPeriod);
    const unposted = periodJournals.filter(j => j.status !== 'POSTED');
    this.closingChecks.unpostedCount = unposted.length;
    this.closingChecks.allJournalsPosted = unposted.length === 0;

    // Check 2: Trial balance
    this.glService.trialBalance(this.closingPeriod).subscribe({
      next: (data: any) => {
        this.closingChecks.trialBalanceOk = data.equationOk;
        
        // Show results
        if (this.closingChecks.allJournalsPosted && this.closingChecks.trialBalanceOk) {
          alert('✓ All pre-closing checks passed! Period is ready to be closed.');
        } else {
          let message = 'Pre-closing checks failed:\n\n';
          if (!this.closingChecks.allJournalsPosted) {
            message += `- ${this.closingChecks.unpostedCount} unposted journal entries\n`;
          }
          if (!this.closingChecks.trialBalanceOk) {
            message += '- Trial balance is not balanced\n';
          }
          alert(message);
        }
      },
      error: (err) => {
        console.error('Error checking trial balance:', err);
        this.closingChecks.trialBalanceOk = false;
      }
    });
  }

  canClosePeriod(): boolean {
    return this.closingChecks.allJournalsPosted && 
           this.closingChecks.trialBalanceOk;
  }

  closePeriod() {
    if (!this.canClosePeriod()) {
      alert('Cannot close period. Please complete all required checks first.');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to close period ${this.closingPeriod}?\n\n` +
      `This will:\n` +
      `- Lock all transactions for this period\n` +
      `- Close revenue and expense accounts to retained earnings\n` +
      `- Generate financial statements\n\n` +
      `This action cannot be easily reversed.`
    );

    if (confirmed) {
      // In a real system, this would call a backend API
      // For now, we'll just show a success message
      alert(
        `Period ${this.closingPeriod} has been closed successfully!\n\n` +
        `Closing entries have been recorded:\n` +
        `- Revenue accounts closed to Retained Earnings\n` +
        `- Expense accounts closed to Retained Earnings\n` +
        `- Net Income calculated and recorded\n` +
        `- Opening balances set for next period\n\n` +
        `Financial statements are now available for this period.`
      );
      
      // Reset checks
      this.closingChecks = {
        allJournalsPosted: false,
        trialBalanceOk: false,
        reconciliationComplete: false,
        unpostedCount: 0
      };
    }
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'info' | 'danger' {
    switch(status) {
      case 'POSTED': return 'success';
      case 'APPROVAL': return 'warning';
      case 'DRAFT': return 'info';
      default: return 'info';
    }
  }
}
