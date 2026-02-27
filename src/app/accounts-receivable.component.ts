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
  selector: 'app-accounts-receivable',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, InputTextModule],
  template: `
    <div class="container">
      <div class="module-section">
        <div class="section-header">
          <h2 class="section-title"><i class="fas fa-hand-holding-usd"></i> Accounts Receivable</h2>
          <div class="section-actions">
            <button class="btn btn-primary" (click)="showAddInvoiceModal()" *ngIf="canEdit">
              <i class="fas fa-plus"></i> Create Invoice
            </button>
            <button class="btn btn-success" (click)="recordPaymentModal()" *ngIf="canEdit">
              <i class="fas fa-money-bill-wave"></i> Record Payment
            </button>
            <button class="btn btn-warning" (click)="sendReminders()" *ngIf="canEdit">
              <i class="fas fa-envelope"></i> Send Reminders
            </button>
            <button class="btn btn-outline" (click)="exportData()">
              <i class="fas fa-file-export"></i> Export
            </button>
          </div>
        </div>

        <!-- Metrics Cards -->
        <div class="cards-container">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Total Receivables</div>
              <i class="fas fa-file-invoice" style="color: #ffc107;"></i>
            </div>
            <div class="card-value">$ {{metrics.totalReceivables | number:'1.2-2'}}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Overdue</div>
              <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
            </div>
            <div class="card-value">$ {{metrics.overdue | number:'1.2-2'}}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Due This Week</div>
              <i class="fas fa-calendar-week" style="color: #1a237e;"></i>
            </div>
            <div class="card-value">$ {{metrics.dueThisWeek | number:'1.2-2'}}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Customers</div>
              <i class="fas fa-user-friends" style="color: #28a745;"></i>
            </div>
            <div class="card-value">{{customers.length}}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <div class="tab" [class.active]="activeTab === 'invoices'" (click)="activeTab = 'invoices'">
            Invoices
          </div>
          <div class="tab" [class.active]="activeTab === 'customers'" (click)="activeTab = 'customers'">
            Customers
          </div>
          <div class="tab" [class.active]="activeTab === 'collections'" (click)="activeTab = 'collections'">
            Collections
          </div>
          <div class="tab" [class.active]="activeTab === 'aging'" (click)="activeTab = 'aging'">
            Aging Analysis
          </div>
        </div>

        <!-- Invoices Tab -->
        <div class="tab-content" *ngIf="activeTab === 'invoices'">
          <div class="search-filter">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" class="form-control" [(ngModel)]="searchTerm" 
                     (input)="filterInvoices()" placeholder="Search invoices, customers...">
            </div>
            <select class="form-control filter-dropdown" [(ngModel)]="statusFilter" (change)="filterInvoices()">
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
            </select>
            <select class="form-control filter-dropdown" [(ngModel)]="customerFilter" (change)="filterInvoices()">
              <option value="all">All Customers</option>
              <option *ngFor="let customer of customers" [value]="customer.id">{{customer.name}}</option>
            </select>
          </div>
          
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
                <th pSortableColumn="customerName">
                  Customer <p-sortIcon field="customerName"></p-sortIcon>
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
                <th pSortableColumn="amount" style="width: 130px;">
                  Amount <p-sortIcon field="amount"></p-sortIcon>
                </th>
                <th pSortableColumn="balance" style="width: 130px;">
                  Balance <p-sortIcon field="balance"></p-sortIcon>
                </th>
                <th pSortableColumn="status" style="width: 130px;">
                  Status <p-sortIcon field="status"></p-sortIcon>
                </th>
                <th style="width: 140px;">Actions</th>
              </tr>
            </ng-template>
            
            <ng-template pTemplate="body" let-invoice>
              <tr>
                <td>{{invoice.customerName}}</td>
                <td>{{invoice.invoiceNumber}}</td>
                <td>{{invoice.invoiceDate}}</td>
                <td>{{invoice.dueDate}}</td>
                <td>&#36;{{invoice.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}}</td>
                <td>&#36;{{invoice.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}}</td>
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
                      (onClick)="recordPaymentForInvoice(invoice)" 
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
                <td colspan="8" style="text-align: center; padding: 40px;">
                  <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 10px; display: block;"></i>
                  <span style="color: var(--text-secondary);">No invoices found</span>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Customers Tab -->
        <div class="tab-content" *ngIf="activeTab === 'customers'">
          <div style="margin-bottom: 20px;">
            <button class="btn btn-primary" (click)="showAddCustomerModal()" *ngIf="canEdit">
              <i class="fas fa-plus"></i> Add Customer
            </button>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>GL Account Code</th>
                  <th>Current Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let customer of customers">
                  <td>{{customer.name}}</td>
                  <td>{{customer.contactPerson}}</td>
                  <td>{{customer.email}}</td>
                  <td>{{customer.phone}}</td>
                  <td>
                    <span class="badge badge-info" *ngIf="customer.accountId">
                      {{getAccountCode(customer.accountId)}}
                    </span>
                    <span style="color: #999;" *ngIf="!customer.accountId">No account</span>
                  </td>
                  <td>$ {{customer.balance || 0 | number:'1.2-2'}}</td>
                  <td>
                    <button class="btn btn-sm btn-outline" (click)="editCustomer(customer)" *ngIf="canEdit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="deleteCustomer(customer)" *ngIf="canEdit">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="customers.length === 0">
                  <td colspan="7" style="text-align: center; padding: 20px;">No customers found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Collections Tab -->
        <div class="tab-content" *ngIf="activeTab === 'collections'">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Invoice No.</th>
                  <th>Amount Received</th>
                  <th>Payment Method</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let payment of paymentHistory">
                  <td>{{payment.paymentDate}}</td>
                  <td>{{payment.customerName}}</td>
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
        <div class="modal-content large-modal">
          <div class="modal-header">
            <h3>{{editingInvoice ? 'Edit' : 'Create'}} Invoice</h3>
            <button class="close-btn" (click)="closeInvoiceModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Customer *</label>
                <select class="form-control" [(ngModel)]="invoiceForm.customerId" required>
                  <option value="">Select Customer</option>
                  <option *ngFor="let customer of customers" [value]="customer.id">{{customer.name}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Template</label>
                <select class="form-control" [(ngModel)]="invoiceForm.templateId">
                  <option [value]="null">Default Template</option>
                  <option *ngFor="let template of invoiceTemplates" [value]="template.id">
                    {{template.templateName}} ({{template.templateType}})
                  </option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Invoice Number *</label>
                <input type="text" class="form-control" [(ngModel)]="invoiceForm.invoiceNumber" required>
              </div>
              <div class="form-group">
                <label>Invoice Date *</label>
                <input type="date" class="form-control" [(ngModel)]="invoiceForm.invoiceDate" required>
              </div>
              <div class="form-group">
                <label>Due Date *</label>
                <input type="date" class="form-control" [(ngModel)]="invoiceForm.dueDate" required>
              </div>
            </div>
            
            <!-- Line Items -->
            <div class="line-items-section">
              <h4>Line Items</h4>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="width: 100px">Qty</th>
                    <th style="width: 120px">Unit Price</th>
                    <th style="width: 120px">Total</th>
                    <th style="width: 100px">Type</th>
                    <th style="width: 60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of invoiceForm.items; let i = index">
                    <td>{{item.description}}</td>
                    <td>{{item.quantity}}</td>
                    <td>\${{item.unitPrice | number:'1.2-2'}}</td>
                    <td>\${{item.quantity * item.unitPrice | number:'1.2-2'}}</td>
                    <td>{{item.itemType}}</td>
                    <td>
                      <button class="btn-icon btn-danger" (click)="removeItem(i)" title="Remove">🗑️</button>
                    </td>
                  </tr>
                  <tr *ngIf="invoiceForm.items.length === 0">
                    <td colspan="6" style="text-align: center; color: #999;">No items added. Add items below.</td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Add Item Form -->
              <div class="add-item-form">
                <div class="form-row">
                  <div class="form-group" style="flex: 2">
                    <input type="text" class="form-control" [(ngModel)]="newItem.description" placeholder="Item Description">
                  </div>
                  <div class="form-group" style="flex: 0.5">
                    <input type="number" class="form-control" [(ngModel)]="newItem.quantity" placeholder="Qty" min="1" step="1">
                  </div>
                  <div class="form-group" style="flex: 0.7">
                    <input type="number" class="form-control" [(ngModel)]="newItem.unitPrice" placeholder="Unit Price" min="0" step="0.01">
                  </div>
                  <div class="form-group" style="flex: 0.6">
                    <select class="form-control" [(ngModel)]="newItem.itemType">
                      <option value="PRODUCT">Product</option>
                      <option value="SERVICE">Service</option>
                    </select>
                  </div>
                  <button class="btn btn-success" (click)="addItem()" style="height: 38px; margin-top: 0;">
                    ➕ Add
                  </button>
                </div>
              </div>
            </div>

            <!-- Totals -->
            <div class="totals-section">
              <div class="totals-row">
                <label>Subtotal:</label>
                <span>\${{calculateSubtotal() | number:'1.2-2'}}</span>
              </div>
              <div class="totals-row">
                <label>Tax Amount:</label>
                <input type="number" class="form-control-inline" [(ngModel)]="invoiceForm.taxAmount" step="0.01" min="0">
              </div>
              <div class="totals-row">
                <label>Discount:</label>
                <input type="number" class="form-control-inline" [(ngModel)]="invoiceForm.discountAmount" step="0.01" min="0">
              </div>
              <div class="totals-row grand-total">
                <label>Total:</label>
                <span>\${{calculateTotal() | number:'1.2-2'}}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea class="form-control" [(ngModel)]="invoiceForm.description" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeInvoiceModal()">Cancel</button>
            <button class="btn btn-info" (click)="previewInvoice()" *ngIf="invoiceForm.items.length > 0">
              👁️ Preview
            </button>
            <button class="btn btn-primary" (click)="saveInvoice()">Save Invoice</button>
          </div>
        </div>
      </div>

      <!-- Invoice Preview Modal -->
      <div class="modal" *ngIf="showInvoicePreviewModal && previewInvoiceData">
        <div class="modal-content preview-modal">
          <div class="modal-header">
            <h3>Invoice Preview</h3>
            <button class="close-btn" (click)="closeInvoicePreview()">&times;</button>
          </div>
          <div class="modal-body preview-body">
            <div class="invoice-preview" #invoicePreview>
              <!-- Company Header -->
              <div class="invoice-header">
                <div class="company-info">
                  <img *ngIf="companySettings?.companyLogo" [src]="companySettings.companyLogo" class="company-logo" alt="Company Logo">
                  <h2 *ngIf="companySettings?.companyName">{{companySettings.companyName}}</h2>
                  <p *ngIf="companySettings?.address">{{companySettings.address}}</p>
                  <p *ngIf="companySettings?.city">{{companySettings.city}}, {{companySettings.state}} {{companySettings.zipCode}}</p>
                  <p *ngIf="companySettings?.phone">Phone: {{companySettings.phone}}</p>
                  <p *ngIf="companySettings?.email">Email: {{companySettings.email}}</p>
                  <p *ngIf="companySettings?.taxId">Tax ID: {{companySettings.taxId}}</p>
                </div>
                <div class="invoice-details">
                  <h1>INVOICE</h1>
                  <p><strong>Invoice #:</strong> {{previewInvoiceData.invoiceNumber}}</p>
                  <p><strong>Date:</strong> {{previewInvoiceData.invoiceDate}}</p>
                  <p><strong>Due Date:</strong> {{previewInvoiceData.dueDate}}</p>
                </div>
              </div>

              <!-- Customer Section -->
              <div class="customer-section">
                <h3>Bill To:</h3>
                <p><strong>{{getCustomerName(previewInvoiceData.customerId)}}</strong></p>
              </div>

              <!-- Items Table -->
              <table class="invoice-items">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: center">Quantity</th>
                    <th style="text-align: right">Unit Price</th>
                    <th style="text-align: right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of previewInvoiceData.items">
                    <td>{{item.description}}</td>
                    <td style="text-align: center">{{item.quantity}}</td>
                    <td style="text-align: right">{{companySettings?.currencySymbol || '$'}}{{item.unitPrice | number:'1.2-2'}}</td>
                    <td style="text-align: right">{{companySettings?.currencySymbol || '$'}}{{item.quantity * item.unitPrice | number:'1.2-2'}}</td>
                  </tr>
                  <tr *ngIf="previewInvoiceData.items?.length === 0">
                    <td colspan="4" style="text-align: center; padding: 20px; color: #999;">
                      <p style="margin: 0;">{{previewInvoiceData.description || 'No itemized details available'}}</p>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Totals -->
              <div class="invoice-totals">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>{{companySettings?.currencySymbol || '$'}}{{previewInvoiceData.subtotal | number:'1.2-2'}}</span>
                </div>
                <div class="total-row" *ngIf="previewInvoiceData.taxAmount > 0">
                  <span>Tax:</span>
                  <span>{{companySettings?.currencySymbol || '$'}}{{previewInvoiceData.taxAmount | number:'1.2-2'}}</span>
                </div>
                <div class="total-row" *ngIf="previewInvoiceData.discountAmount > 0">
                  <span>Discount:</span>
                  <span>-{{companySettings?.currencySymbol || '$'}}{{previewInvoiceData.discountAmount | number:'1.2-2'}}</span>
                </div>
                <div class="total-row grand-total">
                  <span><strong>Total:</strong></span>
                  <span><strong>{{companySettings?.currencySymbol || '$'}}{{previewInvoiceData.amount | number:'1.2-2'}}</strong></span>
                </div>
              </div>

              <!-- Footer -->
              <div class="invoice-footer" *ngIf="companySettings?.invoiceFooterMessage">
                <p>{{companySettings.invoiceFooterMessage}}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeInvoicePreview()">Close</button>
            <button class="btn btn-primary" (click)="printInvoice()">🖨️ Print</button>
            <button class="btn btn-success" (click)="saveFromPreview()" *ngIf="!isViewingExistingInvoice">💾 Save Invoice</button>
          </div>
        </div>
      </div>

      <!-- Record Payment Modal -->
      <div class="modal" *ngIf="showPaymentModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Record Payment</h3>
            <button class="close-btn" (click)="closePaymentModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Invoice</label>
              <select class="form-control" [(ngModel)]="paymentForm.invoiceId" required>
                <option value="">Select Invoice</option>
                <option *ngFor="let inv of unpaidInvoices" [value]="inv.id">
                  {{inv.invoiceNumber}} - {{inv.customerName}} - Balance: {{inv.balance}}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Payment Date</label>
              <input type="date" class="form-control" [(ngModel)]="paymentForm.paymentDate" required>
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input type="number" class="form-control" [(ngModel)]="paymentForm.amount" required step="0.01">
            </div>
            <div class="form-group">
              <label>Payment Method</label>
              <select class="form-control" [(ngModel)]="paymentForm.paymentMethod" required>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
            <div class="form-group">
              <label>Reference</label>
              <input type="text" class="form-control" [(ngModel)]="paymentForm.reference">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closePaymentModal()">Cancel</button>
            <button class="btn btn-primary" (click)="savePayment()">Save</button>
          </div>
        </div>
      </div>

      <!-- Add Customer Modal -->
      <div class="modal" *ngIf="showCustomerModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{editingCustomer ? 'Edit' : 'Add'}} Customer</h3>
            <button class="close-btn" (click)="closeCustomerModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Customer Name</label>
              <input type="text" class="form-control" [(ngModel)]="customerForm.name" required>
            </div>
            <div class="form-group">
              <label>Contact Person</label>
              <input type="text" class="form-control" [(ngModel)]="customerForm.contactPerson">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" [(ngModel)]="customerForm.email">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" class="form-control" [(ngModel)]="customerForm.phone">
            </div>
            <div class="form-group">
              <label>Address</label>
              <textarea class="form-control" [(ngModel)]="customerForm.address" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeCustomerModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveCustomer()">Save</button>
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
    .badge-info { background: #d1ecf1; color: #0c5460; }
    
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.3s; }
    .btn-primary { background: #1a237e; color: white; }
    .btn-primary:hover { background: #0d1b6b; }
    .btn-success { background: #28a745; color: white; }
    .btn-success:hover { background: #218838; }
    .btn-warning { background: #ffc107; color: #212529; }
    .btn-warning:hover { background: #e0a800; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-danger:hover { background: #c82333; }
    .btn-outline { background: transparent; border: 1px solid #ddd; color: #666; }
    .btn-outline:hover { background: #f5f5f5; }
    .btn-sm { padding: 4px 8px; font-size: 12px; }
    
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 10px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
    .large-modal { max-width: 900px; }
    .preview-modal { max-width: 1000px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e0e0e0; }
    .modal-header h3 { margin: 0; color: #1a237e; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
    .modal-body { padding: 20px; }
    .preview-body { padding: 30px; max-height: 70vh; overflow-y: auto; }
    .modal-footer { padding: 20px; border-top: 1px solid #e0e0e0; display: flex; justify-content: flex-end; gap: 10px; }
    
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #333; }
    .form-control { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
    .form-control:focus { outline: none; border-color: #1a237e; }
    .form-row { display: flex; gap: 15px; margin-bottom: 15px; }
    .form-row .form-group { flex: 1; margin-bottom: 0; }
    
    /* Line Items */
    .line-items-section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .line-items-section h4 { margin: 0 0 15px 0; color: #1a237e; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; background: white; }
    .items-table thead { background: #1a237e; color: white; }
    .items-table th,
    .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    .items-table tbody tr:hover { background: #f8f9fa; }
    .add-item-form { padding: 15px; background: white; border-radius: 6px; }
    
    /* Totals */
    .totals-section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; max-width: 400px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 1px; }
    .totals-row label { font-weight: 600; color: #333; }
    .totals-row span { color: #666; }
    .form-control-inline { width: 120px; padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; text-align: right; }
    .grand-total { border-top: 2px solid #1a237e; padding-top: 12px; margin-top: 8px; font-size: 16px; }
    .grand-total label,
    .grand-total span { color: #1a237e; font-weight: 700; }
    
    /* Invoice Preview */
    .invoice-preview { background: white; padding: 40px; font-family: Arial, sans-serif; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #34495e; }
    .company-info { flex: 1; }
    .company-info h2 { margin: 10px 0; color: #2c3e50; font-size: 24px; }
    .company-info p { margin: 5px 0; color: #7f8c8d; font-size: 13px; }
    .company-logo { max-width: 150px; max-height: 80px; margin-bottom: 10px; }
    .invoice-details { text-align: right; }
    .invoice-details h1 { margin: 0 0 10px 0; color: #2c3e50; font-size: 32px; }
    .invoice-details p { margin: 5px 0; color: #7f8c8d; font-size: 13px; }
    .customer-section { margin-bottom: 30px; }
    .customer-section h3 { margin: 0 0 10px 0; color: #34495e; font-size: 16px; }
    .customer-section p { margin: 5px 0; color: #7f8c8d; font-size: 13px; }
    .invoice-items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .invoice-items thead { background: #34495e; color: white; }
    .invoice-items th { padding: 12px; text-align: left; font-size: 13px; }
    .invoice-items td { padding: 10px 12px; border-bottom: 1px solid #ecf0f1; font-size: 13px; color: #2c3e50; }
    .invoice-items tbody tr:last-child td { border-bottom: 2px solid #34495e; }
    .invoice-totals { margin-left: auto; width: 300px; margin-bottom: 30px; }
    .invoice-totals .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #2c3e50; }
    .invoice-totals .grand-total { border-top: 2px solid #34495e; padding-top: 12px; font-size: 16px; }
    .invoice-footer { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin-top: 30px; }
    .invoice-footer p { margin: 0; color: #7f8c8d; font-size: 14px; font-style: italic; }
    
    @media print {
      .modal-header,
      .modal-footer { display: none; }
      .invoice-preview { padding: 0; }
    }
  `]
})
export class AccountsReceivableComponent implements OnInit {
  activeTab = 'invoices';
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  unpaidInvoices: any[] = [];
  customers: any[] = [];
  paymentHistory: any[] = [];
  accounts: any[] = [];
  accountsMap: Map<number, any> = new Map();
  searchTerm = '';
  statusFilter = 'all';
  customerFilter = 'all';
  canEdit = false;
  
