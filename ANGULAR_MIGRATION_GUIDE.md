# React to Angular Migration Guide

## 📚 Learning Angular Through Migration

This document explains the step-by-step migration of the Energy Consumption Dashboard from **React** to **Angular**, highlighting key differences and Angular concepts.

---

## 🎯 Project Overview

**Original Stack (React):**
- React 19.1.0
- React Router DOM 6.26.1
- React Chart.js 2
- Axios for HTTP requests
- React Hooks (useState, useEffect)

**New Stack (Angular):**
- Angular 17.3.12
- Angular Router
- ng2-charts with Chart.js
- HttpClient for HTTP requests
- RxJS for reactive programming

---

## 📁 Project Structure Comparison

### React Structure
```
src/
├── App.js                    # Main dashboard component
├── HourlyDetail.js          # Hourly detail page
├── App.css                  # Global styles
├── index.js                 # Entry point
└── index.css
```

### Angular Structure
```
src-angular/
├── app/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts      # Main dashboard logic
│   │   │   ├── dashboard.component.html    # Dashboard template
│   │   │   └── dashboard.component.css     # Component styles
│   │   └── hourly-detail/
│   │       ├── hourly-detail.component.ts
│   │       ├── hourly-detail.component.html
│   │       └── hourly-detail.component.css
│   ├── services/
│   │   └── data.service.ts                 # API service
│   ├── app.module.ts                       # Main module
│   ├── app-routing.module.ts               # Routing config
│   └── app.component.ts                    # Root component
├── index.html                               # HTML entry point
├── main.ts                                  # Angular bootstrap
└── styles.css                               # Global styles
```

---

## 🔄 Key Concept Mappings

### 1. **Component Definition**

#### React (Functional Component)
```javascript
import React, { useState, useEffect } from 'react';

function App() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <div className="dashboard">
      {/* JSX here */}
    </div>
  );
}
```

#### Angular (Class Component)
```typescript
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  monthlyData: EnergyData[] = [];
  loading = true;
  
  ngOnInit(): void {
    this.fetchData();
  }
  
  // Methods here
}
```

**Key Differences:**
- React uses **functional components with hooks**
- Angular uses **class-based components with decorators**
- React's `useState` → Angular's **class properties**
- React's `useEffect` → Angular's **ngOnInit lifecycle hook**
- React uses **JSX** → Angular uses **separate HTML templates**

---

### 2. **State Management**

#### React
```javascript
const [monthlyData, setMonthlyData] = useState([]);
const [loading, setLoading] = useState(true);

// Update state
setMonthlyData(newData);
setLoading(false);
```

#### Angular
```typescript
monthlyData: EnergyData[] = [];
loading = true;

// Update state (direct assignment)
this.monthlyData = newData;
this.loading = false;
```

**Key Learning:**
- React requires **setter functions** for state updates
- Angular uses **direct property assignment** (change detection handles updates)
- Angular's change detection automatically updates the view when properties change

---

### 3. **HTTP Requests**

#### React (with Axios)
```javascript
import axios from 'axios';

const fetchData = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/data/monthly');
    setMonthlyData(response.data.data);
  } catch (err) {
    setError(err.message);
  }
};
```

#### Angular (with HttpClient)
```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) {}
  
  getMonthlyData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('http://localhost:3000/api/data/monthly');
  }
}

// In component:
async fetchData(): Promise<void> {
  try {
    const response = await this.dataService.getMonthlyData().toPromise();
    this.monthlyData = response?.data || [];
  } catch (err: any) {
    this.error = err.message;
  }
}
```

**Key Learning:**
- Angular uses **Services with Dependency Injection**
- HttpClient returns **Observables** (RxJS)
- Services are **singleton** and can be injected into components
- Use `@Injectable({ providedIn: 'root' })` for app-wide services

---

### 4. **Routing**

#### React Router
```javascript
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// Setup
<BrowserRouter>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/hourly/:date" element={<HourlyDetail />} />
  </Routes>
</BrowserRouter>

// Navigate
const navigate = useNavigate();
navigate(`/hourly/${formattedDate}`);

// Get params
const { date } = useParams();
```

#### Angular Router
```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'hourly/:date', component: HourlyDetailComponent },
  { path: '**', redirectTo: '' }
];

// Navigate
constructor(private router: Router) {}
this.router.navigate(['/hourly', formattedDate]);

// Get params
constructor(private route: ActivatedRoute) {}
this.route.params.subscribe(params => {
  this.date = params['date'];
});
```

