import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, AccountsService } from './services';
import * as XLSX from 'xlsx';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-accounts-payable',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, InputTextModule],
  template: `
    <div class="container">
      <div class="module-section">
        <div class="section-header">
          <h2 class="section-title"><i class="fas fa-file-invoice-dollar"></i> Accounts Payable</h2>
          <div class="section-actions">
            <button class="btn btn-primary" (click)="showAddInvoiceModal()" *ngIf="canEdit">
              <i class="fas fa-plus"></i> Add Invoice
            </button>
            <button class="btn btn-success" (click)="processBatchPayments()" *ngIf="canEdit">
              <i class="fas fa-money-check-alt"></i> Process Payments
            </button>
            <button class="btn btn-outline" (click)="exportData()">
              <i class="fas fa-file-export"></i> Export
            </button>
          </div>
        </div>

        <!-- Search and Filter -->
        <div class="search-filter">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" class="form-control" [(ngModel)]="searchTerm" 
                   (input)="filterInvoices()" placeholder="Search invoices, vendors...">
          </div>
          <select class="form-control filter-dropdown" [(ngModel)]="statusFilter" (change)="filterInvoices()">
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
          </select>
          <select class="form-control filter-dropdown" [(ngModel)]="vendorFilter" (change)="filterInvoices()">
            <option value="all">All Vendors</option>
            <option *ngFor="let vendor of vendors" [value]="vendor.id">{{vendor.name}}</option>
          </select>
        </div>

        <!-- Metrics Cards -->
        <div class="cards-container">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Total Due</div>
              <i class="fas fa-exclamation-circle text-danger"></i>
            </div>
            <div class="card-value">$ {{metrics.totalDue | number:'1.2-2'}}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Overdue</div>
              <i class="fas fa-clock text-warning"></i>
            </div>
            <div class="card-value">$ {{metrics.overdue | number:'1.2-2'}}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Due This Week</div>
              <i class="fas fa-calendar-week text-info"></i>
            </div>
            <div class="card-value">$ {{metrics.dueThisWeek | number:'1.2-2'}}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Vendors</div>
              <i class="fas fa-users text-success"></i>
            </div>
            <div class="card-value">{{vendors.length}}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <div class="tab" [class.active]="activeTab === 'invoices'" (click)="activeTab = 'invoices'">
            Invoices
          </div>
          <div class="tab" [class.active]="activeTab === 'vendors'" (click)="activeTab = 'vendors'">
            Vendors
          </div>
          <div class="tab" [class.active]="activeTab === 'payments'" (click)="activeTab = 'payments'">
            Payment History
          </div>
          <div class="tab" [class.active]="activeTab === 'aging'" (click)="activeTab = 'aging'">
            Aging Analysis
          </div>
        </div>

        <!-- Invoices Tab -->
        <div class="tab-content" *ngIf="activeTab === 'invoices'">
          <p-table 
            [value]="filteredInvoices" 
            [paginator]="true" 
            [rows]="10" 
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 25, 50]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} invoices"
            styleClass="p-datatable-gridlines p-datatable-striped"
            responsiveLayout="scroll">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="vendorName">
                  Vendor <p-sortIcon field="vendorName"></p-sortIcon>
                </th>
                <th pSortableColumn="invoiceNumber">
                  Invoice No. <p-sortIcon field="invoiceNumber"></p-sortIcon>
                </th>
                <th pSortableColumn="invoiceDate">
                  Date <p-sortIcon field="invoiceDate"></p-sortIcon>
                </th>
                <th pSortableColumn="dueDate">
                  Due Date <p-sortIcon field="dueDate"></p-sortIcon>
                </th>
                <th pSortableColumn="amount" style="width: 140px;">
                  Amount <p-sortIcon field="amount"></p-sortIcon>
                </th>
                <th pSortableColumn="status" style="width: 110px;">
                  Status <p-sortIcon field="status"></p-sortIcon>
                </th>
                <th style="width: 140px;">Actions</th>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="body" let-invoice>
              <tr>
                <td>{{invoice.vendorName}}</td>
                <td>{{invoice.invoiceNumber}}</td>
                <td>{{invoice.invoiceDate}}</td>
                <td>{{invoice.dueDate}}</td>
                <td>&#36;{{invoice.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}}</td>
                <td>
                  <p-tag 
                    [value]="invoice.status" 
                    [severity]="getInvoiceStatusSeverity(invoice.status)">
                  </p-tag>
                </td>
                <td>
                  <div style="display: flex; gap: 0.5rem;">
                    <p-button 
                      *ngIf="canEdit && invoice.status !== 'PAID'"
                      icon="pi pi-dollar" 
                      (onClick)="payInvoice(invoice)" 
                      [text]="true" 
                      [rounded]="true"
                      severity="success"
                      size="small"
                      styleClass="p-button-icon-only">
                    </p-button>
                    <p-button 
                      icon="pi pi-eye" 
                      (onClick)="viewInvoice(invoice)" 
                      [text]="true" 
                      [rounded]="true"
                      severity="info"
                      size="small"
                      styleClass="p-button-icon-only">
                    </p-button>
                    <p-button 
                      *ngIf="canEdit"
                      icon="pi pi-trash" 
                      (onClick)="deleteInvoice(invoice)" 
                      [text]="true" 
                      [rounded]="true"
                      severity="danger"
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
                  <span style="color: var(--text-secondary);">No invoices found</span>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Vendors Tab -->
        <div class="tab-content" *ngIf="activeTab === 'vendors'">
          <div style="margin-bottom: 20px;">
            <button class="btn btn-primary" (click)="showAddVendorModal()" *ngIf="canEdit">
              <i class="fas fa-plus"></i> Add Vendor
            </button>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>GL Account Code</th>
                  <th>Current Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let vendor of vendors">
                  <td>{{vendor.name}}</td>
                  <td>{{vendor.contactPerson}}</td>
                  <td>{{vendor.email}}</td>
                  <td>{{vendor.phone}}</td>
                  <td>
                    <span class="badge badge-info" *ngIf="vendor.accountId">
                      {{getAccountCode(vendor.accountId)}}
                    </span>
                    <span class="text-muted" *ngIf="!vendor.accountId">No account</span>
                  </td>
                  <td>$ {{vendor.balance || 0 | number:'1.2-2'}}</td>
                  <td>
                    <button class="btn btn-sm btn-outline" (click)="editVendor(vendor)" *ngIf="canEdit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="deleteVendor(vendor)" *ngIf="canEdit">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="vendors.length === 0">
                  <td colspan="7" style="text-align: center; padding: 20px;">No vendors found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Payment History Tab -->
        <div class="tab-content" *ngIf="activeTab === 'payments'">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Invoice No.</th>
                  <th>Amount Paid</th>
                  <th>Payment Method</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let payment of paymentHistory">
                  <td>{{payment.paymentDate}}</td>
                  <td>{{payment.vendorName}}</td>
                  <td>{{payment.invoiceNumber}}</td>
                  <td>{{payment.amount | number:'1.2-2'}}</td>
                  <td>{{payment.paymentMethod}}</td>
                  <td>{{payment.reference}}</td>
                </tr>
                <tr *ngIf="paymentHistory.length === 0">
                  <td colspan="6" style="text-align: center; padding: 20px;">No payment history found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Aging Analysis Tab -->
        <div class="tab-content" *ngIf="activeTab === 'aging'">
          <div class="cards-container">
            <div class="card">
              <div class="card-header">
                <div class="card-title">Current (0-30 days)</div>
              </div>
              <div class="card-value">$ {{agingAnalysis.current | number:'1.2-2'}}</div>
            </div>
            <div class="card">
              <div class="card-header">
                <div class="card-title">31-60 days</div>
              </div>
              <div class="card-value">$ {{agingAnalysis.days31to60 | number:'1.2-2'}}</div>
            </div>
            <div class="card">
              <div class="card-header">
                <div class="card-title">61-90 days</div>
              </div>
              <div class="card-value">$ {{agingAnalysis.days61to90 | number:'1.2-2'}}</div>
            </div>
            <div class="card">
              <div class="card-header">
                <div class="card-title">Over 90 days</div>
              </div>
              <div class="card-value">$ {{agingAnalysis.over90 | number:'1.2-2'}}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Invoice Modal -->
      <div class="modal" *ngIf="showInvoiceModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{editingInvoice ? 'Edit' : 'Add'}} Invoice</h3>
            <button class="close-btn" (click)="closeInvoiceModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Vendor</label>
              <select class="form-control" [(ngModel)]="invoiceForm.vendorId" required>
                <option value="">Select Vendor</option>
                <option *ngFor="let vendor of vendors" [value]="vendor.id">{{vendor.name}}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Invoice Number</label>
              <input type="text" class="form-control" [(ngModel)]="invoiceForm.invoiceNumber" required>
            </div>
            <div class="form-group">
              <label>Invoice Date</label>
              <input type="date" class="form-control" [(ngModel)]="invoiceForm.invoiceDate" required>
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input type="date" class="form-control" [(ngModel)]="invoiceForm.dueDate" required>
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input type="number" class="form-control" [(ngModel)]="invoiceForm.amount" required step="0.01">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" [(ngModel)]="invoiceForm.description" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeInvoiceModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveInvoice()">Save</button>
          </div>
        </div>
      </div>

      <!-- Add Vendor Modal -->
      <div class="modal" *ngIf="showVendorModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{editingVendor ? 'Edit' : 'Add'}} Vendor</h3>
            <button class="close-btn" (click)="closeVendorModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Vendor Name</label>
              <input type="text" class="form-control" [(ngModel)]="vendorForm.name" required>
            </div>
            <div class="form-group">
              <label>Contact Person</label>
              <input type="text" class="form-control" [(ngModel)]="vendorForm.contactPerson">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" [(ngModel)]="vendorForm.email">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" class="form-control" [(ngModel)]="vendorForm.phone">
            </div>
            <div class="form-group">
              <label>Address</label>
              <textarea class="form-control" [(ngModel)]="vendorForm.address" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeVendorModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveVendor()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .module-section { background: white; border-radius: 8px; padding: 20px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .section-title { font-size: 24px; color: #1a237e; margin: 0; }
    .section-actions { display: flex; gap: 10px; }
    
    .search-filter { display: flex; gap: 10px; margin-bottom: 20px; }
    .search-box { position: relative; flex: 1; }
    .search-box i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #666; }
    .search-box input { padding-left: 35px; }
    .filter-dropdown { max-width: 200px; }
    
    .cards-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .card-title { font-size: 14px; opacity: 0.9; }
    .card-value { font-size: 28px; font-weight: bold; }
    
    .tabs { display: flex; gap: 5px; border-bottom: 2px solid #e0e0e0; margin-bottom: 20px; }
    .tab { padding: 12px 24px; cursor: pointer; color: #666; transition: all 0.3s; }
    .tab:hover { background: #f5f5f5; }
    .tab.active { color: #1a237e; border-bottom: 3px solid #1a237e; font-weight: 600; }
    
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f5f5; font-weight: 600; color: #333; }
    tr:hover { background: #f9f9f9; }
    
    .badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.3s; }
    .btn-primary { background: #1a237e; color: white; }
    .btn-primary:hover { background: #0d1b6b; }
    .btn-success { background: #28a745; color: white; }
    .btn-success:hover { background: #218838; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-danger:hover { background: #c82333; }
    .btn-outline { background: transparent; border: 1px solid #ddd; color: #666; }
    .btn-outline:hover { background: #f5f5f5; }
    .btn-sm { padding: 4px 8px; font-size: 12px; }
    
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 10px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e0e0e0; }
    .modal-header h3 { margin: 0; color: #1a237e; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
    .modal-body { padding: 20px; }
    .modal-footer { padding: 20px; border-top: 1px solid #e0e0e0; display: flex; justify-content: flex-end; gap: 10px; }
    
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #333; }
    .form-control { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
    .form-control:focus { outline: none; border-color: #1a237e; }
  `]
})
export class AccountsPayableComponent implements OnInit {
  activeTab = 'invoices';
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  vendors: any[] = [];
  paymentHistory: any[] = [];
  accounts: any[] = [];
  accountsMap: Map<number, any> = new Map();
  searchTerm = '';
  statusFilter = 'all';
  vendorFilter = 'all';
  canEdit = false;
  
