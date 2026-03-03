import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
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
    NgChartsModule,   // ✅ FIXED (removed BaseChartDirective)
    TableModule,
    ButtonModule,
    CardModule
  ],
  template: `
    <!-- YOUR TEMPLATE REMAINS EXACTLY THE SAME -->
  `,
  styles: [
    `
    /* YOUR STYLES REMAIN EXACTLY THE SAME */
    `
  ]
})
export class UiShowcaseComponent {

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
          label: (context: any) => {
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
          callback: (value: any) => `$${value.toLocaleString()}`
        }
      }
    }
  };

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
          label: (context: any) => {
            const value = context.parsed ?? 0;
            return `${context.label}: $${value.toLocaleString()}`;
          }
        }
      }
    }
  };
}