**Key Learning:**
- Angular has a **dedicated routing module**
- Routes are defined as a **configuration array**
- Angular Router uses **dependency injection** for navigation
- Route parameters are accessed via **ActivatedRoute** service
- Params are provided as **Observables** (reactive approach)

---

### 5. **Template Syntax**

#### React (JSX)
```javascript
return (
  <div className="dashboard">
    {loading && <div className="loading">Loading...</div>}
    {error && <div className="error">Error: {error}</div>}
    
    {!loading && !error && (
      <div>
        <h1>Energy Dashboard</h1>
        {monthlyData.map((item, index) => (
          <div key={index}>{item.total_consumption}</div>
        ))}
      </div>
    )}
  </div>
);
```

#### Angular (Template)
```html
<div class="dashboard">
  <div *ngIf="loading" class="loading">Loading...</div>
  <div *ngIf="error" class="error">Error: {{ error }}</div>
  
  <div *ngIf="!loading && !error">
    <h1>Energy Dashboard</h1>
    <div *ngFor="let item of monthlyData">
      {{ item.total_consumption }}
    </div>
  </div>
</div>
```

**Key Differences:**
| React | Angular | Purpose |
|-------|---------|---------|
| `{expression}` | `{{ expression }}` | Interpolation |
| `className` | `class` | CSS classes |
| `{condition && <div>}` | `*ngIf="condition"` | Conditional rendering |
| `.map()` | `*ngFor` | List rendering |
| `onClick={handler}` | `(click)="handler()"` | Event binding |
| `value={state}` | `[value]="property"` | Property binding |
| `onChange={handler}` | `(change)="handler($event)"` | Event handling |

---

### 6. **Data Binding**

#### React (One-way, Manual)
```javascript
<input 
  type="date" 
  value={dateRange.start.toISOString().split('T')[0]}
  onChange={e => setDateRange({...dateRange, start: new Date(e.target.value)})}
/>
```

#### Angular (Two-way, Declarative)
```html
<!-- Property binding (one-way) -->
<input 
  type="date" 
  [value]="formatDate(dateRange.start)"
  (change)="onStartDateChange($event)"
/>

<!-- Two-way binding with ngModel -->
<input type="text" [(ngModel)]="searchTerm" />
```

**Binding Types in Angular:**
- `{{ }}` - **Interpolation** (one-way from component to view)
- `[property]` - **Property binding** (one-way from component to view)
- `(event)` - **Event binding** (one-way from view to component)
- `[(ngModel)]` - **Two-way binding** (both directions)

---

### 7. **Computed Properties**

#### React
```javascript
const filteredMonthlyData = selectedYear 
  ? monthlyData.filter(item => 
      parseApiDate(item.from_date).getFullYear() === selectedYear)
  : monthlyData;

const ytdConsumption = monthlyData.reduce(
  (sum, item) => sum + parseFloat(item?.total_consumption || 0),
  0
);
```

#### Angular (Getters)
```typescript
get filteredMonthlyData(): EnergyData[] {
  return this.selectedYear 
    ? this.monthlyData.filter(item => 
        this.parseApiDate(item.from_date).getFullYear() === this.selectedYear)
    : this.monthlyData;
}

get ytdConsumption(): number {
  return this.monthlyData.reduce(
    (sum, item) => sum + parseFloat(item?.total_consumption || '0'),
    0
  );
}
```

**Key Learning:**
- React uses **const variables** or `useMemo`
- Angular uses **getter methods** (computed properties)
- Angular getters are **recalculated on each change detection**
- Use `useMemo` in React and **pipes** in Angular for performance optimization

---

### 8. **Event Handling**

#### React
```javascript
const handleMonthChange = (monthValue) => {
  const selected = availableMonths.find(m => m.value === monthValue);
  if (selected) {
    setSelectedMonth(selected);
    // Update other state...
  }
};

<select value={selectedMonth?.value} onChange={(e) => handleMonthChange(e.target.value)}>
  {availableMonths.map((month, index) => (
    <option key={index} value={month.value}>
      {month.label}
    </option>
  ))}
</select>
```

#### Angular
```typescript
handleMonthChange(monthValue: string): void {
  const selected = this.availableMonths.find(m => m.value === monthValue);
  if (selected) {
    this.selectedMonth = selected;
    // Update other properties...
  }
}
```

