# ERP Finance Frontend (Angular 17)

Minimal Angular frontend aligned to the Spring Boot backend for Accounts, Journals, Trial Balance, and Reconciliation.

## Prereqs
- Node.js 18+

## Install & Run
```powershell
cd "c:\D_Drive\INTERNSHIP\Fintech.Task 2\Erp_Finance\frontend"
npm install
npm start
```
- Opens on http://localhost:4200
- Proxy forwards `/api/*` to backend at http://localhost:8080

## Routes
- `/` — Dashboard
- `/accounts` — Manage COA
- `/journals` — Create/approve/post journals
- `/trial-balance` — View TB for a period
- `/recon` — Import items and view match suggestions

## Notes
- Uses standalone components and `HttpClient` services.
- Adjust `proxy.conf.json` if backend runs on a different port.
