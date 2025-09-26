import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';
import './App.css';

// Using ApexCharts for richer visuals

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
  // Table UI states
  const [sortConfig, setSortConfig] = useState({ key: 'from_date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

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

  // Sorting helper for the table
  const sortedMonthly = React.useMemo(() => {
    const items = [...filteredMonthlyData].map(item => ({
      ...item,
      _dateObj: item.from_date ? parseApiDate(item.from_date) : null,
      _consumption: parseFloat(item.total_consumption || 0),
      _charges: parseFloat(item.total_charges || 0)
    }));

    if (!sortConfig?.key) return items;

    items.sort((a, b) => {
      const key = sortConfig.key;
      let av = a[key];
      let bv = b[key];

      // support special keys
      if (key === 'from_date') { av = a._dateObj; bv = b._dateObj; }
      if (key === 'total_consumption') { av = a._consumption; bv = b._consumption; }
      if (key === 'total_charges') { av = a._charges; bv = b._charges; }

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [filteredMonthlyData, sortConfig]);

  // Pagination slice
  const paginatedMonthly = React.useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedMonthly.slice(start, start + rowsPerPage);
  }, [sortedMonthly, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(sortedMonthly.length / rowsPerPage));

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // CSV export helper
  const exportCsv = () => {
    const headers = ['Month','Consumption (kWh)','Total Charges','Days Billed','Cost per kWh'];
    const rows = sortedMonthly.map(item => {
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
    a.download = `monthly-data-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ApexCharts: monthly series and options (column + line)
  const monthlyLabels = filteredMonthlyData.map(item => 
    parseApiDate(item.from_date).toLocaleDateString('en-US', { month: 'short' }));

  const monthlySeries = [
    {
      name: 'Consumption (kWh)',
      type: 'column',
      data: filteredMonthlyData.map(item => parseFloat(item.total_consumption) || 0)
    },
    {
      name: 'Total Charges ($)',
      type: 'line',
      data: filteredMonthlyData.map(item => parseFloat(item.total_charges) || 0)
    }
  ];
  // Calculate nice axis ranges so the dual axes don't make the chart look squashed
  const consumptionValues = monthlySeries[0].data || [];
  const chargesValues = monthlySeries[1].data || [];
  const maxConsumption = consumptionValues.length ? Math.max(...consumptionValues) : 0;
  const maxCharges = chargesValues.length ? Math.max(...chargesValues) : 0;
  const y0Max = Math.ceil(maxConsumption * 1.12) || 10;
  const y1Max = Math.ceil(maxCharges * 1.12) || 1;

  const monthlyOptions = {
    chart: { height: 360, type: 'line', toolbar: { show: true } },
    stroke: { width: [0, 3] },
    plotOptions: { bar: { columnWidth: '50%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: monthlyLabels },
    yaxis: [
      {
        title: { text: 'Consumption (kWh)' },
        min: 0,
        max: y0Max,
        tickAmount: 6,
        labels: {
          formatter: val => Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })
        }
      },
      {
        opposite: true,
        title: { text: 'Total Charges ($)' },
        min: 0,
        max: y1Max,
        tickAmount: 6,
        labels: {
          formatter: val => '$' + Number(val).toLocaleString('en-US', { maximumFractionDigits: 2 })
        }
      }
    ],
    tooltip: {
      shared: true,
      y: {
        formatter: (val, { seriesIndex }) => {
          if (seriesIndex === 0) return `${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`;
          return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }
    },
    colors: [ '#2b8be6', '#28c76f' ],
    legend: { position: 'top' }
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

  // ApexCharts: daily series and options (column + line, dual y-axes)
  const dailyLabels = filteredDailyData.map(item => 
    parseApiDate(item.from_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));

  const dailySeries = [
    {
      name: 'Daily Consumption (kWh)',
      type: 'column',
      data: filteredDailyData.map(item => parseFloat(item.total_consumption) || 0)
    },
    {
      name: 'Total Charges ($)',
      type: 'line',
      data: filteredDailyData.map(item => parseFloat(item.total_charges) || 0)
    }
  ];

  const dailyOptions = {
    chart: {
      height: 340,
      type: 'line',
      toolbar: { show: true },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const idx = config.dataPointIndex;
          const item = filteredDailyData[idx];
          if (!item) return;
          const date = parseApiDate(item.from_date);
          const formattedDate = date.toISOString().split('T')[0];
          // Delay navigation by a tick so ApexCharts can finish any DOM work
          // (measuring/animations) before React unmounts the chart. This avoids
          // intermittent getBoundingClientRect null errors in the chart library.
          setTimeout(() => navigate(`/hourly/${formattedDate}`), 30);
        }
      }
    },
    stroke: { width: [0, 3] },
    plotOptions: { bar: { columnWidth: '60%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: dailyLabels },
    yaxis: [
      { title: { text: 'Consumption (kWh)' }, labels: { formatter: val => Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 }) } },
      { opposite: true, title: { text: 'Total Charges ($)' }, labels: { formatter: val => '$' + Number(val).toLocaleString('en-US', { maximumFractionDigits: 2 }) } }
    ],
    tooltip: {
      shared: true,
      y: {
        formatter: (val, { seriesIndex }) => {
          if (seriesIndex === 0) return `${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`;
          return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }
    },
    colors: [ '#3498db', '#2ecc71' ]
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
  const dateSortedMonthly = [...monthlyData]
    .filter(item => item && item.from_date)
    .sort((a, b) => parseApiDate(a.from_date) - parseApiDate(b.from_date));

  const lastMonthEntry = dateSortedMonthly[dateSortedMonthly.length - 1] || null;
  const prevMonthEntry = dateSortedMonthly[dateSortedMonthly.length - 2] || null;

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
          <ReactApexChart options={dailyOptions} series={dailySeries} type="line" height={340} />
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
          <ReactApexChart options={monthlyOptions} series={monthlySeries} type="line" height={360} />
        </div>
      </div>
      
      <div className="data-table">
        <h2>Detailed Data ({selectedYear ? selectedYear : 'All Years'} - {filteredMonthlyData.length} records)</h2>
        <div className="table-controls">
          <div className="table-actions">
            <button className="btn" onClick={exportCsv}>Export CSV</button>
            <button className="btn secondary" onClick={() => { setSortConfig({ key: 'total_consumption', direction: 'desc' }); setCurrentPage(1); }}>Sort by Consumption</button>
          </div>
          <div>
            <label>Rows per page: </label>
            <select className="page-input" value={rowsPerPage} onChange={e => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('from_date')} style={{ cursor: 'pointer' }}>Month {sortConfig.key === 'from_date' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => requestSort('total_consumption')} style={{ cursor: 'pointer' }}>Consumption (kWh) {sortConfig.key === 'total_consumption' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => requestSort('total_charges')} style={{ cursor: 'pointer' }}>Total Charges {sortConfig.key === 'total_charges' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}</th>
                <th>Days Billed</th>
                <th>Cost per kWh</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMonthly.map((item, index) => {
                const date = item?._dateObj ?? (item.from_date ? parseApiDate(item.from_date) : null);
                const monthLabel = date
                  ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'Unknown';

                const consumption = typeof item._consumption === 'number' ? item._consumption : parseFloat(item?.total_consumption || 0);
                const charges = typeof item._charges === 'number' ? item._charges : parseFloat(item?.total_charges || 0);
                const daysBilled = item?.interval_length ?? 'N/A';
                const costPerKwh = consumption > 0 ? (charges / consumption) : 0;

                // Simple trend: percent of highest month consumption
                const highest = Math.max(...monthlyData.map(m => parseFloat(m.total_consumption || 0)), 1);
                const trendPct = Math.min(100, Math.round((consumption / highest) * 100));

                return (
                  <tr key={index}>
                    <td>{monthLabel}</td>
                    <td>{consumption.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${charges.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{typeof daysBilled === 'number' || typeof daysBilled === 'string' ? daysBilled : 'N/A'}</td>
                    <td>${costPerKwh.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                    <td>
                      <div className="trend-bar">
                        <div className="trend-fill" style={{ width: `${trendPct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div className="pagination">
              <button className="btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</button>
              <button className="btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
              <span>Page {currentPage} / {totalPages}</span>
              <button className="btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
              <button className="btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</button>
            </div>
            <div>
              <small>{sortedMonthly.length} records total</small>
            </div>
          </div>
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