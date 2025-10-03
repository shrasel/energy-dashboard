# React vs Angular: Side-by-Side Comparison

A quick reference for developers learning Angular coming from React.

---

## 📦 Installation & Setup

### React
```bash
npx create-react-app my-app
cd my-app
npm start
```

### Angular
```bash
npm install -g @angular/cli
ng new my-app
cd my-app
ng serve
```

---

## 🏗️ Component Structure

### React
```javascript
// App.js
import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;
```

### Angular
```typescript
// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  count = 0;
  
  increment() {
    this.count++;
  }
}
```

```html
<!-- app.component.html -->
<div>
  <h1>Count: {{ count }}</h1>
  <button (click)="increment()">
    Increment
  </button>
</div>
```

---

## 🔄 State Management

| React | Angular |
|-------|---------|
| `const [state, setState] = useState(initial)` | `property = initial` |
| `setState(newValue)` | `this.property = newValue` |
| `const value = state` | `value = this.property` |

### React
```javascript
const [user, setUser] = useState({ name: 'John', age: 30 });
setUser({ ...user, age: 31 });
```

### Angular
```typescript
user = { name: 'John', age: 30 };
this.user = { ...this.user, age: 31 };
// or
this.user.age = 31;
```

---

## 🎣 Lifecycle & Side Effects

### React
```javascript
import { useEffect } from 'react';

useEffect(() => {
  // Runs on mount
  fetchData();
  
  return () => {
    // Cleanup on unmount
  };
}, []); // Dependencies

useEffect(() => {
  // Runs when count changes
  console.log('Count changed:', count);
}, [count]);
```

### Angular
```typescript
import { OnInit, OnDestroy } from '@angular/core';

ngOnInit() {
  // Runs on mount
  this.fetchData();
}

ngOnDestroy() {
  // Cleanup on unmount
}

ngOnChanges(changes) {
  // Runs when @Input() properties change
  console.log('Input changed:', changes);
}
```

---

## 🌐 HTTP Requests

### React (with axios)
```javascript
import axios from 'axios';

const fetchData = async () => {
  try {
    const response = await axios.get('/api/data');
    setData(response.data);
  } catch (error) {
    setError(error.message);
  }
};
```

### Angular
```typescript
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) {}

fetchData() {
  this.http.get('/api/data').subscribe({
    next: (data) => this.data = data,
    error: (error) => this.error = error.message
  });
}

// Or with async/await
async fetchData() {
  try {
    const data = await this.http.get('/api/data').toPromise();
    this.data = data;
  } catch (error) {
    this.error = error.message;
  }
}
```

---

## 🧭 Routing

### React Router
```javascript
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

// Setup
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/user/:id" element={<User />} />
  </Routes>
</BrowserRouter>

// Navigate
const navigate = useNavigate();
navigate('/user/123');

// Link
<Link to="/user/123">Go to User</Link>

// Get params
const { id } = useParams();
```

### Angular Router
```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'user/:id', component: UserComponent }
];

// Navigate
constructor(private router: Router) {}
this.router.navigate(['/user', 123]);

// Link
<a routerLink="/user/123">Go to User</a>

// Get params
constructor(private route: ActivatedRoute) {}
this.route.params.subscribe(params => {
  const id = params['id'];
});
```

---

## 📝 Forms

### React (Controlled)
```javascript
const [formData, setFormData] = useState({ email: '', password: '' });

const handleSubmit = (e) => {
  e.preventDefault();
  console.log(formData);
};

<form onSubmit={handleSubmit}>
  <input
    type="email"
    value={formData.email}
    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  />
  <button type="submit">Submit</button>
</form>
```

### Angular (Template-driven)
```typescript
formData = { email: '', password: '' };

onSubmit() {
  console.log(this.formData);
}
```

```html
<form (ngSubmit)="onSubmit()">
  <input
    type="email"
    [(ngModel)]="formData.email"
    name="email"
  />
  <button type="submit">Submit</button>
</form>
```

### Angular (Reactive Forms)
```typescript
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

constructor(private fb: FormBuilder) {}

form: FormGroup = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]]
});

onSubmit() {
  if (this.form.valid) {
    console.log(this.form.value);
  }
}
```

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <input type="email" formControlName="email" />
  <div *ngIf="form.get('email')?.invalid">Invalid email</div>
  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>
```

---

## 📋 Lists & Conditionals

### React
```javascript
// Conditional
{loading && <div>Loading...</div>}
{error && <div>Error: {error}</div>}
{!loading && !error && <div>Data loaded!</div>}

// List
{users.map((user, index) => (
  <div key={user.id}>
    {user.name}
  </div>
))}

// Conditional rendering
{isLoggedIn ? <Dashboard /> : <Login />}
```

### Angular
```html
<!-- Conditional -->
<div *ngIf="loading">Loading...</div>
<div *ngIf="error">Error: {{ error }}</div>
<div *ngIf="!loading && !error">Data loaded!</div>

<!-- List -->
<div *ngFor="let user of users; let i = index">
  {{ user.name }}
</div>

<!-- Conditional rendering -->
<app-dashboard *ngIf="isLoggedIn"></app-dashboard>
<app-login *ngIf="!isLoggedIn"></app-login>

