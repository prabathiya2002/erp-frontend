// SERVICES.TS - API Service Layer
// This file contains all services that make HTTP calls to the backend
// Services act as a bridge between Angular components and the Spring Boot backend

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ============================================
// ACCOUNTS SERVICE - Chart of Accounts Management
// ============================================
// Handles all API calls related to financial accounts
// (Assets, Liabilities, Equity, Revenue, Expense accounts)
@Injectable({ providedIn: 'root' })  // Available throughout the entire app
export class AccountsService {
  constructor(private http: HttpClient) {}  // Angular injects HttpClient for making API calls
  
  // Get all accounts from the database
  list() { return this.http.get<any[]>('/api/accounts'); }
  
  // Create a new account (e.g., "Cash", "Salaries Expense")
  create(body: any) { return this.http.post('/api/accounts', body); }
  
  // Get one specific account by its ID
  getById(id: number) { return this.http.get(`/api/accounts/${id}`); }
  
  // Update an existing account's details
  update(id: number, body: any) { return this.http.put(`/api/accounts/${id}`, body); }
  
  // Delete an account (only if no transactions are linked to it)
  delete(id: number) { return this.http.delete(`/api/accounts/${id}`); }
}

// ============================================
// JOURNALS SERVICE - Journal Entry Management
// ============================================
// Handles all API calls for journal entries (the heart of double-entry accounting)
// Every financial transaction creates a journal entry with debits and credits
@Injectable({ providedIn: 'root' })
export class JournalsService {
  constructor(private http: HttpClient) {}
  
  // Get all journal entries
  list() { return this.http.get<any[]>('/api/journals'); }
  
  // Get one specific journal entry by ID
  getById(id: number) { return this.http.get(`/api/journals/${id}`); }
  
  // Create a new journal entry (with debit and credit lines)
  create(body: any) { return this.http.post('/api/journals', body); }
  
  // Approve a journal entry (requires authorization)
  // Status changes from DRAFT → APPROVED
  approve(id: number) { return this.http.post(`/api/journals/${id}/approve`, {}); }
  
  // Post a journal entry to the General Ledger
  // This updates account balances - can't be easily undone!
  // Status changes from APPROVED → POSTED
  post(id: number) { return this.http.post(`/api/journals/${id}/post`, {}); }
  
  // Delete a journal entry (only if not yet posted)
  delete(id: number) { return this.http.delete(`/api/journals/${id}`); }
}

// ============================================
// GENERAL LEDGER SERVICE
// ============================================
// Handles reports and queries related to the General Ledger
@Injectable({ providedIn: 'root' })
export class GlService {
  constructor(private http: HttpClient) {}
  
  // Get Trial Balance for a specific period (e.g., "2026-01")
  // Trial Balance shows total debits and credits for each account
  // Debits should always equal Credits (fundamental accounting rule)
  trialBalance(period: string) { return this.http.get(`/api/gl/trial-balance?period=${period}`); }
  
  // Get Trial Balance for a date range instead of a single period
  // Useful for custom reporting periods
  trialBalanceByDateRange(startDate: string, endDate: string) { 
    return this.http.get(`/api/gl/trial-balance-range?startDate=${startDate}&endDate=${endDate}`); 
  }
}

// ============================================
// RECONCILIATION SERVICE - Bank Reconciliation
// ============================================
// Handles matching bank statement transactions with internal journal entries
// This ensures bank records match company books (important for cash management!)
@Injectable({ providedIn: 'root' })
export class ReconService {
  constructor(private http: HttpClient) {}
  
  // Get all reconciliation items (transactions to be matched)
  list() { return this.http.get<any[]>('/api/recon'); }
  
  // Import bank statement data (usually from Excel/CSV)
  // Creates recon items that need to be matched with journal entries
  import(items: any[]) { return this.http.post<any[]>('/api/recon/import', items); }
  
  // Find suggested matches between bank transactions and journal entries
  // Uses smart matching based on amount and date proximity
  matches(period: string) { return this.http.get<any[]>(`/api/recon/matches?period=${period}`); }
  
