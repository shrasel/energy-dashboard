import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart } from 'react-chartjs-2';
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

  // Process hourly data for chart
  const hourlyChartData = {
    labels: hourlyData.map(item => formatTimeInterval(item.from_date)),
    datasets: [
      {
        label: '15-min Consumption (kWh)',
        data: hourlyData.map(item => parseFloat(item.total_consumption || item.consumption || 0)),
        backgroundColor: 'rgba(52, 152, 219, 0.7)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: '15-min Charges ($)',
        data: hourlyData.map(item => parseFloat(item.total_charges || item.charges || 0)),
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
      {/* Premium Minimal Header */}
      <div className="premium-detail-header">
        <div className="premium-header-top">
          <button 
            onClick={() => navigate('/')}
            className="icon-back-button"
            aria-label="Back to Dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="breadcrumb">
            <span className="breadcrumb-item" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>Dashboard</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="breadcrumb-separator">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="breadcrumb-item active">Hourly Detail</span>
          </div>
        </div>
        
        <div className="premium-header-main">
          <div className="premium-title-section">
            <h1 className="premium-title">Hourly Consumption</h1>
            <div className="premium-meta">
              <span className="meta-badge">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.75V7L10.5 8.75M12.25 7C12.25 9.89949 9.89949 12.25 7 12.25C4.10051 12.25 1.75 9.89949 1.75 7C1.75 4.10051 4.10051 1.75 7 1.75C9.89949 1.75 12.25 4.10051 12.25 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {formattedDate}
              </span>
              <span className="meta-divider">•</span>
              <span className="meta-badge">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.625 7H11.375M2.625 3.5H11.375M2.625 10.5H11.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {hourlyData.length} intervals
              </span>
            </div>
          </div>
          
          <div className="premium-stats-inline">
            <div className="stat-inline">
              <span className="stat-label">Total Consumption</span>
              <span className="stat-value">{totalHourlyKwh.toFixed(2)} kWh</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-inline">
              <span className="stat-label">Total Cost</span>
              <span className="stat-value">${totalHourlyCharges.toFixed(2)}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-inline">
              <span className="stat-label">Avg/Hour</span>
              <span className="stat-value">{hourlyData.length > 0 ? (totalHourlyKwh / hourlyData.length).toFixed(2) : '0.00'} kWh</span>
            </div>
          </div>
        </div>
      </div>

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
          <Chart 
            type='bar'
            data={hourlyChartData}
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
                    text: 'Charges ($)',
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