  metrics = {
    totalReceivables: 0,
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
  showPaymentModal = false;
  showCustomerModal = false;
  showInvoicePreviewModal = false;
  isViewingExistingInvoice = false;
  editingInvoice: any = null;
  editingCustomer: any = null;
  previewInvoiceData: any = null;
  invoiceTemplates: any[] = [];
  companySettings: any = null;
  
  invoiceForm: any = {
    customerId: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    amount: 0,
    description: '',
    templateId: null,
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    items: []
  };
  
  newItem: any = {
    description: '',
    quantity: 1,
    unitPrice: 0,
    itemType: 'PRODUCT'
  };
  
  paymentForm: any = {
    invoiceId: '',
    paymentDate: '',
    amount: 0,
    paymentMethod: 'Bank Transfer',
    reference: ''
  };
  
  customerForm: any = {
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
    this.loadCustomers();
    this.loadPaymentHistory();
    this.loadAccounts();
    this.loadInvoiceTemplates();
    this.loadCompanySettings();
  }

  loadInvoiceTemplates() {
    this.financeService.get('invoice-templates/active').subscribe({
      next: (data: any) => {
        this.invoiceTemplates = data;
      },
      error: (error: any) => {
        console.error('Error loading templates:', error);
      }
    });
  }

  loadCompanySettings() {
    this.financeService.get('company-settings').subscribe({
      next: (data: any) => {
        this.companySettings = data;
      },
      error: (error: any) => {
        console.error('Error loading company settings:', error);
      }
    });
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
    this.financeService.getARInvoices().subscribe({
      next: (data: any) => {
        this.invoices = data;
        this.updateInvoiceStatus();
        this.filterInvoices();
        this.unpaidInvoices = this.invoices.filter(i => i.status !== 'PAID');
        this.calculateMetrics();
        this.calculateAgingAnalysis();
      },
      error: (err) => console.error('Error loading invoices:', err)
    });
  }

  loadCustomers() {
    this.financeService.getCustomers().subscribe({
      next: (data: any) => this.customers = data,
      error: (err) => console.error('Error loading customers:', err)
    });
  }

  loadPaymentHistory() {
    this.financeService.getARPaymentHistory().subscribe({
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
        invoice.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || invoice.status === this.statusFilter;
      const matchesCustomer = this.customerFilter === 'all' || invoice.customerId === this.customerFilter;
      
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }

  calculateMetrics() {
    this.metrics.totalReceivables = this.invoices
      .filter(i => i.status !== 'PAID')
      .reduce((sum, i) => sum + i.balance, 0);
    
    this.metrics.overdue = this.invoices
      .filter(i => i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.balance, 0);
    
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.metrics.dueThisWeek = this.invoices
      .filter(i => {
        const due = new Date(i.dueDate);
        return i.status !== 'PAID' && due >= today && due <= nextWeek;
      })
      .reduce((sum, i) => sum + i.balance, 0);
  }

  calculateAgingAnalysis() {
    const today = new Date();
    this.agingAnalysis = { current: 0, days31to60: 0, days61to90: 0, over90: 0 };
    
    this.invoices.filter(i => i.status !== 'PAID').forEach(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue <= 30) this.agingAnalysis.current += invoice.balance;
      else if (daysOverdue <= 60) this.agingAnalysis.days31to60 += invoice.balance;
      else if (daysOverdue <= 90) this.agingAnalysis.days61to90 += invoice.balance;
      else this.agingAnalysis.over90 += invoice.balance;
    });
  }

  getCustomerTotalReceivable(customerId: string): number {
    return this.invoices
      .filter(i => i.customerId === customerId && i.status !== 'PAID')
      .reduce((sum, i) => sum + i.balance, 0);
  }

  getAccountCode(accountId: number): string {
    const account = this.accountsMap.get(accountId);
    return account ? account.code : 'N/A';
  }

  showAddInvoiceModal() {
    this.editingInvoice = null;
    this.invoiceForm = {
      customerId: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      amount: 0,
      description: '',
      templateId: null,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      items: []
    };
    this.newItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      itemType: 'PRODUCT'
    };
    this.showInvoiceModal = true;
  }