  // Mark a recon item as resolved (matched with a journal entry)
  // variance: difference between bank amount and journal amount (if any)
  resolve(id: number, journalId: number, journalLineId: number, variance?: number) {
    const params = new URLSearchParams({ journalId: String(journalId), journalLineId: String(journalLineId) });
    if (variance != null) params.append('variance', String(variance));
    return this.http.post(`/api/recon/${id}/resolve?${params.toString()}`, {});
  }
}

// ============================================
// FINANCE SERVICE - Comprehensive Financial Operations
// ============================================
// This service handles multiple areas: Accounts Payable (AP) and Accounts Receivable (AR)
// It's a "catch-all" service for various financial operations
@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(private http: HttpClient) {}
  
  // === GENERIC HTTP METHODS ===
  // These provide flexible API access for any endpoint
  get(endpoint: string) { return this.http.get(`/api/${endpoint}`); }
  post(endpoint: string, body: any) { return this.http.post(`/api/${endpoint}`, body); }
  put(endpoint: string, body: any) { return this.http.put(`/api/${endpoint}`, body); }
  delete(endpoint: string) { return this.http.delete(`/api/${endpoint}`); }
  
  // ========================================
  // ACCOUNTS PAYABLE (AP) - Money We Owe
  // ========================================
  
  // === AP INVOICES ===
  // Invoices from suppliers/vendors that we need to pay
  getAPInvoices() { return this.http.get('/api/ap/invoices'); }
  createAPInvoice(invoice: any) { return this.http.post('/api/ap/invoices', invoice); }
  updateAPInvoice(id: any, invoice: any) { return this.http.put(`/api/ap/invoices/${id}`, invoice); }
  deleteAPInvoice(id: any) { return this.http.delete(`/api/ap/invoices/${id}`); }
  payAPInvoice(id: any) { return this.http.post(`/api/ap/invoices/${id}/pay`, {}); }
  
  // === VENDORS ===
  // Companies/people we buy things from
  getVendors() { return this.http.get('/api/ap/vendors'); }
  createVendor(vendor: any) { return this.http.post('/api/ap/vendors', vendor); }
  updateVendor(id: any, vendor: any) { return this.http.put(`/api/ap/vendors/${id}`, vendor); }
  deleteVendor(id: any) { return this.http.delete(`/api/ap/vendors/${id}`); }
  
  // === AP PAYMENT HISTORY ===
  // Record of all payments we've made to vendors
  getAPPaymentHistory() { return this.http.get('/api/ap/payments'); }
  
  // ========================================
  // ACCOUNTS RECEIVABLE (AR) - Money Owed to Us
  // ========================================
  
  // === AR INVOICES (BASIC) ===
  // Invoices we send to customers (without line-item details)
  getARInvoices() { return this.http.get('/api/ar/invoices'); }
  createARInvoice(invoice: any) { return this.http.post('/api/ar/invoices', invoice); }
  updateARInvoice(id: any, invoice: any) { return this.http.put(`/api/ar/invoices/${id}`, invoice); }
  deleteARInvoice(id: any) { return this.http.delete(`/api/ar/invoices/${id}`); }
  
  // === AR INVOICES WITH ITEMS (DETAILED) ===
  // Invoices with itemized line items (like a supermarket receipt)
  // Each item has: description, quantity, price, total
  createARInvoiceWithItems(invoiceDTO: any) { return this.http.post('/api/ar/invoices/with-items', invoiceDTO); }
  updateARInvoiceWithItems(id: any, invoiceDTO: any) { return this.http.put(`/api/ar/invoices/${id}/with-items`, invoiceDTO); }
  getARInvoiceWithItems(id: any) { return this.http.get(`/api/ar/invoices/${id}/with-items`); }
  
  // === CUSTOMERS ===
  // Companies/people who buy from us
  getCustomers() { return this.http.get('/api/ar/customers'); }
  createCustomer(customer: any) { return this.http.post('/api/ar/customers', customer); }
  updateCustomer(id: any, customer: any) { return this.http.put(`/api/ar/customers/${id}`, customer); }
  deleteCustomer(id: any) { return this.http.delete(`/api/ar/customers/${id}`); }
  
  // === AR PAYMENTS ===
  // Record payments received from customers
  recordARPayment(payment: any) { return this.http.post('/api/ar/payments', payment); }
  getARPaymentHistory() { return this.http.get('/api/ar/payments'); }
}

