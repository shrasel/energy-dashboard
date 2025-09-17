import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './App.css';

// Register ChartJS components
ChartJS.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

function App() {
  const navigate = useNavigate();
  
  // Helper function to parse API dates correctly (avoiding timezone issues)
  const parseApiDate = (dateString) => {
    // Extract just the date part (YYYY-MM-DD) and create a local date
    const datePart = dateString.split('T')[0];
    return new Date(datePart + 'T12:00:00'); // Use noon to avoid timezone issues
  };
  
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date('2025-05-01'),
    end: new Date('2025-05-31')
  });
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  // Update the useEffect hook where availableMonths is calculated
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const [monthlyRes, dailyRes] = await Promise.all([
        axios.get('http://localhost:3000/api/data/monthly'),
        axios.get('http://localhost:3000/api/data/daily')
      ]);
      
      const monthlyData = monthlyRes.data.data;
      const dailyData = dailyRes.data.data;
      
      setMonthlyData(monthlyData);
      setDailyData(dailyData);
      
      // Remove this block, as highestMonthData should be calculated in the main component scope
      // const highestMonthData = monthlyRes.reduce((max, item) => 
      //   item.cost > (max?.cost ?? 0) ? item : max
      // , monthlyRes[0]);
      
      // Extract unique years from monthly data
      const years = [...new Set(monthlyData.map(item => 
        parseApiDate(item.from_date).getFullYear()))].sort((a, b) => b - a);
      setAvailableYears(years);
      
      // Set default selected year (most recent)
      if (years.length > 0) {
        setSelectedYear(years[0]);
      }
      
      // Process daily data to find distinct months (modified part)
      const monthMap = new Map();
      dailyData.forEach(item => {
        const date = parseApiDate(item.from_date);
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
      
      const months = Array.from(monthMap.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      setAvailableMonths(months);
      
      // Rest of your code remains the same...
      // Set default selected month for daily chart
      if (months.length > 0) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const currentMonthData = months.find(m => 
          m.month === currentMonth && m.year === currentYear);
        
        setSelectedMonth(currentMonthData ? currentMonthData : months[0]);
        
        // Set date range to selected month
        if (currentMonthData || months[0]) {
          const selected = currentMonthData || months[0];
          const startDate = new Date(selected.year, selected.month, 1);
          const endDate = new Date(selected.year, selected.month + 1, 0);
          setDateRange({
            start: startDate,
            end: endDate
          });
        }
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  fetchData();
}, []);

  // Filter monthly data by selected year
  const filteredMonthlyData = selectedYear 
    ? monthlyData.filter(item => 
        parseApiDate(item.from_date).getFullYear() === selectedYear)
    : monthlyData; // Show all data if no year selected

  // Process data for monthly chart
  const monthlyChartData = {
    labels: filteredMonthlyData.map(item => 
      parseApiDate(item.from_date).toLocaleDateString('en-US', { month: 'short' })),
    datasets: [
      {
        label: 'Consumption (kWh)',
        data: filteredMonthlyData.map(item => parseFloat(item.total_consumption)),
        backgroundColor: 'rgba(52, 152, 219, 0.7)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Total Charges ($)',
        data: filteredMonthlyData.map(item => parseFloat(item.total_charges)),
        backgroundColor: 'rgba(46, 204, 113, 0.7)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 1,
        type: 'line',
        yAxisID: 'y1',
      }
    ]
  };

  // Process daily data for charts (filtered by date range)
  const filteredDailyData = dailyData.filter(item => {
    const date = parseApiDate(item.from_date);
    return date >= dateRange.start && date <= dateRange.end;
  }).reverse();

  // Build per-month color mapping for the filtered daily range
  const colorPalette = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];

  const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
  const monthColorMap = new Map();
  const monthLegends = [];

  filteredDailyData.forEach(item => {
    const d = parseApiDate(item.from_date);
    const key = monthKey(d);
    if (!monthColorMap.has(key)) {
      const color = colorPalette[monthColorMap.size % colorPalette.length];
      monthColorMap.set(key, color);
      monthLegends.push({
        key,
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        color
      });
    }
  });

  const barBgColors = filteredDailyData.map(item => {
    const d = parseApiDate(item.from_date);
    const col = monthColorMap.get(monthKey(d)) || colorPalette[0];
    // Convert hex to rgba with alpha 0.7 for background
    const r = parseInt(col.slice(1,3), 16);
    const g = parseInt(col.slice(3,5), 16);
    const b = parseInt(col.slice(5,7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  });
  const barBorderColors = filteredDailyData.map(item => {
    const d = parseApiDate(item.from_date);
    const col = monthColorMap.get(monthKey(d)) || colorPalette[0];
    return col;
  });

  // Updated dailyChartData to match monthlyChartData (bar + line, dual y-axes)
  const dailyChartData = {
    labels: filteredDailyData.map(item => 
      parseApiDate(item.from_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Daily Consumption (kWh)',
  data: filteredDailyData.map(item => parseFloat(item.total_consumption)),
  backgroundColor: barBgColors,
  borderColor: barBorderColors,
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Total Charges ($)',
        data: filteredDailyData.map(item => parseFloat(item.total_charges)),
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        borderColor: 'rgba(46, 204, 113, 1)',
        borderWidth: 2,
        type: 'line',
        yAxisID: 'y1',
        pointRadius: 3,
        fill: false,
      }
    ]
  };

  // Totals for the current filtered daily range
  const totalDailyKwh = filteredDailyData.reduce(
    (sum, item) => sum + parseFloat(item?.total_consumption || 0),
    0
  );
  const totalDailyCharges = filteredDailyData.reduce(
    (sum, item) => sum + parseFloat(item?.total_charges || 0),
    0
  );

  // Calculate summary metrics (robust by date and with guards)
  const sortedMonthly = [...monthlyData]
    .filter(item => item && item.from_date)
    .sort((a, b) => parseApiDate(a.from_date) - parseApiDate(b.from_date));

  const lastMonthEntry = sortedMonthly[sortedMonthly.length - 1] || null;
  const prevMonthEntry = sortedMonthly[sortedMonthly.length - 2] || null;

  // Keep currentMonthData for UI sections that reference it
  const currentMonthData = lastMonthEntry || {};

  const monthlyChange =
    lastMonthEntry && prevMonthEntry && parseFloat(prevMonthEntry.total_consumption || 0) > 0
      ? (
          ((parseFloat(lastMonthEntry.total_consumption || 0) -
            parseFloat(prevMonthEntry.total_consumption || 0)) /
            parseFloat(prevMonthEntry.total_consumption)) *
          100
        ).toFixed(1)
      : null;

  const ytdConsumption = monthlyData.reduce(
    (sum, item) => sum + parseFloat(item?.total_consumption || 0),
    0
  );
  const ytdCharges = monthlyData.reduce(
    (sum, item) => sum + parseFloat(item?.total_charges || 0),
    0
  );
  const avgCostPerKwh = ytdConsumption > 0 ? (ytdCharges / ytdConsumption).toFixed(3) : '0.000';

  // Find the month with the highest consumption (or charges)
  const highestMonthData = monthlyData.reduce((max, item) =>
    parseFloat(item.total_consumption) > parseFloat(max?.total_consumption ?? 0) ? item : max
  , monthlyData[0] || {});

  // Handle daily bar click to navigate to hourly detail
  const handleDailyBarClick = (event, elements, chart) => {
    if (!elements?.length) return;
    const idx = elements[0].index;
    const item = filteredDailyData[idx];
    if (!item) return;
    
    // Format date as YYYY-MM-DD for the API
    const date = parseApiDate(item.from_date);
    const formattedDate = date.toISOString().split('T')[0];
    navigate(`/hourly/${formattedDate}`);
  };

  // Handle month selection for daily chart
  const handleMonthChange = (monthValue) => {
    const selected = availableMonths.find(m => m.value === monthValue);
    if (selected) {
      setSelectedMonth(selected);
      const startDate = new Date(selected.year, selected.month, 1);
      const endDate = new Date(selected.year, selected.month + 1, 0);
      setDateRange({
        start: startDate,
        end: endDate
      });
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Energy Consumption Dashboard</h1>
        <div className="last-updated">Last Updated: {new Date().toLocaleDateString()}</div>
      </header>
      
      <div className="summary-cards">
        <div className="card">
          <h3>
            Highest Month (
              {parseApiDate(highestMonthData.from_date).toLocaleDateString('en-US', { month: 'short' })}
            )
          </h3>
          <div className="value">{highestMonthData.total_consumption} kWh</div>
          <div className="subtext">${highestMonthData.total_charges} total charges</div>
        </div>
        <div className="card">
          <h3>Avg Cost per kWh</h3>
          <div className="value">${avgCostPerKwh}</div>
          <div className="subtext">Year-to-date average</div>
        </div>
        <div className="card">
          <h3>Monthly Change</h3>
          <div
            className="value"
            style={{ color: monthlyChange !== null && parseFloat(monthlyChange) < 0 ? '#2ecc71' : '#e74c3c' }}
          >
            {monthlyChange !== null ? `${monthlyChange}%` : 'N/A'}
          </div>
          <div className="subtext">Vs previous month (consumption)</div>
        </div>
        <div className="card">
          <h3>Year-to-Date</h3>
          <div className="value">{ytdConsumption.toFixed(2)} kWh</div>
          <div className="subtext">${ytdCharges.toFixed(2)} total charges</div>
        </div>
      </div>
      
      {/* Daily Chart */}
      <div className="chart-card">
        <div className="chart-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2>Daily Consumption</h2>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                Click on any bar to view hourly details
              </div>
            </div>
          <div className="filter-group">
            <select 
              className="month-selector"
              value={selectedMonth ? selectedMonth.value : ''}
              onChange={(e) => handleMonthChange(e.target.value)}
            >
              {availableMonths.map((month, index) => (
                <option key={index} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <div className="date-range">
              <label>From: </label>
              <input 
                type="date" 
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={e => setDateRange({...dateRange, start: new Date(e.target.value)})}
              />
              <label> To: </label>
              <input 
                type="date" 
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={e => setDateRange({...dateRange, end: new Date(e.target.value)})}
              />
            </div>
          </div>
          </div>
            {/* Show total kWh and total charges for the selected range */}
            <div style={{ marginTop: 8, fontWeight: 500, color: '#2c3e50' }}>
              Total: {totalDailyKwh.toFixed(2)} kWh | ${totalDailyCharges.toFixed(2)}
            </div>
          {monthLegends.length > 1 && (
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {monthLegends.map((m) => (
                <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, background: m.color, display: 'inline-block', borderRadius: 2, border: '1px solid #ccc' }} />
                  <span style={{ fontSize: 12, color: '#555' }}>{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="chart-wrapper">
          <Chart 
            type='bar'
            data={dailyChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              onClick: handleDailyBarClick,
              onHover: (event, elements) => {
                event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
              },
              plugins: {
                title: { display: false },
                legend: {
                  position: 'top',
                  labels: {
                    boxWidth: 12
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) label += ': ';
                      if (context.datasetIndex === 0) {
                        label += context.raw.toFixed(2) + ' kWh';
                      } else {
                        label += '$' + context.raw.toFixed(2);
                      }
                      return label;
                    },
                    afterLabel: function(context) {
                      if (context.datasetIndex === 0) {
                        const cost = filteredDailyData[context.dataIndex].total_charges;
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
                    font: {
                      weight: 'bold'
                    }
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: { 
                    display: true, 
                    text: 'Total Charges ($)',
                    font: {
                      weight: 'bold'
                    }
                  },
                  grid: { drawOnChartArea: false }
                }
              }
            }}
          />
        </div>
      </div>
      <div className="spacer" style={{ height: 32 }}></div>
      {/* Monthly Chart with Year Dropdown */}
      <div className="chart-card">
        <div className="chart-header">
          <h2>Monthly Energy Consumption & Cost ({filteredMonthlyData.length} months)</h2>
          <select 
            className="year-selector"
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value === '' ? null : parseInt(e.target.value))}
          >
            <option value="">All Years</option>
            {availableYears.map((year, index) => (
              <option key={index} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="chart-wrapper">
          <Chart 
            type='bar'
            data={monthlyChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: { display: false },
                legend: {
                  position: 'top',
                  labels: {
                    boxWidth: 12
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) label += ': ';
                      if (context.datasetIndex === 0) {
                        label += context.raw.toFixed(2) + ' kWh';
                      } else {
                        label += '$' + context.raw.toFixed(2);
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
                    font: {
                      weight: 'bold'
                    }
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: { 
                    display: true, 
                    text: 'Total Charges ($)',
                    font: {
                      weight: 'bold'
                    }
                  },
                  grid: { drawOnChartArea: false }
                }
              }
            }}
          />
        </div>
      </div>
      
      <div className="data-table">
        <h2>Detailed Data ({selectedYear ? selectedYear : 'All Years'} - {filteredMonthlyData.length} records)</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Month</th>  
                <th>Consumption (kWh)</th>
                <th>Total Charges</th>
                <th>Days Billed</th>
                <th>Cost per kWh</th>
              </tr>
            </thead>
            <tbody>
              {filteredMonthlyData.map((item, index) => {
                // Safely parse date and numeric fields
                const date = item?.from_date ? parseApiDate(item.from_date) : null;
                const monthLabel = date
                  ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'Unknown';

                const consumption = parseFloat(item?.total_consumption || 0);
                const charges = parseFloat(item?.total_charges || 0);
                const daysBilled = item?.interval_length ?? 'N/A';

                // Guard against division by zero for cost per kWh
                const costPerKwh = consumption > 0 ? (charges / consumption) : 0;

                return (
                  <tr key={index}>
                    <td>{monthLabel}</td>
                    <td>{consumption ? consumption.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td>${charges.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{typeof daysBilled === 'number' || typeof daysBilled === 'string' ? daysBilled : 'N/A'}</td>
                    <td>${costPerKwh.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="insights">
        <h2>Insights & Observations</h2>
        <div className="insight-item">
          <h3>Seasonal Pattern Detected</h3>
          <p>Highest usage occurs in winter months (Jan-Feb), with consumption decreasing through spring. 
          January showed the highest consumption at {monthlyData[monthlyData.length - 1]?.total_consumption || 'N/A'} kWh.</p>
        </div>
        <div className="insight-item">
          <h3>Recent Usage</h3>
          <p>Current month shows {currentMonthData.total_consumption} kWh consumption, which is 
          {monthlyChange > 0 ? ' an increase' : ' a decrease'} of {Math.abs(monthlyChange)}% compared to previous month.</p>
        </div>
        <div className="insight-item">
          <h3>Cost Efficiency</h3>
          <p>Your average cost per kWh is ${avgCostPerKwh}, with year-to-date spending totaling ${ytdCharges.toFixed(2)}.</p>
        </div>
      </div>
    </div>
  );
}

export default App;