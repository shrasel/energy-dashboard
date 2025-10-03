import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HourlyDetailComponent } from './components/hourly-detail/hourly-detail.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'hourly/:date', component: HourlyDetailComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
