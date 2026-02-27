import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  styleUrl: './dashboard.component.css',
  template: `
    <div class="dashboard-wrapper">
      <div class="dashboard-topbar">
        <div class="topbar-left">
          <h1 class="dashboard-title">
            <i class="fas fa-chart-pie"></i>
            Financial Overview
          </h1>
          <span class="dashboard-subtitle">Welcome back!</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-left">
          <div class="kpi-row">
            <div class="kpi-card kpi-primary">
              <div class="kpi-icon-wrapper">
                <i class="fas fa-wallet"></i>
              </div>
              <div class="kpi-content">
                <span class="kpi-label">Total Assets</span>
                <h2 class="kpi-value">$1,250,000</h2>
                <div class="kpi-trend positive">
                  <i class="fas fa-arrow-up"></i>
                  <span>+12.5% this month</span>
                </div>
              </div>
            </div>

            <div class="kpi-card kpi-success">
              <div class="kpi-icon-wrapper">
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="kpi-content">
                <span class="kpi-label">Monthly Revenue</span>
                <h2 class="kpi-value">$450,000</h2>
                <div class="kpi-trend positive">
                  <i class="fas fa-arrow-up"></i>
                  <span>+8.3% this month</span>
                </div>
              </div>
            </div>

            <div class="kpi-card kpi-warning">
              <div class="kpi-icon-wrapper">
                <i class="fas fa-credit-card"></i>
              </div>
              <div class="kpi-content">
                <span class="kpi-label">Total Expenses</span>
                <h2 class="kpi-value">$280,000</h2>
                <div class="kpi-trend negative">
                  <i class="fas fa-arrow-down"></i>
                  <span>-3.2% this month</span>
                </div>
              </div>
            </div>

            <div class="kpi-card kpi-info">
              <div class="kpi-icon-wrapper">
                <i class="fas fa-dollar-sign"></i>
              </div>
              <div class="kpi-content">
                <span class="kpi-label">Net Income</span>
                <h2 class="kpi-value">$170,000</h2>
                <div class="kpi-trend positive">
                  <i class="fas fa-check-circle"></i>
                  <span>Profitable</span>
                </div>
              </div>
            </div>
          </div>

          <p-card class="chart-message">
            <h3>📊 Dashboard Loaded Successfully!</h3>
            <p>The dashboard component is working. Charts will be added back once we confirm stability.</p>
            <p-button label="View All Transactions" [routerLink]="'/general-ledger'" styleClass="p-button-outlined"></p-button>
          </p-card>
        </div>

        <div class="dashboard-right">
          <p-card class="quick-actions-card">
            <ng-template pTemplate="header">
              <div class="card-header-custom">
                <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
              </div>
            </ng-template>
            <div class="quick-actions-list">
              <button class="action-btn action-primary" [routerLink]="'/general-ledger'">
                <i class="fas fa-plus-circle"></i>
                <span>New Journal Entry</span>
              </button>
              <button class="action-btn action-success" [routerLink]="'/accounts'">
                <i class="fas fa-book"></i>
                <span>Manage Accounts</span>
              </button>
              <button class="action-btn action-info" [routerLink]="'/financial-reports'">
                <i class="fas fa-file-contract"></i>
                <span>Generate Report</span>
              </button>
            </div>
          </p-card>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {  
  ngOnInit() {
    console.log('✅ Dashboard Component Initialized Successfully!');
  }
}
