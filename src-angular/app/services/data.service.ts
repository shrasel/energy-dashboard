import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EnergyData {
  from_date: string;
  to_date: string;
  total_consumption: string;
  total_charges: string;
  interval_length?: number;
  consumption?: string;
  charges?: string;
}

export interface ApiResponse {
  data: EnergyData[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api/data';

  constructor(private http: HttpClient) {}

  getMonthlyData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/monthly`);
  }

  getDailyData(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/daily`);
  }

  getHourlyData(date: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/hourly?date=${date}`);
  }

  // Helper function to parse API dates correctly (avoiding timezone issues)
  parseApiDate(dateString: string): Date {
    const datePart = dateString.split('T')[0];
    return new Date(datePart + 'T12:00:00');
  }

  // Helper function to format time for 15-minute intervals
  formatTimeInterval(dateString: string): string {
    const date = new Date(dateString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const minuteStr = minutes.toString().padStart(2, '0');
    
    return `${hour12}:${minuteStr} ${ampm}`;
  }
}
