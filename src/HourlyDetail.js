import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';
import './App.css';

function HourlyDetail() {
  const { date } = useParams();
  const navigate = useNavigate();
  
  // Helper function to parse API dates correctly (avoiding timezone issues)
  const parseApiDate = (dateString) => {
    if (!dateString) return new Date();
    // For ISO format dates, parse as UTC then adjust
    return new Date(dateString);
  };

  // Helper function to format time for 15-minute intervals
  const formatTimeInterval = (dateString) => {
    const date = parseApiDate(dateString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    // Format as 12-hour time with AM/PM
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const minuteStr = minutes.toString().padStart(2, '0');
    
    return `${hour12}:${minuteStr} ${ampm}`;
  };
  
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3000/api/data/hourly?date=${date}`);
        setHourlyData(response.data.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (date) {
      fetchHourlyData();
    }
  }, [date]);

  // Ensure chart renders only after the component has mounted and data loaded
  useEffect(() => {
    if (!loading) {
      // small timeout to allow DOM to settle before ApexCharts measures elements
      const t = setTimeout(() => setChartReady(true), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [loading]);

  // Process hourly data for ApexCharts
  const hourlyLabels = hourlyData.map(item => formatTimeInterval(item.from_date));
  const hourlySeries = [
    {
      name: '15-min Consumption (kWh)',
      type: 'bar',
      data: hourlyData.map(item => parseFloat(item.total_consumption || item.consumption || 0))
    },
    {
      name: '15-min Charges ($)',
      type: 'line',
      data: hourlyData.map(item => parseFloat(item.total_charges || item.charges || 0))
    }
  ];

  const hourlyOptions = {
    chart: { type: 'line', height: 320, toolbar: { show: true } },
    stroke: { width: [0, 2] },
    plotOptions: { bar: { columnWidth: '60%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: hourlyLabels },
    yaxis: [
      { title: { text: 'Consumption (kWh)' }, labels: { formatter: val => Number(val).toLocaleString('en-US', { maximumFractionDigits: 3 }) } },
      { opposite: true, title: { text: 'Charges ($)' }, labels: { formatter: val => '$' + Number(val).toLocaleString('en-US', { maximumFractionDigits: 2 }) } }
    ],
    tooltip: {
      shared: true,
      y: {
        formatter: (val, { seriesIndex }) => {
          if (seriesIndex === 0) return `${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} kWh`;
          return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }
    },
    colors: ['#3498db', '#2ecc71'],
    legend: { position: 'top' }
  };

  // Calculate totals
  const totalHourlyKwh = hourlyData.reduce(
    (sum, item) => sum + parseFloat(item.total_consumption || item.consumption || 0),
    0
  );
  const totalHourlyCharges = hourlyData.reduce(
    (sum, item) => sum + parseFloat(item.total_charges || item.charges || 0),
    0
  );

  if (loading) return <div className="loading">Loading hourly data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="dashboard">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              background: '#3498db',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Dashboard
          </button>
          <div>
            <h1>Hourly Consumption Detail</h1>
            <div className="last-updated">{formattedDate}</div>
          </div>
        </div>
      </header>

      {/* Summary cards for the day */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Daily Consumption</h3>
          <div className="value">{totalHourlyKwh.toFixed(2)} kWh</div>
          <div className="subtext">Sum of 24 hours</div>
        </div>
        <div className="card">
          <h3>Total Daily Charges</h3>
          <div className="value">${totalHourlyCharges.toFixed(2)}</div>
          <div className="subtext">Sum of 24 hours</div>
        </div>
        <div className="card">
          <h3>Average Hourly Usage</h3>
          <div className="value">{hourlyData.length > 0 ? (totalHourlyKwh / hourlyData.length).toFixed(2) : '0.00'} kWh</div>
          <div className="subtext">Per hour average</div>
        </div>
        <div className="card">
          <h3>Peak Hour</h3>
          <div className="value">
            {hourlyData.length > 0 ? (() => {
              const peakInterval = hourlyData.reduce((max, item) => 
                parseFloat(item.total_consumption || item.consumption || 0) > 
                parseFloat(max.total_consumption || max.consumption || 0) ? item : max
              , hourlyData[0]);
              return formatTimeInterval(peakInterval.from_date);
            })() : 'N/A'}
          </div>
          <div className="subtext">Highest consumption interval</div>
        </div>
      </div>

      {/* Hourly Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h2>Hourly Consumption</h2>
          <div style={{ fontSize: 14, color: '#666' }}>
            Total: {totalHourlyKwh.toFixed(2)} kWh | ${totalHourlyCharges.toFixed(2)}
          </div>
        </div>
        <div className="chart-wrapper">
          {chartReady && hourlySeries[0].data.length > 0 ? (
            <ReactApexChart options={hourlyOptions} series={hourlySeries} type="line" height={320} />
          ) : (
            <div style={{ padding: 24, color: '#666' }}>
              {loading ? 'Preparing chart...' : 'No hourly data available for this date.'}
            </div>
          )}
        </div>
      </div>

      {/* 15-minute Data Table */}
      <div className="data-table">
        <h2>15-Minute Interval Breakdown</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Time Interval</th>
                <th>Consumption (kWh)</th>
                <th>Charges ($)</th>
                <th>Cost per kWh</th>
              </tr>
            </thead>
            <tbody>
              {hourlyData.map((item, index) => {
                const startTime = formatTimeInterval(item.from_date);
                const consumption = parseFloat(item.total_consumption || item.consumption || 0);
                const charges = parseFloat(item.total_charges || item.charges || 0);
                const costPerKwh = consumption > 0 ? (charges / consumption).toFixed(3) : '0.000';
                
                // Calculate end time (15 minutes later)
                const startDate = parseApiDate(item.from_date);
                const endDate = new Date(startDate.getTime() + 15 * 60000); // Add 15 minutes
                const endTime = formatTimeInterval(endDate.toISOString());
                
                return (
                  <tr key={index}>
                    <td>{startTime} - {endTime}</td>
                    <td>{consumption.toFixed(3)}</td>
                    <td>${charges.toFixed(2)}</td>
                    <td>${costPerKwh}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HourlyDetail;
