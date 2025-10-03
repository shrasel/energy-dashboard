import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartType } from 'chart.js';
import { DataService, EnergyData } from '../../services/data.service';

interface MonthData {
  month: number;
  year: number;
  label: string;
  value: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  monthlyData: EnergyData[] = [];
  dailyData: EnergyData[] = [];
  loading = true;
  error: string | null = null;
  
  dateRange = {
    start: new Date('2025-05-01'),
    end: new Date('2025-05-31')
  };
  
  selectedYear: number | null = null;
  selectedMonth: MonthData | null = null;
  availableYears: number[] = [];
  availableMonths: MonthData[] = [];
  
  // Table UI states
  sortConfig: SortConfig = { key: 'from_date', direction: 'desc' };
  currentPage = 1;
  rowsPerPage = 8;
  
  // Chart data
  monthlyChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  dailyChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  monthlyChartOptions: ChartConfiguration['options'] = {};
  dailyChartOptions: ChartConfiguration['options'] = {};
  chartType: ChartType = 'bar';
  
  // Expose global functions to template
  parseFloat = parseFloat;
  Math = Math;

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  async fetchData(): Promise<void> {
    try {
      this.loading = true;
      
      const [monthlyRes, dailyRes] = await Promise.all([
        this.dataService.getMonthlyData().toPromise(),
        this.dataService.getDailyData().toPromise()
      ]);
      
      this.monthlyData = monthlyRes?.data || [];
      this.dailyData = dailyRes?.data || [];
      
      // Extract unique years from monthly data
      const years = [...new Set(this.monthlyData.map(item => 
        this.parseApiDate(item.from_date).getFullYear()))].sort((a, b) => b - a);
      this.availableYears = years;
      
      // Set default selected year (most recent)
      if (years.length > 0) {
        this.selectedYear = years[0];
      }
      
      // Process daily data to find distinct months
      const monthMap = new Map<string, MonthData>();
      this.dailyData.forEach(item => {
        const date = this.parseApiDate(item.from_date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            month: date.getMonth(),
            year: date.getFullYear(),
            label: monthLabel,
            value: monthKey
          });
        }
      });
      
      this.availableMonths = Array.from(monthMap.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      // Set default selected month for daily chart
      if (this.availableMonths.length > 0) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const currentMonthData = this.availableMonths.find(m => 
          m.month === currentMonth && m.year === currentYear);
        
        this.selectedMonth = currentMonthData ? currentMonthData : this.availableMonths[0];
        
        // Set date range to selected month
        if (this.selectedMonth) {
          const selected = this.selectedMonth;
          const startDate = new Date(selected.year, selected.month, 1);
          const endDate = new Date(selected.year, selected.month + 1, 0);
          this.dateRange = { start: startDate, end: endDate };
        }
      }
      