<!-- Or use ng-template -->
<app-dashboard *ngIf="isLoggedIn; else loginTemplate"></app-dashboard>
<ng-template #loginTemplate>
  <app-login></app-login>
</ng-template>
```

---

## 🎨 Styling

### React
```javascript
// Inline styles
<div style={{ color: 'red', fontSize: 16 }}>Text</div>

// CSS Modules
import styles from './App.module.css';
<div className={styles.container}>Content</div>

// Conditional classes
<div className={isActive ? 'active' : ''}>Item</div>
<div className={`item ${isActive ? 'active' : ''}`}>Item</div>
```

### Angular
```html
<!-- Inline styles -->
<div [style.color]="'red'" [style.font-size.px]="16">Text</div>

<!-- CSS classes -->
<div class="container">Content</div>

<!-- Conditional classes -->
<div [class.active]="isActive">Item</div>
<div [ngClass]="{'active': isActive, 'disabled': isDisabled}">Item</div>

<!-- Dynamic styles -->
<div [ngStyle]="{'color': textColor, 'font-size': fontSize + 'px'}">Text</div>
```

---

## 🔗 Component Communication

### React (Props & Callbacks)
```javascript
// Parent
function Parent() {
  const [count, setCount] = useState(0);
  
  return (
    <Child 
      count={count} 
      onIncrement={() => setCount(count + 1)}
    />
  );
}

// Child
function Child({ count, onIncrement }) {
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={onIncrement}>Increment</button>
    </div>
  );
}
```

### Angular (@Input & @Output)
```typescript
// parent.component.ts
count = 0;
increment() {
  this.count++;
}
```

```html
<!-- parent.component.html -->
<app-child 
  [count]="count"
  (increment)="increment()">
</app-child>
```

```typescript
// child.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({...})
export class ChildComponent {
  @Input() count: number = 0;
  @Output() increment = new EventEmitter<void>();
  
  handleClick() {
    this.increment.emit();
  }
}
```

```html
<!-- child.component.html -->
<div>
  <p>Count: {{ count }}</p>
  <button (click)="handleClick()">Increment</button>
</div>
```

---

## 🗂️ Shared State/Services

### React (Context)
```javascript
import { createContext, useContext } from 'react';

const UserContext = createContext(null);

// Provider
function App() {
  const [user, setUser] = useState(null);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Component />
    </UserContext.Provider>
  );
}

// Consumer
function Component() {
  const { user, setUser } = useContext(UserContext);
  return <div>{user?.name}</div>;
}
```

### Angular (Service)
```typescript
// user.service.ts
@Injectable({ providedIn: 'root' })
export class UserService {
  private user = new BehaviorSubject(null);
  user$ = this.user.asObservable();
  
  setUser(userData) {
    this.user.next(userData);
  }
}

// component.ts
constructor(private userService: UserService) {}

ngOnInit() {
  this.userService.user$.subscribe(user => {
    this.user = user;
  });
}

updateUser() {
  this.userService.setUser({ name: 'John' });
}
```

---

## 🛠️ Custom Hooks vs Pipes

### React (Custom Hook)
```javascript
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}

// Usage
const { width, height } = useWindowSize();
```

### Angular (Pipe)
```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'capitalize' })
export class CapitalizePipe implements PipeTransform {
  transform(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

// Usage in template
{{ 'hello' | capitalize }}  <!-- Output: Hello -->
```

---

## 📊 Performance Optimization

### React
```javascript
import { useMemo, useCallback, memo } from 'react';

// Memoize computed values
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize components
const MemoizedComponent = memo(Component);
```

### Angular
```typescript
// Change Detection Strategy
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Pure pipes (memoized by default)
@Pipe({ name: 'myPipe', pure: true })

// TrackBy for lists
trackByFn(index, item) {
  return item.id;
}
```

```html
<div *ngFor="let item of items; trackBy: trackByFn">
  {{ item.name }}
</div>
```

---

## 🎯 Key Takeaways

| Concept | React | Angular |
|---------|-------|---------|
| **Philosophy** | Library, minimal | Framework, complete |
| **Language** | JavaScript/JSX | TypeScript |
| **Learning Curve** | Easier | Steeper |
| **Structure** | Flexible | Opinionated |
| **State** | Hooks | Properties |
| **Templates** | JSX | HTML |
| **DI** | Manual | Built-in |
| **Routing** | Library | Built-in |
| **Forms** | Manual | Built-in (2 ways) |
| **HTTP** | Library | Built-in |

---

## 🚀 When to Choose

### Choose React when:
- Building simple to medium apps
- Need flexibility in architecture
- Want faster initial learning
- Prefer JavaScript over TypeScript
- Team is small or mid-sized

### Choose Angular when:
- Building large enterprise apps
- Need consistent structure
- Want built-in solutions
- Prefer TypeScript
- Team is large and needs conventions

---

## 📚 Further Reading

- [React Docs](https://react.dev/)
- [Angular Docs](https://angular.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RxJS Guide](https://rxjs.dev/)

---

**Remember**: Both frameworks are excellent choices. The best one depends on your project requirements, team expertise, and personal preference. Happy coding! 🎉
