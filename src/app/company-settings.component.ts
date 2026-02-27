import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface CompanySettings {
  id?: number;
  companyName: string;
  companyLogo?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  invoiceFooterMessage?: string;
  termsAndConditions?: string;
  currency?: string;
  currencySymbol?: string;
}

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="company-settings-container">
      <div class="header">
        <h2>⚙️ Company Settings</h2>
        <button class="btn-primary" (click)="saveSettings()">
          <i class="icon">💾</i> Save Settings
        </button>
      </div>

      <div class="settings-card">
        <h3>Company Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label>Company Name *</label>
            <input type="text" [(ngModel)]="settings.companyName" placeholder="Enter company name" required>
          </div>
        </div>

        <div class="form-group full-width">
          <label>Company Logo</label>
          <div class="logo-upload-container">
            <div class="logo-upload-options">
              <div class="upload-method">
                <label class="upload-btn">
                  <i class="icon">📁</i> Browse Computer
                  <input type="file" accept="image/*" (change)="onFileSelected($event)" hidden>
                </label>
              </div>
              <div class="upload-divider">OR</div>
              <div class="upload-method">
                <input type="text" [(ngModel)]="settings.companyLogo" placeholder="Enter image URL">
              </div>
            </div>
            <small>Upload a logo from your computer or provide an image URL</small>
            
            <!-- Logo Preview -->
            <div class="logo-preview-inline" *ngIf="settings.companyLogo">
              <img [src]="settings.companyLogo" alt="Company Logo" (error)="onImageError()">
              <button class="btn-remove" (click)="removeLogo()" type="button">✕ Remove</button>
              <p *ngIf="imageLoadError" class="error-text">Failed to load logo</p>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label>Address</label>
            <input type="text" [(ngModel)]="settings.address" placeholder="Street address">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>City</label>
            <input type="text" [(ngModel)]="settings.city" placeholder="City">
          </div>
          <div class="form-group">
            <label>State/Province</label>
            <input type="text" [(ngModel)]="settings.state" placeholder="State">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>ZIP/Postal Code</label>
            <input type="text" [(ngModel)]="settings.zipCode" placeholder="Postal code">
          </div>
          <div class="form-group">
            <label>Country</label>
            <input type="text" [(ngModel)]="settings.country" placeholder="Country">
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>Contact Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label>Phone</label>
            <input type="text" [(ngModel)]="settings.phone" placeholder="+1 (555) 123-4567">
          </div>
          <div class="form-group">
            <label>Fax</label>
            <input type="text" [(ngModel)]="settings.fax" placeholder="+1 (555) 123-4568">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="settings.email" placeholder="info@company.com">
          </div>
          <div class="form-group">
            <label>Website</label>
            <input type="text" [(ngModel)]="settings.website" placeholder="www.company.com">
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>Tax & Registration</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label>Tax ID / VAT Number</label>
            <input type="text" [(ngModel)]="settings.taxId" placeholder="XX-XXXXXXX">
          </div>
          <div class="form-group">
            <label>Registration Number</label>
            <input type="text" [(ngModel)]="settings.registrationNumber" placeholder="Registration #">
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>Currency Settings</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label>Currency Code</label>
            <select [(ngModel)]="settings.currency">
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>
          <div class="form-group">
            <label>Currency Symbol</label>
            <input type="text" [(ngModel)]="settings.currencySymbol" placeholder="$" maxlength="3">
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>Invoice Footer Message</h3>
        
        <div class="form-group full-width">
          <label>Default Footer Message</label>
          <textarea 
            [(ngModel)]="settings.invoiceFooterMessage" 
            rows="3" 
            placeholder="Thank you for your business! We appreciate your trust."></textarea>
          <small>This message will appear at the bottom of all invoices</small>
        </div>
      </div>

      <div class="settings-card">
        <h3>Terms & Conditions</h3>
        
        <div class="form-group full-width">
          <label>Terms and Conditions</label>
          <textarea 
            [(ngModel)]="settings.termsAndConditions" 
            rows="5" 
            placeholder="Enter your terms and conditions here..."></textarea>
          <small>These will be included in invoices when needed</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-settings-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
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

    .settings-card {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .settings-card h3 {
      margin: 0 0 20px 0;
      color: #34495e;
      font-size: 18px;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 15px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
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
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
    }

    .form-group small {
      color: #7f8c8d;
      font-size: 12px;
      margin-top: 3px;
    }

    .btn-primary {
      background: #3498db;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .icon {
      font-size: 16px;
    }

    .logo-upload-container {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 20px;
      background: #f8f9fa;
    }

    .logo-upload-options {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .upload-method {
      flex: 1;
      min-width: 200px;
    }

    .upload-method input[type="text"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    }

    .upload-btn:hover {
      background: #2980b9;
    }

    .upload-divider {
      font-weight: 600;
      color: #7f8c8d;
      padding: 0 10px;
    }

    .logo-preview-inline {
      margin-top: 15px;
      padding: 15px;
      background: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }

    .logo-preview-inline img {
      max-width: 200px;
      max-height: 100px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 5px;
    }

    .btn-remove {
      padding: 6px 12px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    .btn-remove:hover {
      background: #c0392b;
    }

    .logo-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .logo-preview img {
      max-width: 300px;
      max-height: 150px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
    }

    .error-text {
      color: #e74c3c;
      font-size: 13px;
      margin: 0;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CompanySettingsComponent implements OnInit {
  settings: CompanySettings = {
    companyName: '',
    currency: 'USD',
    currencySymbol: '$'
  };
  
  imageLoadError = false;
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.http.get<CompanySettings>(`${this.apiUrl}/company-settings`).subscribe({
      next: (data) => {
        this.settings = data;
      },
      error: (error) => {
        console.error('Error loading company settings:', error);
        alert('Error loading company settings');
      }
    });
  }

  saveSettings() {
    if (!this.settings.companyName) {
      alert('Company name is required');
      return;
    }

    this.http.put<CompanySettings>(`${this.apiUrl}/company-settings`, this.settings).subscribe({
      next: (data) => {
        this.settings = data;
        alert('Company settings saved successfully!');
      },
      error: (error) => {
        console.error('Error saving company settings:', error);
        alert('Error saving company settings');
      }
    });
  }

  onImageError() {
    this.imageLoadError = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.settings.companyLogo = e.target.result;
        this.imageLoadError = false;
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
    if (confirm('Are you sure you want to remove the logo?')) {
      this.settings.companyLogo = '';
      this.imageLoadError = false;
    }
  }
}
