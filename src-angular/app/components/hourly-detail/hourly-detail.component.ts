import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartConfiguration, ChartType } from 'chart.js';
import { DataService, EnergyData } from '../../services/data.service';

@Component({
  selector: 'app-hourly-detail',
  templateUrl: './hourly-detail.component.html',
  styleUrls: ['./hourly-detail.component.css']
})
export class HourlyDetailComponent implements OnInit {
  date: string = '';
  hourlyData: EnergyData[] = [];
  loading = true;
  error: string | null = null;

  // Chart data
  hourlyChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  hourlyChartOptions: ChartConfiguration['options'] = {};
  chartType: ChartType = 'bar';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.date = params['date'];
      if (this.date) {
        this.fetchHourlyData();
      }
    });
  }

  async fetchHourlyData(): Promise<void> {
    try {
      this.loading = true;
      const response = await this.dataService.getHourlyData(this.date).toPromise();
      this.hourlyData = response?.data || [];
      this.updateChart();
      this.loading = false;
    } catch (err: any) {
      this.error = err.message;
      this.loading = false;
    }
  }

  updateChart(): void {
    this.hourlyChartData = {
      labels: this.hourlyData.map(item => this.dataService.formatTimeInterval(item.from_date)),
      datasets: [
        {
          label: '15-min Consumption (kWh)',
          data: this.hourlyData.map(item => parseFloat(item.total_consumption || item.consumption || '0')),
          backgroundColor: 'rgba(52, 152, 219, 0.7)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: '15-min Charges ($)',
          data: this.hourlyData.map(item => parseFloat(item.total_charges || item.charges || '0')),
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          borderColor: 'rgba(46, 204, 113, 1)',
          borderWidth: 2,
          type: 'line',
          yAxisID: 'y1',
          pointRadius: 3,
          fill: false,
        } as any
      ]
    };

    this.hourlyChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: false },
        legend: {
          position: 'top',
          labels: { boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.datasetIndex === 0) {
                label += (context.raw as number).toFixed(2) + ' kWh';
              } else {
                label += '$' + (context.raw as number).toFixed(2);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { 
            display: true, 
            text: 'Consumption (kWh)',
            font: { weight: 'bold' }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { 
            display: true, 
            text: 'Charges ($)',
            font: { weight: 'bold' }
          },
          grid: { drawOnChartArea: false }
        }
      }
    };
  }

  get totalHourlyKwh(): number {
    return this.hourlyData.reduce(
      (sum, item) => sum + parseFloat(item.total_consumption || item.consumption || '0'),
      0
    );
  }

  get totalHourlyCharges(): number {
    return this.hourlyData.reduce(
      (sum, item) => sum + parseFloat(item.total_charges || item.charges || '0'),
      0
    );
  }

  get averageHourlyUsage(): number {
    return this.hourlyData.length > 0 ? this.totalHourlyKwh / this.hourlyData.length : 0;
  }

  get peakHour(): string {
    if (this.hourlyData.length === 0) return 'N/A';
    
    const peakInterval = this.hourlyData.reduce((max, item) => 
      parseFloat(item.total_consumption || item.consumption || '0') > 
      parseFloat(max.total_consumption || max.consumption || '0') ? item : max
    , this.hourlyData[0]);
    
    return this.dataService.formatTimeInterval(peakInterval.from_date);
  }

  get formattedDate(): string {
    const d = new Date(this.date + 'T12:00:00');
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