```html
<select 
  [value]="selectedMonth?.value"
  (change)="handleMonthChange($any($event.target).value)">
  <option *ngFor="let month of availableMonths" [value]="month.value">
    {{ month.label }}
  </option>
</select>
```

**Key Differences:**
- React passes `event` automatically, Angular uses `$event`
- Angular requires explicit typing (TypeScript)
- Angular uses `$any()` to bypass type checking when needed

---

### 9. **Lifecycle Methods**

#### React Hooks
```javascript
useEffect(() => {
  // Component mounted
  fetchData();
  
  return () => {
    // Component will unmount (cleanup)
  };
}, []); // Empty array = run once on mount

useEffect(() => {
  // Run when dependencies change
  updateCharts();
}, [monthlyData, dailyData]);
```

#### Angular Lifecycle Hooks
```typescript
ngOnInit(): void {
  // Component initialized
  this.fetchData();
}

ngOnDestroy(): void {
  // Component destroyed (cleanup)
}

ngOnChanges(changes: SimpleChanges): void {
  // When input properties change
}

ngAfterViewInit(): void {
  // After view is initialized
}
```

**Common Lifecycle Hooks:**
| React | Angular | When It Runs |
|-------|---------|--------------|
| `useEffect(() => {}, [])` | `ngOnInit()` | Once on mount |
| `useEffect(() => cleanup, [])` | `ngOnDestroy()` | On unmount |
| `useEffect(() => {}, [dep])` | `ngOnChanges()` | When inputs change |
| N/A | `ngAfterViewInit()` | After view renders |

---

### 10. **Dependency Injection**

This is one of Angular's most powerful features, not present in React.

#### Angular Service with DI
```typescript
// data.service.ts
@Injectable({
  providedIn: 'root'  // Singleton service
})
export class DataService {
  constructor(private http: HttpClient) {}
  
  getMonthlyData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/monthly`);
  }
}

// dashboard.component.ts
@Component({...})
export class DashboardComponent {
  constructor(
    private dataService: DataService,  // Injected automatically
    private router: Router
  ) {}
  
  fetchData(): void {
    this.dataService.getMonthlyData().subscribe(...);
  }
}
```

**Key Learning:**
- Angular **automatically creates and injects** service instances
- Services are **singletons** by default (shared across app)
- No need to import and call services manually
- Promotes **separation of concerns**

---

## 🎨 Chart Integration

### React (react-chartjs-2)
```javascript
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, BarController, BarElement, ... } from 'chart.js';

// Register components
ChartJS.register(BarController, BarElement, ...);

<Chart 
  type='bar'
  data={monthlyChartData}
  options={chartOptions}
/>
```

### Angular (ng2-charts)
```typescript
// Import in module
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  imports: [NgChartsModule]
})

// In template
<canvas 
  baseChart
  [data]="monthlyChartData"
  [options]="monthlyChartOptions"
  [type]="chartType">
