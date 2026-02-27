import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
}

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-container">
      <div class="header">
        <h2>Financial Reports</h2>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()" *ngIf="currentReport">
            <i class="icon">📥</i> Export to PDF
          </button>
        </div>
      </div>

      <!-- Report Selection -->
      <div class="report-selector">
        <div class="report-cards">
          <div class="report-card" (click)="selectReport('income-statement')" 
               [class.active]="selectedReportType === 'income-statement'">
            <div class="report-icon">📊</div>
            <h3>Income Statement</h3>
            <p>Profit & Loss Report</p>
          </div>
          
          <div class="report-card" (click)="selectReport('balance-sheet')" 
               [class.active]="selectedReportType === 'balance-sheet'">
            <div class="report-icon">⚖️</div>
            <h3>Balance Sheet</h3>
            <p>Financial Position</p>
          </div>
          
          <div class="report-card" (click)="selectReport('trial-balance')" 
               [class.active]="selectedReportType === 'trial-balance'">
            <div class="report-icon">📋</div>
            <h3>Trial Balance</h3>
            <p>Account Balances</p>
          </div>
          
          <div class="report-card" (click)="selectReport('cash-flow')" 
               [class.active]="selectedReportType === 'cash-flow'">
            <div class="report-icon">💰</div>
            <h3>Cash Flow Statement</h3>
            <p>Cash Movement Analysis</p>
          </div>
          
          <div class="report-card" (click)="selectReport('account-ledger')" 
               [class.active]="selectedReportType === 'account-ledger'">
            <div class="report-icon">📖</div>
            <h3>Account Ledger</h3>
            <p>Transaction Detail</p>
          </div>
        </div>
      </div>

      <!-- Report Parameters -->
      <div class="report-parameters" *ngIf="selectedReportType">
        <div class="param-group">
          <label *ngIf="selectedReportType === 'account-ledger'">Select Account:</label>
          <select [(ngModel)]="selectedAccountId" *ngIf="selectedReportType === 'account-ledger'" class="param-input">
            <option value="">Choose Account</option>
            <option *ngFor="let account of accounts" [value]="account.id">
              {{ account.code }} - {{ account.name }}
            </option>
          </select>

          <label *ngIf="needsDateRange()">Start Date:</label>
          <input type="date" [(ngModel)]="startDate" *ngIf="needsDateRange()" class="param-input">
          
          <label *ngIf="needsDateRange()">End Date:</label>
          <input type="date" [(ngModel)]="endDate" *ngIf="needsDateRange()" class="param-input">
          
          <label *ngIf="needsAsOfDate()">As of Date:</label>
          <input type="date" [(ngModel)]="asOfDate" *ngIf="needsAsOfDate()" class="param-input">
          
          <button class="btn-primary" (click)="generateReport()">Generate Report</button>
        </div>
      </div>

      <!-- Report Display Area -->
      <div class="report-display" *ngIf="currentReport">
        <!-- Income Statement -->
        <div *ngIf="selectedReportType === 'income-statement'" class="report-content">
          <div class="report-header">
            <h2>{{ companyName }}</h2>
            <h3>Income Statement</h3>
            <p>For the Period {{ currentReport.startDate | date:'MM/dd/yyyy' }} to {{ currentReport.endDate | date:'MM/dd/yyyy' }}</p>
          </div>

          <div class="report-section">
            <h4>Revenue</h4>
            <table class="report-table">
              <tbody>
                <tr *ngFor="let item of currentReport.revenues">
                  <td>{{ item.accountCode }}</td>
                  <td>{{ item.accountName }}</td>
                  <td class="amount">{{ item.amount | number:'1.2-2' }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2"><strong>Total Revenue</strong></td>
                  <td class="amount"><strong>{{ currentReport.totalRevenue | number:'1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="report-section">
            <h4>Expenses</h4>
            <table class="report-table">
              <tbody>
                <tr *ngFor="let item of currentReport.expenses">
                  <td>{{ item.accountCode }}</td>
                  <td>{{ item.accountName }}</td>
                  <td class="amount">{{ item.amount | number:'1.2-2' }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2"><strong>Total Expenses</strong></td>
                  <td class="amount"><strong>{{ currentReport.totalExpense | number:'1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="report-summary">
            <div class="summary-row" [class.profit]="currentReport.netIncome >= 0" [class.loss]="currentReport.netIncome < 0">
              <strong>Net {{ currentReport.netIncome >= 0 ? 'Income' : 'Loss' }}</strong>
              <strong>{{ currentReport.netIncome | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>

        <!-- Balance Sheet -->
        <div *ngIf="selectedReportType === 'balance-sheet'" class="report-content">
          <div class="report-header">
            <h2>{{ companyName }}</h2>
            <h3>Balance Sheet</h3>
            <p>As of {{ currentReport.asOfDate | date:'MM/dd/yyyy' }}</p>
          </div>

          <div class="report-section">
            <h4>Assets</h4>
            <table class="report-table">
              <tbody>
                <tr *ngFor="let item of currentReport.assets">
                  <td>{{ item.accountCode }}</td>
                  <td>{{ item.accountName }}</td>
                  <td class="amount">{{ item.amount | number:'1.2-2' }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2"><strong>Total Assets</strong></td>
                  <td class="amount"><strong>{{ currentReport.totalAssets | number:'1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="report-section">
            <h4>Liabilities</h4>
            <table class="report-table">
              <tbody>
                <tr *ngFor="let item of currentReport.liabilities">
                  <td>{{ item.accountCode }}</td>
                  <td>{{ item.accountName }}</td>
                  <td class="amount">{{ item.amount | number:'1.2-2' }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2"><strong>Total Liabilities</strong></td>
                  <td class="amount"><strong>{{ currentReport.totalLiabilities | number:'1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="report-section">
            <h4>Equity</h4>
            <table class="report-table">
              <tbody>
                <tr *ngFor="let item of currentReport.equity">
                  <td>{{ item.accountCode }}</td>
                  <td>{{ item.accountName }}</td>
                  <td class="amount">{{ item.amount | number:'1.2-2' }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2"><strong>Total Equity</strong></td>
                  <td class="amount"><strong>{{ currentReport.totalEquity | number:'1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="report-summary">
            <div class="summary-row">
              <strong>Total Liabilities & Equity</strong>
              <strong>{{ currentReport.totalLiabilitiesAndEquity | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>

        <!-- Trial Balance -->
        <div *ngIf="selectedReportType === 'trial-balance'" class="report-content">
          <div class="report-header">
            <h2>{{ companyName }}</h2>
            <h3>Trial Balance</h3>
            <p>As of {{ currentReport.asOfDate | date:'MM/dd/yyyy' }}</p>
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th class="amount">Debit</th>
                <th class="amount">Credit</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let account of currentReport.accounts">
                <td>{{ account.accountCode }}</td>
                <td>{{ account.accountName }}</td>
                <td>{{ account.accountType }}</td>
                <td class="amount">{{ account.debit > 0 ? (account.debit | number:'1.2-2') : '-' }}</td>
                <td class="amount">{{ account.credit > 0 ? (account.credit | number:'1.2-2') : '-' }}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3"><strong>Totals</strong></td>
                <td class="amount"><strong>{{ currentReport.totalDebit | number:'1.2-2' }}</strong></td>
                <td class="amount"><strong>{{ currentReport.totalCredit | number:'1.2-2' }}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="report-summary">
            <div class="balance-status" [class.balanced]="currentReport.isBalanced" [class.unbalanced]="!currentReport.isBalanced">
              {{ currentReport.isBalanced ? '✅ Books are Balanced' : '❌ Books are NOT Balanced' }}
            </div>
          </div>
        </div>

        <!-- Cash Flow Statement -->
        <div *ngIf="selectedReportType === 'cash-flow'" class="report-content">
          <div class="report-header">
            <h2>{{ companyName }}</h2>
            <h3>Cash Flow Statement</h3>
            <p>For the Period {{ currentReport.startDate | date:'MM/dd/yyyy' }} to {{ currentReport.endDate | date:'MM/dd/yyyy' }}</p>
          </div>

          <div class="report-section">
            <h4>Operating Activities</h4>
            <table class="report-table">
              <tbody>
                <tr *ngFor="let item of currentReport.operatingActivities">
                  <td>{{ item.date | date:'MM/dd/yyyy' }}</td>
                  <td>{{ item.description }}</td>
                  <td class="amount">{{ item.amount | number:'1.2-2' }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2"><strong>Net Cash from Operating Activities</strong></td>
                  <td class="amount"><strong>{{ currentReport.operatingCashFlow | number:'1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="report-section">
            <h4>Investing Activities</h4>
            <table class="report-table">
              <tbody>
                <tr *ngFor="let item of currentReport.investingActivities">
                  <td>{{ item.date | date:'MM/dd/yyyy' }}</td>
                  <td>{{ item.description }}</td>
                  <td class="amount">{{ item.amount | number:'1.2-2' }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2"><strong>Net Cash from Investing Activities</strong></td>
                  <td class="amount"><strong>{{ currentReport.investingCashFlow | number:'1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="report-section">
            <h4>Financing Activities</h4>
            <table class="report-table">
              <tbody>
                <tr *ngFor="let item of currentReport.financingActivities">
                  <td>{{ item.date | date:'MM/dd/yyyy' }}</td>
                  <td>{{ item.description }}</td>
                  <td class="amount">{{ item.amount | number:'1.2-2' }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2"><strong>Net Cash from Financing Activities</strong></td>
                  <td class="amount"><strong>{{ currentReport.financingCashFlow | number:'1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="report-summary">
            <div class="summary-row">
              <strong>Net Increase (Decrease) in Cash</strong>
              <strong>{{ currentReport.netCashFlow | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>

        <!-- Account Ledger -->
        <div *ngIf="selectedReportType === 'account-ledger'" class="report-content">
          <div class="report-header">
            <h2>{{ companyName }}</h2>
            <h3>Account Ledger</h3>
            <p>{{ currentReport.accountCode }} - {{ currentReport.accountName }}</p>
            <p>For the Period {{ currentReport.startDate | date:'MM/dd/yyyy' }} to {{ currentReport.endDate | date:'MM/dd/yyyy' }}</p>
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th class="amount">Debit</th>
                <th class="amount">Credit</th>
                <th class="amount">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let txn of currentReport.transactions">
                <td>{{ txn.date | date:'MM/dd/yyyy' }}</td>
                <td>{{ txn.description }}</td>
                <td class="amount">{{ txn.debit > 0 ? (txn.debit | number:'1.2-2') : '-' }}</td>
                <td class="amount">{{ txn.credit > 0 ? (txn.credit | number:'1.2-2') : '-' }}</td>
                <td class="amount">{{ txn.balance | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="report-summary">
            <div class="summary-row">
              <strong>Ending Balance</strong>
              <strong>{{ currentReport.endingBalance | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container { padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .header h2 { margin: 0; color: #2c3e50; }
    .header-actions { display: flex; gap: 10px; }
    
    .report-selector { margin-bottom: 30px; }
    .report-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .report-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s; text-align: center; }
    .report-card:hover { transform: translateY(-5px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .report-card.active { border: 3px solid #3498db; background: #ebf5fb; }
    .report-icon { font-size: 48px; margin-bottom: 10px; }
    .report-card h3 { margin: 10px 0; color: #2c3e50; font-size: 18px; }
    .report-card p { margin: 0; color: #7f8c8d; font-size: 14px; }
    
    .report-parameters { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; }
    .param-group { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
    .param-group label { font-weight: 600; color: #2c3e50; }
    .param-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; min-width: 200px; }
    
    .report-display { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .report-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #34495e; padding-bottom: 20px; }
    .report-header h2 { margin: 0; color: #2c3e50; font-size: 28px; }
    .report-header h3 { margin: 10px 0; color: #34495e; font-size: 22px; }
    .report-header p { margin: 5px 0; color: #7f8c8d; }
    
    .report-section { margin: 30px 0; }
    .report-section h4 { color: #2c3e50; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #ecf0f1; padding-bottom: 8px; }
    
    .report-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .report-table thead th { background: #34495e; color: white; padding: 12px; text-align: left; font-weight: 600; }
    .report-table tbody td { padding: 10px 12px; border-bottom: 1px solid #ecf0f1; }
    .report-table .amount { text-align: right; font-family: monospace; }
    .report-table .total-row { background: #ecf0f1; font-weight: bold; }
    .report-table .total-row td { border-top: 2px solid #34495e; border-bottom: 3px double #34495e; }
    
    .report-summary { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 20px; padding: 10px 0; }
    .summary-row.profit { color: #27ae60; }
    .summary-row.loss { color: #e74c3c; }
    
    .balance-status { text-align: center; font-size: 18px; font-weight: bold; padding: 15px; border-radius: 8px; }
    .balance-status.balanced { background: #d5f4e6; color: #27ae60; }
    .balance-status.unbalanced { background: #fadbd8; color: #e74c3c; }
    
    .btn-primary, .btn-secondary { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .btn-primary { background: #3498db; color: white; }
    .btn-primary:hover { background: #2980b9; }
    .btn-secondary { background: #95a5a6; color: white; }
    .btn-secondary:hover { background: #7f8c8d; }
    .icon { margin-right: 5px; }
    
    @media print {
      .header, .report-selector, .report-parameters { display: none; }
      .report-display { box-shadow: none; padding: 0; }
    }
  `]
})
export class FinancialReportsComponent implements OnInit {
  selectedReportType = '';
  currentReport: any = null;
  companyName = 'ERP Finance Module';
  
  startDate = '';
  endDate = '';
  asOfDate = '';
  
  selectedAccountId = '';
  accounts: Account[] = [];
  
  private apiUrl = 'http://localhost:8080/api';
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.loadAccounts();
    this.setDefaultDates();
  }
  
  setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
    this.asOfDate = today.toISOString().split('T')[0];
  }
  
  loadAccounts() {
    this.http.get<Account[]>(`${this.apiUrl}/accounts`).subscribe({
      next: (data) => {
        this.accounts = data.filter(a => a.type !== 'EQUITY');
      },
      error: (error) => console.error('Error loading accounts:', error)
    });
  }
  
  selectReport(reportType: string) {
    this.selectedReportType = reportType;
    this.currentReport = null;
  }
  
  needsDateRange(): boolean {
    return ['income-statement', 'cash-flow', 'account-ledger'].includes(this.selectedReportType);
  }
  
  needsAsOfDate(): boolean {
    return ['balance-sheet', 'trial-balance'].includes(this.selectedReportType);
  }
  
  generateReport() {
    switch (this.selectedReportType) {
      case 'income-statement':
        this.getIncomeStatement();
        break;
      case 'balance-sheet':
        this.getBalanceSheet();
        break;
      case 'trial-balance':
        this.getTrialBalance();
        break;
      case 'cash-flow':
        this.getCashFlowStatement();
        break;
      case 'account-ledger':
        this.getAccountLedger();
        break;
    }
  }
  
  getIncomeStatement() {
    this.http.get(`${this.apiUrl}/reports/income-statement?startDate=${this.startDate}&endDate=${this.endDate}`)
      .subscribe({
        next: (data) => {
          this.currentReport = data;
        },
        error: (error) => {
          console.error('Error generating report:', error);
          alert('Error generating Income Statement');
        }
      });
  }
  
  getBalanceSheet() {
    this.http.get(`${this.apiUrl}/reports/balance-sheet?asOfDate=${this.asOfDate}`)
      .subscribe({
        next: (data) => {
          this.currentReport = data;
        },
        error: (error) => {
          console.error('Error generating report:', error);
          alert('Error generating Balance Sheet');
        }
      });
  }
  
  getTrialBalance() {
    this.http.get(`${this.apiUrl}/reports/trial-balance?asOfDate=${this.asOfDate}`)
      .subscribe({
        next: (data) => {
          this.currentReport = data;
        },
        error: (error) => {
          console.error('Error generating report:', error);
          alert('Error generating Trial Balance');
        }
      });
  }
  
  getCashFlowStatement() {
    this.http.get(`${this.apiUrl}/reports/cash-flow?startDate=${this.startDate}&endDate=${this.endDate}`)
      .subscribe({
        next: (data) => {
          this.currentReport = data;
        },
        error: (error) => {
          console.error('Error generating report:', error);
          alert('Error generating Cash Flow Statement');
        }
      });
  }
  
  getAccountLedger() {
    if (!this.selectedAccountId) {
      alert('Please select an account');
      return;
    }
    
    this.http.get(`${this.apiUrl}/reports/account-ledger/${this.selectedAccountId}?startDate=${this.startDate}&endDate=${this.endDate}`)
      .subscribe({
        next: (data) => {
          this.currentReport = data;
        },
        error: (error) => {
          console.error('Error generating report:', error);
          alert('Error generating Account Ledger');
        }
      });
  }
  
  exportReport() {
    if (!this.currentReport) {
      alert('Please generate a report first');
      return;
    }

    const wb = XLSX.utils.book_new();
    let exportData: any[] = [];
    let sheetName = '';

    // Prepare data based on report type
    switch (this.selectedReportType) {
      case 'income-statement':
        sheetName = 'Income Statement';
        exportData = [
          { 'Section': 'REVENUE', 'Account': '', 'Amount': '' },
          ...this.currentReport.revenue.map((item: any) => ({
            'Section': '',
            'Account': item.accountName,
            'Amount': item.amount
          })),
          { 'Section': 'Total Revenue', 'Account': '', 'Amount': this.currentReport.totalRevenue },
          { 'Section': '', 'Account': '', 'Amount': '' },
          { 'Section': 'EXPENSES', 'Account': '', 'Amount': '' },
          ...this.currentReport.expenses.map((item: any) => ({
            'Section': '',
            'Account': item.accountName,
            'Amount': item.amount
          })),
          { 'Section': 'Total Expenses', 'Account': '', 'Amount': this.currentReport.totalExpenses },
          { 'Section': '', 'Account': '', 'Amount': '' },
          { 'Section': 'NET INCOME', 'Account': '', 'Amount': this.currentReport.netIncome }
        ];
        break;

      case 'balance-sheet':
        sheetName = 'Balance Sheet';
        exportData = [
          { 'Section': 'ASSETS', 'Account': '', 'Amount': '' },
          ...this.currentReport.assets.map((item: any) => ({
            'Section': '',
            'Account': item.accountName,
            'Amount': item.balance
          })),
          { 'Section': 'Total Assets', 'Account': '', 'Amount': this.currentReport.totalAssets },
          { 'Section': '', 'Account': '', 'Amount': '' },
          { 'Section': 'LIABILITIES', 'Account': '', 'Amount': '' },
          ...this.currentReport.liabilities.map((item: any) => ({
            'Section': '',
            'Account': item.accountName,
            'Amount': item.balance
          })),
          { 'Section': 'Total Liabilities', 'Account': '', 'Amount': this.currentReport.totalLiabilities },
          { 'Section': '', 'Account': '', 'Amount': '' },
          { 'Section': 'EQUITY', 'Account': '', 'Amount': '' },
          ...this.currentReport.equity.map((item: any) => ({
            'Section': '',
            'Account': item.accountName,
            'Amount': item.balance
          })),
          { 'Section': 'Total Equity', 'Account': '', 'Amount': this.currentReport.totalEquity }
        ];
        break;

      case 'trial-balance':
        sheetName = 'Trial Balance';
        exportData = this.currentReport.accounts.map((account: any) => ({
          'Account Code': account.accountCode,
          'Account Name': account.accountName,
          'Debit': account.debit,
          'Credit': account.credit
        }));
        exportData.push({
          'Account Code': '',
          'Account Name': 'TOTAL',
          'Debit': this.currentReport.totalDebit,
          'Credit': this.currentReport.totalCredit
        });
        break;

      case 'cash-flow':
        sheetName = 'Cash Flow Statement';
        exportData = [
          { 'Section': 'OPERATING ACTIVITIES', 'Description': '', 'Amount': '' },
          ...this.currentReport.operatingActivities.map((item: any) => ({
            'Section': '',
            'Description': item.description,
            'Amount': item.amount
          })),
          { 'Section': 'Net Cash from Operating', 'Description': '', 'Amount': this.currentReport.netOperating },
          { 'Section': '', 'Description': '', 'Amount': '' },
          { 'Section': 'INVESTING ACTIVITIES', 'Description': '', 'Amount': '' },
          ...this.currentReport.investingActivities.map((item: any) => ({
            'Section': '',
            'Description': item.description,
            'Amount': item.amount
          })),
          { 'Section': 'Net Cash from Investing', 'Description': '', 'Amount': this.currentReport.netInvesting },
          { 'Section': '', 'Description': '', 'Amount': '' },
          { 'Section': 'FINANCING ACTIVITIES', 'Description': '', 'Amount': '' },
          ...this.currentReport.financingActivities.map((item: any) => ({
            'Section': '',
            'Description': item.description,
            'Amount': item.amount
          })),
          { 'Section': 'Net Cash from Financing', 'Description': '', 'Amount': this.currentReport.netFinancing },
          { 'Section': '', 'Description': '', 'Amount': '' },
          { 'Section': 'NET CHANGE IN CASH', 'Description': '', 'Amount': this.currentReport.netChange }
        ];
        break;

      case 'account-ledger':
        sheetName = 'Account Ledger';
        exportData = this.currentReport.transactions.map((tx: any) => ({
          'Date': tx.date,
          'Period': tx.period,
          'Description': tx.description,
          'Debit': tx.debit,
          'Credit': tx.credit,
          'Balance': tx.balance
        }));
        break;
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate filename with report type and date
    const date = new Date().toISOString().split('T')[0];
    const filename = `${sheetName.replace(/ /g, '_')}_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  }
}
