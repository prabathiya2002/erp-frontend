import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-fixed-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="module-section">
        <div class="section-header">
          <h2 class="section-title"><i class="fas fa-building"></i> Fixed Assets Management</h2>
          <div class="section-actions">
            <button class="btn btn-primary" (click)="showAddAssetModal()" *ngIf="canEdit">
              <i class="fas fa-plus"></i> Add Asset
            </button>
            <button class="btn btn-success" (click)="recordMonthlyDepreciation()" *ngIf="canEdit">
              <i class="fas fa-calculator"></i> Record Depreciation
            </button>
            <button class="btn btn-outline" (click)="exportData()">
              <i class="fas fa-file-export"></i> Export
            </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="cards-container">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Total Asset Value</div>
              <i class="fas fa-dollar-sign" style="color: #28a745;"></i>
            </div>
            <div class="card-value">$ {{metrics.totalValue | number:'1.2-2'}}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Accumulated Depreciation</div>
              <i class="fas fa-chart-line" style="color: #dc3545;"></i>
            </div>
            <div class="card-value">$ {{metrics.totalDepreciation | number:'1.2-2'}}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Net Book Value</div>
              <i class="fas fa-balance-scale" style="color: #1a237e;"></i>
            </div>
            <div class="card-value">$ {{metrics.netBookValue | number:'1.2-2'}}</div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Active Assets</div>
              <i class="fas fa-check-circle" style="color: #28a745;"></i>
            </div>
            <div class="card-value">{{metrics.activeAssets}}</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="search-filter">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" class="form-control" [(ngModel)]="searchTerm" 
                   (input)="filterAssets()" placeholder="Search assets...">
          </div>
          <select class="form-control filter-dropdown" [(ngModel)]="categoryFilter" (change)="filterAssets()">
            <option value="all">All Categories</option>
            <option value="BUILDING">Building</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="FURNITURE">Furniture</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="COMPUTER">Computer</option>
            <option value="MACHINERY">Machinery</option>
            <option value="LAND">Land</option>
            <option value="OTHER">Other</option>
          </select>
          <select class="form-control filter-dropdown" [(ngModel)]="statusFilter" (change)="filterAssets()">
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="FULLY_DEPRECIATED">Fully Depreciated</option>
            <option value="DISPOSED">Disposed</option>
          </select>
        </div>

        <!-- Assets Table -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Purchase Date</th>
                <th>Purchase Cost</th>
                <th>Accumulated Depreciation</th>
                <th>Net Book Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let asset of filteredAssets">
                <td>{{asset.assetCode}}</td>
                <td>{{asset.assetName}}</td>
                <td>{{asset.category}}</td>
                <td>{{asset.purchaseDate}}</td>
                <td>$ {{asset.purchaseCost | number:'1.2-2'}}</td>
                <td>$ {{asset.accumulatedDepreciation | number:'1.2-2'}}</td>
                <td>$ {{calculateNetBookValue(asset) | number:'1.2-2'}}</td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-success': asset.status === 'ACTIVE',
                    'badge-warning': asset.status === 'FULLY_DEPRECIATED',
                    'badge-danger': asset.status === 'DISPOSED'
                  }">{{asset.status}}</span>
                </td>
                <td>
                  <button class="btn btn-sm btn-success" (click)="depreciateAsset(asset)" 
                          *ngIf="canEdit && asset.status === 'ACTIVE'">
                    <i class="fas fa-calculator"></i>
                  </button>
                  <button class="btn btn-sm btn-outline" (click)="viewAsset(asset)">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-warning" (click)="disposeAsset(asset)" 
                          *ngIf="canEdit && asset.status !== 'DISPOSED'">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" (click)="deleteAsset(asset)" *ngIf="canEdit">
                    <i class="fas fa-times"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredAssets.length === 0">
                <td colspan="9" style="text-align: center; padding: 20px;">No fixed assets found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Asset Modal -->
      <div class="modal" *ngIf="showAssetModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{editingAsset ? 'Edit' : 'Add'}} Fixed Asset</h3>
            <button class="close-btn" (click)="closeAssetModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Asset Name *</label>
              <input type="text" class="form-control" [(ngModel)]="assetForm.assetName" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Asset Code</label>
                <input type="text" class="form-control" [(ngModel)]="assetForm.assetCode" 
                       placeholder="Auto-generated if empty">
              </div>
              <div class="form-group">
                <label>Category *</label>
                <select class="form-control" [(ngModel)]="assetForm.category" required>
                  <option value="">Select Category</option>
                  <option value="BUILDING">Building</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="FURNITURE">Furniture</option>
                  <option value="VEHICLE">Vehicle</option>
                  <option value="COMPUTER">Computer</option>
                  <option value="MACHINERY">Machinery</option>
                  <option value="LAND">Land</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Purchase Date *</label>
                <input type="date" class="form-control" [(ngModel)]="assetForm.purchaseDate" required>
              </div>
              <div class="form-group">
                <label>Purchase Cost *</label>
                <input type="number" class="form-control" [(ngModel)]="assetForm.purchaseCost" 
                       required step="0.01" min="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Salvage Value</label>
                <input type="number" class="form-control" [(ngModel)]="assetForm.salvageValue" 
                       step="0.01" min="0">
              </div>
              <div class="form-group">
                <label>Useful Life (Years) *</label>
                <input type="number" class="form-control" [(ngModel)]="assetForm.usefulLifeYears" 
                       required min="1">
              </div>
            </div>
            <div class="form-group">
              <label>Depreciation Method *</label>
              <select class="form-control" [(ngModel)]="assetForm.depreciationMethod" required>
                <option value="">Select Method</option>
                <option value="STRAIGHT_LINE">Straight Line</option>
                <option value="DECLINING_BALANCE">Declining Balance</option>
              </select>
            </div>
            <div class="form-group">
              <label>Location</label>
              <input type="text" class="form-control" [(ngModel)]="assetForm.location">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" [(ngModel)]="assetForm.description" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeAssetModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveAsset()">Save</button>
          </div>
        </div>
      </div>

      <!-- Dispose Modal -->
      <div class="modal" *ngIf="showDisposeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Dispose Asset</h3>
            <button class="close-btn" (click)="closeDisposeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>Asset:</strong> {{selectedAsset?.assetName}}</p>
            <p><strong>Net Book Value:</strong> $ {{calculateNetBookValue(selectedAsset) | number:'1.2-2'}}</p>
            <div class="form-group">
              <label>Disposal Date *</label>
              <input type="date" class="form-control" [(ngModel)]="disposeForm.date" required>
            </div>
            <div class="form-group">
              <label>Disposal Amount *</label>
              <input type="number" class="form-control" [(ngModel)]="disposeForm.amount" 
                     required step="0.01" min="0">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeDisposeModal()">Cancel</button>
            <button class="btn btn-warning" (click)="confirmDispose()">Dispose Asset</button>
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
    .btn-warning { background: #ffc107; color: #212529; }
    .btn-warning:hover { background: #e0a800; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-danger:hover { background: #c82333; }
    .btn-outline { background: transparent; border: 1px solid #ddd; color: #666; }
    .btn-outline:hover { background: #f5f5f5; }
    .btn-sm { padding: 4px 8px; font-size: 12px; }
    
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 10px; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e0e0e0; }
    .modal-header h3 { margin: 0; color: #1a237e; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
    .modal-body { padding: 20px; }
    .modal-footer { padding: 20px; border-top: 1px solid #e0e0e0; display: flex; justify-content: flex-end; gap: 10px; }
    
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #333; }
    .form-control { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
    .form-control:focus { outline: none; border-color: #1a237e; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  `]
})
export class FixedAssetsComponent implements OnInit {
  assets: any[] = [];
  filteredAssets: any[] = [];
  searchTerm = '';
  categoryFilter = 'all';
  statusFilter = 'all';
  canEdit = false;
  
  metrics = {
    totalValue: 0,
    totalDepreciation: 0,
    netBookValue: 0,
    activeAssets: 0
  };
  
  showAssetModal = false;
  showDisposeModal = false;
  editingAsset: any = null;
  selectedAsset: any = null;
  
  assetForm: any = {
    assetName: '',
    assetCode: '',
    category: '',
    purchaseDate: '',
    purchaseCost: 0,
    salvageValue: 0,
    usefulLifeYears: 5,
    depreciationMethod: 'STRAIGHT_LINE',
    location: '',
    description: ''
  };
  
  disposeForm: any = {
    date: '',
    amount: 0
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const userIndex = sessionStorage.getItem('currentUserIndex');
    // System Admin (index 0) and Accountant (index 1) can edit, Account Executive (index 2) is read-only
    this.canEdit = userIndex === '0' || userIndex === '1' || userIndex === null;
    this.loadAssets();
  }

  loadAssets() {
    this.http.get<any[]>('/api/fixed-assets').subscribe({
      next: (data) => {
        this.assets = data;
        this.filterAssets();
        this.calculateMetrics();
      },
      error: (err) => console.error('Error loading assets:', err)
    });
  }

  filterAssets() {
    this.filteredAssets = this.assets.filter(asset => {
      const matchesSearch = !this.searchTerm || 
        asset.assetName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        asset.assetCode.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = this.categoryFilter === 'all' || asset.category === this.categoryFilter;
      const matchesStatus = this.statusFilter === 'all' || asset.status === this.statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  calculateMetrics() {
    this.metrics.totalValue = this.assets.reduce((sum, a) => sum + a.purchaseCost, 0);
    this.metrics.totalDepreciation = this.assets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
    this.metrics.netBookValue = this.metrics.totalValue - this.metrics.totalDepreciation;
    this.metrics.activeAssets = this.assets.filter(a => a.status === 'ACTIVE').length;
  }

  calculateNetBookValue(asset: any): number {
    return asset.purchaseCost - asset.accumulatedDepreciation;
  }

  showAddAssetModal() {
    this.editingAsset = null;
    this.assetForm = {
      assetName: '',
      assetCode: '',
      category: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 0,
      salvageValue: 0,
      usefulLifeYears: 5,
      depreciationMethod: 'STRAIGHT_LINE',
      location: '',
      description: ''
    };
    this.showAssetModal = true;
  }

  closeAssetModal() {
    this.showAssetModal = false;
  }

  saveAsset() {
    if (!this.assetForm.assetName || !this.assetForm.category || !this.assetForm.purchaseCost) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.editingAsset) {
      this.http.put(`/api/fixed-assets/${this.editingAsset.id}`, this.assetForm).subscribe({
        next: () => {
          this.loadAssets();
          this.closeAssetModal();
        },
        error: (err) => alert('Error updating asset: ' + err.message)
      });
    } else {
      this.http.post('/api/fixed-assets', this.assetForm).subscribe({
        next: () => {
          this.loadAssets();
          this.closeAssetModal();
        },
        error: (err) => alert('Error creating asset: ' + err.message)
      });
    }
  }

  depreciateAsset(asset: any) {
    if (confirm(`Record depreciation for ${asset.assetName}?`)) {
      const today = new Date().toISOString().split('T')[0];
      this.http.post(`/api/fixed-assets/${asset.id}/depreciate`, { date: today }).subscribe({
        next: () => {
          alert('Depreciation recorded successfully');
          this.loadAssets();
        },
        error: (err) => alert('Error recording depreciation: ' + err.message)
      });
    }
  }

  recordMonthlyDepreciation() {
    const activeAssets = this.assets.filter(a => a.status === 'ACTIVE');
    if (activeAssets.length === 0) {
      alert('No active assets to depreciate');
      return;
    }

    if (confirm(`Record monthly depreciation for ${activeAssets.length} active asset(s)?`)) {
      const today = new Date().toISOString().split('T')[0];
      let processed = 0;
      
      activeAssets.forEach(asset => {
        this.http.post(`/api/fixed-assets/${asset.id}/depreciate`, { date: today }).subscribe({
          next: () => {
            processed++;
            if (processed === activeAssets.length) {
              alert(`Depreciation recorded for ${processed} asset(s)`);
              this.loadAssets();
            }
          },
          error: (err) => {
            processed++;
            console.error('Error depreciating asset:', err);
            if (processed === activeAssets.length) {
              this.loadAssets();
            }
          }
        });
      });
    }
  }

  viewAsset(asset: any) {
    const nbv = this.calculateNetBookValue(asset);
    const details = `Asset Details:\n\nCode: ${asset.assetCode}\nName: ${asset.assetName}\nCategory: ${asset.category}\nPurchase Date: ${asset.purchaseDate}\nPurchase Cost: $${asset.purchaseCost.toFixed(2)}\nSalvage Value: $${asset.salvageValue.toFixed(2)}\nUseful Life: ${asset.usefulLifeYears} years\nDepreciation Method: ${asset.depreciationMethod}\nAccumulated Depreciation: $${asset.accumulatedDepreciation.toFixed(2)}\nNet Book Value: $${nbv.toFixed(2)}\nStatus: ${asset.status}\nLocation: ${asset.location || 'N/A'}\nDescription: ${asset.description || 'N/A'}`;
    alert(details);
  }

  disposeAsset(asset: any) {
    this.selectedAsset = asset;
    this.disposeForm = {
      date: new Date().toISOString().split('T')[0],
      amount: 0
    };
    this.showDisposeModal = true;
  }

  closeDisposeModal() {
    this.showDisposeModal = false;
    this.selectedAsset = null;
  }

  confirmDispose() {
    if (!this.disposeForm.date || this.disposeForm.amount < 0) {
      alert('Please fill in all fields');
      return;
    }

    this.http.post(`/api/fixed-assets/${this.selectedAsset.id}/dispose`, this.disposeForm).subscribe({
      next: () => {
        alert('Asset disposed successfully');
        this.loadAssets();
        this.closeDisposeModal();
      },
      error: (err) => alert('Error disposing asset: ' + err.message)
    });
  }

  deleteAsset(asset: any) {
    if (confirm(`Delete asset ${asset.assetName}? This action cannot be undone.`)) {
      this.http.delete(`/api/fixed-assets/${asset.id}`).subscribe({
        next: () => {
          this.loadAssets();
        },
        error: (err) => alert('Error deleting asset: ' + err.message)
      });
    }
  }

  exportData() {
    if (!this.filteredAssets || this.filteredAssets.length === 0) {
      alert('No assets to export. Please add assets first.');
      return;
    }

    // Prepare data for export
    const exportData = this.filteredAssets.map(asset => ({
      'Asset Code': asset.assetCode,
      'Asset Name': asset.assetName,
      'Category': asset.category,
      'Purchase Date': asset.purchaseDate,
      'Purchase Cost': asset.purchaseCost,
      'Useful Life (Years)': asset.usefulLifeYears,
      'Depreciation Method': asset.depreciationMethod,
      'Accumulated Depreciation': asset.accumulatedDepreciation || 0,
      'Net Book Value': asset.purchaseCost - (asset.accumulatedDepreciation || 0),
      'Status': asset.status,
      'Location': asset.location || '',
      'Description': asset.description || ''
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Asset Code
      { wch: 25 }, // Asset Name
      { wch: 15 }, // Category
      { wch: 12 }, // Purchase Date
      { wch: 15 }, // Purchase Cost
      { wch: 18 }, // Useful Life
      { wch: 20 }, // Depreciation Method
      { wch: 22 }, // Accumulated Depreciation
      { wch: 15 }, // Net Book Value
      { wch: 12 }, // Status
      { wch: 20 }, // Location
      { wch: 30 }  // Description
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fixed Assets');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `Fixed_Assets_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  }
}
