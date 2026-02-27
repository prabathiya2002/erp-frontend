import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalsService, AccountsService } from './services';

@Component({
  standalone: true,
  selector: 'app-journals',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-section">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-file-invoice"></i> Journal Entries</h2>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-plus-circle"></i> Create New Journal Entry</h3>
        </div>
        <div style="padding: 25px;">
          <!-- Header Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;" class="text-dark">Date</label>
              <input [(ngModel)]="date" name="date" class="form-control" type="date" />
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;" class="text-dark">Period</label>
              <input [(ngModel)]="period" name="period" class="form-control" placeholder="2026-01" />
            </div>
          </div>

          <!-- Journal Lines -->
          <h4 style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;" class="text-dark">
            <i class="fas fa-list"></i> Journal Lines
          </h4>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th style="width: 100px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let l of lines; let i=index">
                  <td><input [(ngModel)]="l.accountId" class="form-control" placeholder="Account ID" style="width: 100%;"/></td>
                  <td><input [(ngModel)]="l.debit" class="form-control" type="number" placeholder="0.00" style="width: 100%;"/></td>
                  <td><input [(ngModel)]="l.credit" class="form-control" type="number" placeholder="0.00" style="width: 100%;"/></td>
                  <td><button (click)="remove(i)" class="btn btn-danger" style="padding: 8px 12px;"><i class="fas fa-trash"></i></button></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 20px;">
            <button (click)="add()" class="btn btn-info"><i class="fas fa-plus"></i> Add Line</button>
          </div>

          <!-- Totals -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <div>
              <strong class="text-dark">Total Debit:</strong>
              <span style="float: right; font-size: 1.2rem; font-weight: 700;" class="text-success">
                &#36;{{getTotalDebit() | number:'1.2-2'}}
              </span>
            </div>
            <div>
              <strong class="text-dark">Total Credit:</strong>
              <span style="float: right; font-size: 1.2rem; font-weight: 700;" class="text-danger">
                &#36;{{getTotalCredit() | number:'1.2-2'}}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button (click)="create()" class="btn btn-primary"><i class="fas fa-save"></i> Create Entry</button>
            <button (click)="approve()" [disabled]="!journalId" class="btn btn-success"><i class="fas fa-check-circle"></i> Approve</button>
            <button (click)="post()" [disabled]="!journalId" class="btn btn-warning"><i class="fas fa-paper-plane"></i> Post to GL</button>
          </div>
          
          <div *ngIf="journalId" style="margin-top: 20px; padding: 15px; border-radius: 8px;" class="bg-success-light text-success">
            <i class="fas fa-check-circle"></i> Journal Entry Created - ID: <strong>{{journalId}}</strong>
          </div>
        </div>
      </div>

      <!-- Existing Journals List -->
      <div class="module-section" style="margin-top: 30px;">
        <div class="section-header" style="border-bottom: none; padding-bottom: 0;">
          <h3 class="text-dark"><i class="fas fa-list"></i> All Journal Entries ({{journals.length}})</h3>
          <button class="btn btn-info" (click)="loadJournals()"><i class="fas fa-sync"></i> Refresh</button>
        </div>
        <div class="table-container" *ngIf="journals.length > 0; else noJournals">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Period</th>
                <th>Lines</th>
                <th>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let j of journals">
                <td><strong>#{{j.id}}</strong></td>
                <td>{{j.date}}</td>
                <td>{{j.period}}</td>
                <td>{{j.lines?.length || 0}} lines</td>
                <td>
                  <strong class="text-success">
                    &#36;{{calculateAmount(j) | number:'1.2-2'}}
                  </strong>
                </td>
                <td>
                  <span [class]="'badge badge-' + getStatusBadge(j.status)">{{j.status}}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noJournals>
          <div style="text-align:center; padding:40px;" class="text-secondary">
            <i class="fas fa-folder-open" style="font-size: 3rem; opacity: 0.3;"></i>
            <p style="margin-top: 15px;">No journal entries found. Create your first entry above.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `
})
export class JournalsComponent implements OnInit {
  date = '2026-01-16';
  period = '2026-01';
  lines: any[] = [{ accountId: '', debit: 0, credit: 0 }];
  journalId?: number;
  journals: any[] = [];
  accounts: any[] = [];
  
  constructor(private api: JournalsService, private accountsApi: AccountsService) {}
  
  ngOnInit() {
    this.loadJournals();
    this.loadAccounts();
  }
  
  loadJournals() {
    this.api.list().subscribe((data: any) => {
      this.journals = data;
    });
  }
  
  loadAccounts() {
    this.accountsApi.list().subscribe((data: any) => {
      this.accounts = data;
    });
  }
  
  add(){ this.lines.push({ accountId: '', debit: 0, credit: 0 }); }
  remove(i:number){ this.lines.splice(i,1); }
  
  getTotalDebit(): number {
    return this.lines.reduce((sum, l) => sum + (+l.debit || 0), 0);
  }
  
  getTotalCredit(): number {
    return this.lines.reduce((sum, l) => sum + (+l.credit || 0), 0);
  }
  
  create(){
    const entry = { date: this.date, period: this.period, lines: this.lines };
    this.api.create(entry).subscribe((res: any) => { 
      this.journalId = res.id;
      this.loadJournals();
      alert('Journal entry created successfully!');
    });
  }
  
  approve(){ 
    if(this.journalId) {
      this.api.approve(this.journalId).subscribe(() => {
        this.loadJournals();
        alert('Journal entry approved!');
      });
    }
  }
  
  post(){ 
    if(this.journalId) {
      this.api.post(this.journalId).subscribe(() => {
        this.loadJournals();
        alert('Journal entry posted to GL! Account balances updated.');
        this.journalId = undefined;
        this.lines = [{ accountId: '', debit: 0, credit: 0 }];
      });
    }
  }
  
  calculateAmount(journal: any): number {
    if (!journal.lines || journal.lines.length === 0) return 0;
    return journal.lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
  }
  
  getStatusBadge(status: string): string {
    switch(status) {
      case 'POSTED': return 'success';
      case 'APPROVAL': return 'warning';
      default: return 'info';
    }
  }
}
