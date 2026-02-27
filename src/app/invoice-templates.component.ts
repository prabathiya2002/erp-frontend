import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface InvoiceTemplate {
  id?: number;
  templateName: string;
  templateType: 'PRODUCT' | 'SERVICE';
  customFooterMessage?: string;
  showLogo?: boolean;
  showCompanyAddress?: boolean;
  showCompanyPhone?: boolean;
  showCompanyEmail?: boolean;
  showTaxId?: boolean;
  showItemDescription?: boolean;
  showItemQuantity?: boolean;
  showItemPrice?: boolean;
  showItemTotal?: boolean;
  showSubtotal?: boolean;
  showTax?: boolean;
  showDiscount?: boolean;
  showTotal?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
}

@Component({
  selector: 'app-invoice-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="templates-container">
      <div class="header">
        <h2>📄 Invoice Templates</h2>
        <button class="btn-primary" (click)="openCreateModal()">
          <i class="icon">➕</i> Create Template
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">📦</div>
          <div class="card-content">
            <h3>Product Templates</h3>
            <p class="card-value">{{ getProductTemplatesCount() }}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">🛠️</div>
          <div class="card-content">
            <h3>Service Templates</h3>
            <p class="card-value">{{ getServiceTemplatesCount() }}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">⭐</div>
          <div class="card-content">
            <h3>Default Templates</h3>
            <p class="card-value">{{ getDefaultTemplatesCount() }}</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">✅</div>
          <div class="card-content">
            <h3>Active Templates</h3>
            <p class="card-value">{{ getActiveTemplatesCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Templates Table -->
      <div class="table-container">
        <table class="templates-table">
          <thead>
            <tr>
              <th>Template Name</th>
              <th>Type</th>
              <th>Footer Message</th>
              <th>Default</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let template of templates">
              <td>{{ template.templateName }}</td>
              <td>
                <span class="type-badge" [class.type-product]="template.templateType === 'PRODUCT'" 
                      [class.type-service]="template.templateType === 'SERVICE'">
                  {{ template.templateType }}
                </span>
              </td>
              <td class="footer-message">{{ template.customFooterMessage || '-' }}</td>
              <td>
                <span class="badge" [class.badge-default]="template.isDefault">
                  {{ template.isDefault ? '⭐ Default' : '-' }}
                </span>
              </td>
              <td>
                <span class="badge" [class.badge-active]="template.isActive" 
                      [class.badge-inactive]="!template.isActive">
                  {{ template.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" (click)="openEditModal(template)" title="Edit">✏️</button>
                  <button class="btn-icon" (click)="openPreviewModal(template)" title="Preview">👁️</button>
                  <button class="btn-icon btn-danger" (click)="confirmDelete(template)" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="templates.length === 0">
              <td colspan="6" class="no-data">No templates found. Click "Create Template" to add one.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Edit Template' : 'Create Template' }}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>Template Name *</label>
              <input type="text" [(ngModel)]="currentTemplate.templateName" placeholder="e.g., Retail Invoice" required>
            </div>

            <div class="form-group">
              <label>Template Type *</label>
              <select [(ngModel)]="currentTemplate.templateType" required>
                <option value="PRODUCT">Product Invoice</option>
                <option value="SERVICE">Service Invoice</option>
              </select>
            </div>

            <div class="form-group">
              <label>Footer Message</label>
              <textarea 
                [(ngModel)]="currentTemplate.customFooterMessage" 
                rows="3" 
                placeholder="e.g., Thank you for your purchase! Come again soon!"></textarea>
            </div>

            <div class="section-header">Company Information Display</div>
            <div class="checkbox-grid">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showLogo">
                Show Logo
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showCompanyAddress">
                Show Address
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showCompanyPhone">
                Show Phone
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showCompanyEmail">
                Show Email
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showTaxId">
                Show Tax ID
              </label>
            </div>

            <div class="section-header">Item Details Display</div>
            <div class="checkbox-grid">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showItemDescription">
                Show Description
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showItemQuantity">
                Show Quantity
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showItemPrice">
                Show Price
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showItemTotal">
                Show Item Total
              </label>
            </div>

            <div class="section-header">Totals Display</div>
            <div class="checkbox-grid">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showSubtotal">
                Show Subtotal
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showTax">
                Show Tax
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showDiscount">
                Show Discount
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.showTotal">
                Show Total
              </label>
            </div>

            <div class="section-header">Template Settings</div>
            <div class="checkbox-grid">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.isDefault">
                ⭐ Set as Default Template
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="currentTemplate.isActive">
                ✅ Active
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-preview" (click)="showPreview()">
              <i class="icon">👁️</i> Preview
            </button>
            <button class="btn-primary" (click)="saveTemplate()">
              {{ isEditMode ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Modal -->
      <div class="modal" *ngIf="showPreviewModal" (click)="closePreviewModal()">
        <div class="modal-content preview-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Invoice Preview - {{ previewTemplate?.templateName }}</h3>
            <button class="close-btn" (click)="closePreviewModal()">×</button>
          </div>
          <div class="modal-body preview-body">
            <div class="invoice-preview">
              <!-- Company Header -->
              <div class="invoice-header" *ngIf="companySettings">
                <div class="company-info">
                  <img *ngIf="previewTemplate?.showLogo && companySettings.companyLogo" 
                       [src]="companySettings.companyLogo" 
                       alt="Company Logo" 
                       class="company-logo">
                  <h2>{{ companySettings.companyName }}</h2>
                  <div *ngIf="previewTemplate?.showCompanyAddress">
                    <p>{{ companySettings.address }}</p>
                    <p>{{ companySettings.city }}, {{ companySettings.state }} {{ companySettings.zipCode }}</p>
                    <p>{{ companySettings.country }}</p>
                  </div>
                  <p *ngIf="previewTemplate?.showCompanyPhone">Phone: {{ companySettings.phone }}</p>
                  <p *ngIf="previewTemplate?.showCompanyEmail">Email: {{ companySettings.email }}</p>
                  <p *ngIf="previewTemplate?.showTaxId && companySettings.taxId">Tax ID: {{ companySettings.taxId }}</p>
                </div>
                <div class="invoice-details">
                  <h1>INVOICE</h1>
                  <p><strong>Invoice #:</strong> INV-2024-001</p>
                  <p><strong>Date:</strong> {{ currentDate | date:'MM/dd/yyyy' }}</p>
                  <p><strong>Due Date:</strong> {{ dueDate | date:'MM/dd/yyyy' }}</p>
                </div>
              </div>

              <!-- Customer Info -->
              <div class="customer-section">
                <h3>Bill To:</h3>
                <p><strong>Sample Customer</strong></p>
                <p>123 Customer Street</p>
                <p>Customer City, State 12345</p>
              </div>

              <!-- Items Table -->
              <table class="invoice-items">
                <thead>
                  <tr>
                    <th>#</th>
                    <th *ngIf="previewTemplate?.showItemDescription">Description</th>
                    <th *ngIf="previewTemplate?.showItemQuantity">Qty</th>
                    <th *ngIf="previewTemplate?.showItemPrice">Unit Price</th>
                    <th *ngIf="previewTemplate?.showItemTotal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of sampleItems; let i = index">
                    <td>{{ i + 1 }}</td>
                    <td *ngIf="previewTemplate?.showItemDescription">{{ item.description }}</td>
                    <td *ngIf="previewTemplate?.showItemQuantity">{{ item.quantity }}</td>
                    <td *ngIf="previewTemplate?.showItemPrice">{{ companySettings?.currencySymbol }}{{ item.price }}</td>
                    <td *ngIf="previewTemplate?.showItemTotal">{{ companySettings?.currencySymbol }}{{ item.total }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Totals -->
              <div class="invoice-totals">
                <div class="total-row" *ngIf="previewTemplate?.showSubtotal">
                  <span>Subtotal:</span>
                  <span>{{ companySettings?.currencySymbol }}{{ calculateSubtotal() }}</span>
                </div>
                <div class="total-row" *ngIf="previewTemplate?.showTax">
                  <span>Tax (10%):</span>
                  <span>{{ companySettings?.currencySymbol }}{{ calculateTax() }}</span>
                </div>
                <div class="total-row" *ngIf="previewTemplate?.showDiscount">
                  <span>Discount:</span>
                  <span>-{{ companySettings?.currencySymbol }}0.00</span>
                </div>
                <div class="total-row grand-total" *ngIf="previewTemplate?.showTotal">
                  <span><strong>Total:</strong></span>
                  <span><strong>{{ companySettings?.currencySymbol }}{{ calculateGrandTotal() }}</strong></span>
                </div>
              </div>

              <!-- Footer Message -->
              <div class="invoice-footer" *ngIf="previewTemplate?.customFooterMessage || companySettings?.invoiceFooterMessage">
                <p>{{ previewTemplate?.customFooterMessage || companySettings?.invoiceFooterMessage }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closePreviewModal()">Close</button>
            <button class="btn-primary" (click)="printPreview()">
              <i class="icon">🖨️</i> Print
            </button>
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
            <p>Are you sure you want to delete the template "{{ selectedTemplate?.templateName }}"?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeDeleteModal()">Cancel</button>
            <button class="btn-danger" (click)="deleteTemplate()">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .templates-container {
      padding: 20px;
      max-width: 100%;
      overflow-x: hidden;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .card-icon {
      font-size: 40px;
    }

    .card-content h3 {
      margin: 0;
      font-size: 14px;
      color: #7f8c8d;
    }

    .card-value {
      margin: 5px 0 0 0;
      font-size: 28px;
      font-weight: bold;
      color: #2c3e50;
    }

    .table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow-x: auto;
      width: 100%;
    }

    .templates-table {
      width: 100%;
      border-collapse: collapse;
    }

    .templates-table thead {
      background: #34495e;
      color: white;
    }

    .templates-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }

    .templates-table td {
      padding: 12px;
      border-bottom: 1px solid #ecf0f1;
      font-size: 13px;
    }

    .templates-table tbody tr:hover {
      background: #f8f9fa;
    }

    .footer-message {
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .type-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .type-product {
      background: #3498db;
      color: white;
    }

    .type-service {
      background: #9b59b6;
      color: white;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-default {
      background: #f39c12;
      color: white;
    }

    .badge-active {
      background: #27ae60;
      color: white;
    }

    .badge-inactive {
      background: #95a5a6;
      color: white;
    }

    .action-buttons {
      display: flex;
      gap: 5px;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 5px;
      transition: transform 0.2s;
    }

    .btn-icon:hover {
      transform: scale(1.2);
    }

    .btn-primary,
    .btn-secondary,
    .btn-danger {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background: #7f8c8d;
    }

    .btn-danger {
      background: #e74c3c;
      color: white;
    }

    .btn-danger:hover {
      background: #c0392b;
    }

    .btn-preview {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #9b59b6;
      color: white;
    }

    .btn-preview:hover {
      background: #8e44ad;
    }

    .icon {
      font-size: 16px;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #95a5a6;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content.small {
      max-width: 500px;
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #ecf0f1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: #95a5a6;
    }

    .close-btn:hover {
      color: #2c3e50;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #ecf0f1;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 15px;
    }

    .form-group label {
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3498db;
    }

    .section-header {
      font-weight: 600;
      color: #34495e;
      margin: 20px 0 10px 0;
      padding-bottom: 5px;
      border-bottom: 2px solid #3498db;
    }

    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin-bottom: 15px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #2c3e50;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      cursor: pointer;
      width: 18px;
      height: 18px;
    }

    .warning-text {
      color: #e74c3c;
      font-weight: 600;
      margin-top: 10px;
    }

    /* Preview Modal Styles */
    .preview-modal {
      max-width: 900px;
    }

    .preview-body {
      max-height: 70vh;
      overflow-y: auto;
    }

    .invoice-preview {
      background: white;
      padding: 40px;
      font-family: Arial, sans-serif;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #34495e;
    }

    .company-info {
      flex: 1;
    }

    .company-info h2 {
      margin: 10px 0;
      color: #2c3e50;
      font-size: 24px;
    }

    .company-info p {
      margin: 5px 0;
      color: #7f8c8d;
      font-size: 13px;
    }

    .company-logo {
      max-width: 150px;
      max-height: 80px;
      margin-bottom: 10px;
    }

    .invoice-details {
      text-align: right;
    }

    .invoice-details h1 {
      margin: 0 0 10px 0;
      color: #2c3e50;
      font-size: 32px;
    }

    .invoice-details p {
      margin: 5px 0;
      color: #7f8c8d;
      font-size: 13px;
    }

    .customer-section {
      margin-bottom: 30px;
    }

    .customer-section h3 {
      margin: 0 0 10px 0;
      color: #34495e;
      font-size: 16px;
    }

    .customer-section p {
      margin: 5px 0;
      color: #7f8c8d;
      font-size: 13px;
    }

    .invoice-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .invoice-items thead {
      background: #34495e;
      color: white;
    }

    .invoice-items th {
      padding: 12px;
      text-align: left;
      font-size: 13px;
    }

    .invoice-items td {
      padding: 10px 12px;
      border-bottom: 1px solid #ecf0f1;
      font-size: 13px;
      color: #2c3e50;
    }

    .invoice-items tbody tr:last-child td {
      border-bottom: 2px solid #34495e;
    }

    .invoice-totals {
      margin-left: auto;
      width: 300px;
      margin-bottom: 30px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #2c3e50;
    }

    .grand-total {
      border-top: 2px solid #34495e;
      padding-top: 12px;
      font-size: 16px;
      color: #2c3e50;
    }

    .invoice-footer {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-top: 30px;
    }

    .invoice-footer p {
      margin: 0;
      color: #7f8c8d;
      font-size: 14px;
      font-style: italic;
    }

    @media print {
      .modal-header,
      .modal-footer {
        display: none;
      }

      .invoice-preview {
        padding: 0;
      }
    }
  `]
})
export class InvoiceTemplatesComponent implements OnInit {
  templates: InvoiceTemplate[] = [];
  showModal = false;
  showDeleteModal = false;
  isEditMode = false;
  currentTemplate: InvoiceTemplate = this.getEmptyTemplate();
  selectedTemplate: InvoiceTemplate | null = null;

  // Preview modal properties
  showPreviewModal = false;
  previewTemplate: InvoiceTemplate | null = null;
  companySettings: any = null;
  sampleItems = [
    { description: 'Sample Product 1', quantity: 2, price: 50.00, total: 100.00 },
    { description: 'Sample Product 2', quantity: 1, price: 75.00, total: 75.00 },
    { description: 'Sample Product 3', quantity: 3, price: 25.00, total: 75.00 }
  ];
  currentDate = new Date();
  dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTemplates();
    this.initializeDefaultTemplates();
  }

  loadTemplates() {
    this.http.get<InvoiceTemplate[]>(`${this.apiUrl}/invoice-templates`).subscribe({
      next: (data) => {
        this.templates = data;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
      }
    });
  }

  initializeDefaultTemplates() {
    this.http.post(`${this.apiUrl}/invoice-templates/initialize`, {}).subscribe({
      next: () => {
        this.loadTemplates();
      },
      error: (error) => {
        console.error('Error initializing templates:', error);
      }
    });
  }

  getProductTemplatesCount(): number {
    return this.templates.filter(t => t.templateType === 'PRODUCT').length;
  }

  getServiceTemplatesCount(): number {
    return this.templates.filter(t => t.templateType === 'SERVICE').length;
  }

  getDefaultTemplatesCount(): number {
    return this.templates.filter(t => t.isDefault).length;
  }

  getActiveTemplatesCount(): number {
    return this.templates.filter(t => t.isActive).length;
  }

  openCreateModal() {
    this.isEditMode = false;
    this.currentTemplate = this.getEmptyTemplate();
    this.showModal = true;
  }

  openEditModal(template: InvoiceTemplate) {
    this.isEditMode = true;
    this.currentTemplate = { ...template };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveTemplate() {
    if (!this.currentTemplate.templateName || !this.currentTemplate.templateType) {
      alert('Please fill in all required fields');
      return;
    }

    const url = this.isEditMode 
      ? `${this.apiUrl}/invoice-templates/${this.currentTemplate.id}`
      : `${this.apiUrl}/invoice-templates`;
    
    const request = this.isEditMode
      ? this.http.put<InvoiceTemplate>(url, this.currentTemplate)
      : this.http.post<InvoiceTemplate>(url, this.currentTemplate);

    request.subscribe({
      next: () => {
        alert(`Template ${this.isEditMode ? 'updated' : 'created'} successfully!`);
        this.closeModal();
        this.loadTemplates();
      },
      error: (error) => {
        console.error('Error saving template:', error);
        alert('Error saving template');
      }
    });
  }

  confirmDelete(template: InvoiceTemplate) {
    this.selectedTemplate = template;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedTemplate = null;
  }

  deleteTemplate() {
    if (!this.selectedTemplate?.id) return;

    this.http.delete(`${this.apiUrl}/invoice-templates/${this.selectedTemplate.id}`).subscribe({
      next: () => {
        alert('Template deleted successfully!');
        this.closeDeleteModal();
        this.loadTemplates();
      },
      error: (error) => {
        console.error('Error deleting template:', error);
        alert('Error deleting template');
      }
    });
  }

  openPreviewModal(template: InvoiceTemplate) {
    this.previewTemplate = { ...template };
    this.loadCompanySettings();
    this.showPreviewModal = true;
  }

  showPreview() {
    this.previewTemplate = { ...this.currentTemplate };
    this.loadCompanySettings();
    this.showPreviewModal = true;
  }

  closePreviewModal() {
    this.showPreviewModal = false;
  }

  printPreview() {
    window.print();
  }

  loadCompanySettings() {
    this.http.get<any>(`${this.apiUrl}/company-settings`).subscribe({
      next: (data) => {
        this.companySettings = data;
      },
      error: (error) => {
        console.error('Error loading company settings:', error);
        // Use default settings if API call fails
        this.companySettings = {
          companyName: 'Your Company Name',
          companyLogo: '',
          address: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345',
          country: 'Country',
          phone: '(123) 456-7890',
          email: 'info@company.com',
          taxId: 'TAX-123456',
          currencySymbol: '$',
          invoiceFooterMessage: 'Thank you for your business!'
        };
      }
    });
  }

  calculateSubtotal(): number {
    return this.sampleItems.reduce((sum, item) => sum + item.total, 0);
  }

  calculateTax(): number {
    return this.calculateSubtotal() * 0.10; // 10% tax
  }

  calculateGrandTotal(): number {
    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax();
    const discount = 0; // No discount in this example
    return subtotal + tax - discount;
  }

  private getEmptyTemplate(): InvoiceTemplate {
    return {
      templateName: '',
      templateType: 'PRODUCT',
      customFooterMessage: '',
      showLogo: true,
      showCompanyAddress: true,
      showCompanyPhone: true,
      showCompanyEmail: true,
      showTaxId: true,
      showItemDescription: true,
      showItemQuantity: true,
      showItemPrice: true,
      showItemTotal: true,
      showSubtotal: true,
      showTax: true,
      showDiscount: false,
      showTotal: true,
      isDefault: false,
      isActive: true
    };
  }
}
