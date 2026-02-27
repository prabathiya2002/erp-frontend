import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlService } from './services';

@Component({
  standalone: true,
  selector: 'app-trial-balance',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-section">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-balance-scale"></i> Trial Balance Report</h2>
        <div style="display: flex; gap: 15px; align-items: center;">
          <input [(ngModel)]="period" class="form-control" placeholder="Period (e.g., 2026-01)" style="width: 200px;" />
          <button (click)="load()" class="btn btn-primary"><i class="fas fa-sync"></i> Generate Report</button>
        </div>
      </div>
      
      <div class="card" *ngIf="tb">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-file-alt"></i> Financial Summary - Period: {{period}}</h3>
          <span [class]="'badge badge-' + (tb.equationOk ? 'success' : 'danger')">
            {{tb.equationOk ? 'BALANCED' : 'OUT OF BALANCE'}}
          </span>
        </div>
        
        <div style="padding: 30px;">
          <div class="stats-grid">
            <div class="stat-card success">
              <div class="stat-label">Total Assets</div>
              <div class="stat-value text-success">&#36;{{tb.assets | number:'1.2-2'}}</div>
              <i class="fas fa-coins stat-icon"></i>
            </div>
            
            <div class="stat-card warning">
              <div class="stat-label">Total Liabilities</div>
              <div class="stat-value text-warning">&#36;{{tb.liabilities | number:'1.2-2'}}</div>
              <i class="fas fa-file-invoice-dollar stat-icon"></i>
            </div>
            
            <div class="stat-card text-info" style="border-left-color: #2196f3;">
              <div class="stat-label">Total Equity</div>
              <div class="stat-value text-info">&#36;{{tb.equity | number:'1.2-2'}}</div>
              <i class="fas fa-landmark stat-icon"></i>
            </div>
            
            <div class="stat-card success">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-value text-success">&#36;{{tb.revenue | number:'1.2-2'}}</div>
              <i class="fas fa-arrow-up stat-icon"></i>
            </div>
            
            <div class="stat-card danger">
              <div class="stat-label">Total Expenses</div>
              <div class="stat-value text-danger">&#36;{{tb.expenses | number:'1.2-2'}}</div>
              <i class="fas fa-arrow-down stat-icon"></i>
            </div>
            
            <div [class]="'stat-card ' + (tb.equationOk ? 'success' : 'danger')">
              <div class="stat-label">Accounting Equation</div>
              <div class="stat-value" [style.color]="tb.equationOk ? '#4caf50' : '#f44336'">
                {{tb.equationOk ? 'VALID' : 'INVALID'}}
              </div>
              <i [class]="'fas ' + (tb.equationOk ? 'fa-check-circle' : 'fa-exclamation-circle') + ' stat-icon'"></i>
            </div>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2196f3;">
            <h4 style="margin: 0 0 10px 0;" class="text-dark"><i class="fas fa-info-circle"></i> Accounting Equation Verification</h4>
            <p style="margin: 0; font-size: 1.1rem;" class="text-secondary">
              <strong>Assets</strong> (&#36;{{tb.assets | number:'1.2-2'}}) = 
              <strong>Liabilities</strong> (&#36;{{tb.liabilities | number:'1.2-2'}}) + 
              <strong>Equity</strong> (&#36;{{tb.equity | number:'1.2-2'}})
            </p>
          </div>
        </div>
      </div>

      <div *ngIf="!tb" style="text-align:center; padding:60px;" class="text-secondary">
        <i class="fas fa-chart-bar" style="font-size: 4rem; opacity: 0.3;"></i>
        <p style="margin-top: 20px; font-size: 1.1rem;">No trial balance data available.</p>
        <p class="text-muted">Enter a period and click "Generate Report" to view the trial balance.</p>
      </div>
    </div>
  `
})
export class TrialBalanceComponent implements OnInit {
  period = '2026-01';
  tb: any;
  
  constructor(private api: GlService) {}
  
  ngOnInit() {
    this.load();
  }
  
  load(){ 
    this.api.trialBalance(this.period).subscribe(res => this.tb = res); 
  }
}
