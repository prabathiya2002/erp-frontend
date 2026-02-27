import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReconService } from './services';

@Component({
  standalone: true,
  selector: 'app-recon',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-section">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-sync-alt"></i> Bank Reconciliation</h2>
        <div style="display: flex; gap: 15px; align-items: center;">
          <input [(ngModel)]="period" class="form-control" placeholder="Period (e.g., 2026-01)" style="width: 200px;" />
          <button (click)="matches()" class="btn btn-primary"><i class="fas fa-search"></i> Find Matches</button>
        </div>
      </div>
      
      <!-- Import Items Section -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-file-import"></i> Import Bank Statement Items</h3>
          <span class="badge badge-info">{{items.length}} Items</span>
        </div>
        <div style="padding: 20px;">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th style="width: 100px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let i of items; let idx = index">
                  <td><input [(ngModel)]="i.date" class="form-control" type="date" style="width: 100%;" /></td>
                  <td><input [(ngModel)]="i.amount" class="form-control" type="number" placeholder="0.00" style="width: 100%;" /></td>
                  <td><input [(ngModel)]="i.reference" class="form-control" placeholder="Reference #" style="width: 100%;" /></td>
                  <td><button (click)="remove(idx)" class="btn btn-danger" style="padding: 8px 12px;"><i class="fas fa-trash"></i></button></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="action-buttons" style="margin-top: 20px;">
            <button (click)="add()" class="btn btn-info"><i class="fas fa-plus"></i> Add Item</button>
            <button (click)="import()" class="btn btn-success"><i class="fas fa-upload"></i> Import Items</button>
          </div>
        </div>
      </div>

      <!-- Matching Suggestions -->
      <div class="module-section" *ngIf="suggestions.length > 0">
        <div class="section-header" style="border-bottom: none; padding-bottom: 0;">
          <h3 style="color: #333;"><i class="fas fa-magic"></i> Auto-Match Suggestions</h3>
          <span class="badge badge-success">{{suggestions.length}} Matches Found</span>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Recon Item ID</th>
                <th>Journal ID</th>
                <th>Journal Line ID</th>
                <th>Match Score</th>
                <th>Confidence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of suggestions">
                <td><strong>#{{s.reconItemId}}</strong></td>
                <td>Journal #{{s.journalId}}</td>
                <td>Line #{{s.journalLineId}}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 100px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                      <div [style.width.%]="s.score * 100" 
                           [style.background]="getScoreColor(s.score)"
                           style="height: 100%; transition: width 0.3s;">
                      </div>
                    </div>
                    <span>{{(s.score * 100).toFixed(1)}}%</span>
                  </div>
                </td>
                <td>
                  <span [class]="'badge badge-' + getConfidenceBadge(s.score)">
                    {{getConfidenceLevel(s.score)}}
                  </span>
                </td>
                <td>
                  <button class="btn btn-success" style="padding: 8px 16px;">
                    <i class="fas fa-check"></i> Accept Match
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="suggestions.length === 0 && period" style="text-align:center; padding:60px; color:#666;">
        <i class="fas fa-search" style="font-size: 4rem; opacity: 0.3;"></i>
        <p style="margin-top: 20px; font-size: 1.1rem;">No matching suggestions found.</p>
        <p style="color: #999;">Import bank statement items and click "Find Matches" to see auto-match suggestions.</p>
      </div>
    </div>
  `
})
export class ReconComponent implements OnInit {
  period = '2026-01';
  items: any[] = [{ date: '2026-01-16', amount: 0, reference: '' }];
  suggestions: any[] = [];
  
  constructor(private api: ReconService) {}
  
  ngOnInit() {}
  
  add(){ 
    this.items.push({ date: '2026-01-16', amount: 0, reference: '' }); 
  }
  
  remove(i:number){ 
    this.items.splice(i,1); 
  }
  
  import(){ 
    this.api.import(this.items).subscribe(() => {
      alert('Bank statement items imported successfully!');
    }); 
  }
  
  matches(){ 
    this.api.matches(this.period).subscribe(res => {
      this.suggestions = res;
      if (res.length === 0) {
        alert('No matching suggestions found for this period.');
      }
    }); 
  }
  
  getScoreColor(score: number): string {
    if (score >= 0.8) return '#4caf50';
    if (score >= 0.6) return '#ff9800';
    return '#f44336';
  }
  
  getConfidenceBadge(score: number): string {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'danger';
  }
  
  getConfidenceLevel(score: number): string {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  }
}