      this.updateCharts();
      this.loading = false;
    } catch (err: any) {
      this.error = err.message;
      this.loading = false;
    }
  }

  parseApiDate(dateString: string): Date {
    return this.dataService.parseApiDate(dateString);
  }

  // Filter monthly data by selected year
  get filteredMonthlyData(): EnergyData[] {
    return this.selectedYear 
      ? this.monthlyData.filter(item => 
          this.parseApiDate(item.from_date).getFullYear() === this.selectedYear)
      : this.monthlyData;
  }

  // Filter daily data by date range
  get filteredDailyData(): EnergyData[] {
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    return this.dailyData.filter(item => {
      const date = this.parseApiDate(item.from_date);
      return date >= startOfDay(this.dateRange.start) && date <= endOfDay(this.dateRange.end);
    }).reverse();
  }

  // Sorted and paginated monthly data
  get sortedMonthly(): any[] {
    const items = this.filteredMonthlyData.map(item => ({
      ...item,
      _dateObj: this.parseApiDate(item.from_date),
      _consumption: parseFloat(item.total_consumption || '0'),
      _charges: parseFloat(item.total_charges || '0')
    }));

    if (!this.sortConfig?.key) return items;

    items.sort((a, b) => {
      const key = this.sortConfig.key;
      let av: any = (a as any)[key];
      let bv: any = (b as any)[key];

      // support special keys
      if (key === 'from_date') { av = a._dateObj; bv = b._dateObj; }
      if (key === 'total_consumption') { av = a._consumption; bv = b._consumption; }
      if (key === 'total_charges') { av = a._charges; bv = b._charges; }

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (av < bv) return this.sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return this.sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }

  get paginatedMonthly(): any[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.sortedMonthly.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedMonthly.length / this.rowsPerPage));
  }

  requestSort(key: string): void {
    let direction: 'asc' | 'desc' = 'asc';
    if (this.sortConfig.key === key && this.sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    this.sortConfig = { key, direction };
    this.currentPage = 1;
  }

  exportCsv(): void {
    const headers = ['Month', 'Consumption (kWh)', 'Total Charges', 'Days Billed', 'Cost per kWh'];
    const rows = this.sortedMonthly.map(item => {
      const date = item._dateObj ? item._dateObj.toISOString().split('T')[0] : '';
      const consumption = item._consumption.toFixed(2);
      const charges = item._charges.toFixed(2);
      const days = item.interval_length ?? '';
      const cost = item._consumption > 0 ? (item._charges / item._consumption).toFixed(3) : '0.000';
      return [date, consumption, charges, days, cost];
    });

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-data-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  handleMonthChange(monthValue: string): void {
    const selected = this.availableMonths.find(m => m.value === monthValue);
    if (selected) {
      this.selectedMonth = selected;
      const startDate = new Date(selected.year, selected.month, 1);
      const endDate = new Date(selected.year, selected.month + 1, 0, 23, 59, 59, 999);
      this.dateRange = { start: startDate, end: endDate };
      this.updateCharts();
    }
  }

  onYearChange(year: string): void {
    this.selectedYear = year === '' ? null : parseInt(year);
    this.updateCharts();
  }

  onStartDateChange(event: any): void {
    this.dateRange.start = new Date(event.target.value);
    this.updateCharts();
  }

  onEndDateChange(event: any): void {
    this.dateRange.end = new Date(event.target.value);
    this.updateCharts();
  }

  setPage(page: number): void {
    this.currentPage = Math.max(1, Math.min(this.totalPages, page));
  }

  setRowsPerPage(rows: number): void {
    this.rowsPerPage = rows;
    this.currentPage = 1;
  }

  sortByConsumption(): void {
    this.sortConfig = { key: 'total_consumption', direction: 'desc' };
    this.currentPage = 1;
  }

  // Calculate summary metrics
  get highestMonthData(): EnergyData {
    return this.monthlyData.reduce((max, item) =>
      parseFloat(item.total_consumption) > parseFloat(max?.total_consumption ?? '0') ? item : max
    , this.monthlyData[0] || {} as EnergyData);
  }

  get ytdConsumption(): number {
    return this.monthlyData.reduce(
      (sum, item) => sum + parseFloat(item?.total_consumption || '0'),
      0
    );
  }

  get ytdCharges(): number {
    return this.monthlyData.reduce(
      (sum, item) => sum + parseFloat(item?.total_charges || '0'),
      0
    );
  }

  get avgCostPerKwh(): string {
    return this.ytdConsumption > 0 ? (this.ytdCharges / this.ytdConsumption).toFixed(3) : '0.000';
  }

  get monthlyChange(): string | null {
    const dateSortedMonthly = [...this.monthlyData]
      .filter(item => item && item.from_date)
      .sort((a, b) => this.parseApiDate(a.from_date).getTime() - this.parseApiDate(b.from_date).getTime());

    const lastMonthEntry = dateSortedMonthly[dateSortedMonthly.length - 1] || null;
    const prevMonthEntry = dateSortedMonthly[dateSortedMonthly.length - 2] || null;

    if (lastMonthEntry && prevMonthEntry && parseFloat(prevMonthEntry.total_consumption || '0') > 0) {
      return (
        ((parseFloat(lastMonthEntry.total_consumption || '0') -
          parseFloat(prevMonthEntry.total_consumption || '0')) /
          parseFloat(prevMonthEntry.total_consumption)) * 100
      ).toFixed(1);
    }
    return null;
  }

  get totalDailyKwh(): number {
    return this.filteredDailyData.reduce(
      (sum, item) => sum + parseFloat(item?.total_consumption || '0'),
      0
    );
  }

  get totalDailyCharges(): number {
    return this.filteredDailyData.reduce(
      (sum, item) => sum + parseFloat(item?.total_charges || '0'),
      0
    );
  }

  get currentMonthData(): EnergyData {
    const dateSortedMonthly = [...this.monthlyData]
      .filter(item => item && item.from_date)
      .sort((a, b) => this.parseApiDate(a.from_date).getTime() - this.parseApiDate(b.from_date).getTime());
    
    return dateSortedMonthly[dateSortedMonthly.length - 1] || {} as EnergyData;
  }

  getTrendPercentage(consumption: number): number {
    const highest = Math.max(...this.monthlyData.map(m => parseFloat(m.total_consumption || '0')), 1);
    return Math.min(100, Math.round((consumption / highest) * 100));
  }

  getCostPerKwh(consumption: number, charges: number): number {
    return consumption > 0 ? charges / consumption : 0;
  }

  // Chart handling
  updateCharts(): void {
    this.updateMonthlyChart();
    this.updateDailyChart();
  }

  updateMonthlyChart(): void {
    this.monthlyChartData = {
      labels: this.filteredMonthlyData.map(item => 
        this.parseApiDate(item.from_date).toLocaleDateString('en-US', { month: 'short' })),
      datasets: [
        {
          label: 'Consumption (kWh)',
          data: this.filteredMonthlyData.map(item => parseFloat(item.total_consumption)),
          backgroundColor: 'rgba(52, 152, 219, 0.7)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Total Charges ($)',
          data: this.filteredMonthlyData.map(item => parseFloat(item.total_charges)),
          backgroundColor: 'rgba(46, 204, 113, 0.7)',
          borderColor: 'rgba(46, 204, 113, 1)',
          borderWidth: 1,
          type: 'line',
          yAxisID: 'y1',
        } as any
      ]
    };

    this.monthlyChartOptions = {
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
            text: 'Total Charges ($)',
            font: { weight: 'bold' }
          },
          grid: { drawOnChartArea: false }
        }
      }
    };
  }

  updateDailyChart(): void {
    const colorPalette = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];

    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
    const monthColorMap = new Map<string, string>();

    this.filteredDailyData.forEach(item => {
      const d = this.parseApiDate(item.from_date);
      const key = monthKey(d);
      if (!monthColorMap.has(key)) {
        const color = colorPalette[monthColorMap.size % colorPalette.length];
        monthColorMap.set(key, color);
      }
    });

    const barBgColors = this.filteredDailyData.map(item => {
      const d = this.parseApiDate(item.from_date);
      const col = monthColorMap.get(monthKey(d)) || colorPalette[0];
      const r = parseInt(col.slice(1, 3), 16);
      const g = parseInt(col.slice(3, 5), 16);
      const b = parseInt(col.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.7)`;
    });

    const barBorderColors = this.filteredDailyData.map(item => {
      const d = this.parseApiDate(item.from_date);
      return monthColorMap.get(monthKey(d)) || colorPalette[0];
    });

    this.dailyChartData = {
      labels: this.filteredDailyData.map(item => 
        this.parseApiDate(item.from_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })),
      datasets: [
        {
          label: 'Daily Consumption (kWh)',
          data: this.filteredDailyData.map(item => parseFloat(item.total_consumption)),
          backgroundColor: barBgColors,
          borderColor: barBorderColors,
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Total Charges ($)',
          data: this.filteredDailyData.map(item => parseFloat(item.total_charges)),
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

    this.dailyChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => this.handleDailyBarClick(event, elements),
      onHover: (event: any, elements: any[]) => {
        if (event.native && event.native.target) {
          event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      },
      plugins: {
        title: { display: false },
        legend: {
          position: 'top',
          labels: { boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.datasetIndex === 0) {
                label += (context.raw as number).toFixed(2) + ' kWh';
              } else {
                label += '$' + (context.raw as number).toFixed(2);
              }
              return label;
            },
            afterLabel: (context) => {
              if (context.datasetIndex === 0) {
                const cost = this.filteredDailyData[context.dataIndex].total_charges;
                return `Cost: $${parseFloat(cost).toFixed(2)}`;
              }
              return '';
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
            text: 'Total Charges ($)',
            font: { weight: 'bold' }
          },
          grid: { drawOnChartArea: false }
        }
      }
    };
  }

  handleDailyBarClick(event: any, elements: any[]): void {
    if (!elements?.length) return;
    const idx = elements[0].index;
    const item = this.filteredDailyData[idx];
    if (!item) return;
    
    const date = this.parseApiDate(item.from_date);
    const formattedDate = date.toISOString().split('T')[0];
    this.router.navigate(['/hourly', formattedDate]);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  get currentDate(): string {
    return new Date().toLocaleDateString();
  }
}