</canvas>
```

---

## 📦 Module System

### React
- Uses **ES6 imports/exports**
- No formal module system
- Everything is a component or utility

### Angular
```typescript
@NgModule({
  declarations: [
    AppComponent,           // Components
    DashboardComponent,
    HourlyDetailComponent
  ],
  imports: [
    BrowserModule,         // Angular modules
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgChartsModule
  ],
  providers: [DataService], // Services
  bootstrap: [AppComponent] // Root component
})
export class AppModule { }
```

**Key Learning:**
- Angular uses **NgModules** to organize the app
- **declarations**: Components, directives, pipes
- **imports**: Other modules
- **providers**: Services
- **bootstrap**: Root component to start the app

---

## 🚀 Running the Applications

### React
```bash
npm run start:react    # Start React app on port 3000
npm run build:react    # Build React app
```

### Angular
```bash
npm start              # Start Angular app on port 4200
npm run build          # Build Angular app
npm run watch          # Build with watch mode
```

---

## 🔍 Key Differences Summary

| Feature | React | Angular |
|---------|-------|---------|
| **Language** | JavaScript/JSX | TypeScript |
| **Architecture** | Component-based | Component + Module based |
| **Data Flow** | One-way (hooks) | Two-way binding available |
| **State Management** | useState, useReducer | Class properties |
| **Side Effects** | useEffect | Lifecycle hooks |
| **HTTP** | axios, fetch | HttpClient (built-in) |
| **Routing** | React Router (library) | Angular Router (built-in) |
| **Forms** | Controlled components | Template-driven & Reactive |
| **Dependency Injection** | Manual/Context | Built-in DI system |
| **Templates** | JSX (JS + HTML) | Separate HTML files |
| **Styling** | CSS-in-JS, modules | CSS, SCSS (scoped) |
| **Learning Curve** | Moderate | Steep |

---

## 📝 Migration Checklist

- [x] Set up Angular project structure
- [x] Create Angular modules and components
- [x] Migrate state management from hooks to class properties
- [x] Convert useEffect to ngOnInit
- [x] Migrate API calls to Angular services
- [x] Update routing from React Router to Angular Router
- [x] Convert JSX templates to Angular templates
- [x] Update event handlers and data binding
- [x] Migrate chart integration
- [x] Apply global styles
- [x] Test all functionality

---

## 🎓 What You Learned

### Angular Core Concepts
1. **Decorators** (`@Component`, `@Injectable`, `@NgModule`)
2. **Dependency Injection** - Angular's powerful DI system
3. **Observables & RxJS** - Reactive programming patterns
4. **Template Syntax** - Structural directives (`*ngIf`, `*ngFor`)
5. **Data Binding** - Interpolation, property, event, two-way
6. **Services** - Separation of concerns and code reusability
7. **Routing** - Declarative routing configuration
8. **Lifecycle Hooks** - Component lifecycle management
9. **TypeScript** - Strong typing and interfaces
10. **Modules** - Organizing app into feature modules

### React vs Angular Philosophy
- **React**: "Just a library" - minimal, flexible, community-driven
- **Angular**: "Complete framework" - opinionated, batteries-included, enterprise-ready

---

## 🛠️ Common Pitfalls & Solutions

### 1. Template Variables
**Problem**: Can't access global functions in templates
```html
<!-- Won't work -->
{{ Math.abs(value) }}
```

**Solution**: Expose in component
```typescript
Math = Math;
parseFloat = parseFloat;
```

### 2. Type Safety
**Problem**: TypeScript strict mode errors
```typescript
// Error: Object is possibly 'undefined'
this.monthlyData[0].total_consumption
```

**Solution**: Use optional chaining and nullish coalescing
```typescript
this.monthlyData[0]?.total_consumption ?? '0'
```

### 3. Observable Subscriptions
**Problem**: Memory leaks from unsubscribed observables

**Solution**: Unsubscribe in ngOnDestroy
```typescript
subscription: Subscription;

ngOnInit() {
  this.subscription = this.dataService.getData().subscribe(...);
}

ngOnDestroy() {
  this.subscription.unsubscribe();
}
```

### 4. Change Detection
**Problem**: View not updating when data changes

**Solution**: Use ChangeDetectorRef or ensure proper change detection
```typescript
constructor(private cdr: ChangeDetectorRef) {}

updateData() {
  this.data = newData;
  this.cdr.detectChanges(); // Force update
}
```

---

## 🎯 Next Steps

1. **Learn More Angular**:
   - Angular Forms (Template-driven & Reactive)
   - Custom Directives and Pipes
   - Angular Material for UI components
   - State management with NgRx

2. **Optimize the App**:
   - Implement lazy loading for routes
   - Add change detection strategy: OnPush
   - Create custom pipes for data transformation
   - Add unit tests with Jasmine/Karma

3. **Explore Advanced Features**:
   - Server-Side Rendering (Angular Universal)
   - Progressive Web App (PWA) features
   - Internationalization (i18n)
   - Custom validators for forms

---

## 📚 Resources

- [Official Angular Documentation](https://angular.io/docs)
- [Angular Tutorial (Tour of Heroes)](https://angular.io/tutorial)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Angular Style Guide](https://angular.io/guide/styleguide)

---

## 🏁 Conclusion

Congratulations! You've successfully migrated a full-featured React application to Angular. You've learned:

- Angular's component architecture and module system
- Dependency injection and services
- RxJS and reactive programming
- TypeScript integration
- Angular Router and navigation
- Template syntax and data binding

This migration demonstrates that while React and Angular achieve similar goals, they take very different approaches. React is minimal and flexible, while Angular is comprehensive and opinionated. Both are excellent choices depending on your project needs and team preferences.

Happy coding! 🚀
