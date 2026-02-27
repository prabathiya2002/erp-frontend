import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// Add Basic Auth credentials to all requests
const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Don't add auth to H2 console
  if (req.url.includes('/h2-console')) {
    return next(req);
  }
  
  // Get stored auth header
  const authHeader = sessionStorage.getItem('authHeader');
  
  // Add Basic Auth header
  const modifiedReq = req.clone({
    withCredentials: true,
    setHeaders: authHeader ? {
      'Authorization': authHeader
    } : {}
  });
  return next(modifiedReq);
};

const routes: Routes = [
  { path: '', loadComponent: () => import('./app/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'accounts', loadComponent: () => import('./app/accounts.component').then(m => m.AccountsComponent) },
  { path: 'general-ledger', loadComponent: () => import('./app/general-ledger.component').then(m => m.GeneralLedgerComponent) },
  { path: 'trial-balance', loadComponent: () => import('./app/trial-balance.component').then(m => m.TrialBalanceComponent) },
  { path: 'recon', loadComponent: () => import('./app/recon.component').then(m => m.ReconComponent) },
  { path: 'accounts-payable', loadComponent: () => import('./app/accounts-payable.component').then(m => m.AccountsPayableComponent) },
  { path: 'accounts-receivable', loadComponent: () => import('./app/accounts-receivable.component').then(m => m.AccountsReceivableComponent) },
  { path: 'fixed-assets', loadComponent: () => import('./app/fixed-assets.component').then(m => m.FixedAssetsComponent) },
  { path: 'budget', loadComponent: () => import('./app/budget.component').then(m => m.BudgetComponent) },
  { path: 'financial-reports', loadComponent: () => import('./app/financial-reports.component').then(m => m.FinancialReportsComponent) },
  { path: 'company-settings', loadComponent: () => import('./app/company-settings.component').then(m => m.CompanySettingsComponent) },
  { path: 'invoice-templates', loadComponent: () => import('./app/invoice-templates.component').then(m => m.InvoiceTemplatesComponent) },
  { path: 'user-management', loadComponent: () => import('./app/user-management.component').then(m => m.UserManagementComponent) },
  { path: 'ui-showcase', loadComponent: () => import('./app/ui-showcase.component').then(m => m.UiShowcaseComponent) },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), 
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations()
  ]
});
