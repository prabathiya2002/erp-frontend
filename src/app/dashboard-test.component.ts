import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-dashboard-test',
  imports: [CommonModule],
  template: `
    <div style="padding: 2rem; background: #f0f9ff; min-height: 100vh;">
      <h1 style="color: #14b8a6; font-size: 2rem; margin-bottom: 1rem;">
        ✅ Dashboard Test Component Loaded Successfully!
      </h1>
      <p style="font-size: 1.2rem; color: #334155;">
        If you can see this message, the routing is working correctly.
      </p>
      <p style="color: #64748b; margin-top: 1rem;">
        This means the issue is with the main dashboard component, not the routing.
      </p>
    </div>
  `
})
export class DashboardTestComponent {}