  metrics = {
    totalDue: 0,
    overdue: 0,
    dueThisWeek: 0
  };
  
  agingAnalysis = {
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0
  };
  
  showInvoiceModal = false;
  showVendorModal = false;
  editingInvoice: any = null;
  editingVendor: any = null;
  
  invoiceForm: any = {
    vendorId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    amount: 0,
    description: ''
  };
  
  vendorForm: any = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  };

  constructor(
    private financeService: FinanceService,
    private accountsService: AccountsService
  ) {}

  ngOnInit() {
    // Get current user index from sessionStorage
    const userIndex = sessionStorage.getItem('currentUserIndex');
    // System Admin (index 0) and Accountant (index 1) can edit, Account Executive (index 2) is read-only
    this.canEdit = userIndex === '0' || userIndex === '1' || userIndex === null;
    this.loadData();
  }

  loadData() {
    this.loadInvoices();
    this.loadVendors();
    this.loadPaymentHistory();
    this.loadAccounts();
  }

  loadAccounts() {
    this.accountsService.list().subscribe({
      next: (data: any) => {
        this.accounts = data;
        this.accountsMap = new Map(data.map((acc: any) => [acc.id, acc]));
      },
      error: (err) => console.error('Error loading accounts:', err)
    });
  }

  loadInvoices() {
    this.financeService.getAPInvoices().subscribe({
      next: (data: any) => {
        this.invoices = data;
        this.updateInvoiceStatus();
        this.filterInvoices();
        this.calculateMetrics();
        this.calculateAgingAnalysis();
      },
      error: (err) => console.error('Error loading invoices:', err)
    });
  }

  loadVendors() {
    this.financeService.getVendors().subscribe({
      next: (data: any) => this.vendors = data,
      error: (err) => console.error('Error loading vendors:', err)
    });
  }

  loadPaymentHistory() {
    this.financeService.getAPPaymentHistory().subscribe({
      next: (data: any) => this.paymentHistory = data,
      error: (err) => console.error('Error loading payment history:', err)
    });
  }

  updateInvoiceStatus() {
    const today = new Date();
    this.invoices.forEach(invoice => {
      if (invoice.status !== 'PAID') {
        const dueDate = new Date(invoice.dueDate);
        if (dueDate < today) {
          invoice.status = 'OVERDUE';
        }
      }
    });
  }

  filterInvoices() {
    this.filteredInvoices = this.invoices.filter(invoice => {
      const matchesSearch = !this.searchTerm || 
        invoice.vendorName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || invoice.status === this.statusFilter;
      const matchesVendor = this.vendorFilter === 'all' || invoice.vendorId === this.vendorFilter;
      
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }

  calculateMetrics() {
    this.metrics.totalDue = this.invoices
      .filter(i => i.status !== 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);
    
    this.metrics.overdue = this.invoices
      .filter(i => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.amount, 0);
    
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.metrics.dueThisWeek = this.invoices
      .filter(i => {
        const due = new Date(i.dueDate);
        return i.status !== 'PAID' && due >= today && due <= nextWeek;
      })
      .reduce((sum, i) => sum + i.amount, 0);
  }

  calculateAgingAnalysis() {
    const today = new Date();
    this.agingAnalysis = { current: 0, days31to60: 0, days61to90: 0, over90: 0 };
    
    this.invoices.filter(i => i.status !== 'PAID').forEach(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue <= 30) this.agingAnalysis.current += invoice.amount;
      else if (daysOverdue <= 60) this.agingAnalysis.days31to60 += invoice.amount;
      else if (daysOverdue <= 90) this.agingAnalysis.days61to90 += invoice.amount;
      else this.agingAnalysis.over90 += invoice.amount;
    });
  }

  getVendorTotalDue(vendorId: string): number {
    return this.invoices
      .filter(i => i.vendorId === vendorId && i.status !== 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);
  }

  getAccountCode(accountId: number): string {
    const account = this.accountsMap.get(accountId);
    return account ? account.code : 'N/A';
  }

  showAddInvoiceModal() {
    this.editingInvoice = null;
    this.invoiceForm = {
      vendorId: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      amount: 0,
      description: ''
    };
    this.showInvoiceModal = true;
  }

  closeInvoiceModal() {
    this.showInvoiceModal = false;
  }

  saveInvoice() {
    if (!this.invoiceForm.vendorId || !this.invoiceForm.invoiceNumber || !this.invoiceForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const vendor = this.vendors.find(v => v.id === this.invoiceForm.vendorId);
    const invoice = {
      ...this.invoiceForm,
      vendorName: vendor?.name || '',
      status: 'PENDING'
    };

    if (this.editingInvoice) {
      this.financeService.updateAPInvoice(this.editingInvoice.id, invoice).subscribe({
        next: () => {
          this.loadInvoices();
          this.closeInvoiceModal();
        },
        error: (err) => alert('Error updating invoice: ' + err.message)
      });
    } else {
      this.financeService.createAPInvoice(invoice).subscribe({
        next: () => {
          this.loadInvoices();
          this.closeInvoiceModal();
        },
        error: (err) => alert('Error creating invoice: ' + err.message)
      });
    }
  }

  payInvoice(invoice: any) {
    if (confirm(`Pay invoice ${invoice.invoiceNumber} for $${invoice.amount.toFixed(2)}?`)) {
      this.financeService.payAPInvoice(invoice.id).subscribe({
        next: () => this.loadData(),
        error: (err) => alert('Error paying invoice: ' + err.message)
      });
    }
  }

  viewInvoice(invoice: any) {
    alert(`Invoice Details:\n\nVendor: ${invoice.vendorName}\nInvoice No: ${invoice.invoiceNumber}\nDate: ${invoice.invoiceDate}\nDue Date: ${invoice.dueDate}\nAmount: $${invoice.amount.toFixed(2)}\nStatus: ${invoice.status}\nDescription: ${invoice.description || 'N/A'}`);
  }

  deleteInvoice(invoice: any) {
    if (confirm(`Delete invoice ${invoice.invoiceNumber}?`)) {
      this.financeService.deleteAPInvoice(invoice.id).subscribe({
        next: () => this.loadInvoices(),
        error: (err) => alert('Error deleting invoice: ' + err.message)
      });
    }
  }

  showAddVendorModal() {
    this.editingVendor = null;
    this.vendorForm = {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: ''
    };
    this.showVendorModal = true;
  }

  closeVendorModal() {
    this.showVendorModal = false;
  }

  saveVendor() {
    if (!this.vendorForm.name) {
      alert('Please enter vendor name');
      return;
    }

    if (this.editingVendor) {
      this.financeService.updateVendor(this.editingVendor.id, this.vendorForm).subscribe({
        next: () => {
          this.loadVendors();
          this.closeVendorModal();
        },
        error: (err) => alert('Error updating vendor: ' + err.message)
      });
    } else {
      this.financeService.createVendor(this.vendorForm).subscribe({
        next: () => {
          this.loadVendors();
          this.closeVendorModal();
        },
        error: (err) => alert('Error creating vendor: ' + err.message)
      });
    }
  }

  editVendor(vendor: any) {
    this.editingVendor = vendor;
    this.vendorForm = { ...vendor };
    this.showVendorModal = true;
  }

  deleteVendor(vendor: any) {
    if (confirm(`Delete vendor ${vendor.name}?`)) {
      this.financeService.deleteVendor(vendor.id).subscribe({
        next: () => this.loadVendors(),
        error: (err) => alert('Error deleting vendor: ' + err.message)
      });
    }
  }

  processBatchPayments() {
    const pendingInvoices = this.invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE');
    
    if (pendingInvoices.length === 0) {
      alert('No pending invoices to process');
      return;
    }
    
    const totalAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const message = `Process ${pendingInvoices.length} pending invoice(s)?\n\nTotal Amount: $${totalAmount.toFixed(2)}\n\nThis will mark all pending invoices as PAID and create payment records.`;
    
    if (confirm(message)) {
      let processed = 0;
      let failed = 0;
      
      pendingInvoices.forEach(invoice => {
        this.financeService.payAPInvoice(invoice.id).subscribe({
          next: () => {
            processed++;
            if (processed + failed === pendingInvoices.length) {
              alert(`Batch payment completed!\n\nProcessed: ${processed}\nFailed: ${failed}`);
              this.loadData();
            }
          },
          error: (err) => {
            failed++;
            console.error('Error processing invoice:', invoice.invoiceNumber, err);
            if (processed + failed === pendingInvoices.length) {
              alert(`Batch payment completed!\n\nProcessed: ${processed}\nFailed: ${failed}`);
              this.loadData();
            }
          }
        });
      });
    }
  }

  exportData() {
    if (!this.filteredInvoices || this.filteredInvoices.length === 0) {
      alert('No invoices to export. Please add invoices first.');
      return;
    }

    // Prepare data for export
    const exportData = this.filteredInvoices.map(invoice => {
      const vendor = this.vendors.find(v => v.id === invoice.vendorId);
      return {
        'Invoice Number': invoice.invoiceNumber,
        'Vendor': vendor ? vendor.name : 'Unknown',
        'Invoice Date': invoice.invoiceDate,
        'Due Date': invoice.dueDate,
        'Amount': invoice.amount,
        'Status': invoice.status,
        'Description': invoice.description || ''
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Invoice Number
      { wch: 25 }, // Vendor
      { wch: 12 }, // Invoice Date
      { wch: 12 }, // Due Date
      { wch: 12 }, // Amount
      { wch: 10 }, // Status
      { wch: 40 }  // Description
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts Payable');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `Accounts_Payable_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  }

  getInvoiceStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    switch(status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'OVERDUE': return 'danger';
      default: return 'info';
    }
  }
}
