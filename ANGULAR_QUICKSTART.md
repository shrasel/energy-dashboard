# Angular Quick Start Guide

## 🚀 Running the Application

### Start Angular App (Port 4200)
```bash
npm start
```

Visit: http://localhost:4200

### Start React App (Port 3000)
```bash
npm run start:react
```

Visit: http://localhost:3000

---

## 📂 Project Structure

```
ohm-dashboard/
├── src/                          # React application
│   ├── App.js                    # React main dashboard
│   ├── HourlyDetail.js          # React hourly detail page
│   └── App.css                   # React styles
│
├── src-angular/                  # Angular application
│   ├── app/
│   │   ├── components/
│   │   │   ├── dashboard/       # Dashboard component
│   │   │   └── hourly-detail/   # Hourly detail component
│   │   ├── services/
│   │   │   └── data.service.ts  # API service
│   │   ├── app.module.ts        # Root module
│   │   └── app-routing.module.ts # Routing
│   ├── index.html
│   ├── main.ts                   # Bootstrap
│   └── styles.css                # Global styles
│
├── angular.json                  # Angular config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## 🔑 Key Files Explained

### `src-angular/main.ts`
Entry point that bootstraps the Angular application.

### `src-angular/app/app.module.ts`
Main module that:
- Declares all components
- Imports necessary modules
- Provides services
- Bootstraps the root component

### `src-angular/app/app-routing.module.ts`
Configures routing:
- `/` → Dashboard
- `/hourly/:date` → Hourly Detail

### `src-angular/app/services/data.service.ts`
Service for API calls:
- `getMonthlyData()`
- `getDailyData()`
- `getHourlyData(date)`

### Components
Each component has 3 files:
- `.ts` - TypeScript logic
- `.html` - Template
- `.css` - Styles

---

## 🎯 Common Commands

```bash
# Development
npm start                    # Start Angular dev server
npm run watch               # Build with watch mode

# Build
npm run build               # Production build

# React (legacy)
npm run start:react         # Start React app
npm run build:react         # Build React app
```

---

## 📝 Making Changes

### 1. Add a New Component
```bash
# Create component folder
mkdir -p src-angular/app/components/my-component

# Create files
touch src-angular/app/components/my-component/my-component.component.ts
touch src-angular/app/components/my-component/my-component.component.html
touch src-angular/app/components/my-component/my-component.component.css
```

Register in `app.module.ts`:
```typescript
import { MyComponent } from './components/my-component/my-component.component';

@NgModule({
  declarations: [
    ...,
    MyComponent  // Add here
  ]
})
```

### 2. Add a New Service
```bash
touch src-angular/app/services/my-service.service.ts
```

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MyService {
  constructor() {}
}
```

### 3. Add a New Route
In `app-routing.module.ts`:
```typescript
const routes: Routes = [
  ...,
  { path: 'my-path', component: MyComponent }
];
```

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 4200
lsof -ti:4200 | xargs kill -9
```

### Clear npm cache
```bash
rm -rf node_modules
npm cache clean --force
npm install
```

### TypeScript errors
```bash
# Check tsconfig.json
# Ensure "strict": true is manageable
# Use "any" type temporarily if needed
```

---

## 📚 Learning Resources

- [Angular Docs](https://angular.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RxJS Guide](https://rxjs.dev/guide/overview)
- [ng2-charts](https://www.npmjs.com/package/ng2-charts)

---

## ⚡ Hot Tips

1. **Components communicate via:**
   - `@Input()` - Parent to child
   - `@Output()` - Child to parent
   - Services - Shared state

2. **Use getters for computed values:**
   ```typescript
   get filteredData(): any[] {
     return this.data.filter(...);
   }
   ```

3. **Unsubscribe from Observables:**
   ```typescript
   subscription = this.service.getData().subscribe(...);
   ngOnDestroy() {
     this.subscription.unsubscribe();
   }
   ```

4. **Use async pipe in templates:**
   ```html
   <div *ngIf="data$ | async as data">
     {{ data.value }}
   </div>
   ```

5. **Debugging:**
   - Use Angular DevTools (Chrome extension)
   - `console.log()` in component methods
   - Check Network tab for API calls

---

## 🎨 Styling

### Global Styles
Edit `src-angular/styles.css`

### Component Styles
Edit component-specific `.css` files

### View Encapsulation
```typescript
@Component({
  ...,
  encapsulation: ViewEncapsulation.None // Disable CSS scoping
})
```

---

## 🔐 API Configuration

API base URL is in `data.service.ts`:
```typescript
private apiUrl = 'http://localhost:3000/api/data';
```

Make sure your API server is running on port 3000!

---

## ✅ Migration Complete!

Your React app has been successfully migrated to Angular. Both versions are fully functional and can run side-by-side for comparison.

For detailed migration notes, see `ANGULAR_MIGRATION_GUIDE.md`.
