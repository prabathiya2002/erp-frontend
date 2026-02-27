import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
}

@Component({
  selector: 'app-ui-showcase',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    TableModule,
    ButtonModule,
    CardModule
  ],
  template: `
    <div class="ui-showcase">
      <div class="page-header">
        <h1 class="page-title">
          <i class="fas fa-palette"></i>
          UI Components Showcase
        </h1>
        <p class="page-subtitle">Enhanced UI tools for better user experience</p>
      </div>

      <!-- PrimeNG DataTable Example -->
      <div class="module-section">
        <h2 class="section-title">
          <i class="fas fa-table"></i>
          PrimeNG DataTable
        </h2>
        <p-card header="Recent Transactions">
          <p-table [value]="transactions" 
                   [paginator]="true" 
                   [rows]="5"
                   [showCurrentPageReport]="true"
                   currentPageReportTemplate="Showing {first} to {last} of {totalRecords} transactions"
                   styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-transaction>
              <tr>
                <td>{{ transaction.id }}</td>
                <td>{{ transaction.date }}</td>
                <td>{{ transaction.description }}</td>
                <td>{{ transaction.amount | currency }}</td>
                <td>
                  <span [class]="'badge badge-' + transaction.status">
                    {{ transaction.status | titlecase }}
                  </span>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>

      <!-- Chart.js Examples -->
      <div class="module-section">
        <h2 class="section-title">
          <i class="fas fa-chart-line"></i>
          Financial Charts
        </h2>
        <div class="charts-grid">
          <!-- Revenue Chart -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Monthly Revenue</h3>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <canvas baseChart
                  [type]="'line'"
                  [data]="revenueChartData"
                  [options]="chartOptions">
                </canvas>
              </div>
            </div>
          </div>

          <!-- Expense Chart -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Expense Breakdown</h3>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <canvas baseChart
                  [type]="'doughnut'"
                  [data]="expenseChartData"
                  [options]="doughnutChartOptions">
                </canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ui-showcase {
      padding: 2rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .toast-demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .badge-completed {
      background: var(--success);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-pending {
      background: var(--warning);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-failed {
      background: var(--danger);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }
  `]
})
export class UiShowcaseComponent {
  // Sample transaction data
  transactions: Transaction[] = [
    { id: 1001, date: '2024-02-26', description: 'Office Supplies', amount: 450.00, status: 'completed' },
    { id: 1002, date: '2024-02-25', description: 'Software License', amount: 1299.00, status: 'completed' },
    { id: 1003, date: '2024-02-24', description: 'Client Payment', amount: 5500.00, status: 'pending' },
    { id: 1004, date: '2024-02-23', description: 'Hardware Purchase', amount: 2340.00, status: 'completed' },
    { id: 1005, date: '2024-02-22', description: 'Monthly Rent', amount: 3000.00, status: 'failed' },
    { id: 1006, date: '2024-02-21', description: 'Utilities', amount: 678.50, status: 'completed' },
    { id: 1007, date: '2024-02-20', description: 'Marketing Campaign', amount: 1850.00, status: 'pending' },
    { id: 1008, date: '2024-02-19', description: 'Consulting Services', amount: 4200.00, status: 'completed' }
  ];

  // Revenue Chart Data
  revenueChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [65000, 72000, 68000, 81000, 76000, 95000],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Expenses',
        data: [45000, 52000, 48000, 61000, 56000, 65000],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed?.y ?? 0;
            return `${context.dataset.label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value.toLocaleString()}`
        }
      }
    }
  };

  // Expense Doughnut Chart Data
  expenseChartData: ChartConfiguration['data'] = {
    labels: ['Salaries', 'Rent', 'Utilities', 'Marketing', 'Supplies'],
    datasets: [
      {
        data: [45000, 12000, 5000, 8000, 3000],
        backgroundColor: [
          '#2563eb',
          '#8b5cf6',
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ]
      }
    ]
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed ?? 0;
            return `${context.label}: $${value.toLocaleString()}`;
          }
        }
      }
    }
  };
}