  closeInvoiceModal() {
    this.showInvoiceModal = false;
  }

  addItem() {
    if (!this.newItem.description || this.newItem.quantity <= 0 || this.newItem.unitPrice < 0) {
      alert('Please fill in all item fields correctly');
      return;
    }

    this.invoiceForm.items.push({
      description: this.newItem.description,
      quantity: this.newItem.quantity,
      unitPrice: this.newItem.unitPrice,
      itemType: this.newItem.itemType
    });

    // Reset new item form
    this.newItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      itemType: 'PRODUCT'
    };
  }

  removeItem(index: number) {
    this.invoiceForm.items.splice(index, 1);
  }

  calculateSubtotal(): number {
    return this.invoiceForm.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  }

  calculateTotal(): number {
    const subtotal = this.calculateSubtotal();
    const tax = parseFloat(this.invoiceForm.taxAmount) || 0;
    const discount = parseFloat(this.invoiceForm.discountAmount) || 0;
    return subtotal + tax - discount;
  }

  previewInvoice() {
    if (this.invoiceForm.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    this.previewInvoiceData = {
      ...this.invoiceForm,
      subtotal: this.calculateSubtotal(),
      amount: this.calculateTotal()
    };
    this.isViewingExistingInvoice = false;
    this.showInvoicePreviewModal = true;
  }

  closeInvoicePreview() {
    this.showInvoicePreviewModal = false;
  }

  printInvoice() {
    window.print();
  }

  getCustomerName(customerId: string): string {
    const customer = this.customers.find((c: any) => c.id == customerId);
    return customer ? customer.name : 'Unknown Customer';
  }

  saveFromPreview() {
    this.closeInvoicePreview();
    this.saveInvoice();
  }

  saveInvoice() {
    if (!this.invoiceForm.customerId || !this.invoiceForm.invoiceNumber) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.invoiceForm.items.length === 0) {
      alert('Please add at least one item to the invoice');
      return;
    }

    const subtotal = this.calculateSubtotal();
    const total = this.calculateTotal();

    const invoiceDTO = {
      invoice: {
        customerId: this.invoiceForm.customerId,
        invoiceNumber: this.invoiceForm.invoiceNumber,
        invoiceDate: this.invoiceForm.invoiceDate,
        dueDate: this.invoiceForm.dueDate,
        amount: total,
        balance: total,
        description: this.invoiceForm.description,
        templateId: this.invoiceForm.templateId,
        subtotal: subtotal,
        taxAmount: parseFloat(this.invoiceForm.taxAmount) || 0,
        discountAmount: parseFloat(this.invoiceForm.discountAmount) || 0,
        status: 'PENDING'
      },
      items: this.invoiceForm.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        itemType: item.itemType
      }))
    };

    if (this.editingInvoice) {
      this.financeService.put(`ar/invoices/${this.editingInvoice.id}/with-items`, invoiceDTO).subscribe({
        next: () => {
          alert('Invoice updated successfully!');
          this.closeInvoiceModal();
          this.loadInvoices();
        },
        error: (error: any) => {
          console.error('Error updating invoice:', error);
          alert('Error updating invoice');
        }
      });
    } else {
      this.financeService.post('ar/invoices/with-items', invoiceDTO).subscribe({
        next: () => {
          alert('Invoice created successfully!');
          this.closeInvoiceModal();
          this.loadInvoices();
        },
        error: (error: any) => {
          console.error('Error creating invoice:', error);
          alert('Error creating invoice');
        }
      });
    }
  }

  recordPaymentModal() {
    this.paymentForm = {
      invoiceId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'Bank Transfer',
      reference: ''
    };
    this.showPaymentModal = true;
  }

  recordPaymentForInvoice(invoice: any) {
    this.paymentForm = {
      invoiceId: invoice.id,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: invoice.balance,
      paymentMethod: 'Bank Transfer',
      reference: ''
    };
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
  }

  savePayment() {
    if (!this.paymentForm.invoiceId || !this.paymentForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    this.financeService.recordARPayment(this.paymentForm).subscribe({
      next: () => {
        this.loadData();
        this.closePaymentModal();
      },
      error: (err) => alert('Error recording payment: ' + err.message)
    });
  }

  viewInvoice(invoice: any) {
    // Load invoice with items to show in preview
    this.financeService.get(`ar/invoices/${invoice.id}/with-items`).subscribe({
      next: (data: any) => {
        this.previewInvoiceData = {
          invoiceNumber: data.invoice.invoiceNumber,
          invoiceDate: data.invoice.invoiceDate,
          dueDate: data.invoice.dueDate,
          customerId: data.invoice.customerId,
          description: data.invoice.description,
          subtotal: data.invoice.subtotal || 0,
          taxAmount: data.invoice.taxAmount || 0,
          discountAmount: data.invoice.discountAmount || 0,
          amount: data.invoice.amount,
          items: data.items || []
        };
        this.isViewingExistingInvoice = true;
        this.showInvoicePreviewModal = true;
      },
      error: (error: any) => {
        console.error('Error loading invoice:', error);
        // Fallback to basic invoice data if items endpoint fails
        this.previewInvoiceData = {
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          customerId: invoice.customerId,
          description: invoice.description,
          subtotal: invoice.amount,
          taxAmount: 0,
          discountAmount: 0,
          amount: invoice.amount,
          items: []
        };
        this.isViewingExistingInvoice = true;
        this.showInvoicePreviewModal = true;
      }
    });
  }

  deleteInvoice(invoice: any) {
    if (confirm(`Delete invoice ${invoice.invoiceNumber}?`)) {
      this.financeService.deleteARInvoice(invoice.id).subscribe({
        next: () => this.loadInvoices(),
        error: (err) => alert('Error deleting invoice: ' + err.message)
      });
    }
  }

  showAddCustomerModal() {
    this.editingCustomer = null;
    this.customerForm = {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: ''
    };
    this.showCustomerModal = true;
  }

  closeCustomerModal() {
    this.showCustomerModal = false;
  }

  saveCustomer() {
    if (!this.customerForm.name) {
      alert('Please enter customer name');
      return;
    }

    if (this.editingCustomer) {
      this.financeService.updateCustomer(this.editingCustomer.id, this.customerForm).subscribe({
        next: () => {
          this.loadCustomers();
          this.closeCustomerModal();
        },
        error: (err) => alert('Error updating customer: ' + err.message)
      });
    } else {
      this.financeService.createCustomer(this.customerForm).subscribe({
        next: () => {
          this.loadCustomers();
          this.closeCustomerModal();
        },
        error: (err) => alert('Error creating customer: ' + err.message)
      });
    }
  }

  editCustomer(customer: any) {
    this.editingCustomer = customer;
    this.customerForm = { ...customer };
    this.showCustomerModal = true;
  }

  deleteCustomer(customer: any) {
    if (confirm(`Delete customer ${customer.name}?`)) {
      this.financeService.deleteCustomer(customer.id).subscribe({
        next: () => this.loadCustomers(),
        error: (err) => alert('Error deleting customer: ' + err.message)
      });
    }
  }

  sendReminders() {
    const overdueCount = this.invoices.filter(i => i.status === 'OVERDUE').length;
    if (overdueCount > 0) {
      alert(`Sending reminders to ${overdueCount} customers with overdue invoices...`);
    } else {
      alert('No overdue invoices found');
    }
  }

  exportData() {
    if (!this.filteredInvoices || this.filteredInvoices.length === 0) {
      alert('No invoices to export. Please add invoices first.');
      return;
    }

    // Prepare data for export
    const exportData = this.filteredInvoices.map(invoice => {
      const customer = this.customers.find(c => c.id === invoice.customerId);
      return {
        'Invoice Number': invoice.invoiceNumber,
        'Customer': customer ? customer.name : 'Unknown',
        'Invoice Date': invoice.invoiceDate,
        'Due Date': invoice.dueDate,
        'Amount': invoice.amount,
        'Balance': invoice.balance,
        'Status': invoice.status,
        'Description': invoice.description || ''
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Invoice Number
      { wch: 25 }, // Customer
      { wch: 12 }, // Invoice Date
      { wch: 12 }, // Due Date
      { wch: 12 }, // Amount
      { wch: 12 }, // Balance
      { wch: 15 }, // Status
      { wch: 40 }  // Description
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts Receivable');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `Accounts_Receivable_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  }

  getInvoiceStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    switch(status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'OVERDUE': return 'danger';
      case 'PARTIALLY_PAID': return 'info';
      default: return 'info';
    }
  }
}
